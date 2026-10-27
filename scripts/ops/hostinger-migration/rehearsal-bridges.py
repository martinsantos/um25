#!/usr/bin/env python3
"""Local-only TCP access to Docker internal networks for isolated rehearsal."""
import ipaddress
import json
import os
from pathlib import Path
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
TARGETS = {
    'postgres': ('directus-admin-database-1','umsa-migration-db',5432,5432),
    'directus': ('directus-admin-directus-app-1','umsa-clean-shared',8055,8055),
    'dge': ('dge-demo-web','umsa-clean-dge',18191,8000),
    'dge-fallback': ('dge-demo-rollback-cf24407ee8ee','umsa-clean-dge',18192,8000),
    'arca': ('arca_app','umsa-clean-shared',8501,8501),
}
SUBNETS = {'umsa-migration-db':'172.30.250.0/24','umsa-clean-shared':'172.20.0.0/16','umsa-clean-dge':'172.18.0.0/16'}


def destination(container, network, metadata):
    if metadata['Name'] != '/' + container or not metadata['State']['Running']:
        raise RuntimeError('Expected healthy target container')
    value = metadata['NetworkSettings']['Networks'][network]['IPAddress']
    if ipaddress.ip_address(value) not in ipaddress.ip_network(SUBNETS[network]):
        raise RuntimeError('Container address outside isolated network')
    return value


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'clean-container-rehearsal.ready').is_file() or (STAGE / 'rehearsal-bridges.started').exists():
        raise RuntimeError('Unexpected rehearsal state')
    plans = {}
    for name,(container,network,local,remote) in TARGETS.items():
        metadata = json.loads(subprocess.check_output(['docker','inspect',container]))[0]
        address = destination(container,network,metadata)
        proof = json.loads(subprocess.check_output(['docker','network','inspect',network]))[0]
        if not proof['Internal']:
            raise RuntimeError('Rehearsal network is not internal')
        with socket.socket() as probe:
            probe.bind(('127.0.0.1',local))
        plans[name] = (address,local,remote)
    with (STAGE / 'receipts/rehearsal-bridges.log').open('ab') as log:
        def run(args):
            subprocess.run(args,check=True,stdout=log,stderr=log)
        (STAGE / 'rehearsal-bridges.started').write_text('Internal Docker local access only.\n')
        run(['dnf','-y','install','socat'])
        for name,(address,local,remote) in plans.items():
            unit = '[Unit]\nDescription=Local isolated rehearsal bridge ' + name + '\n[Service]\nType=simple\n'
            unit += f'ExecStart=/usr/bin/socat TCP4-LISTEN:{local},bind=127.0.0.1,reuseaddr,fork TCP4:{address}:{remote}\n'
            unit += 'IPAddressDeny=any\nIPAddressAllow=localhost\nIPAddressAllow=' + address + '/32\n'
            unit += 'NoNewPrivileges=yes\nPrivateTmp=yes\nProtectSystem=strict\nProtectHome=yes\nRestart=no\n'
            Path('/etc/systemd/system/umsa-rehearsal-bridge-' + name + '.service').write_text(unit)
        run(['systemctl','daemon-reload'])
        for name in plans:
            run(['systemctl','start','umsa-rehearsal-bridge-' + name])
    (STAGE / 'rehearsal-bridges.ready').write_text(json.dumps(plans) + '\n')
    print('Local rehearsal bridges installed. Docker networks remain internal and no public port is opened.')


if __name__ == '__main__':
    main()
