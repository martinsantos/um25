#!/usr/bin/env python3
"""Restore SGI production flags on the authoritative target, using a second port."""
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
FLAGS = ('NODE_APP_INSTANCE', 'INSTANCE_ID', 'DISABLE_EMAILS',
         'BLOCKCHAIN_ENABLED', 'SGI_OPERATIONAL_WATCHDOG')


def parse_environment(text):
    values = {}
    for line in text.splitlines():
        match = re.fullmatch(r'([A-Za-z_][A-Za-z0-9_]*)="((?:[^"\\]|\\["\\])*)"', line)
        if not match or match[1] in values:
            raise ValueError('Unexpected managed SGI environment syntax')
        values[match[1]] = re.sub(r'\\(["\\])', r'\1', match[2])
    return values


def production_environment(current, original):
    result = dict(current)
    for key in FLAGS:
        if key in original and original[key] is not None:
            result[key] = str(original[key])
        else:
            result.pop(key, None)
    result.update(PORT='3001', HOST='127.0.0.1', HOSTNAME='127.0.0.1')
    return result


def environment_text(values):
    return ''.join(k + '="' + v.replace('\\', '\\\\').replace('"', '\\"') + '"\n'
                   for k, v in sorted(values.items()))


def new_upstream(text):
    old = 'proxy_pass http://127.0.0.1:3000;'
    if text.count(old) != 1:
        raise RuntimeError('Unexpected SGI upstream inventory')
    return text.replace(old, 'proxy_pass http://127.0.0.1:3001;')


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud'
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file()
            or (STAGE / 'sgi-production-state.json').exists()):
        raise RuntimeError('Unexpected SGI production transition state')
    os.umask(0o077)
    receipts = list((STAGE / 'sgi-cutovers').glob('*/cutover.complete.json'))
    backups = list(Path('/srv/umsa-operational-backups').glob('*/backup.complete.json'))
    if len(receipts) != 1 or not backups:
        raise RuntimeError('Final SGI cutover and operational backup required')
    receipt = json.loads(receipts[0].read_text())
    if not receipt['source_fenced'] or not receipt['public_target_ready']:
        raise RuntimeError('SGI source must remain fenced')
    candidate = receipt['candidate']
    if not re.fullmatch(r'[0-9]+-[0-9]+', candidate):
        raise RuntimeError('Unexpected SGI database candidate')
    current_path = receipts[0].parent / 'sgi-live.environment'
    current = parse_environment(current_path.read_text())
    expected_socket = str(STAGE / 'sgi-dedicated-rehearsals' / candidate / 'socket/mysqld.sock')
    if current.get('DB_SOCKET') != expected_socket or current.get('PORT') != '3000':
        raise RuntimeError('SGI must use its active dedicated database')
    original = json.loads((STAGE / 'internal-credentials/node-environments.json').read_text())['sgi']
    values = production_environment(current, original)
    if values.get('SESSION_SECRET') != current.get('SESSION_SECRET'):
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
    for index, (p, text) in enumerate(previous.items()):
        (root / ('before-' + str(index) + '.conf')).write_text(text)
    (root / 'before.environment').write_text(current_path.read_text())
    old_unit = OLD_UNIT.read_text()
    if str(current_path) not in old_unit or old_unit.count('IPAddressDeny=any') != 1:
        raise RuntimeError('Unexpected isolated SGI unit')
    new_unit = old_unit.replace(str(current_path), str(environment))
    new_unit = '\n'.join(line for line in new_unit.splitlines()
                         if not line.startswith(('IPAddressDeny=', 'IPAddressAllow='))) + '\n'
    new_unit = new_unit.replace('Description=Clean isolated UMSA rehearsal sgi',
                                'Description=Authoritative UMSA SGI production')
    front_new = previous[front_unit].replace('umsa-clean-sgi.service', 'umsa-operational-sgi.service')
    if front_new == previous[front_unit]:
        raise RuntimeError('Expected proxy startup dependency missing')
    container = 'umsa-sgi-db-' + candidate
    timezone_config = STAGE / 'internal-credentials/sgi-timezone.cnf'
    public.atomic(timezone_config, '[mariadb]\ndefault-time-zone=-03:00\n', 0o600)
    with (root / 'operation.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, stdout=log, stderr=log, check=True, timeout=120)
        # Match the source database clock without stopping the database. New
        # connections in the candidate process inherit this session time zone.
        run(['docker', 'cp', str(timezone_config), container + ':/etc/mysql/conf.d/99-umsa-timezone.cnf'])
        run(['docker', 'exec', container, 'chmod', '644', '/etc/mysql/conf.d/99-umsa-timezone.cnf'])
        run(['docker', 'exec', container, 'mariadb', '--defaults-extra-file=/run/secrets/root.cnf',
             '-e', "SET GLOBAL time_zone='-03:00';"])
        check = subprocess.check_output(['docker', 'exec', container, 'mariadb',
            '--defaults-extra-file=/run/secrets/root.cnf', '-N', '-e', 'SELECT @@global.time_zone,@@session.time_zone;'], text=True)
        if check.strip() != '-03:00\t-03:00':
            raise RuntimeError('SGI database time zone did not match the source')
        public.atomic(environment, environment_text(values))
        public.atomic(NEW_UNIT, new_unit, 0o644)
        run(['systemd-analyze', 'verify', str(NEW_UNIT)])
        run(['systemctl', 'daemon-reload'])
        switched = False
        try:
            run(['systemctl', 'enable', '--now', 'umsa-operational-sgi'])
            for attempt in range(30):
                result = subprocess.run(['curl', '-fsS', '--max-time', '3', '-o', '/dev/null',
                                         'http://127.0.0.1:3001/auth/login'], stdout=log, stderr=log)
                if result.returncode == 0:
                    break
                time.sleep(1)
            else:
                raise RuntimeError('Operational SGI did not become ready')
            for p in vhosts:
                public.atomic(p, new_upstream(previous[p]), 0o600)
            public.atomic(front_unit, front_new, 0o644)
            run(['/usr/sbin/nginx', '-t', '-c', '/srv/umsa-clean-proxy/nginx/nginx.conf'])
            run(['/usr/sbin/nginx', '-t', '-c', str(public.FRONT)])
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'umsa-clean-front', 'umsa-sitrep-ingress'])
            public.probe('sgi.ultimamilla.com.ar', '/auth/login', {'200'})
            switched = True
        finally:
            if not switched:
                for p, text in previous.items():
                    public.atomic(p, text, 0o644 if p == front_unit else 0o600)
                run(['systemctl', 'daemon-reload'])
                run(['systemctl', 'reload', 'umsa-clean-front', 'umsa-sitrep-ingress'])
                run(['systemctl', 'disable', '--now', 'umsa-operational-sgi'])
        # Let requests held by the old Nginx workers finish before retiring the
        # rehearsal instance. Both instances use the same authoritative DB.
        time.sleep(30)
        run(['systemctl', 'disable', '--now', 'umsa-clean-sgi'])
        run(['systemctl', 'is-active', '--quiet', 'umsa-operational-sgi'])
        state = {'run': identifier, 'service': 'umsa-operational-sgi', 'port': 3001,
                 'same_session_secret': True, 'source_flags_restored': list(FLAGS),
                 'database_time_zone': '-03:00', 'outbound_integrations_enabled': True,
                 'financial_operations_or_test_email_sent': False}
        public.atomic(STAGE / 'sgi-production-state.json', json.dumps(state, indent=2) + '\n')
        (root / 'operation.complete.json').write_text(json.dumps(state, indent=2) + '\n')
    print('SGI production flags, network access and database clock restored; source remained fenced.')


if __name__ == '__main__':
    main(sys.argv[1])
