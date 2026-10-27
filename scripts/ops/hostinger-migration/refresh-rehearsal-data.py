#!/usr/bin/env python3
"""Exercise a fresh logical data refresh of the isolated rehearsal, preserving backups.

The source remains online and read-only to this tool. Its MyISAM snapshot is
therefore explicitly NOT a final cutover snapshot. No production-ready marker
is written by this operation.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import socket
import sqlite3
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
BOOTSTRAP = 'umsa_restore_admin_20261027'
PG = {'directus-admin-database-1': 'directus', 'dge-demo-db': 'postgres'}
UNITS = ('umsa-clean-astro-ultimamilla', 'umsa-clean-sgi', 'umsa-clean-sitrep-backend',
         'umsa-clean-umbot-aceite', 'umsa-clean-plan')
APPS = ('directus-admin-directus-app-1', 'dge-demo-web', 'dge-demo-rollback-cf24407ee8ee', 'arca_app')


def names(rows):
    result = sorted(row for row in rows.splitlines() if row)
    if not result or len(result) != len(set(result)) or any(not re.fullmatch('[A-Za-z0-9_]+', row) for row in result):
        raise ValueError('Unexpected database identifier inventory')
    return result


def validate_inventory(source, target):
    if source != target:
        raise RuntimeError('Database inventory changed; manual review required before refresh')
    if any(name in ('mysql', 'sys', 'information_schema', 'performance_schema', 'postgres') for name in source):
        raise RuntimeError('System databases must not be replaced')


def target_guard():
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'):
        raise RuntimeError('Wrong destination')
    if (STAGE / 'production.active').exists() or (STAGE / 'web-publication-state.json').exists():
        raise RuntimeError('Refusing to replace data after public cutover')
    for marker in ('persist-rehearsal.complete', 'internal-rotation.complete'):
        if not (STAGE / marker).is_file():
            raise RuntimeError('Completed isolated rehearsal required')


def main(identifier):
    os.umask(0o077)
    target_guard()
    if not re.fullmatch('[0-9]+-[0-9]+', identifier) or not os.environ.get('SSH_AUTH_SOCK'):
        raise RuntimeError('CI identity and forwarded source access required')
    if (STAGE / 'data-refresh.incomplete').exists():
        raise RuntimeError('An earlier refresh is incomplete; inspect its private receipt first')
    for network in ('umsa-migration-db', 'umsa-clean-shared', 'umsa-clean-dge'):
        if not json.loads(subprocess.check_output(['docker', 'network', 'inspect', network]))[0]['Internal']:
            raise RuntimeError('Destination application network is not isolated')
    snapshot = STAGE / 'data-refreshes' / identifier
    snapshot.mkdir(parents=True, mode=0o700)
    (snapshot / 'REHEARSAL-ONLY').write_text('Live source snapshot; MyISAM is not a final consistent cutover copy.\n')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(STAGE / 'known_hosts'), '-o', 'ConnectTimeout=15',
           '-o', 'ServerAliveInterval=30', 'root@23.105.176.45']
    pg_query = "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres' ORDER BY datname;"
    maria_query = "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN ('mysql','sys','information_schema','performance_schema') ORDER BY SCHEMA_NAME;"
    plan = {}
    def remote(args): return ssh + [shlex.join(args)]
    def query(args): return subprocess.check_output(args, text=True)
    for container, user in PG.items():
        base_source = ['docker', 'exec', container, 'psql', '-X', '-w', '-U', user, '-d', 'postgres', '-At', '-c']
        base_target = ['docker', 'exec', container, 'psql', '-X', '-w', '-U', BOOTSTRAP, '-d', 'postgres', '-At', '-c']
        tables = "SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema','pg_catalog');"
        if query(remote(base_source + [tables])).strip() != '0' or query(base_target + [tables]).strip() != '0':
            raise RuntimeError('Default postgres database now contains application data')
        roles = "SELECT rolname,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolcanlogin AND rolname <> '" + BOOTSTRAP + "' ORDER BY rolname;"
        if query(remote(base_source + [roles])) != query(base_target + [roles]):
            raise RuntimeError('PostgreSQL accounts changed since credential rotation')
        source_names = names(query(remote(['docker', 'exec', container, 'psql', '-X', '-w', '-U', user,
            '-d', 'postgres', '-At', '-c', pg_query])))
        target_names = names(query(['docker', 'exec', container, 'psql', '-X', '-w', '-U', BOOTSTRAP,
            '-d', 'postgres', '-At', '-c', pg_query]))
        validate_inventory(source_names, target_names)
        plan[container] = source_names
    maria_names = names(query(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', maria_query])))
    validate_inventory(maria_names, names(query(['mariadb', '--no-defaults', '-uroot', '-N', '-e', maria_query])))
    accounts = 'SELECT User,Host FROM mysql.user ORDER BY User,Host;'
    if query(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', accounts])) != query(['mariadb', '--no-defaults', '-uroot', '-N', '-e', accounts]):
        raise RuntimeError('MariaDB account identities changed since credential rotation')
    plan['mariadb'] = maria_names
    vault = json.loads((STAGE / 'internal-credentials/vault.json').read_text())
    token = vault['directus_api']
    if not re.fullmatch('[A-Za-z0-9_-]+', token): raise RuntimeError('Unexpected rotated token format')
    token_query = "SELECT id FROM directus_users WHERE token='" + token + "';"
    account = subprocess.check_output(['docker', 'exec', '-i', 'directus-admin-database-1', 'psql', '-X', '-w',
        '-U', BOOTSTRAP, '-d', 'directus', '-At'], input=token_query, text=True).strip()
    if not re.fullmatch('[0-9a-f-]{36}', account): raise RuntimeError('Rotated API account not unique')
    (snapshot / 'inventory.json').write_text(json.dumps(plan, indent=2) + '\n')
    with (snapshot / 'refresh.log').open('ab') as log:
        def run(args): return subprocess.run(args, check=True, stdout=log, stderr=log)
        def capture(args, path):
            with path.with_suffix(path.suffix + '.partial').open('xb') as output:
                subprocess.run(args, check=True, stdout=output, stderr=log)
            path.with_suffix(path.suffix + '.partial').rename(path)
            if not path.stat().st_size: raise RuntimeError('Empty logical dump')
        # Capture all source data before stopping or changing any target service.
        for container, databases in plan.items():
            if container == 'mariadb': continue
            for database in databases:
                capture(remote(['docker', 'exec', container, 'pg_dump', '-U', PG[container], '-Fc', '-Z1', database]),
                        snapshot / (container + '-' + database + '.dump'))
        maria_args = ['mariadb-dump', '--no-defaults', '-uroot', '--single-transaction', '--skip-lock-tables',
                      '--routines', '--events', '--triggers', '--hex-blob', '--add-drop-database', '--databases', *maria_names]
        capture(remote(maria_args), snapshot / 'mariadb.sql')
        with (snapshot / 'aceite.sql').open('xb') as output, Path(__file__).with_name('sqlite-snapshot.py').open('rb') as code:
            subprocess.run(remote(['python3', '-']), stdin=code, stdout=output, stderr=log, check=True)
        with sqlite3.connect(snapshot / 'aceite.db') as database:
            database.executescript((snapshot / 'aceite.sql').read_text())
            if database.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                raise RuntimeError('Fresh SQLite integrity failure')
        (STAGE / 'data-refresh.incomplete').write_text(str(snapshot) + '\n')
        for unit in UNITS: run(['systemctl', 'stop', unit])
        run(['docker', 'stop', *APPS])
        backup = snapshot / 'previous-target'
        backup.mkdir(mode=0o700)
        # Preserve the prior target data before replacing anything. Roles and
        # database credentials are never imported from the source.
        for container, databases in plan.items():
            if container == 'mariadb': continue
            for database in databases:
                capture(['docker', 'exec', container, 'pg_dump', '-U', BOOTSTRAP, '-Fc', '-Z1', database],
                        backup / (container + '-' + database + '.dump'))
        capture(['mariadb-dump', '--no-defaults', '-uroot', '--routines', '--events', '--triggers',
                 '--hex-blob', '--add-drop-database', '--databases', *maria_names], backup / 'mariadb.sql')
        sqlite_path = Path('/srv/umsa-clean-apps/umbot-aceite/db/custom.db')
        if sqlite_path.parent.is_symlink(): raise RuntimeError('Unexpected SQLite directory link')
        run(['cp', '-a', '--reflink=always', str(sqlite_path.parent), str(backup / 'aceite-db-directory')])
        for container, databases in plan.items():
            if container == 'mariadb': continue
            for database in databases:
                with (snapshot / (container + '-' + database + '.dump')).open('rb') as stream:
                    subprocess.run(['docker', 'exec', '-i', container, 'pg_restore', '-U', BOOTSTRAP,
                        '--exit-on-error', '--clean', '--if-exists', '--create', '-d', 'postgres'],
                        stdin=stream, stdout=log, stderr=log, check=True)
        with (snapshot / 'mariadb.sql').open('rb') as stream:
            subprocess.run(['mariadb', '--no-defaults', '-uroot'], stdin=stream, stdout=log, stderr=log, check=True)
        run(['mariadb', '--no-defaults', '-uroot', '-e', 'SET GLOBAL event_scheduler=OFF;'])
        run(['mariadb-check', '--no-defaults', '-uroot', '--databases', *maria_names, '--check'])
        sql = "UPDATE directus_users SET token='" + token + "' WHERE id='" + account + "' RETURNING id;"
        restored = subprocess.check_output(['docker', 'exec', '-i', 'directus-admin-database-1', 'psql', '-X', '-w',
            '-U', BOOTSTRAP, '-d', 'directus', '-At', '--set', 'ON_ERROR_STOP=on'], input=sql, text=True)
        if restored.splitlines() != [account, 'UPDATE 1']:
            raise RuntimeError('API account changed during refresh')
        # Existing app credentials must still authenticate after data import.
        for user in ('sgi_app', 'ultimami_um', 'vecinorabioso'):
            run(['mariadb', '--defaults-file=' + str(STAGE / 'internal-credentials' / (user + '.cnf')), '-e', 'SELECT 1;'])
        # Keep any previous WAL/SHM alongside the prior database; never replay
        # a stale journal against the newly restored SQLite database.
        sqlite_path.parent.rename(backup / 'aceite-db-before-swap')
        sqlite_path.parent.mkdir(mode=0o750)
        run(['cp', '--reflink=always', str(snapshot / 'aceite.db'), str(sqlite_path)])
        # No user traffic reaches this rehearsal. Restart the applications with
        # their unchanged rotated secrets after replacing only rehearsal data.
        run(['docker', 'start', *APPS])
        for unit in UNITS: run(['systemctl', 'start', unit])
        for unit in UNITS: run(['systemctl', 'is-active', '--quiet', unit])
        hashes = {}
        for path in snapshot.glob('*'):
            if path.is_file() and path.suffix in ('.dump', '.sql', '.db'):
                digest = hashlib.sha256()
                with path.open('rb') as stream:
                    while chunk := stream.read(1024 * 1024): digest.update(chunk)
                hashes[path.name] = digest.hexdigest()
        (snapshot / 'SHA256SUMS.json').write_text(json.dumps(hashes, indent=2) + '\n')
    (STAGE / 'data-refresh.incomplete').rename(snapshot / 'refresh.complete')
    print('Fresh logical rehearsal data restored; prior target data retained and rotated credentials preserved. Final consistent cutover snapshot and file delta are still required.')


if __name__ == '__main__':
    main(sys.argv[1])
