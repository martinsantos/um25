#!/usr/bin/env python3
"""Preserve recent live database snapshots without stopping or changing services.

The source stays active. MariaDB MyISAM tables and cross-database timing are
not a consistent final cutover. SITREP is captured from its active new server.
"""
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shlex
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
SOURCE = 'root@23.105.176.45'
TARGET_PG_ADMIN = 'umsa_restore_admin_20261027'
MARIA_EXCLUDED = {'mysql', 'sys', 'information_schema', 'performance_schema'}


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def maria_names(text):
    names = text.splitlines()
    if (not names or len(names) != len(set(names)) or 'sgi_production' not in names
            or any(not re.fullmatch(r'[A-Za-z0-9_]{1,64}', name) or name in MARIA_EXCLUDED for name in names)):
        raise RuntimeError('Unexpected source MariaDB inventory')
    return sorted(names)


def hash_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main(identifier):
    if (not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier)
            or socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not os.environ.get('SSH_AUTH_SOCK')):
        raise RuntimeError('Expected Hostinger target and source identity are required')
    os.umask(0o077)
    known, backup_known = STAGE / 'known_hosts', STAGE / 'backup-known-hosts'
    backup_key = Path('/root/.ssh/umsa_offsite_20261027')
    public_key = Path(__file__).with_name('offsite-recovery-public.asc')
    sqlite_helper = Path(__file__).with_name('sqlite-snapshot.py')
    if any(p.is_symlink() or not p.is_file() for p in
           (known, backup_known, backup_key, public_key, sqlite_helper, STAGE / 'backup-identity.prepared')):
        raise RuntimeError('Reviewed rescue identity or helper is missing')
    streaming = load('streaming_recovery', 'rehearse-streaming-recovery.py')
    common = load('recovery_common', 'rehearse-encrypted-recovery.py')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=30', SOURCE]
    def remote(args):
        return ssh + [shlex.join(args)]
    maria_sql = ("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN "
                 "('mysql','sys','information_schema','performance_schema') ORDER BY SCHEMA_NAME;")
    names = maria_names(subprocess.check_output(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', maria_sql]),
                                                text=True, timeout=30))
    root = STAGE / 'live-data-rescues' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    (root / 'NOT-FINAL.txt').write_text('Live-source rescue; MyISAM and cross-database timing are not a consistent cutover.\n')
    with (root / 'capture.log').open('ab') as log:
        def capture(args, filename, input_stream=None):
            destination = root / filename
            with destination.open('xb') as output:
                subprocess.run(args, stdin=input_stream, stdout=output, stderr=log, check=True, timeout=900)
            if destination.stat().st_size == 0:
                raise RuntimeError('Empty rescue database snapshot')
            return destination
        pg = [
            ('directus-source.dump', remote(['docker', 'exec', 'directus-admin-database-1', 'pg_dump', '-U', 'directus', '-Fc', '-Z1', 'directus'])),
            ('arca-source.dump', remote(['docker', 'exec', 'directus-admin-database-1', 'pg_dump', '-U', 'directus', '-Fc', '-Z1', 'arca_facturas'])),
            ('dge-source.dump', remote(['docker', 'exec', 'dge-demo-db', 'pg_dump', '-U', 'postgres', '-Fc', '-Z1', 'dge_demo'])),
            ('sitrep-active-target.dump', ['docker', 'exec', 'directus-admin-database-1', 'pg_dump', '-U', TARGET_PG_ADMIN, '-Fc', '-Z1', 'trazabilidad_rrpp']),
        ]
        files = []
        for name, command in pg:
            file = capture(command, name)
            with file.open('rb') as stream:
                subprocess.run(['docker', 'exec', '-i', 'directus-admin-database-1', 'pg_restore', '--list'],
                               stdin=stream, stdout=log, stderr=log, check=True)
            files.append(file)
        files.append(capture(remote(['mariadb-dump', '--no-defaults', '-uroot', '--single-transaction',
            '--skip-lock-tables', '--routines', '--events', '--triggers', '--hex-blob', '--databases', *names]),
            'mariadb-live-source.sql'))
        with sqlite_helper.open('rb') as helper:
            files.append(capture(remote(['python3', '-']), 'aceite-live-source.sql', helper))
    hashes = {file.name: hash_file(file) for file in files}
    (root / 'SHA256SUMS.json').write_text(json.dumps(hashes, indent=2) + '\n')
    (root / 'inventory.json').write_text(json.dumps({'mariadb': names, 'postgres_snapshots': [name for name, _ in pg],
        'source_online': True, 'sitrep_source': 'active Hostinger', 'final_cutover_snapshot': False}, indent=2) + '\n')
    keyring = root / 'public-keyring'
    streaming.import_recipient(keyring, public_key, streaming.FINGERPRINT)
    archive = root / ('LIVE-RESCUE-umsa-' + identifier + '.tar.gz.gpg')
    names_in_archive = ['live-data-rescues/' + identifier + '/' + name for name in
                        sorted(hashes) + ['SHA256SUMS.json', 'inventory.json', 'NOT-FINAL.txt']]
    streaming.encrypted_archive(STAGE, names_in_archive, keyring, streaming.FINGERPRINT, archive)
    digest = hash_file(archive)
    backup_ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
                  '-o', 'UserKnownHostsFile=' + str(backup_known), '-o', 'ConnectTimeout=15', '-i', str(backup_key)]
    remote_backup = 'umbak@76.13.234.213'
    listing = subprocess.check_output(backup_ssh + [remote_backup, 'listar'], text=True)
    if common.available_gb(listing) < 8 + math.ceil(archive.stat().st_size / 1024**3):
        raise RuntimeError('Offsite receiver must retain at least 8 GiB free')
    if any(line.split() and line.split()[-1] == archive.name for line in listing.splitlines()):
        raise RuntimeError('Offsite rescue name already exists')
    subprocess.run(['rsync', '-a', '-e', shlex.join(backup_ssh), str(archive),
                    remote_backup + ':/opt/remote-backups/directus/'], check=True)
    listing = subprocess.check_output(backup_ssh + [remote_backup, 'listar'], text=True)
    matching = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
    if len(matching) != 1 or len(matching[0]) < 5 or matching[0][4] != str(archive.stat().st_size):
        raise RuntimeError('Offsite rescue size could not be confirmed')
    (root / 'rescue.complete.json').write_text(json.dumps({'run': identifier, 'archive': archive.name,
        'bytes': archive.stat().st_size, 'sha256': digest, 'database_hashes': hashes,
        'final_cutover_snapshot': False, 'independent_verification_pending': True}, indent=2) + '\n')
    print('Recent live database rescue encrypted offsite; independent recovery verification remains.')


if __name__ == '__main__':
    main(sys.argv[1])
