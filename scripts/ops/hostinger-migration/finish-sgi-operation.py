#!/usr/bin/env python3
"""Restore SGI production flags on the authoritative target, using a second port."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
OLD_UNIT = Path('/etc/systemd/system/umsa-clean-sgi.service')
NEW_UNIT = Path('/etc/systemd/system/umsa-operational-sgi.service')
# This exact encrypted archive was independently decrypted on the recovery host
# and Mac; its nine database hashes and referenced base were verified.
VERIFIED_BACKUP = ('20261028T094123Z-ae3eaadb', 51645153,
                   '6325ae56621bdc9098eca6ec850d36f15d5876468e9e868b364dad01f69d0622')
FLAGS = ('NODE_APP_INSTANCE', 'INSTANCE_ID', 'DISABLE_EMAILS',
         'BLOCKCHAIN_ENABLED', 'SGI_OPERATIONAL_WATCHDOG')


def parse_environment(text):
    values = {}
    for line in text.splitlines():
        match = re.fullmatch(r'([A-Za-z_][A-Za-z0-9_]*)="((?:[^"\\]|\\["\\])*)"', line)
        # The dedicated-database cutover appended this one literal path unquoted.
        if not match:
            match = re.fullmatch(r'(DB_SOCKET)=(/srv/umsa-migration/sgi-dedicated-rehearsals/'
                                 r'[0-9]+-[0-9]+/socket/mysqld\.sock)', line)
        if not match or match[1] in values:
            raise ValueError('Unexpected managed SGI environment syntax')
        values[match[1]] = re.sub(r'\\(["\\])', r'\1', match[2])
    return values


def production_environment(current, original):
    result = dict(current)
    for key in FLAGS:
        if key in original and original[key] is not None:
            value = original[key]
            result[key] = str(value).lower() if isinstance(value, bool) else str(value)
        else:
            result.pop(key, None)
    result.update(PORT='3001', HOST='127.0.0.1', HOSTNAME='127.0.0.1')
    return result


def environment_text(values):
    if any(not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', k) or not isinstance(v, str)
           or any(c in v for c in '\n\r\0') for k, v in values.items()):
        raise ValueError('Unsafe managed SGI environment value')
    return ''.join(k + '="' + v.replace('\\', '\\\\').replace('"', '\\"') + '"\n'
                   for k, v in sorted(values.items()))


def new_upstream(text):
    old = 'proxy_pass http://127.0.0.1:3000;'
    if text.count(old) != 1:
        raise RuntimeError('Unexpected SGI upstream inventory')
    return text.replace(old, 'proxy_pass http://127.0.0.1:3001;')


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def verified_backup():
    identifier, size, digest = VERIFIED_BACKUP
    root = Path('/srv/umsa-operational-backups') / identifier
    receipt_path = root / 'backup.complete.json'
    if root.is_symlink() or receipt_path.is_symlink():
        raise RuntimeError('Unexpected verified backup configuration')
    receipt = json.loads(receipt_path.read_text())
    archive = root / ('HOSTINGER-active-' + identifier + '.tar.gz.gpg')
    if (receipt.get('archive') != archive.name or receipt.get('bytes') != size
            or receipt.get('sha256') != digest or receipt.get('database_files') != 9
            or receipt.get('encrypted_offsite') is not True or archive.is_symlink()
            or archive.stat().st_size != size or sha256(archive) != digest):
        raise RuntimeError('The independently verified operational backup changed')
    return digest


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or os.geteuid() != 0
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file()
            or (STAGE / 'sgi-production-state.json').exists()):
        raise RuntimeError('Unexpected SGI production transition state')
    os.umask(0o077)
    receipts = list((STAGE / 'sgi-cutovers').glob('*/cutover.complete.json'))
    if len(receipts) != 1:
        raise RuntimeError('Final SGI cutover required')
    backup_digest = verified_backup()
    receipt = json.loads(receipts[0].read_text())
    if not receipt['source_fenced'] or not receipt['public_target_ready']:
        raise RuntimeError('SGI source must remain fenced')
    candidate = receipt['candidate']
    if not re.fullmatch(r'[0-9]+-[0-9]+', candidate):
        raise RuntimeError('Unexpected SGI database candidate')
    current_path = receipts[0].parent / 'sgi-live.environment'
    current = parse_environment(current_path.read_text())
    expected_socket = str(STAGE / 'sgi-dedicated-rehearsals' / candidate / 'socket/mysqld.sock')
    if (current.get('DB_SOCKET') != expected_socket or current.get('PORT') != '3000'
            or current.get('NODE_ENV') != 'production' or not current.get('SESSION_SECRET')):
        raise RuntimeError('SGI must use its active dedicated database and session secret')
    original = json.loads((STAGE / 'internal-credentials/node-environments.json').read_text())['sgi']
    values = production_environment(current, original)
    if values.get('SESSION_SECRET') != current['SESSION_SECRET']:
        raise RuntimeError('Do not invalidate active SGI sessions')
    root = STAGE / 'sgi-operational-finalizations' / identifier
    root.mkdir(parents=True, mode=0o700, exist_ok=False)
    spec = importlib.util.spec_from_file_location('sgi_public', Path(__file__).with_name('public-vhost.py'))
    public = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(public)
    environment = STAGE / 'production-sgi.environment'
    if NEW_UNIT.exists() or environment.exists():
        raise RuntimeError('An operational SGI instance already exists')
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 3001))
    front_unit = Path('/etc/systemd/system/umsa-clean-front.service')
    vhosts = [Path('/srv/umsa-public-vhosts/sgi.ultimamilla.com.ar.conf'),
              Path('/srv/umsa-clean-proxy/nginx/sites-enabled/sgi.ultimamilla.com.ar')]
    files = [*vhosts, front_unit]
    if any(p.is_symlink() or not p.is_file() for p in [*files, OLD_UNIT, current_path]):
        raise RuntimeError('Unexpected managed SGI configuration type')
    previous = {p: p.read_text() for p in files}
    replacements = {p: new_upstream(previous[p]) for p in vhosts}
    for index, (p, text) in enumerate(previous.items()):
        (root / ('before-' + str(index) + '.conf')).write_text(text)
    (root / 'before.environment').write_text(current_path.read_text())
    old_unit = OLD_UNIT.read_text()
    if (old_unit.count('EnvironmentFile=' + str(current_path)) != 1
            or old_unit.count('IPAddressDeny=any') != 1
            or 'Restart=on-failure' not in old_unit or 'WantedBy=multi-user.target' not in old_unit):
        raise RuntimeError('Unexpected isolated SGI unit')
    new_unit = old_unit.replace(str(current_path), str(environment))
    new_unit = '\n'.join(line for line in new_unit.splitlines()
                         if not line.startswith(('IPAddressDeny=', 'IPAddressAllow='))) + '\n'
    new_unit = new_unit.replace('[Unit]\n', '[Unit]\nAfter=docker.service network-online.target\nWants=docker.service network-online.target\n', 1)
    new_unit = new_unit.replace('Description=Clean isolated UMSA rehearsal sgi',
                                'Description=Authoritative UMSA SGI production')
    if previous[front_unit].count('umsa-clean-sgi.service') != 2:
        raise RuntimeError('Expected proxy startup dependencies missing')
    front_new = previous[front_unit].replace('umsa-clean-sgi.service', 'umsa-operational-sgi.service')
    container = 'umsa-sgi-db-' + candidate
    info = json.loads(subprocess.check_output(['docker', 'inspect', container], text=True, timeout=30))[0]
    if (info['HostConfig']['NetworkMode'] != 'none' or info['HostConfig'].get('PortBindings')
            or info['HostConfig']['RestartPolicy']['Name'] not in ('always', 'unless-stopped')
            or not info['State']['Running']):
        raise RuntimeError('SGI database isolation or persistent startup changed')
    timezone_config = root / 'sgi-timezone.cnf'
    public.atomic(timezone_config, '[mariadb]\ndefault-time-zone=-03:00\n', 0o600)
    timezone_inside = '/etc/mysql/conf.d/99-umsa-timezone.cnf'
    with (root / 'operation.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, stdout=log, stderr=log, check=True, timeout=120)
        def db(sql):
            return subprocess.check_output(['docker', 'exec', container, 'mariadb',
                '--defaults-extra-file=/run/secrets/root.cnf', '-N', '-e', sql], text=True, timeout=30).strip()
        def ready(port):
            for _ in range(30):
                result = subprocess.run(['curl', '--noproxy', '*', '-fsS', '--max-time', '3', '-o', '/dev/null',
                                         'http://127.0.0.1:' + str(port) + '/auth/login'], stdout=log, stderr=log)
                if result.returncode == 0:
                    return
                time.sleep(1)
            raise RuntimeError('SGI port did not become ready: ' + str(port))
        # This file must be new so rollback can remove only our own addition.
        run(['docker', 'exec', container, 'test', '!', '-e', timezone_inside])
        previous_zone = db('SELECT @@global.time_zone;')
        if previous_zone != 'SYSTEM':
            raise RuntimeError('Unexpected SGI database clock baseline')
        timezone_changed = False
        service_created = False
        try:
            # New connections inherit the source clock; the file survives restart.
            timezone_changed = True
            run(['docker', 'cp', str(timezone_config), container + ':' + timezone_inside])
            run(['docker', 'exec', container, 'chmod', '644', timezone_inside])
            run(['docker', 'exec', container, 'mariadb', '--defaults-extra-file=/run/secrets/root.cnf',
                 '-e', "SET GLOBAL time_zone='-03:00';"])
            if db('SELECT @@global.time_zone,@@session.time_zone;') != '-03:00\t-03:00':
                raise RuntimeError('SGI database time zone did not match the source')
            public.atomic(environment, environment_text(values))
            service_created = True
            public.atomic(NEW_UNIT, new_unit, 0o644)
            run(['systemd-analyze', 'verify', str(NEW_UNIT)])
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'enable', '--now', 'umsa-operational-sgi'])
            run(['systemctl', 'is-enabled', '--quiet', 'umsa-operational-sgi'])
            ready(3001)
            for p in vhosts:
                public.atomic(p, replacements[p], 0o600)
            public.atomic(front_unit, front_new, 0o644)
            run(['/usr/sbin/nginx', '-t', '-c', '/srv/umsa-clean-proxy/nginx/nginx.conf'])
            run(['/usr/sbin/nginx', '-t', '-c', str(public.FRONT)])
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'umsa-clean-front', 'umsa-sitrep-ingress'])
            public.probe('sgi.ultimamilla.com.ar', '/auth/login', {'200'})
            # Drain old Nginx workers, then recheck before retiring port 3000.
            time.sleep(30)
            run(['systemctl', 'is-active', '--quiet', 'umsa-operational-sgi'])
            public.probe('sgi.ultimamilla.com.ar', '/auth/login', {'200'})
            run(['systemctl', 'disable', '--now', 'umsa-clean-sgi'])
            state = {'run': identifier, 'service': 'umsa-operational-sgi', 'port': 3001,
                     'same_session_secret': True, 'source_flags_restored': list(FLAGS),
                     'database_time_zone': '-03:00', 'outbound_integrations_enabled': True,
                     'verified_backup_sha256': backup_digest,
                     'test_payment_or_email_requested': False}
            public.atomic(root / 'operation.complete.json', json.dumps(state, indent=2) + '\n')
            public.atomic(STAGE / 'sgi-production-state.json', json.dumps(state, indent=2) + '\n')
        except Exception:
            # Keep the new instance available until old routing has been restored.
            # No source writer is ever restarted: both services use the target DB.
            run(['systemctl', 'enable', '--now', 'umsa-clean-sgi'])
            ready(3000)
            for p, text in previous.items():
                public.atomic(p, text, 0o644 if p == front_unit else 0o600)
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'umsa-clean-front', 'umsa-sitrep-ingress'])
            if service_created:
                time.sleep(30)
                run(['systemctl', 'disable', '--now', 'umsa-operational-sgi'])
                NEW_UNIT.unlink(missing_ok=True)
                environment.unlink(missing_ok=True)
                run(['systemctl', 'daemon-reload'])
            if timezone_changed:
                run(['docker', 'exec', container, 'rm', '-f', timezone_inside])
                run(['docker', 'exec', container, 'mariadb', '--defaults-extra-file=/run/secrets/root.cnf',
                     '-e', "SET GLOBAL time_zone='SYSTEM';"])
            (root / 'operation.complete.json').unlink(missing_ok=True)
            raise
    print('SGI production flags, network access and database clock restored; source remained fenced.')


if __name__ == '__main__':
    main(sys.argv[1])
