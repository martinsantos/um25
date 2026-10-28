#!/usr/bin/env python3
"""Restore a live-source SGI rehearsal in a disposable, networkless database.

The source is never stopped or written. MyISAM rows are not a final consistent
snapshot, so this rehearsal is not a cutover or replacement of production data.
"""
import json
import os
from pathlib import Path
import re
import shlex
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
IMAGE = 'mariadb:10.11@sha256:d769e37960821dfdcf096954f6e7ac89f747e116c1bba98e48edd265dfc7deae'
SOURCE = 'root@23.105.176.45'
ENTRYPOINT_READY = b'MariaDB init process done. Ready for start up.'
SQL = """SELECT CONCAT('T|',TABLE_NAME,'|',ENGINE) FROM information_schema.TABLES
 WHERE TABLE_SCHEMA='sgi_production' AND TABLE_TYPE='BASE TABLE'
 UNION ALL SELECT CONCAT('V|',TABLE_NAME,'|',DEFINER,'|',SECURITY_TYPE) FROM information_schema.VIEWS
 WHERE TABLE_SCHEMA='sgi_production'
 UNION ALL SELECT CONCAT('R|',ROUTINE_NAME,'|',DEFINER,'|',SECURITY_TYPE) FROM information_schema.ROUTINES
 WHERE ROUTINE_SCHEMA='sgi_production'
 UNION ALL SELECT CONCAT('G|',TRIGGER_NAME,'|',DEFINER,'|',EVENT_MANIPULATION) FROM information_schema.TRIGGERS
 WHERE TRIGGER_SCHEMA='sgi_production' ORDER BY 1;"""


def parse_inventory(text):
    rows = text.splitlines()
    if (len(rows) != len(set(rows)) or not rows
            or any(not re.fullmatch(r'[TVRG]\|[A-Za-z0-9_]+\|[A-Za-z0-9_@.-]+(?:\|[A-Za-z0-9_]+)?', row)
                   for row in rows)):
        raise ValueError('Unexpected SGI metadata inventory')
    counts = {kind: sum(row.startswith(kind + '|') for row in rows) for kind in 'TVRG'}
    if counts != {'T': 168, 'V': 4, 'R': 2, 'G': 1}:
        raise RuntimeError('SGI schema changed since the reviewed inventory')
    return sorted(rows)


def assert_isolated(details):
    host = details['HostConfig']
    if (host.get('NetworkMode') != 'none' or host.get('Privileged') or host.get('PortBindings')
            or any(mount.get('Type') != 'tmpfs' or mount.get('Destination') != '/var/lib/mysql'
                   for mount in details.get('Mounts', []))
            or '/var/lib/mysql' not in (host.get('Tmpfs') or {})):
        raise RuntimeError('Disposable MariaDB is not isolated')


def main(identifier):
    if (not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier)
            or socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not os.environ.get('SSH_AUTH_SOCK')):
        raise RuntimeError('Expected isolated CI target and source identity are required')
    os.umask(0o077)
    known = STAGE / 'known_hosts'
    if known.is_symlink() or not known.is_file():
        raise RuntimeError('Pinned source host key is missing')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-o',
           'ServerAliveInterval=30', SOURCE]
    def remote(args):
        return ssh + [shlex.join(args)]
    def source_query(query):
        return subprocess.check_output(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', query]),
                                       text=True, timeout=30)
    source_inventory = parse_inventory(source_query(SQL))
    root = STAGE / 'sgi-snapshot-rehearsals' / identifier
    root.mkdir(parents=True, mode=0o700, exist_ok=False)
    name = 'umsa-sgi-isolated-test-' + identifier
    # The image is digest-pinned; no host directory or port is mounted.
    subprocess.run(['docker', 'pull', IMAGE], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(['docker', 'run', '-d', '--rm', '--name', name, '--network', 'none',
                    '--memory', '1500m', '--pids-limit', '256', '--tmpfs', '/var/lib/mysql:rw,nosuid,size=1g',
                    '-e', 'MARIADB_ALLOW_EMPTY_ROOT_PASSWORD=1', IMAGE], check=True, stdout=subprocess.DEVNULL)
    try:
        details = json.loads(subprocess.check_output(['docker', 'inspect', name], text=True))[0]
        assert_isolated(details)
        def target_query(query):
            return subprocess.check_output(['docker', 'exec', name, 'mariadb', '--no-defaults', '-uroot',
                                            '-N', '-e', query], text=True, timeout=30)
        for _ in range(90):
            logs = subprocess.run(['docker', 'logs', name], capture_output=True, timeout=10)
            # The image starts and then stops a temporary initialization server.
            # A successful SELECT there does not mean the final server is ready.
            if ENTRYPOINT_READY not in logs.stdout + logs.stderr:
                time.sleep(1)
                continue
            try:
                if target_query('SELECT 1;').strip() == '1':
                    break
            except subprocess.CalledProcessError:
                time.sleep(1)
        else:
            raise RuntimeError('Disposable MariaDB did not start')
        dump_command = ['mariadb-dump', '--no-defaults', '-uroot', '--single-transaction', '--skip-lock-tables',
                        '--routines', '--events', '--triggers', '--hex-blob', '--databases', 'sgi_production']
        with (root / 'restore.log').open('ab') as log:
            source_dump = subprocess.Popen(remote(dump_command), stdout=subprocess.PIPE, stderr=log)
            try:
                restore = subprocess.Popen(['docker', 'exec', '-i', name, 'mariadb', '--no-defaults', '-uroot'],
                                           stdin=source_dump.stdout, stdout=log, stderr=log)
            finally:
                source_dump.stdout.close()
            restore_result, dump_result = restore.wait(timeout=600), source_dump.wait(timeout=60)
            if restore_result or dump_result:
                raise RuntimeError('SGI rehearsal dump or restore failed; see private log')
            target_inventory = parse_inventory(target_query(SQL))
            final_source = parse_inventory(source_query(SQL))
            if source_inventory != target_inventory or source_inventory != final_source:
                raise RuntimeError('SGI source or restored schema differs')
            for row in target_inventory:
                if row.startswith('V|'):
                    view = row.split('|')[1]
                    target_query('SELECT * FROM `sgi_production`.`' + view + '` LIMIT 0;')
            subprocess.run(['docker', 'exec', name, 'mariadb-check', '--no-defaults', '-uroot',
                            '--databases', 'sgi_production', '--check'], check=True, stdout=log, stderr=log,
                           timeout=300)
        (root / 'rehearsal.complete.json').write_text(json.dumps({
            'run': identifier, 'tables': 168, 'views': 4, 'routines': 2, 'triggers': 1,
            'network': 'none', 'source_online': True, 'final_cutover_snapshot': False}, indent=2) + '\n')
    finally:
        subprocess.run(['docker', 'stop', '--time', '15', name], check=True, stdout=subprocess.DEVNULL)
    print('SGI schema, views and database checks passed in a disposable networkless MariaDB; no cutover occurred.')


if __name__ == '__main__':
    main(sys.argv[1])
