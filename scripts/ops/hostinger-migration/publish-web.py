#!/usr/bin/env python3
"""Publish a fresh UMSA build on Hostinger; keep releases, data and other services."""
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import socket
import subprocess
import sys
import tarfile
import time

STAGE = Path('/srv/umsa-migration')
RELEASES = Path('/srv/umsa-web-releases')
FRONT = Path('/srv/umsa-clean-proxy/nginx/nginx.conf')
PUBLIC_ROOT = Path('/srv/umsa-public-vhosts')
PUBLIC_FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
STATE = STAGE / 'web-publication-state.json'
INITIAL = {'port': 4321, 'unit': 'umsa-clean-astro-ultimamilla.service',
           'config': '/srv/umsa-clean-proxy/nginx',
           'assets': '/srv/umsa-clean-apps/astro-ultimamilla/dist/client'}
ROUTES = ('/', '/servicios', '/antecedentes', '/estilo/fuentes/plantilla', '/status/')
PROC = Path('/proc')
TRANSIENT_CURL_ERRORS = frozenset((7, 18, 28, 52, 55, 56, 92))


def probe_after_reload(url, log, resolve):
    """Allow transport drain after HUP; HTTP and certificate failures stay fatal."""
    deadline = time.monotonic() + 10
    last_error = 'deadline expired'
    for attempt in range(4):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        budget = min(3, remaining)
        args = ['curl', '--noproxy', '*', '--http1.1', '-fsS', '--max-time', str(budget),
                '--resolve', resolve, '-o', '/dev/null', '-w', '%{http_code}', url]
        try:
            result = subprocess.run(args, stdout=subprocess.PIPE, stderr=log,
                                    text=True, timeout=budget)
            status = result.stdout.strip()
            # An HTTP error is never a reason to retry, even with a stream error.
            if re.fullmatch(r'[45][0-9]{2}', status):
                raise RuntimeError('Publication probe returned HTTP ' + status + ': ' + url)
            if result.returncode == 0:
                if not re.fullmatch(r'[23][0-9]{2}', status):
                    raise RuntimeError('Publication probe returned no valid HTTP status: ' + url)
                return
            if result.returncode not in TRANSIENT_CURL_ERRORS:
                result.check_returncode()
            last_error = 'curl ' + str(result.returncode)
        except subprocess.TimeoutExpired as error:
            partial = error.stdout or ''
            if isinstance(partial, bytes):
                partial = partial.decode(errors='replace')
            if re.fullmatch(r'[45][0-9]{2}', partial.strip()):
                raise RuntimeError('Publication probe returned HTTP ' + partial.strip() + ': ' + url) from error
            last_error = 'curl timeout'
        log.write(('Transport readiness attempt ' + str(attempt + 1) + ': ' + last_error + '\n').encode())
        log.flush()
        remaining = deadline - time.monotonic()
        if attempt < 3 and remaining > 0:
            time.sleep(min(0.25, remaining))
    raise RuntimeError('Publication transport did not recover within 10s/4 attempts: ' + last_error + ': ' + url)


def verify_web_runtime(unit, application, port, expected_pid=None):
    """Tie the real listener to the exact candidate process and entry point."""
    if port not in (4321, 4322):
        raise RuntimeError('Unexpected candidate web port')
    pid = subprocess.check_output(['systemctl', 'show', unit, '-p', 'MainPID', '--value'],
                                  text=True).strip()
    if not re.fullmatch(r'[1-9][0-9]*', pid) or (expected_pid is not None and pid != expected_pid):
        raise RuntimeError('Candidate process is missing or changed during publication')
    command = (PROC / pid / 'cmdline').read_bytes().split(b'\0')
    if command and command[-1] == b'':
        command.pop()
    expected = [b'/usr/bin/node', str(application / 'dist/server/entry.mjs').encode()]
    if command != expected:
        raise RuntimeError('Candidate PID does not execute the reviewed release entry point')
    listeners = subprocess.check_output(['ss', '-H', '-ltnp', 'sport = :' + str(port)], text=True)
    rows = [line.split() for line in listeners.splitlines() if line.strip()]
    if (len(rows) != 1 or len(rows[0]) < 6 or rows[0][3] != '127.0.0.1:' + str(port)
            or not re.search(r'\bpid=' + pid + r',', ' '.join(rows[0][5:]))):
        raise RuntimeError('Candidate PID does not own the expected loopback web listener')
    return pid


