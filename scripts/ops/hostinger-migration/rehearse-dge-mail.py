#!/usr/bin/env python3
"""Test DGE's local SMTP path without transmitting mail or enabling the MTA."""
import json
import os
from pathlib import Path
import socket
import subprocess
import time

STAGE = Path('/srv/umsa-migration')
QUEUE = Path('/var/spool/postfix')
UNIT = 'umsa-dge-mail-rehearsal'


def queue_empty(root):
    for name in ('active', 'deferred', 'incoming', 'hold'):
        path = root / name
        if path.is_symlink() or not path.is_dir() or any(item.is_file() or item.is_symlink() for item in path.rglob('*')):
            return False
    return True


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or not (STAGE / 'mail-prepared.complete').is_file()):
        raise RuntimeError('Not the isolated, prepared target')
    if (STAGE / 'dge-mail-rehearsal.started').exists() or not queue_empty(QUEUE):
        raise RuntimeError('Earlier attempt or nonempty queue; inspect before starting')
    for unit in ('postfix', UNIT):
        if subprocess.run(['systemctl', 'is-active', '--quiet', unit]).returncode == 0:
            raise RuntimeError('Unexpected active SMTP service')
    network = json.loads(subprocess.check_output(['docker', 'network', 'inspect', 'umsa-clean-dge']))[0]
    clients = [row for row in network['Containers'].values() if row['Name'] == 'dge-demo-web']
    if not network['Internal'] or len(clients) != 1 or clients[0]['IPv4Address'] != '172.18.0.3/16':
        raise RuntimeError('Unexpected DGE network')
    interfaces = subprocess.check_output(['postconf', '-h', 'inet_interfaces'], text=True).strip()
    if interfaces != '127.0.0.1, 172.18.0.1':
        raise RuntimeError('Unexpected SMTP bind addresses')
    (STAGE / 'dge-mail-rehearsal.started').write_text('Temporary egress-restricted Postfix; SMTP greeting and RSET only.\n')
    client = ("import smtplib; s=smtplib.SMTP('172.18.0.1',25,timeout=5); "
              "assert s.ehlo()[0]==250; assert s.rset()[0]==250; s.quit()")
    with (STAGE / 'receipts/dge-mail-rehearsal.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        try:
            run(['systemd-run', '--unit=' + UNIT, '--property=IPAddressDeny=any',
                 '--property=IPAddressAllow=localhost', '--property=IPAddressAllow=172.18.0.0/16',
                 '/usr/sbin/postfix', '-c', '/etc/postfix', 'start-fg'])
            for _ in range(30):
                result = subprocess.run(['docker', 'exec', 'dge-demo-web', 'python', '-c', client],
                                        stdout=log, stderr=log)
                if result.returncode == 0:
                    break
                time.sleep(1)
            else:
                raise RuntimeError('DGE SMTP greeting did not succeed')
        finally:
            run(['systemctl', 'stop', UNIT])
    if not queue_empty(QUEUE) or subprocess.run(['systemctl', 'is-active', '--quiet', 'postfix']).returncode == 0:
        raise RuntimeError('Unexpected queue or SMTP service state')
    (STAGE / 'dge-mail-rehearsal.complete').write_text('DGE SMTP greeting and RSET passed; no mail sent, queue empty, permanent MTA stopped.\n')
    print('DGE can reach its local SMTP service in isolation; no message was sent and the service was stopped again.')


if __name__ == '__main__':
    main()
