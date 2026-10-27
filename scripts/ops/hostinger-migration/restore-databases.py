#!/usr/bin/env python3
"""Restore rehearsal databases on the fresh target; never replace existing data."""
import gzip
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
BOOTSTRAP = 'umsa_restore_admin_20261027'
DATABASES = {
    'directus-admin-database-1': ('postgres-shared.sql.gz', 'directus-admin_directus_db_data', 'directus'),
    'dge-demo-db': ('postgres-dge.sql.gz', 'dge-demo-postgres', 'postgres'),
}
# Independently resolved from the official Docker Hub postgres repository,
# linux/amd64 manifests. Never execute database images supplied by the old host.
VERIFIED_IMAGES = {
    'directus-admin-database-1': (
        'postgres@sha256:dbedb0e3d02d268e77b6966910404b748bd390a9dbcb91216303349bbc4dc1b3',
        'sha256:06686173a6ebc27c0f4687565ae0fe73342ea23d1e3813264ded5f5d2b29fe28', '15'),
    'dge-demo-db': (
        'postgres@sha256:f9d1e581cde3e4c8bc696b07e6f7b7aea1d41014b33a52b27990762daae61beb',
        'sha256:066167ff39c2a612402ce99b734ea1cff92a9d1f2ac52f697a5f0384f0d88d6b', '16'),
}
AUDITED_COMMANDS = {
    'directus-admin-database-1': ['postgres'],
    'dge-demo-db': ['postgres', '-c', 'shared_buffers=32MB', '-c', 'max_connections=16',
                    '-c', 'work_mem=2MB', '-c', 'max_wal_size=128MB'],
}


