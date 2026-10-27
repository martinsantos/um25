#!/usr/bin/env python3
"""Restore verified rehearsal copies in a networkless disposable PostgreSQL sandbox."""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import time

STAGE = Path('/srv/umsa-migration')
SOURCE = STAGE / 'offsite-rehearsals/40584949950-1'
IMAGE = 'sha256:06686173a6ebc27c0f4687565ae0fe73342ea23d1e3813264ded5f5d2b29fe28'
CHECKSUMS = {
    'directus': 'd149ba8b23d65ac79614ad5ac6402bde47abcca882df14a53af0f575ba3c0ae6',
    'trazabilidad_rrpp': '7d1c72ae438540d2da0291b01d7fb7e3d8dc77a683ef2452ce86cb758d0ce4ed',
}
CONTAINER = 'umsa-backup-restore-rehearsal-40584949950'


def verified_paths(manifest, root):
    if set(manifest) != set(CHECKSUMS):
        raise ValueError('Unexpected backup database inventory')
    result = {}
    for name, digest in CHECKSUMS.items():
        row = manifest[name]
        filename = f'REHEARSAL-hostinger-{name}-40584949950-1.dump'
        path = root / filename
        if (row['file'] != filename or row['sha256'] != digest or path.is_symlink()
                or not path.is_file() or path.stat().st_size != row['bytes']):
            raise ValueError('Backup manifest or file differs')
        actual = hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                actual.update(block)
        if actual.hexdigest() != digest:
            raise ValueError('Backup checksum differs')
        result[name] = path
    return result


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()):
        raise RuntimeError('Not the isolated target')
    if SOURCE.is_symlink() or not (SOURCE / 'transfer.complete').is_file():
        raise RuntimeError('Successful transfer required')
    files = verified_paths(json.loads((SOURCE / 'manifest.json').read_text()), SOURCE)
    receipt = SOURCE / 'restore-rehearsal.log'
    marker = SOURCE / 'restore-rehearsal.started'
    if marker.exists() or receipt.exists():
        raise RuntimeError('Restore already attempted; inspect before retry')
    existing = subprocess.check_output(['docker', 'ps', '-aq', '--filter', 'name=^/' + CONTAINER + '$'], text=True)
    if existing.strip():
        raise RuntimeError('Unexpected existing sandbox')
    marker.write_text('Disposable networkless PostgreSQL with tmpfs data only; existing databases untouched.\n')
    with receipt.open('xb') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        started = False
        try:
            run(['docker', 'run', '-d', '--name', CONTAINER, '--network', 'none', '--read-only',
                 '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--user', '70:70',
                 '--memory', '3g', '--cpus', '1', '--pids-limit', '200', '--restart', 'no',
                 '--tmpfs', '/var/lib/postgresql/data:rw,nosuid,nodev,size=2g,uid=70,gid=70,mode=0700',
                 '--tmpfs', '/var/run/postgresql:rw,nosuid,nodev,size=16m,uid=70,gid=70,mode=0775',
                 '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m,uid=70,gid=70',
                 '--env', 'POSTGRES_HOST_AUTH_METHOD=trust', '--env', 'POSTGRES_USER=postgres', IMAGE])
            started = True
            for _ in range(60):
                check = subprocess.run(['docker', 'exec', CONTAINER, 'pg_isready', '-U', 'postgres'],
                                       stdout=log, stderr=log)
                if check.returncode == 0:
                    break
                time.sleep(1)
            else:
                raise RuntimeError('Sandbox PostgreSQL did not become ready')
            counts = {}
            for name, path in files.items():
                run(['docker', 'exec', CONTAINER, 'createdb', '-U', 'postgres', name])
                with path.open('rb') as stream:
                    run(['docker', 'exec', '-i', CONTAINER, 'pg_restore', '-U', 'postgres',
                         '--exit-on-error', '--no-owner', '--no-privileges', '-d', name], stdin=stream)
                result = subprocess.check_output(['docker', 'exec', CONTAINER, 'psql', '-X', '-U', 'postgres',
                    '-d', name, '-At', '--command', "SELECT count(*) FROM pg_class WHERE relkind IN ('r','p') AND relnamespace NOT IN ('pg_catalog'::regnamespace,'information_schema'::regnamespace);"],
                    stderr=log, text=True).strip()
                if not result.isdigit() or int(result) <= 0:
                    raise RuntimeError('Restored database has no application tables')
                counts[name] = int(result)
        finally:
            if started:
                run(['docker', 'stop', '--time', '30', CONTAINER])
    (SOURCE / 'restore-rehearsal.complete.json').write_text(json.dumps({'tables': counts,
        'network': 'none', 'storage': 'temporary tmpfs', 'source': 'labelled rehearsal copies'}, indent=2) + '\n')
    print('Both rehearsal archives restored in a networkless temporary PostgreSQL sandbox; table inventories verified. Final production backups remain pending.')


if __name__ == '__main__':
    main()
