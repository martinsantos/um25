#!/usr/bin/env python3
"""Fence the source SGI writer during an explicitly approved CI cutover."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import socket
import subprocess
import sys
import time

ROOT = Path('/root/umsa-sgi-cutovers')
SITE = Path('/etc/nginx/sites-enabled/sgi.ultimamilla.com.ar')
MONITOR = Path('/root/scripts/ensure-pm2-processes.sh')
MARKER = Path('/root/umsa-sgi-cutover-active')
MONITOR_SHA = '41a564be4408d8fde9f9d84b930833e2c1acca789cdb94409a8f7f6f1a1ff2a3'
SITE_SHA = 'c9f423f434f7325c3217a3d4b2cb72194a1f85e26e468a585b93b3582f82ec97'


def maintenance():
    return '''server {
    listen 80;
    server_name sgi.ultimamilla.com.ar www.sgi.ultimamilla.com.ar;
    return 301 https://sgi.ultimamilla.com.ar$request_uri;
}
server {
    listen 443 ssl http2;
    server_name sgi.ultimamilla.com.ar www.sgi.ultimamilla.com.ar;
    ssl_certificate /etc/letsencrypt/live/sgi.ultimamilla.com.ar-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sgi.ultimamilla.com.ar-0001/privkey.pem;
    default_type text/plain;
    add_header Retry-After 120 always;
    return 503 "SGI esta cambiando de servidor. Reintente en unos minutos.\\n";
}
'''


def monitor_text(original):
    anchor = '    log_message "DEBUG" "Checking process: $process"'
    if original.count(anchor) != 1 or 'umsa-sgi-cutover-active' in original:
        raise RuntimeError('Unexpected source monitor')
    return original.replace(anchor, '''    if [[ "$process" = "sgi" && -f /root/umsa-sgi-cutover-active ]]; then
        log_message "INFO" "SGI migration fence active; source writer remains stopped"
        continue
    fi
''' + anchor)


def atomic(path, content, mode=0o600):
    pending = path.with_name(path.name + '.umsa-pending')
    with pending.open('x') as stream:
        stream.write(content)
        stream.flush()
        os.fsync(stream.fileno())
    pending.chmod(mode)
    os.replace(pending, path)


def command(args, check=True):
    return subprocess.run(args, check=check, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)


def query(sql):
    return subprocess.check_output(['mariadb', '--no-defaults', '-uroot', '-N', '-e', sql], text=True, timeout=30)


def pm2_state():
    rows = json.loads(subprocess.check_output(['pm2', 'jlist'], text=True, timeout=20))
    return [row['pm2_env']['status'] for row in rows if row['name'] == 'sgi']


def site_path():
    result = SITE.resolve(strict=True)
    if result not in (SITE, Path('/etc/nginx/sites-available/sgi.ultimamilla.com.ar')):
        raise RuntimeError('Unexpected SGI site path')
    return result


def reload():
    command(['nginx', '-t'])
    command(['systemctl', 'reload', 'nginx'])


def lock_active(identifier):
    if command(['systemctl', 'is-active', '--quiet', 'umsa-sgi-fence-' + identifier], False).returncode:
        return False
    rows = query("SELECT COUNT(*) FROM information_schema.PROCESSLIST WHERE USER='root' "
                 "AND DB IS NULL AND INFO='SELECT SLEEP(28800)';")
    return int(rows.strip()) == 1


def verify(identifier):
    directory = ROOT / identifier
    if (not (directory / 'fence.complete.json').is_file() or MARKER.is_symlink()
            or MARKER.read_text().strip() != identifier or pm2_state() != ['stopped']
            or site_path().read_text() != maintenance()
            or MONITOR.read_text() != monitor_text((directory / 'monitor.before').read_text())
            or not lock_active(identifier)):
        raise RuntimeError('SGI source fence is not intact')
    grants = query("SHOW GRANTS FOR 'sgi_app'@'localhost';")
    if any(word in grants for word in ('INSERT', 'UPDATE', 'DELETE', 'EXECUTE')):
        raise RuntimeError('Old SGI writer privileges were not revoked')
    print('Source SGI writer stopped, restart guard active, writes revoked and tables read-locked.')


def recover(identifier):
    directory = ROOT / identifier
    if (directory / 'target-writes-authorized').exists():
        raise RuntimeError('Target may have writes; refusing to restart the old SGI writer')
    # The lock is released only during a pre-activation recovery.
    command(['systemctl', 'stop', 'umsa-sgi-fence-' + identifier], False)
    if (directory / 'grants.before.sql').is_file():
        subprocess.run(['mariadb', '--no-defaults', '-uroot'],
                       input=(directory / 'grants.before.sql').read_text(), text=True,
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
    if (directory / 'monitor.before').is_file():
        atomic(MONITOR, (directory / 'monitor.before').read_text(), 0o755)
    if MARKER.exists() and MARKER.read_text().strip() == identifier:
        MARKER.rename(directory / 'source-marker.recovered')
    command(['pm2', 'restart', 'sgi'])
    command(['pm2', 'save'])
    if (directory / 'site.before').is_file():
        atomic(site_path(), (directory / 'site.before').read_text(), 0o644)
        reload()
    (directory / 'recovered').write_text('Recovered before target writes were authorized.\n')


def fence(identifier):
    original_site, original_monitor = site_path().read_text(), MONITOR.read_text()
    if (MARKER.exists() or hashlib.sha256(original_site.encode()).hexdigest() != SITE_SHA
            or hashlib.sha256(original_monitor.encode()).hexdigest() != MONITOR_SHA
            or pm2_state() != ['online']):
        raise RuntimeError('Source SGI baseline changed; cutover not started')
    grants = query("SHOW GRANTS FOR 'sgi_app'@'localhost';")
    if ('GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, EXECUTE ON `sgi_production`.*'
            not in grants or len(grants.splitlines()) != 2):
        raise RuntimeError('Unexpected source SGI grants')
    directory = ROOT / identifier
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    (directory / 'site.before').write_text(original_site)
    (directory / 'monitor.before').write_text(original_monitor)
    (directory / 'grants.before.sql').write_text(';\n'.join(grants.splitlines()) + ';\n')
    try:
        atomic(MARKER, identifier + '\n')
        atomic(MONITOR, monitor_text(original_monitor), 0o755)
        command(['bash', '-n', str(MONITOR)])
        atomic(site_path(), maintenance(), 0o644)
        reload()
        command(['pm2', 'stop', 'sgi'])
        command(['pm2', 'save'])
        if pm2_state() != ['stopped']:
            raise RuntimeError('Source SGI did not stop')
        query("REVOKE INSERT,UPDATE,DELETE,EXECUTE ON sgi_production.* FROM 'sgi_app'@'localhost';")
        for value in query("SELECT ID FROM information_schema.PROCESSLIST WHERE USER='sgi_app';").splitlines():
            if not value.isdigit():
                raise RuntimeError('Unexpected SGI connection identifier')
            query('KILL CONNECTION ' + value + ';')
        lock = Path(__file__).with_name('sgi-write-lock.py')
        if lock.is_symlink() or not lock.is_file():
            raise RuntimeError('Reviewed SGI table lock helper is missing')
        command(['systemd-run', '--quiet', '--unit=umsa-sgi-fence-' + identifier,
                 '--property=Type=exec', '/usr/bin/python3', str(lock)])
        for _ in range(45):
            if lock_active(identifier):
                break
            time.sleep(1)
        else:
            raise RuntimeError('SGI read lock did not become active')
        (directory / 'fence.complete.json').write_text(json.dumps({'run': identifier,
            'source_writer': 'stopped', 'table_lock': True, 'write_privileges': 'revoked'}) + '\n')
        verify(identifier)
        # The watchdog restores source only if target writes have not been authorized.
        command(['systemd-run', '--quiet', '--unit=umsa-sgi-watchdog-' + identifier,
                 '/usr/bin/python3', str(Path(__file__).resolve()), 'watchdog', identifier])
    except Exception:
        recover(identifier)
        raise


def main(mode, identifier):
    if socket.gethostname() != 'FTS-23.105.176.45' or not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise RuntimeError('Unexpected source or run identity')
    os.umask(0o077)
    if mode == 'fence':
        fence(identifier)
    elif mode == 'verify':
        verify(identifier)
    elif mode == 'commit':
        verify(identifier)
        with (ROOT / identifier / 'target-writes-authorized').open('x') as stream:
            stream.write('Source must remain fenced while Hostinger is the writer.\n')
            stream.flush()
            os.fsync(stream.fileno())
    elif mode == 'recover':
        recover(identifier)
    elif mode == 'watchdog':
        deadline = time.monotonic() + 1200
        while time.monotonic() < deadline:
            if (ROOT / identifier / 'target-writes-authorized').exists() or (ROOT / identifier / 'recovered').exists():
                return
            time.sleep(5)
        recover(identifier)
    else:
        raise ValueError('Unsupported SGI cutover operation')


if __name__ == '__main__':
    main(*sys.argv[1:])
