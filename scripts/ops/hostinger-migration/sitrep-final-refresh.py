#!/usr/bin/env python3
"""Refresh a private SITREP target from an already fenced source.

The previous target database and file trees are retained under new names.
This operation does not expose the target or authorize production writes.
"""
import hashlib
import http.client
import importlib.util
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
APP = Path('/srv/umsa-clean-apps/sitrep-backend')
UNIT = 'umsa-clean-sitrep-backend'
PG = 'directus-admin-database-1'
ADMIN = 'umsa_restore_admin_20261027'
SOURCE = 'root@23.105.176.45'
DATA_PATHS = {
    'data': '/var/www/sitrep-backend/data',
    'uploads': '/var/www/sitrep-backend-releases/20260925-064551-inspections/uploads',
}
EXPECTED_DB_METADATA = 'directus|UTF8|en_US.utf8|en_US.utf8'
DB_METADATA_SQL = ("SELECT pg_get_userbyid(datdba),pg_encoding_to_char(encoding),datcollate,datctype "
                   "FROM pg_database WHERE datname='trazabilidad_rrpp';")


def safe_id(identifier):
    if not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier):
        raise ValueError('Invalid CI run identifier')
    return identifier


def load_swap():
    file = Path(__file__).with_name('sitrep-database-swap.py')
    spec = importlib.util.spec_from_file_location('sitrep_database_swap', file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def install_trees(snapshot, root):
    if snapshot.stat().st_dev != root.stat().st_dev:
        raise RuntimeError('SITREP data swaps require the same filesystem')
    changed = []
    try:
        for name in ('data', 'uploads'):
            current = root / name
            incoming = snapshot / ('incoming-' + name)
            previous = snapshot / ('previous-' + name)
            if (current.is_symlink() or not current.is_dir() or incoming.is_symlink()
                    or not incoming.is_dir() or previous.exists() or previous.is_symlink()):
                raise RuntimeError('Unexpected SITREP file tree state')
            current.rename(previous)
            try:
                incoming.rename(current)
            except Exception:
                previous.rename(current)
                raise
            changed.append(name)
    except Exception:
        restore_trees(snapshot, root, changed)
        raise
    return changed


def restore_trees(snapshot, root, changed):
    for name in reversed(changed):
        current = root / name
        previous = snapshot / ('previous-' + name)
        rejected = snapshot / ('rejected-' + name)
        if (current.is_symlink() or not current.is_dir() or previous.is_symlink()
                or not previous.is_dir() or rejected.exists() or rejected.is_symlink()):
            raise RuntimeError('SITREP file recovery requires inspection')
        current.rename(rejected)
        try:
            previous.rename(current)
        except Exception:
            rejected.rename(current)
            raise


def health_ready():
    connection = None
    try:
        connection = http.client.HTTPConnection('127.0.0.1', 3002, timeout=4)
        connection.request('GET', '/api/health')
        response = connection.getresponse()
        data = json.loads(response.read())
        return response.status == 200 and data.get('status') == 'ok' and data.get('db') == 'connected'
    except (OSError, ValueError, http.client.HTTPException):
        return False
    finally:
        if connection is not None:
            connection.close()


def backup_listing_matches(listing, filename, size):
    matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == filename]
    return len(matches) == 1 and len(matches[0]) >= 5 and matches[0][4] == str(size)


def tree_manifest(root):
    digest = hashlib.sha256()
    count = total = 0
    for path in sorted(root.rglob('*')):
        if path.is_symlink() or not (path.is_dir() or path.is_file()):
            raise RuntimeError('Unexpected object in staged SITREP data')
        if not path.is_file():
            continue
        content = hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                content.update(block)
        digest.update(path.relative_to(root).as_posix().encode('utf-8') + b'\0' + content.digest())
        count += 1
        total += path.stat().st_size
    return {'files': count, 'bytes': total, 'sha256': digest.hexdigest()}


