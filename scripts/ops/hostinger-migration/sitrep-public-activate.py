#!/usr/bin/env python3
"""Activate only SITREP after the old writer and final backup are verified."""
import importlib.util
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
SOURCE = 'root@23.105.176.45'
UNIT = 'umsa-sitrep-ingress'
BACKEND = 'umsa-clean-sitrep-backend'
DROPIN_DIR = Path('/etc/systemd/system/umsa-clean-sitrep-backend.service.d')
DROPIN = DROPIN_DIR / 'umsa-sitrep-live.conf'
LIVE_ENV = STAGE / 'sitrep-live.environment'
EXPECTED_FLAGS = {'BLOCKCHAIN_ENABLED': 'true', 'DISABLE_EMAILS': 'true',
                  'SMTP_HOST': '127.0.0.1', 'SMTP_PORT': '25'}


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_hash(value):
    if not re.fullmatch(r'[0-9a-f]{64}', value):
        raise ValueError('Invalid independently verified backup hash')
    return value


def backend_dropin(environment):
    return '[Service]\nIPAddressDeny=\nIPAddressAllow=\nEnvironmentFile=' + str(environment) + '\n'


def extract_flags(rows, *, quoted):
    values = {}
    for row in rows:
        if '=' not in row:
            continue
        key, value = row.split('=', 1)
        if key not in EXPECTED_FLAGS:
            continue
        if key in values:
            raise RuntimeError('Duplicate SITREP integration flag')
        if quoted:
            parts = shlex.split(value)
            if len(parts) != 1:
                raise RuntimeError('Invalid SITREP integration flag')
            value = parts[0]
        values[key] = value
    return values


def running_backend_flags():
    pid_text = subprocess.check_output(['systemctl', 'show', BACKEND, '-p', 'MainPID', '--value'], text=True).strip()
    if not pid_text.isdigit() or int(pid_text) <= 1:
        return None
    rows = (Path('/proc') / pid_text / 'environ').read_bytes().decode('utf-8', errors='surrogateescape').split('\0')
    return extract_flags(rows, quoted=False)


def check_running_backend():
    if running_backend_flags() != EXPECTED_FLAGS:
        raise RuntimeError('Live SITREP integration flags differ from the original')
    denied = subprocess.check_output(['systemctl', 'show', BACKEND, '-p', 'IPAddressDeny', '--value'], text=True).strip()
    if denied:
        raise RuntimeError('SITREP backend egress is still restricted')


def write_exclusive(path, content, mode):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
    with os.fdopen(fd, 'w') as stream:
        stream.write(content)
        stream.flush()
        os.fsync(stream.fileno())
    os.chmod(path, mode)


def atomic_replace(path, content, mode):
    pending = path.with_name('.' + path.name + '.umsa-live-pending')
    write_exclusive(pending, content, mode)
    os.replace(pending, path)


def ensure_exact_file(path, content, mode):
    if path.is_symlink():
        raise RuntimeError('Unexpected symbolic link in SITREP activation')
    if path.exists():
        if not path.is_file() or path.read_text() != content or path.stat().st_mode & 0o777 != mode:
            raise RuntimeError('Existing SITREP activation file differs')
        return
    write_exclusive(path, content, mode)


