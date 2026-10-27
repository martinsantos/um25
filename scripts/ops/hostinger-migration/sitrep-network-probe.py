#!/usr/bin/env python3
"""Briefly test the target web port only from the old server, without app data."""
import os
from pathlib import Path
import re
import shlex
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
TARGET_IP = '179.198.115.115'
SOURCE_IP = '23.105.176.45'


def token(identifier):
    if not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier):
        raise ValueError('Invalid CI run identifier')
    return 'UMSA-SITREP-NETWORK-' + identifier


def serve(identifier):
    if socket.gethostname() != 'srv2101069.hstgr.cloud':
        raise RuntimeError('Unexpected probe host')
    answer = (token(identifier) + '\n').encode()
    with socket.socket() as listener:
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        listener.bind((TARGET_IP, 443))
        listener.listen(4)
        listener.settimeout(2)
        deadline = time.monotonic() + 28
        while time.monotonic() < deadline:
            try:
                connection, peer = listener.accept()
            except socket.timeout:
                continue
            with connection:
                if peer[0] in (SOURCE_IP, '127.0.0.1'):
                    connection.sendall(answer)


def main(identifier):
    expected = token(identifier)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != TARGET_IP
            or any((STAGE / marker).exists() for marker in ('production.active', 'sitrep-final-refresh.started',
                                                              'sitrep-public-activation.started'))
            or not os.environ.get('SSH_AUTH_SOCK')):
        raise RuntimeError('Not the isolated Hostinger destination')
    known = STAGE / 'known_hosts'
    if known.is_symlink() or not known.is_file():
        raise RuntimeError('Pinned source host key is missing')
    with socket.socket() as probe:
        probe.bind((TARGET_IP, 443))
    unit = 'umsa-sitrep-network-probe-' + identifier
    started = False
    try:
        subprocess.run(['systemd-run', '--unit=' + unit, '--collect', '--property=RuntimeMaxSec=35',
            '--property=IPAddressDeny=any', '--property=IPAddressAllow=localhost',
            '--property=IPAddressAllow=' + SOURCE_IP + '/32', '/usr/bin/python3', str(Path(__file__).resolve()),
            '--serve', identifier], check=True, stdout=subprocess.DEVNULL)
        started = True
        for _ in range(40):
            listening = subprocess.check_output(['ss', '-H', '-lnt', 'sport', '=', ':443'], text=True)
            if TARGET_IP + ':443' in listening:
                break
            time.sleep(0.25)
        else:
            raise RuntimeError('Restricted probe listener did not start')
        code = ("import socket; s=socket.create_connection(('179.198.115.115',443),timeout=8); "
                "print(s.recv(128).decode('ascii').strip()); s.close()")
        ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
               'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', 'root@' + SOURCE_IP]
        response = subprocess.check_output(ssh + [shlex.join(['/usr/bin/python3', '-c', code])], text=True).strip()
        if response != expected:
            raise RuntimeError('Source-to-target network response differs')
    finally:
        if started:
            subprocess.run(['systemctl', 'stop', unit], check=True)
    print('Hostinger port 443 is reachable from the old server with a source-restricted test listener.')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--serve':
        serve(sys.argv[2])
    elif len(sys.argv) == 2:
        main(sys.argv[1])
    else:
        raise RuntimeError('Unknown network probe operation')