def validate_archive(archive):
    regular = set()
    seen = set()
    for member in archive.getmembers():
        name = PurePosixPath(member.name)
        if name.is_absolute() or '..' in name.parts or not name.parts:
            raise ValueError('Unsafe archive path')
        if name.parts[0] not in ('dist', 'node_modules', 'package.json', 'package-lock.json'):
            raise ValueError('Unexpected release payload')
        if name in seen:
            raise ValueError('Duplicate archive member')
        seen.add(name)
        if member.isdev() or member.isfifo():
            raise ValueError('Unsupported archive entry')
        if member.islnk():
            # npm installs esbuild's executable as a hardlink. Only accept a
            # backward reference to a regular member already validated here.
            target = PurePosixPath(member.linkname)
            if target.is_absolute() or '..' in target.parts or target not in regular:
                raise ValueError('Unsafe hardlink target')
            regular.add(name)
        elif member.isfile():
            regular.add(name)
        if member.issym():
            target = PurePosixPath(member.linkname)
            if target.is_absolute():
                raise ValueError('Absolute archive link')
            parts = list(name.parent.parts)
            for item in target.parts:
                if item == '..':
                    if not parts: raise ValueError('Escaping archive link')
                    parts.pop()
                elif item != '.': parts.append(item)
            if not parts or parts[0] != 'node_modules':
                raise ValueError('Link outside dependency tree')


def transform_config(text, previous, root, assets, port):
    return (text.replace(previous['config'], str(root)).replace(previous['assets'], str(assets))
        .replace('http://127.0.0.1:' + str(previous['port']) + ';', 'http://127.0.0.1:' + str(port) + ';'))


def public_listeners(text):
    text = re.sub(r'(?m)^\s*listen \[::1\]:(?:80|443)[^;]*;\s*\n', '\n', text)
    text, count = re.subn(r'\blisten 127\.0\.0\.1:(80|443)\b', r'listen 179.198.115.115:\1', text)
    if not count or re.search(r'\blisten\s+(?!179\.198\.115\.115:)', text):
        raise RuntimeError('Unexpected public UMSA listener')
    return text


def atomic_text(path, text, mode=0o600):
    temp = path.with_name(path.name + '.pending')
    with temp.open('x') as stream:
        stream.write(text)
        stream.flush()
        os.fsync(stream.fileno())
    temp.chmod(mode)
    os.replace(temp, path)


def validate_previous(previous):
    if previous == INITIAL:
        return
    root = Path(previous['config'])
    if (root.parent.parent != RELEASES or root.name != 'nginx' or root.is_symlink()
            or not re.fullmatch(r'[0-9a-f]{40}-[0-9]+-[0-9]+', root.parent.name)
            or previous['assets'] != str(root.parent / 'application/dist/client')
            or previous['unit'] != 'umsa-web-' + root.parent.name + '.service'
            or previous['port'] not in (4321, 4322)):
        raise ValueError('Invalid current release state')