def main(identifier, fence_id, backup_sha256, files_sha256):
    ingress = load('sitrep_public_ingress', 'sitrep-public-ingress.py')
    refresh = load('sitrep_final_refresh', 'sitrep-final-refresh.py')
    identifier, fence_id = ingress.valid_id(identifier), ingress.valid_id(fence_id)
    backup_sha256 = validate_hash(backup_sha256)
    files_sha256 = validate_hash(files_sha256)
    snapshot = STAGE / 'sitrep-final-refreshes' / identifier
    directory = STAGE / 'sitrep-public-ingress' / identifier
    config = directory / 'nginx.conf'
    live_candidate = directory / 'live-candidate.conf'
    ready = STAGE / 'sitrep-final-refresh.ready'
    ingress_ready = STAGE / 'sitrep-ingress-source-only.ready'
    started = STAGE / 'sitrep-public-activation.started'
    complete = STAGE / 'sitrep-public-activation.complete'
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != ingress.ADDRESS
            or (STAGE / 'production.active').exists() or started.is_symlink() or complete.is_symlink()
            or not os.environ.get('SSH_AUTH_SOCK') or snapshot.is_symlink() or directory.is_symlink()
            or ready.is_symlink() or not ready.is_file() or ready.read_text().strip() != str(snapshot)
            or ingress_ready.is_symlink() or not ingress_ready.is_file()
            or ingress_ready.read_text().strip() != str(directory)
            or not (directory / 'source-only.complete').is_file()
            or any(path.is_symlink() or not path.is_file() for path in (config, live_candidate, ingress.UNIT_FILE))
            or DROPIN_DIR.is_symlink() or DROPIN.is_symlink() or LIVE_ENV.is_symlink()):
        raise RuntimeError('SITREP activation prerequisites or isolation differ')
    receipt = json.loads((snapshot / 'refresh.complete.json').read_text())
    if (receipt.get('run') != identifier or receipt.get('fence_run') != fence_id
            or receipt.get('source_dump_sha256') != backup_sha256 or receipt.get('offsite_files_sha256') != files_sha256
            or not receipt.get('offsite_size_confirmed')):
        raise RuntimeError('Independently verified backup hash differs from the final source snapshot')
    health_config = ingress.health_config(directory, identifier)
    public_config = ingress.live_config(ingress.SITE.read_text(), directory)
    source_unit = ingress.source_only_unit(config)
    public_unit = ingress.live_unit(config)
    resuming = started.exists()
    expected_start = {'run': identifier, 'fence_run': fence_id, 'offsite_sha256': backup_sha256,
                      'offsite_files_sha256': files_sha256}
    if resuming and json.loads(started.read_text()) != expected_start:
        raise RuntimeError('An existing SITREP activation receipt differs')
    if (live_candidate.read_text() != public_config or config.read_text() not in (health_config, public_config)
            or ingress.UNIT_FILE.read_text() not in (source_unit, public_unit)
            or (not resuming and (config.read_text() != health_config or ingress.UNIT_FILE.read_text() != source_unit))):
        raise RuntimeError('Prepared SITREP ingress configuration changed')
    if not resuming and subprocess.run(['systemctl', 'is-active', '--quiet', UNIT]).returncode:
        raise RuntimeError('Restricted SITREP ingress is not active')
    if not resuming and subprocess.run(['systemctl', 'is-enabled', '--quiet', UNIT]).returncode == 0:
        raise RuntimeError('Restricted SITREP ingress unexpectedly starts at boot')
    if not resuming and not refresh.health_ready():
        raise RuntimeError('Isolated SITREP backend or database is unhealthy')
    environment_file = STAGE / 'clean-sitrep-backend.environment'
    values = extract_flags(environment_file.read_text().splitlines(), quoted=True)
    if values != {'BLOCKCHAIN_ENABLED': 'false', 'DISABLE_EMAILS': 'true',
                  'SMTP_HOST': '127.0.0.1', 'SMTP_PORT': '25'}:
        raise RuntimeError('The isolated SITREP integration flags have changed')
    known = STAGE / 'known_hosts'
    if known.is_symlink() or not known.is_file():
        raise RuntimeError('Pinned source host key is missing')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', SOURCE]
    def remote(args):
        return ssh + [shlex.join(args)]
    source_dir = '/root/umsa-sitrep-migration/' + fence_id
    source_tool = source_dir + '/sitrep-source-fence.py'
    if not resuming:
        subprocess.run(remote(['/usr/bin/python3', source_tool, '--verify', fence_id]), check=True)
    source_receipt = json.loads(subprocess.check_output(remote(['cat', source_dir + '/fence.complete.json']), text=True))
    if source_receipt.get('runtime_flags') != EXPECTED_FLAGS:
        raise RuntimeError('Original SITREP integration flags differ')
    os.umask(0o077)
    DROPIN_DIR.mkdir(mode=0o755, parents=True, exist_ok=True)
    if DROPIN_DIR.is_symlink() or (not resuming and (DROPIN.exists() or LIVE_ENV.exists())):
        raise RuntimeError('SITREP backend drop-in needs review')
    subprocess.run(['nginx', '-t', '-c', str(live_candidate)], check=True)
    if not resuming:
        write_exclusive(started, json.dumps(expected_start) + '\n', 0o600)
    # This source-side marker is the one-way boundary: automatic recovery must
    # never restart the old writer after this point.
    subprocess.run(remote(['/usr/bin/python3', source_tool, '--commit-target', fence_id, backup_sha256, files_sha256]), check=True)
    ensure_exact_file(LIVE_ENV, 'BLOCKCHAIN_ENABLED=true\n', 0o600)
    ensure_exact_file(DROPIN, backend_dropin(LIVE_ENV), 0o644)
    subprocess.run(['systemctl', 'daemon-reload'], check=True)
    if running_backend_flags() == EXPECTED_FLAGS:
        if not refresh.health_ready():
            raise RuntimeError('Previously started live SITREP backend needs inspection')
    else:
        restart = directory / 'backend-restart.started'
        if restart.exists() or restart.is_symlink():
            raise RuntimeError('An earlier SITREP backend restart needs inspection')
        write_exclusive(restart, 'One live restart attempted.\n', 0o600)
        subprocess.run(['systemctl', 'restart', BACKEND], check=True)
        for _ in range(40):
            if refresh.health_ready():
                break
            time.sleep(0.5)
        else:
            raise RuntimeError('Live SITREP backend and database did not become healthy')
    check_running_backend()
    with socket.socket() as probe:
        probe.settimeout(2)
        if probe.connect_ex((ingress.ADDRESS, 3002)) == 0:
            raise RuntimeError('SITREP backend is unexpectedly exposed directly')
    for current, before, expected in ((config, directory / 'health-config.before-live', health_config),
                                      (ingress.UNIT_FILE, directory / 'source-only-unit.before-live', source_unit)):
        if before.is_symlink():
            raise RuntimeError('Unexpected SITREP ingress backup link')
        if before.exists():
            if before.read_text() != expected:
                raise RuntimeError('SITREP ingress backup differs')
        elif current.read_text() == expected:
            shutil.copy2(current, before)
        else:
            raise RuntimeError('The original SITREP ingress configuration is missing')
    if config.read_text() == health_config:
        atomic_replace(config, public_config, 0o600)
    if ingress.UNIT_FILE.read_text() == source_unit:
        atomic_replace(ingress.UNIT_FILE, public_unit, 0o644)
    subprocess.run(['systemctl', 'daemon-reload'], check=True)
    def source_direct_health():
        args = ['curl', '--noproxy', '*', '--silent', '--show-error', '--fail', '--max-time', '8',
                '--resolve', ingress.HOST + ':443:' + ingress.ADDRESS, 'https://' + ingress.HOST + '/api/health']
        try:
            status = json.loads(subprocess.check_output(remote(args), text=True))
            return status.get('status') == 'ok' and status.get('db') == 'connected'
        except (subprocess.CalledProcessError, ValueError):
            return False
    if subprocess.run(['systemctl', 'is-active', '--quiet', UNIT]).returncode or not source_direct_health():
        subprocess.run(['systemctl', 'restart', UNIT], check=True)
    subprocess.run(['systemctl', 'enable', UNIT], check=True)
    subprocess.run(remote(['/usr/bin/python3', source_tool, '--proxy', fence_id]), check=True)
    completion = json.dumps({
        'run': identifier, 'fence_run': fence_id, 'offsite_sha256': backup_sha256,
        'offsite_files_sha256': files_sha256,
        'source_proxy': 'active', 'blockchain_restored': True}) + '\n'
    ensure_exact_file(complete, completion, 0o600)
    print('SITREP is served by Hostinger through the old source proxy; DNS remains unchanged.')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
