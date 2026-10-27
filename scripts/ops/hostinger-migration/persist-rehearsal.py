#!/usr/bin/env python3
"""Persist the verified, still isolated target services without a public cutover."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
UNITS = Path('/etc/systemd/system')
APPS = ('astro-ultimamilla', 'sgi', 'sitrep-backend', 'umbot-aceite', 'plan')
CONTAINERS = {'directus-admin-database-1', 'dge-demo-db', 'dge-demo-web',
              'dge-demo-rollback-cf24407ee8ee', 'directus-admin-directus-app-1', 'arca_app'}


def persistent_unit(text, dependencies):
    if (text.count('[Unit]') != 1 or text.count('[Service]') != 1
            or text.count('Restart=no\n') != 1 or '[Install]' in text
            or 'IPAddressDeny=any\n' not in text):
        raise ValueError('Not the reviewed isolated unit')
    text = text.replace('[Unit]\n', '[Unit]\nAfter=' + dependencies + '\nWants=' + dependencies + '\n', 1)
    return text.replace('Restart=no\n', 'Restart=on-failure\nRestartSec=3\n') + '\n[Install]\nWantedBy=multi-user.target\n'


def front_unit(dependencies):
    return ('[Unit]\nDescription=Verified UMSA front proxy (isolated until cutover)\n'
        'After=network-online.target ' + dependencies + '\nWants=network-online.target ' + dependencies + '\n'
        '[Service]\nType=simple\n'
        'ExecStartPre=/usr/sbin/nginx -t -c /srv/umsa-clean-proxy/nginx/nginx.conf\n'
        'ExecStart=/usr/sbin/nginx -c /srv/umsa-clean-proxy/nginx/nginx.conf -g "daemon off;"\n'
        'ExecReload=/bin/kill -HUP $MAINPID\nKillSignal=SIGQUIT\nTimeoutStopSec=30\n'
        'IPAddressDeny=any\nIPAddressAllow=localhost\nIPAddressAllow=68.168.218.28/32\n'
        'Restart=on-failure\nRestartSec=3\n[Install]\nWantedBy=multi-user.target\n')


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'):
        raise RuntimeError('Wrong destination')
    for marker in ('clean-proxy-rehearsal.ready', 'mail-prepared.complete', 'database-network-restricted.complete'):
        if not (STAGE / marker).is_file():
            raise RuntimeError('Missing isolated validation: ' + marker)
    if (STAGE / 'persist-rehearsal.started').exists() or (STAGE / 'production.active').exists():
        raise RuntimeError('Already attempted or production active; inspect first')
    if subprocess.run(['systemctl', 'is-enabled', '--quiet', 'nginx']).returncode == 0:
        raise RuntimeError('Legacy Nginx must remain disabled')
    if subprocess.run(['systemctl', 'is-active', '--quiet', 'nginx']).returncode == 0:
        raise RuntimeError('Legacy Nginx must remain stopped')
    metadata = json.loads(subprocess.check_output(['docker', 'inspect', *sorted(CONTAINERS)]))
    if {r['Name'].lstrip('/') for r in metadata} != CONTAINERS or not all(r['State']['Running'] for r in metadata):
        raise RuntimeError('Expected clean containers not running')
    for network in ('umsa-migration-db', 'umsa-clean-shared', 'umsa-clean-dge'):
        if not json.loads(subprocess.check_output(['docker', 'network', 'inspect', network]))[0]['Internal']:
            raise RuntimeError('Container network is not isolated')
    module_path = Path(__file__).with_name('rehearsal-bridges.py')
    spec = importlib.util.spec_from_file_location('bridges', module_path)
    bridges = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bridges)
    plans = {}
    for name, (container, network, local, remote) in bridges.TARGETS.items():
        row = next(r for r in metadata if r['Name'] == '/' + container)
        address = bridges.destination(container, network, row)
        unit_name = 'umsa-rehearsal-bridge-' + name + '.service'
        text = (UNITS / unit_name).read_text()
        if f'TCP4:{address}:{remote}\n' not in text or f'bind=127.0.0.1' not in text:
            raise RuntimeError('Bridge destination changed')
        # Docker preserves these existing network endpoints across restarts.
        # A preflight checks their identities again before each bridge is started.
        text = text.replace('[Service]\n', '[Service]\nExecStartPre=/usr/bin/python3 ' + str(STAGE / 'tooling/check-bridge.py') + ' ' + name + '\n')
        plans[unit_name] = persistent_unit(text, 'docker.service')
    bridge_units = ' '.join(sorted(plans))
    for name in APPS:
        unit_name = 'umsa-clean-' + name + '.service'
        text = (UNITS / unit_name).read_text()
        if 'ExecStart=' not in text or 'WorkingDirectory=/srv/umsa-clean-' not in text:
            raise RuntimeError('Unexpected application unit')
        plans[unit_name] = persistent_unit(text, 'mariadb.service redis.service memcached.service ' + bridge_units)
    plans['umsa-clean-front.service'] = front_unit(' '.join(sorted(plans)) + ' php-fpm.service php74-php-fpm.service')
    with (STAGE / 'receipts/persist-rehearsal.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        run(['/usr/sbin/nginx', '-t', '-c', '/srv/umsa-clean-proxy/nginx/nginx.conf'])
        backup = STAGE / 'units-before-persistence'
        backup.mkdir(mode=0o700)
        (STAGE / 'persist-rehearsal.started').write_text('Only verified target units; no public listeners or source changes.\n')
        for name, text in plans.items():
            path = UNITS / name
            if path.exists():
                shutil.copy2(path, backup / name)
            path.write_text(text)
            path.chmod(0o644)
        run(['systemd-analyze', 'verify', *[str(UNITS / name) for name in plans]])
        run(['systemctl', 'daemon-reload'])
        run(['docker', 'update', '--restart', 'unless-stopped', *sorted(CONTAINERS)])
        run(['systemctl', 'enable', 'docker', 'mariadb', 'redis', 'memcached', 'php-fpm', 'php74-php-fpm', *plans])
        # Replace only the private transient front process with the persistent unit.
        run(['systemctl', 'stop', 'umsa-clean-proxy'])
        try:
            run(['systemctl', 'start', 'umsa-clean-front'])
        except subprocess.CalledProcessError:
            run(['systemd-run', '--unit=umsa-clean-proxy-recovery', '--property=IPAddressDeny=any',
                 '--property=IPAddressAllow=localhost', '--property=IPAddressAllow=68.168.218.28/32',
                 '/usr/sbin/nginx', '-c', '/srv/umsa-clean-proxy/nginx/nginx.conf', '-g', 'daemon off;'])
            raise
        for name in plans:
            run(['systemctl', 'is-active', '--quiet', name])
        for name in bridges.TARGETS:
            run(['python3', str(STAGE / 'tooling/check-bridge.py'), name])
    (STAGE / 'persist-rehearsal.complete').write_text('Verified isolated services have persistent boot configuration. No reboot or public cutover performed.\n')
    print('Verified target services now have persistent boot configuration; networks remain isolated and source unchanged.')


if __name__ == '__main__':
    main()