def main(identifier, fence_id):
    identifier, fence_id = safe_id(identifier), safe_id(fence_id)
    swap = load_swap()
    staged_db, previous_db = swap.names(identifier)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or APP.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or (STAGE / 'sitrep-public-activation.started').exists()
            or (STAGE / 'sitrep-final-refresh.started').exists()
            or (STAGE / 'sitrep-final-refresh.ready').exists() or not os.environ.get('SSH_AUTH_SOCK')
            or shutil.disk_usage(STAGE).free < 5 * 1024**3):
        raise RuntimeError('Not an isolated target ready for SITREP refresh')
    os.umask(0o077)
    known = STAGE / 'known_hosts'
    if known.is_symlink() or not known.is_file():
        raise RuntimeError('Pinned source host key is missing')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=30', SOURCE]
    remote = lambda args: ssh + [shlex.join(args)]
    source_tool = '/root/umsa-sitrep-migration/' + fence_id + '/sitrep-source-fence.py'
    def verify_source():
        subprocess.run(remote(['/usr/bin/python3', source_tool, '--verify', fence_id]),
                       check=True, stdout=subprocess.DEVNULL)
    def target_query(sql):
        return subprocess.check_output(['docker', 'exec', PG, 'psql', '-X', '-w', '-U', ADMIN,
            '-d', 'postgres', '-At', '--set', 'ON_ERROR_STOP=1', '-c', sql], text=True).strip()
    def wait_no_target_sessions():
        for _ in range(40):
            sessions = int(target_query("SELECT count(*) FROM pg_stat_activity WHERE datname='trazabilidad_rrpp' "
                                        "AND backend_type='client backend';"))
            if sessions == 0:
                return
            time.sleep(0.5)
        raise RuntimeError('Other destination sessions still use the SITREP database')
    verify_source()
    source_metadata = subprocess.check_output(remote(['docker', 'exec', PG, 'psql', '-X', '-w', '-U',
        'directus', '-d', 'postgres', '-At', '-c', DB_METADATA_SQL]), text=True).strip()
    if source_metadata != EXPECTED_DB_METADATA or target_query(DB_METADATA_SQL) != EXPECTED_DB_METADATA:
        raise RuntimeError('Source and destination SITREP database metadata need review')
    existing = target_query("SELECT datname FROM pg_database WHERE datname IN ('trazabilidad_rrpp','"
                            + staged_db + "','" + previous_db + "') ORDER BY datname;").splitlines()
    if existing != ['trazabilidad_rrpp']:
        raise RuntimeError('A database name for this run is already in use')
    actual_link = subprocess.check_output(remote(['readlink', '/var/www/sitrep-backend/uploads']), text=True).strip()
    if actual_link != DATA_PATHS['uploads']:
        raise RuntimeError('SITREP uploads link has changed')
    for path in DATA_PATHS.values():
        subprocess.run(remote(['test', '-d', path]), check=True)
        unsafe = subprocess.check_output(remote(['find', path, '(', '-type', 'l', '-o', '-type', 'b',
            '-o', '-type', 'c', '-o', '-type', 'p', '-o', '-type', 's', ')', '-print', '-quit']), text=True)
        if unsafe:
            raise RuntimeError('SITREP source data contains a link or special file')
    snapshot = STAGE / 'sitrep-final-refreshes' / identifier
    snapshot.mkdir(parents=True, mode=0o700, exist_ok=False)
    log = (snapshot / 'refresh.log').open('ab')
    def run(args, **kwargs):
        return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
    stopped = db_swapped = False
    trees = []
    started = STAGE / 'sitrep-final-refresh.started'
    try:
        dump = snapshot / ('CUTOVER-sitrep-' + identifier + '.dump')
        with dump.open('xb') as output:
            subprocess.run(remote(['docker', 'exec', PG, 'pg_dump', '-U', 'directus', '-Fc', '-Z1',
                                   swap.CURRENT]), check=True, stdout=output, stderr=log)
        if dump.stat().st_size == 0:
            raise RuntimeError('The source database dump is empty')
        with dump.open('rb') as input_file:
            subprocess.run(['docker', 'exec', '-i', PG, 'pg_restore', '--list'],
                           stdin=input_file, check=True, stdout=log, stderr=log)
        digest = hashlib.sha256()
        with dump.open('rb') as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(block)
        ssh_rsync = shlex.join(ssh[:-1])
        trees_manifest = {}
        for name, path in DATA_PATHS.items():
            incoming = snapshot / ('incoming-' + name)
            incoming.mkdir(mode=0o700)
            run(['rsync', '-a', '--numeric-ids', '--no-links', '--no-specials', '--no-devices', '-e', ssh_rsync,
                 SOURCE + ':' + path + '/', str(incoming) + '/'])
            trees_manifest[name] = tree_manifest(incoming)
            differences = subprocess.check_output(['rsync', '-rnic', '--no-links', '-e', ssh_rsync,
                SOURCE + ':' + path + '/', str(incoming) + '/'], stderr=log, text=True)
            if differences.strip():
                raise RuntimeError('SITREP source files changed during capture')
            unsafe = subprocess.check_output(remote(['find', path, '(', '-type', 'l', '-o', '-type', 'b',
                '-o', '-type', 'c', '-o', '-type', 'p', '-o', '-type', 's', ')', '-print', '-quit']), text=True)
            if unsafe:
                raise RuntimeError('SITREP source data gained a link or special file during capture')
        backup_key = Path('/root/.ssh/umsa_offsite_20261027')
        backup_known = STAGE / 'backup-known-hosts'
        if any(path.is_symlink() or not path.is_file() for path in
               (backup_key, backup_known, STAGE / 'backup-identity.prepared')):
            raise RuntimeError('Restricted offsite backup identity is missing')
        backup_ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o',
                      'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + str(backup_known),
                      '-o', 'ConnectTimeout=15', '-i', str(backup_key)]
        listing = subprocess.check_output(backup_ssh + ['umbak@76.13.234.213', 'listar'], text=True)
        if any(line.split() and line.split()[-1] == dump.name for line in listing.splitlines()):
            raise RuntimeError('Offsite SITREP backup name already exists')
        run(['rsync', '-a', '-e', shlex.join(backup_ssh), str(dump),
             'umbak@76.13.234.213:/opt/remote-backups/sitrep/'])
        listing = subprocess.check_output(backup_ssh + ['umbak@76.13.234.213', 'listar'], text=True)
        if not backup_listing_matches(listing, dump.name, dump.stat().st_size):
            raise RuntimeError('Offsite SITREP backup size could not be confirmed')
        verify_source()
        run(['docker', 'exec', PG, 'createdb', '-U', ADMIN, '-O', 'directus', '-T', 'template0',
             '-E', 'UTF8', '--lc-collate=en_US.utf8', '--lc-ctype=en_US.utf8', staged_db])
        with dump.open('rb') as stream:
            subprocess.run(['docker', 'exec', '-i', PG, 'pg_restore', '-U', ADMIN,
                '--exit-on-error', '-d', staged_db], stdin=stream, check=True, stdout=log, stderr=log)
        verify_source()
        with started.open('x') as marker:
            marker.write(str(snapshot) + '\n')
            marker.flush()
            os.fsync(marker.fileno())
        stopped = True
        run(['systemctl', 'stop', UNIT])
        wait_no_target_sessions()
        trees = install_trees(snapshot, APP)
        swap.swap(PG, ADMIN, identifier)
        db_swapped = True
        verify_source()
        run(['systemctl', 'start', UNIT])
        for _ in range(40):
            if health_ready():
                break
            time.sleep(0.5)
        else:
            raise RuntimeError('Refreshed isolated SITREP did not become healthy')
        verify_source()
        receipt = {'run': identifier, 'fence_run': fence_id, 'source_dump_bytes': dump.stat().st_size,
                   'source_dump_sha256': digest.hexdigest(), 'previous_database': previous_db,
                   'offsite_backup': dump.name, 'offsite_size_confirmed': True,
                   'offsite_sha256_independently_verified': False,
                   'source_trees': trees_manifest,
                   'previous_data': str(snapshot / 'previous-data'),
                   'previous_uploads': str(snapshot / 'previous-uploads')}
        (snapshot / 'refresh.complete.json').write_text(json.dumps(receipt, indent=2) + '\n')
    except Exception:
        if stopped:
            run(['systemctl', 'stop', UNIT])
            wait_no_target_sessions()
            if db_swapped:
                swap.undo_private_swap(PG, ADMIN, identifier)
            if trees:
                restore_trees(snapshot, APP, trees)
            run(['systemctl', 'start', UNIT])
        raise
    finally:
        log.close()
    with (STAGE / 'sitrep-final-refresh.ready').open('x') as ready:
        ready.write(str(snapshot) + '\n')
        ready.flush()
        os.fsync(ready.fileno())
    print('SITREP source data refreshed in isolation; previous target database and files are preserved.')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