def main(mode, revision, run_id, attempt, expected):
    os.umask(0o022)
    if mode not in ('rehearse', 'publish') or not re.fullmatch('[0-9a-f]{40}', revision):
        raise ValueError('Invalid mode or revision')
    if not re.fullmatch('[0-9]+', run_id) or not re.fullmatch('[0-9]+', attempt) or not re.fullmatch('[0-9a-f]{64}', expected):
        raise ValueError('Invalid release identity')
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'persist-rehearsal.complete').is_file():
        raise RuntimeError('Persistent target rehearsal must pass first')
    production = (STAGE / 'production.active').is_file()
    if (mode == 'publish') != production:
        raise RuntimeError('Publishing requires the completed migration cutover; rehearsal is pre-cutover only')
    identifier = revision + '-' + run_id + '-' + attempt
    package = STAGE / 'incoming' / (identifier + '.tar.gz')
    if package.is_symlink() or not package.is_file():
        raise RuntimeError('Missing immutable CI package')
    h = hashlib.sha256()
    with package.open('rb') as stream:
        while chunk := stream.read(1024 * 1024): h.update(chunk)
    if h.hexdigest() != expected:
        raise RuntimeError('CI package digest differs')
    lock = open('/run/umsa-web-publish.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    previous = json.loads(STATE.read_text()) if STATE.exists() else INITIAL.copy()
    validate_previous(previous)
    port = 4322 if previous['port'] == 4321 else 4321
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', port))
    if RELEASES.is_symlink() or shutil.disk_usage('/srv').free < max(5 * 1024**3, package.stat().st_size * 5):
        raise RuntimeError('Unsafe release root or insufficient free disk')
    RELEASES.mkdir(mode=0o755, exist_ok=True)
    release = RELEASES / identifier
    release.mkdir(mode=0o755)
    application = release / 'application'
    application.mkdir()
    with tarfile.open(package) as archive:
        validate_archive(archive)
    with (release / 'publication.log').open('xb') as log:
        os.chmod(log.name, 0o600)
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        run(['tar', '--no-same-owner', '-xzf', str(package), '-C', str(application)])
        if not (application / 'dist/server/entry.mjs').is_file() or (application / '.env').exists():
            raise RuntimeError('Incomplete or credential-bearing runtime')
        assets = application / 'dist/client'
        # Preserve historical URLs missing from the new build. Never remove data.
        run(['rsync', '-a', '--ignore-existing', previous['assets'] + '/', str(assets) + '/'])
        env = (STAGE / 'clean-astro-ultimamilla.environment').read_text()
        env, count = re.subn(r'(?m)^PORT=.*$', 'PORT="' + str(port) + '"', env)
        if count != 1 or 'HOST="127.0.0.1"' not in env:
            raise RuntimeError('Unexpected reviewed web environment')
        envfile = release / 'web.environment'
        atomic_text(envfile, env)
        unit_name = 'umsa-web-' + identifier + '.service'
        unit = ('[Unit]\nDescription=UMSA verified web release ' + identifier + '\nAfter=network-online.target\n'
            '[Service]\nType=simple\nWorkingDirectory=' + str(application) + '\nEnvironmentFile=' + str(envfile) + '\n'
            'ExecStart=/usr/bin/node ' + str(application / 'dist/server/entry.mjs') + '\n'
            'Restart=on-failure\nRestartSec=3\nUMask=0027\n')
        if not production: unit += 'IPAddressDeny=any\nIPAddressAllow=localhost\n'
        unit += '[Install]\nWantedBy=multi-user.target\n'
        unit_path = Path('/etc/systemd/system') / unit_name
        atomic_text(unit_path, unit, 0o644)
        run(['systemd-analyze', 'verify', str(unit_path)])
        run(['systemctl', 'daemon-reload'])
        old_front = FRONT.read_text()
        front_unit_path = Path('/etc/systemd/system/umsa-clean-front.service')
        old_unit = front_unit_path.read_text()
        if old_unit.count(previous['unit']) != 2:
            raise RuntimeError('Persistent proxy dependencies differ from current web release')
        switched = False
        unit_switched = False
        public_before = {}
        committed = False
        try:
            run(['systemctl', 'start', unit_name])
            for trial in range(30):
                result = subprocess.run(['curl', '-fsS', '--max-time', '3', '-o', '/dev/null',
                    'http://127.0.0.1:' + str(port) + '/'], stdout=log, stderr=log)
                if result.returncode == 0: break
                time.sleep(1)
            else: raise RuntimeError('Candidate did not become ready')
            for route in ROUTES:
                run(['curl', '-fsS', '--max-time', '20', '-o', '/dev/null', 'http://127.0.0.1:' + str(port) + route])
            candidate_pid = verify_web_runtime(unit_name, application, port)
            config = release / 'nginx'
            shutil.copytree(previous['config'], config)
            changes = 0
            for path in config.rglob('*'):
                if path.is_symlink(): raise RuntimeError('Unexpected proxy config symlink')
                if not path.is_file(): continue
                text = path.read_text()
                changes += text.count('http://127.0.0.1:' + str(previous['port']) + ';')
                path.write_text(transform_config(text, previous, config, assets, port))
            if changes < 1: raise RuntimeError('UMSA upstream missing from active config')
            run(['/usr/sbin/nginx', '-t', '-c', str(config / 'nginx.conf')])
            if mode == 'rehearse':
                run(['systemctl', 'stop', unit_name])
                atomic_text(release / 'rehearsal.complete', 'Candidate HTTP routes and Nginx configuration passed. Live proxy unchanged.\n')
                print('Fresh publisher rehearsal passed. No public route, DNS, database or other service changed.')
                return
            atomic_text(release / 'previous-front.conf', old_front)
            atomic_text(FRONT, 'include ' + str(config / 'nginx.conf') + ';\n', 0o644)
            switched = True
            run(['systemctl', 'reload', 'umsa-clean-front'])
            for route in ROUTES:
                probe_after_reload('https://www.ultimamilla.com.ar' + route, log,
                                   'www.ultimamilla.com.ar:443:127.0.0.1')
            verify_web_runtime(unit_name, application, port, candidate_pid)
            # The live ingress has its own listeners. Switch both UMSA vhosts
            # before retiring the previous Astro port; leave all other vhosts alone.
            if PUBLIC_ROOT.is_symlink() or PUBLIC_FRONT.is_symlink() or not PUBLIC_FRONT.is_file():
                raise RuntimeError('Public ingress is missing or unsafe')
            for name in ('ultimamilla.com.ar', 'directus-admin'):
                destination = PUBLIC_ROOT / (name + '.conf')
                source = config / 'sites-enabled' / name
                if destination.is_symlink() or not destination.is_file() or source.is_symlink() or not source.is_file():
                    raise RuntimeError('Active public UMSA vhost is missing')
                public_before[destination] = destination.read_text()
                atomic_text(release / ('previous-public-' + name + '.conf'), public_before[destination])
                atomic_text(destination, public_listeners(source.read_text()))
            run(['/usr/sbin/nginx', '-t', '-c', str(PUBLIC_FRONT)])
            run(['systemctl', 'reload', 'umsa-sitrep-ingress'])
            for route in ROUTES:
                probe_after_reload('https://www.ultimamilla.com.ar' + route, log,
                                   'www.ultimamilla.com.ar:443:179.198.115.115')
            probe_after_reload('https://sitrep.ultimamilla.com.ar/api/health', log,
                               'sitrep.ultimamilla.com.ar:443:179.198.115.115')
            verify_web_runtime(unit_name, application, port, candidate_pid)
            current = {'port': port, 'unit': unit_name, 'config': str(config), 'assets': str(assets)}
            run(['systemctl', 'enable', unit_name])
            atomic_text(release / 'previous-front.service', old_unit)
            atomic_text(front_unit_path, old_unit.replace(previous['unit'], unit_name), 0o644)
            unit_switched = True
            run(['systemctl', 'daemon-reload'])
            atomic_text(STATE, json.dumps(current) + '\n')
            committed = True
            # Existing workers may still finish requests against the old runtime.
            for trial in range(30):
                processes = subprocess.check_output(['ps', '-eo', 'args'], text=True)
                if 'nginx: worker process is shutting down' not in processes:
                    run(['systemctl', 'disable', previous['unit']])
                    run(['systemctl', 'stop', previous['unit']])
                    break
                time.sleep(2)
            atomic_text(release / 'publication.complete', json.dumps(current) + '\n')
        except Exception:
            if not committed:
                if public_before:
                    for destination, text in public_before.items():
                        atomic_text(destination, text)
                    run(['/usr/sbin/nginx', '-t', '-c', str(PUBLIC_FRONT)])
                    run(['systemctl', 'reload', 'umsa-sitrep-ingress'])
                if unit_switched:
                    atomic_text(front_unit_path, old_unit, 0o644)
                    run(['systemctl', 'daemon-reload'])
                if switched:
                    atomic_text(FRONT, old_front, 0o644)
                    run(['systemctl', 'reload', 'umsa-clean-front'])
                run(['systemctl', 'stop', unit_name])
                run(['systemctl', 'disable', unit_name])
            raise
    print('UMSA release activated and checked on Hostinger. Previous files retained; other services and databases unchanged.')


if __name__ == '__main__':
    main(*sys.argv[1:])
