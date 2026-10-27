#!/usr/bin/env python3
"""Fence only the old SITREP application during an explicitly approved cutover.

The command is intended for the reviewed CI workflow, not an interactive shell.
On failure before the snapshot starts, it restores the original SITREP service.
Other PM2 processes, databases and Nginx sites are not stopped or reconfigured.
"""
import hashlib
import fcntl
import importlib.util
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

HOST = 'FTS-23.105.176.45'
GATE = Path('/etc/nginx/conf.d/00-umsa-sitrep-migration.conf')
SOURCE_SITE = Path('/etc/nginx/conf.d/sitrep.conf')
RUN_ROOT = Path('/root/umsa-sitrep-migration')
DATABASE = 'trazabilidad_rrpp'
CONTAINER = 'directus-admin-database-1'
EXPECTED_PROCESSES = 2


def identifier_parts(identifier):
    if not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Invalid migration run identifier')
    return ('umsa_sitrep_fence_' + identifier.replace('-', '_'),
            'umsa-sitrep-fence-' + identifier)


def load_gate(directory):
    file = directory / 'sitrep-gate-config.py'
    if file.is_symlink() or not file.is_file():
        raise RuntimeError('Reviewed gate renderer is missing')
    spec = importlib.util.spec_from_file_location('sitrep_gate_config', file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.render_gate('maintenance')


def command(args, *, check=True):
    return subprocess.run(args, check=check, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def query(database, sql):
    return subprocess.check_output(['docker', 'exec', CONTAINER, 'psql', '-X', '-w',
        '-U', 'directus', '-d', database, '-At', '--set', 'ON_ERROR_STOP=1', '-c', sql], text=True).strip()


def pm2_states():
    processes = json.loads(subprocess.check_output(['pm2', 'jlist'], text=True))
    return [process.get('pm2_env', {}).get('status') for process in processes
            if process.get('name') == 'sitrep-backend']


def wait_pm2(status):
    for _ in range(40):
        states = pm2_states()
        if len(states) == EXPECTED_PROCESSES and all(value == status for value in states):
            return
        time.sleep(0.5)
    raise RuntimeError('SITREP PM2 state did not reach ' + status)


def http_status(host, path='/'):
    return subprocess.check_output(['curl', '--noproxy', '*', '--silent', '--show-error', '--max-time', '8',
        '--output', '/dev/null', '--write-out', '%{http_code}', '--resolve', host + ':443:127.0.0.1',
        'https://' + host + path], text=True).strip()


def wait_gate(expected):
    for _ in range(40):
        try:
            if http_status('sitrep.ultimamilla.com.ar') == expected:
                return
        except subprocess.CalledProcessError:
            pass
        time.sleep(0.5)
    raise RuntimeError('SITREP gate did not return ' + expected)


def atomic_gate(text, *, exclusive):
    if exclusive:
        pending = GATE.with_name('.umsa-sitrep-gate-pending')
        fd = os.open(pending, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
        with os.fdopen(fd, 'w') as stream:
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        os.link(pending, GATE, follow_symlinks=False)
        return
    temp = GATE.with_name('.umsa-sitrep-gate-restored')
    fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    with os.fdopen(fd, 'w') as stream:
        stream.write(text)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, GATE)


def reload_nginx():
    command(['nginx', '-t'])
    command(['systemctl', 'reload', 'nginx'])


def lock_count(application):
    sql = ("SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid "
           "WHERE a.datname='trazabilidad_rrpp' AND a.application_name='" + application + "' "
           "AND l.mode='ShareLock' AND l.locktype='relation' AND l.granted;")
    return int(query('postgres', sql))


def lock_session_count(application):
    return int(query('postgres', "SELECT count(*) FROM pg_stat_activity WHERE datname='trazabilidad_rrpp' "
                     "AND application_name='" + application + "' AND backend_type='client backend';"))


def wait_for_lock(application, unit):
    for _ in range(80):
        if command(['systemctl', 'is-active', '--quiet', unit], check=False).returncode:
            raise RuntimeError('SITREP lock service stopped unexpectedly')
        if lock_session_count(application) == 1 and lock_count(application) > 0:
            expected = int(query(DATABASE, "SELECT count(*) FROM pg_class c JOIN pg_namespace n "
                                 "ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') "
                                 "AND n.nspname <> 'information_schema' AND n.nspname NOT LIKE 'pg\\_%' ESCAPE '\\';"))
            others = int(query('postgres', "SELECT count(*) FROM pg_stat_activity WHERE datname='trazabilidad_rrpp' "
                               "AND application_name <> '" + application + "' AND backend_type='client backend';"))
            if expected > 0 and lock_count(application) >= expected and others == 0:
                return
        time.sleep(0.5)
    raise RuntimeError('SITREP database was not fenced cleanly')


def verify_fence(identifier):
    application, unit = identifier_parts(identifier)
    directory = RUN_ROOT / identifier
    receipt_path = directory / 'fence.complete.json'
    if (socket.gethostname() != HOST or directory.is_symlink() or not directory.is_dir()
            or receipt_path.is_symlink() or not receipt_path.is_file()
            or (directory / 'fence.recovered').exists()
            or (directory / 'target-writes-authorized').exists()
            or GATE.is_symlink() or not GATE.is_file() or GATE.read_text() != load_gate(directory)):
        raise RuntimeError('SITREP source fence markers or gate differ')
    receipt = json.loads(receipt_path.read_text())
    if (receipt.get('run') != identifier or receipt.get('lock_application') != application
            or receipt.get('lock_unit') != unit or int(receipt.get('locked_relations', 0)) < 1
            or pm2_states() != ['stopped'] * EXPECTED_PROCESSES
            or command(['systemctl', 'is-active', '--quiet', unit], check=False).returncode
            or lock_session_count(application) != 1
            or lock_count(application) < int(receipt['locked_relations'])
            or http_status('sitrep.ultimamilla.com.ar') != '503'):
        raise RuntimeError('SITREP source fence is not active')
    others = int(query('postgres', "SELECT count(*) FROM pg_stat_activity WHERE datname='trazabilidad_rrpp' "
                       "AND application_name <> '" + application + "' AND backend_type='client backend';"))
    if others:
        raise RuntimeError('Unexpected source database session during SITREP fence')
    print('SITREP source fence is active; no other database sessions are connected.')


def release_lock(application, unit):
    # Prevent a still-starting helper from opening a new session after recovery.
    command(['systemctl', 'stop', unit], check=False)
    empty = 0
    for _ in range(40):
        count = lock_session_count(application)
        if count > 1:
            raise RuntimeError('More than one SITREP lock session needs review')
        if count == 1:
            empty = 0
            result = query('postgres', "SELECT pg_cancel_backend(pid) FROM pg_stat_activity "
                           "WHERE datname='trazabilidad_rrpp' AND application_name='" + application + "';")
            if result != 't':
                raise RuntimeError('SITREP lock could not be released')
        else:
            empty += 1
            if empty >= 2:
                return
        time.sleep(0.5)
    raise RuntimeError('SITREP lock session did not finish')


def recover(application, unit, gate_text, stopped, lock_started, directory):
    if (directory / 'target-writes-authorized').exists():
        raise RuntimeError('Target writes were authorized; the old writer must not restart')
    if not GATE.is_file() or GATE.is_symlink() or GATE.read_text() != gate_text:
        raise RuntimeError('SITREP gate changed; manual recovery is required')
    if lock_started:
        release_lock(application, unit)
    if (directory / 'target-writes-authorized').exists():
        raise RuntimeError('Target writes were authorized during recovery')
    if stopped:
        command(['pm2', 'restart', 'sitrep-backend'])
        wait_pm2('online')
    atomic_gate('# SITREP migration gate disabled after recovery.\n', exclusive=False)
    reload_nginx()
    wait_gate('200')


def main(identifier):
    application, unit = identifier_parts(identifier)
    directory = RUN_ROOT / identifier
    if (socket.gethostname() != HOST or RUN_ROOT.is_symlink() or directory.is_symlink()
            or not directory.is_dir() or SOURCE_SITE.is_symlink() or not SOURCE_SITE.is_file()
            or (directory / 'fence.started.json').exists() or GATE.exists()
            or len(pm2_states()) != EXPECTED_PROCESSES
            or any(value != 'online' for value in pm2_states())):
        raise RuntimeError('Source does not match the reviewed SITREP baseline')
    site = SOURCE_SITE.read_text()
    if (site.count('listen 80;') != 1 or site.count('listen 443 ssl http2;') != 2
            or 'server_name sitrep.ultimamilla.com.ar;' not in site
            or 'server_name www.sitrep.ultimamilla.com.ar;' not in site):
        raise RuntimeError('SITREP source vhost changed; review it before fencing')
    helper = directory / 'sitrep-write-lock.py'
    watchdog = directory / 'sitrep-fence-watchdog.py'
    if any(path.is_symlink() or not path.is_file() for path in (helper, watchdog)):
        raise RuntimeError('Reviewed lock or recovery helper is missing')
    gate_text = load_gate(directory)
    os.umask(0o077)
    command(['nginx', '-t'])
    if http_status('sitrep.ultimamilla.com.ar') != '200':
        raise RuntimeError('SITREP source is not healthy before fencing')
    receipt = {'source_config_sha256': hashlib.sha256(SOURCE_SITE.read_bytes()).hexdigest(),
               'lock_application': application, 'lock_unit': unit, 'run': identifier}
    (directory / 'fence.started.json').write_text(json.dumps(receipt, indent=2) + '\n')
    gate_written = stopped = lock_started = False
    try:
        command(['systemd-run', '--unit=' + unit + '-watchdog', '--on-active=10m',
                 '/usr/bin/python3', str(watchdog), identifier])
        atomic_gate(gate_text, exclusive=True)
        gate_written = True
        reload_nginx()
        wait_gate('503')
        for host in ('www.ultimamilla.com.ar', 'sgi.ultimamilla.com.ar', 'www.umbot.com.ar'):
            if not re.fullmatch(r'[23][0-9]{2}', http_status(host)):
                raise RuntimeError('An unrelated site failed after the SITREP gate reload')
        stopped = True
        command(['pm2', 'stop', 'sitrep-backend'])
        wait_pm2('stopped')
        lock_started = True
        command(['systemd-run', '--unit=' + unit, '--collect', '--property=RuntimeMaxSec=28900',
                 '/usr/bin/python3', str(helper), identifier])
        wait_for_lock(application, unit)
        receipt['locked_relations'] = lock_count(application)
        (directory / 'fence.complete.json').write_text(json.dumps(receipt, indent=2) + '\n')
    except Exception:
        if gate_written:
            recover(application, unit, gate_text, stopped, lock_started, directory)
            (directory / 'fence.recovered').write_text('Source restored before target activation.\n')
        raise
    print('SITREP source is in maintenance and its user tables are locked against writes.')


if __name__ == '__main__':
    _verify = len(sys.argv) == 3 and sys.argv[1] == '--verify'
    _id = sys.argv[2] if _verify else sys.argv[1]
    _, _unit = identifier_parts(_id)
    _directory = RUN_ROOT / _id
    if _directory.is_symlink() or not _directory.is_dir():
        raise RuntimeError('Expected private run directory is missing')
    with (_directory / 'transition.lock').open('a') as _lock:
        fcntl.flock(_lock, fcntl.LOCK_SH if _verify else fcntl.LOCK_EX)
        if _verify:
            verify_fence(_id)
        else:
            main(_id)