def validate_snapshot(stage):
    if socket.gethostname() != 'srv2101069.hstgr.cloud':
        raise RuntimeError('Wrong host')
    if stage.is_symlink() or (stage / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong staging marker')
    snapshot = Path((stage / 'latest-snapshot').read_text().strip()).resolve(strict=True)
    if snapshot.parent != stage / 'snapshots' or not (snapshot / 'REHEARSAL-ONLY').is_file():
        raise RuntimeError('Not a completed rehearsal snapshot')
    return snapshot


def database_plan(metadata):
    by_name = {row['Name'].lstrip('/'): row for row in metadata}
    result = []
    for name, (dump, volume, owner) in DATABASES.items():
        row = by_name[name]
        mounts = row['Mounts']
        if len(mounts) != 1 or mounts[0].get('Name') != volume or mounts[0]['Destination'] != '/var/lib/postgresql/data':
            raise ValueError('Unexpected database storage: ' + name)
        if row['Config']['Entrypoint'] != ['docker-entrypoint.sh'] or row['Config']['Cmd'][0] != 'postgres':
            raise ValueError('Unexpected database entrypoint: ' + name)
        old_env = dict(value.split('=', 1) for value in row['Config']['Env'] if '=' in value)
        image, config_id, major = VERIFIED_IMAGES[name]
        if old_env.get('PG_MAJOR') != major or row['Config']['Cmd'] != AUDITED_COMMANDS[name]:
            raise ValueError('Database version/command differs from the audited source')
        # Runtime defaults come from the official image, not the source environment.
        env = dict(POSTGRES_USER=BOOTSTRAP, POSTGRES_DB='postgres')
        result.append(dict(name=name, dump=dump, volume=volume, owner=owner,
                           image=image, config_id=config_id, command=AUDITED_COMMANDS[name], env=env))
    return result


def validate_empty_recovery(containers, volumes, volume_path, network):
    if containers or volumes != ['directus-admin_directus_db_data']:
        raise RuntimeError('Recovery requires exactly the initial empty volume and no containers')
    if volume_path.is_symlink() or not volume_path.is_dir() or any(volume_path.iterdir()):
        raise RuntimeError('Recovery refuses any initialized database volume')
    if (not network['Internal'] or network['Containers']
            or [x['Subnet'] for x in network['IPAM']['Config']] != ['172.30.250.0/24']):
        raise RuntimeError('Unexpected recovery network')


def validate_maria_inventory(rows):
    if rows not in ([], [['test', '0', '0', '0']]):
        raise RuntimeError('MariaDB contains existing application data; refusing import')


def restore_maria(snapshot, run, log):
    if (STAGE / 'mariadb-import.started').exists():
        raise RuntimeError('MariaDB import already attempted; inspect before retry')
    # Target-only MariaDB rehearsal. No copied events or public DB listeners.
    Path('/etc/my.cnf.d/umsa-migration.cnf').write_text(
        '[mysqld]\nbind-address=127.0.0.1\nevent_scheduler=OFF\n'
        'character-set-server=latin1\ncollation-server=latin1_swedish_ci\n'
        'default-time-zone=-03:00\nmax_allowed_packet=16777216\n')
    run(['systemctl', 'start', 'mariadb'])
    inventory = subprocess.check_output(['mariadb', '--no-defaults', '-uroot', '-N', '-e',
        "SELECT s.SCHEMA_NAME,(SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=s.SCHEMA_NAME),"
        "(SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA=s.SCHEMA_NAME),"
        "(SELECT COUNT(*) FROM INFORMATION_SCHEMA.EVENTS WHERE EVENT_SCHEMA=s.SCHEMA_NAME) "
        "FROM INFORMATION_SCHEMA.SCHEMATA s WHERE s.SCHEMA_NAME NOT IN ('mysql','information_schema','performance_schema','sys');"], text=True)
    validate_maria_inventory([line.split('\t') for line in inventory.splitlines() if line])
    (STAGE / 'mariadb-import.started').write_text(str(snapshot) + '\n')
    with gzip.open(snapshot / 'mariadb-rehearsal.sql.gz', 'rb') as dump:
        process = subprocess.Popen(['mariadb', '--no-defaults', '-uroot'], stdin=subprocess.PIPE, stdout=log, stderr=log)
        try:
            while chunk := dump.read(1024 * 1024):
                process.stdin.write(chunk)
            process.stdin.close()
        except Exception:
            process.stdin.close()
            process.wait()
            raise
        if process.wait() != 0:
            raise RuntimeError('MariaDB rehearsal import failed; private receipt retained')
    run(['mariadb', '--no-defaults', '-uroot', '-e', 'FLUSH PRIVILEGES; SET GLOBAL event_scheduler=OFF; SHOW DATABASES;'])
    run(['mariadb-check', '--no-defaults', '-uroot', '--all-databases', '--check'])


def finish_mariadb():
    os.umask(0o077)
    snapshot = validate_snapshot(STAGE)
    if ((STAGE / 'database-restore.complete').exists()
            or not (STAGE / 'database-restore.before-storage-repair').is_file()
            or (STAGE / 'database-restore.started').read_text().strip() != str(snapshot)):
        raise RuntimeError('Not the audited partial database restore')
    names = subprocess.check_output(['docker', 'ps', '-a', '--format', '{{.Names}}'], text=True).split()
    if sorted(names) != sorted(DATABASES):
        raise RuntimeError('Unexpected target containers before MariaDB completion')
    plan = database_plan(json.loads((snapshot / 'docker-inspect.json').read_text()))
    with (STAGE / 'receipts/database-restore.log').open('ab') as log:
        def run(args):
            subprocess.run(args, check=True, stdout=log, stderr=log)
        run(['sha256sum', '--check', str(snapshot / 'SHA256SUMS')])
        for item in plan:
            row = json.loads(subprocess.check_output(['docker', 'inspect', item['name']]))[0]
            if row['Image'] != item['config_id'] or not row['State']['Running']:
                raise RuntimeError('Restored official PostgreSQL container not confirmed')
            database = 'directus' if item['name'] == 'directus-admin-database-1' else 'dge_demo'
            count = subprocess.check_output(['docker', 'exec', item['name'], 'psql', '-X', '-w',
                '-U', item['owner'], '-d', database, '-At', '-c',
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"], text=True)
            if int(count.strip()) <= 0:
                raise RuntimeError('Restored PostgreSQL application schema missing')
        restore_maria(snapshot, run, log)
    (STAGE / 'database-restore.complete').write_text(str(snapshot) + '\n')
    print('MariaDB restored and checked. Existing restored PostgreSQL data preserved; no applications activated.')


def main(recover=False):
    os.umask(0o077)
    snapshot = validate_snapshot(STAGE)
    plan = database_plan(json.loads((snapshot / 'docker-inspect.json').read_text()))
    marker = STAGE / 'database-restore.started'
    if marker.exists() and not recover:
        raise RuntimeError('Database restoration already attempted; inspect before any retry')
    with (STAGE / 'receipts/database-restore.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)

        run(['sha256sum', '--check', str(snapshot / 'SHA256SUMS')])
        run(['systemctl', 'start', 'docker'])
        if recover:
            archived_marker = STAGE / 'database-restore.before-storage-repair'
            if not marker.is_file() or archived_marker.exists() or (STAGE / 'database-restore.complete').exists():
                raise RuntimeError('Not the audited initial failure')
            if marker.read_text().strip() != str(snapshot) or Path('/etc/docker/daemon.json').exists():
                raise RuntimeError('Recovery state/configuration changed')
            containers = subprocess.check_output(['docker', 'ps', '-aq'], text=True).split()
            volumes = subprocess.check_output(['docker', 'volume', 'ls', '-q'], text=True).split()
            network = json.loads(subprocess.check_output(['docker', 'network', 'inspect', 'umsa-migration-db']))[0]
            validate_empty_recovery(containers, volumes,
                Path('/var/lib/docker/volumes/directus-admin_directus_db_data/_data'), network)
            # Match the source's overlay2 store; keep the containerd store archived in place.
            Path('/etc/docker/daemon.json').write_text('{"features":{"containerd-snapshotter":false},"storage-driver":"overlay2"}\n')
            run(['systemctl', 'restart', 'docker'])
            if subprocess.check_output(['docker', 'info', '--format', '{{.Driver}}'], text=True).strip() != 'overlay2':
                raise RuntimeError('Classic storage driver not confirmed')
            marker.rename(archived_marker)
        # Refuse to touch any initialized target containers or volumes.
        containers = subprocess.check_output(['docker', 'ps', '-aq'], text=True).strip()
        volumes = subprocess.check_output(['docker', 'volume', 'ls', '-q'], text=True).strip()
        if containers or (volumes and not (recover and volumes == 'directus-admin_directus_db_data')):
            raise RuntimeError('Target Docker is not empty; no restore performed')
        marker.write_text(str(snapshot) + '\n')
        for item in plan:
            run(['docker', 'pull', item['image']])
            actual = subprocess.check_output(['docker', 'image', 'inspect', '--format', '{{.Id}}', item['image']], text=True).strip()
            if actual != item['config_id']:
                raise RuntimeError('Official image configuration digest does not match')
        if not recover:
            run(['docker', 'network', 'create', '--internal', '--subnet', '172.30.250.0/24', 'umsa-migration-db'])
        for item in plan:
            environment = item['env']
            environment['POSTGRES_PASSWORD'] = secrets.token_urlsafe(48)
            envfile = STAGE / ('bootstrap-' + item['name'] + '.env')
            if any('\n' in value or '\r' in value for value in environment.values()):
                raise RuntimeError('Multiline container environment requires explicit handling')
            envfile.write_text(''.join(f'{key}={value}\n' for key, value in environment.items()))
            run(['docker', 'volume', 'create', item['volume']])
            command = ['docker', 'create', '--name', item['name'], '--network', 'umsa-migration-db',
                       '--restart', 'no', '--env-file', str(envfile),
                       '--mount', f'type=volume,source={item["volume"]},target=/var/lib/postgresql/data']
            if item['name'] == 'directus-admin-database-1':
                command += ['--publish', '127.0.0.1:5432:5432']
            command += [item['image']] + item['command']
            run(command)
            run(['docker', 'start', item['name']])
            for attempt in range(60):
                ready = subprocess.run(['docker', 'exec', item['name'], 'pg_isready', '-U', BOOTSTRAP, '-d', 'postgres'], stdout=log, stderr=log)
                if ready.returncode == 0:
                    # The temporary initialization server can also report ready.
                    pid = subprocess.run(['docker', 'exec', item['name'], 'sh', '-c', 'test "$(cat /proc/1/comm)" = postgres'], stdout=log, stderr=log)
                    if pid.returncode == 0:
                        break
                time.sleep(2)
            else:
                raise RuntimeError('PostgreSQL did not finish initialization')
            with gzip.open(snapshot / item['dump'], 'rb') as dump:
                process = subprocess.Popen(['docker', 'exec', '-i', item['name'], 'psql', '-X', '-w', '-U', BOOTSTRAP,
                                            '-d', 'postgres', '--set', 'ON_ERROR_STOP=on'], stdin=subprocess.PIPE, stdout=log, stderr=log)
                try:
                    while chunk := dump.read(1024 * 1024):
                        process.stdin.write(chunk)
                    process.stdin.close()
                except Exception:
                    process.stdin.close()
                    process.wait()
                    raise
                if process.wait() != 0:
                    raise RuntimeError('PostgreSQL restore failed; private receipt retained')
            run(['docker', 'exec', item['name'], 'psql', '-X', '-w', '-U', item['owner'], '-d', 'postgres',
                 '-c', 'SELECT datname, pg_database_size(oid) FROM pg_database WHERE datistemplate = false ORDER BY datname;'])

        restore_maria(snapshot, run, log)
    (STAGE / 'database-restore.complete').write_text(str(snapshot) + '\n')
    print('Rehearsal databases restored and checked; applications, jobs and DNS remain inactive on target.')


if __name__ == '__main__':
    if sys.argv[1:] not in ([], ['--recover-empty-storage'], ['--finish-mariadb']):
        raise SystemExit('Unknown option')
    if sys.argv[1:] == ['--finish-mariadb']:
        finish_mariadb()
    else:
        main(recover=bool(sys.argv[1:]))
