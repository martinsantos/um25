#!/usr/bin/env python3
"""Copy two isolated rehearsal databases to the existing restricted receiver.

These are labelled rehearsal copies, not final cutover backups. No timer is
installed and no existing backup is modified. Verify remote checksums separately
through receiver administration before relying on the copies.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
KEY = Path('/root/.ssh/umsa_offsite_20261027')
KNOWN = STAGE / 'backup-known-hosts'
DATABASES = {'directus': 'directus', 'trazabilidad_rrpp': 'sitrep'}


def make_plan(identifier):
    if not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Invalid CI run identifier')
    return {db: (group, f'REHEARSAL-hostinger-{db}-{identifier}.dump')
            for db, group in DATABASES.items()}


def main(identifier):
    os.umask(0o077)
    plan = make_plan(identifier)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()):
        raise RuntimeError('Not an isolated Hostinger rehearsal')
    for path in (STAGE / 'backup-identity.prepared', KEY, KNOWN):
        if path.is_symlink() or not path.is_file():
            raise RuntimeError('Missing or unexpected backup identity')
    if shutil.disk_usage(STAGE).free < 5 * 1024**3:
        raise RuntimeError('Insufficient free space for rehearsal copies')
    root = STAGE / 'offsite-rehearsals' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    (root / 'REHEARSAL-ONLY').write_text('Isolated data; not the final source snapshot.\n')
    ssh = ('ssh -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes '
           '-o UserKnownHostsFile=/srv/umsa-migration/backup-known-hosts '
           '-o ConnectTimeout=15 -i /root/.ssh/umsa_offsite_20261027')
    manifest = {}
    with (root / 'receipt.log').open('ab') as log:
        for db, (group, filename) in plan.items():
            path = root / filename
            partial = root / (filename + '.partial')
            with partial.open('xb') as output:
                subprocess.run(['docker', 'exec', 'directus-admin-database-1', 'pg_dump',
                    '-U', 'umsa_restore_admin_20261027', '-Fc', '-Z1', db],
                    check=True, stdout=output, stderr=log)
            if partial.stat().st_size == 0:
                raise RuntimeError('Empty database dump')
            with partial.open('rb') as stream:
                subprocess.run(['docker', 'exec', '-i', 'directus-admin-database-1',
                    'pg_restore', '--list'], stdin=stream, stdout=log, stderr=log, check=True)
            partial.rename(path)
            digest = hashlib.sha256()
            with path.open('rb') as stream:
                for block in iter(lambda: stream.read(1024 * 1024), b''):
                    digest.update(block)
            manifest[db] = {'file': filename, 'bytes': path.stat().st_size,
                            'sha256': digest.hexdigest(), 'receiver_directory': group}
            (root / 'manifest.partial.json').write_text(json.dumps(manifest, indent=2) + '\n')
            subprocess.run(['rsync', '-a', '-e', ssh, str(path),
                'umbak@76.13.234.213:/opt/remote-backups/' + group + '/'],
                check=True, stdout=log, stderr=log)
    (root / 'manifest.partial.json').rename(root / 'manifest.json')
    (root / 'transfer.complete').write_text('Transfer succeeded; independent remote checksum and restoration tests remain required.\n')
    print('Two rehearsal archives transferred. Existing backups remain untouched; final snapshots and independent validation are pending.')


if __name__ == '__main__':
    main(sys.argv[1])
