#!/usr/bin/env python3
"""Restore final CMS/DGE/ARCA data, preserving SITREP and the other databases."""
import hashlib
import importlib.util
import json
import math
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
SOURCE = 'root@23.105.176.45'
ADMIN = 'umsa_restore_admin_20261027'
DATABASES = {'directus': ('directus-admin-database-1', 'directus', 'directus'),
             'arca': ('directus-admin-database-1', 'directus', 'arca_facturas'),
             'dge': ('dge-demo-db', 'postgres', 'dge_demo')}
CONTAINERS = ['directus-admin-directus-app-1', 'arca_app', 'dge-demo-web', 'dge-demo-rollback-cf24407ee8ee']
BASE = STAGE / 'mutable-rehearsals/40593832809-1'
BASE_ARCHIVE = 'REHEARSAL-umsa-stream-40614031828-1.tar.gz.gpg'


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def tree_manifest(root):
    result = {}
    for file in root.rglob('*'):
        if file.is_symlink() or not (file.is_dir() or file.is_file()):
            raise RuntimeError('Unexpected mutable file type')
        if file.is_file():
            result[file.relative_to(root).as_posix()] = sha256(file)
    return result


def database_names(kind, identifier):
    if kind not in DATABASES or not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Invalid core database identity')
    suffix = identifier.replace('-', '_')
    return 'umsa_core_next_' + kind + '_' + suffix, 'umsa_core_before_' + kind + '_' + suffix


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or not os.environ.get('SSH_AUTH_SOCK')
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()):
        raise RuntimeError('Unexpected core cutover target or identity')
    os.umask(0o077)
    root = STAGE / 'core-cutovers' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    public = load('public_vhost', 'public-vhost.py')
    streaming = load('streaming_recovery', 'rehearse-streaming-recovery.py')
    common = load('recovery_common', 'rehearse-encrypted-recovery.py')
    public.preflight('umsa', root)
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
               'UserKnownHostsFile=' + str(STAGE / 'known_hosts'), '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=30']
    def remote(args):
        return ['ssh', *options, SOURCE, shlex.join(args)]
    source_script = '/root/umsa-core-cutover-tooling/' + identifier + '/core-source-cutover.py'
    def fence(mode):
        subprocess.run(remote(['python3', source_script, mode, identifier]), check=True, timeout=240)
    def pg(kind, sql, database='postgres'):
        container, _, _ = DATABASES[kind]
        return subprocess.check_output(['docker', 'exec', '-i', container, 'psql', '-X', '-w', '-U', ADMIN,
            '-d', database, '-At', '--set', 'ON_ERROR_STOP=1'], input=sql, text=True,
            stderr=subprocess.PIPE, timeout=90).strip()
    def rename(kind, old, new):
        if any(not re.fullmatch(r'[a-z][a-z0-9_]{0,62}', value) for value in (old, new)):
            raise ValueError('Unsafe database rename')
        pg(kind, 'ALTER DATABASE "' + old + '" RENAME TO "' + new + '";')
    vault = json.loads((STAGE / 'internal-credentials/vault.json').read_text())
    token = vault['directus_api']
    if not re.fullmatch(r'[A-Za-z0-9_-]+', token):
        raise RuntimeError('Invalid rotated CMS token')
    account = pg('directus', "SELECT id FROM directus_users WHERE token='" + token + "';", 'directus')
    if not re.fullmatch(r'[a-f0-9-]{36}', account):
        raise RuntimeError('Rotated CMS API account is not unique')
    fenced, committed, stopped = False, False, False
    swapped, replaced = [], []
    with (root / 'cutover.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        try:
            fence('fence')
            fenced = True
            hashes = {}
            for kind, (container, owner, database) in DATABASES.items():
                dump = root / (kind + '-FINAL.dump')
                with dump.open('xb') as output:
                    subprocess.run(remote(['docker', 'exec', container, 'pg_dump', '-U', owner,
                        '-Fc', '-Z1', database]), stdout=output, stderr=log, check=True, timeout=600)
                hashes[dump.name] = sha256(dump)
                staged, previous = database_names(kind, identifier)
                # Fresh candidate names preserve every existing target database.
                pg(kind, 'CREATE DATABASE "' + staged + '" OWNER "' + owner + '" TEMPLATE template0;')
                with dump.open('rb') as source:
                    run(['docker', 'exec', '-i', container, 'pg_restore', '-U', ADMIN, '--no-owner',
                         '--role', owner, '--exit-on-error', '-d', staged], stdin=source, timeout=600)
                count_sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
                source_count = subprocess.check_output(remote(['docker', 'exec', container, 'psql', '-X',
                    '-U', owner, '-d', database, '-At', '-c', count_sql]), text=True).strip()
                if source_count != pg(kind, count_sql, staged):
                    raise RuntimeError('Restored core table count differs')
            staged, _ = database_names('directus', identifier)
            if pg('directus', "UPDATE directus_users SET token='" + token + "' WHERE id='" + account +
                  "' RETURNING id;", staged).splitlines() != [account, 'UPDATE 1']:
                raise RuntimeError('CMS API account changed during cutover')
            paths = {'directus-uploads': '/opt/directus-admin/uploads',
                     'arca-output': '/opt/plantilla-arca-app/output',
                     'arca-certs': '/opt/plantilla-arca-app/certs'}
            files, delta = root / 'files', root / 'delta'
            files.mkdir()
            delta.mkdir()
            manifests = {}
            for group, source_path in paths.items():
                unsafe = subprocess.check_output(['ssh', *options, SOURCE,
                    'test -d ' + source_path + ' && test ! -L ' + source_path + ' && find ' + source_path +
                    r' \( -type l -o -type b -o -type c -o -type p -o -type s \) -print -quit'], text=True)
                if unsafe:
                    raise RuntimeError('Unexpected mutable core data type')
                target = files / group
                target.mkdir()
                run(['rsync', '-a', '--no-specials', '--no-devices', '-e', shlex.join(['ssh', *options]),
                     SOURCE + ':' + source_path + '/', str(target) + '/'], timeout=600)
                manifests[group] = tree_manifest(target)
                for relative, digest in manifests[group].items():
                    old = BASE / group / relative
                    if old.is_symlink() or not old.is_file() or sha256(old) != digest:
                        destination = delta / group / relative
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(target / relative, destination)
            (root / 'SHA256SUMS.json').write_text(json.dumps(hashes, indent=2) + '\n')
            (root / 'files.sha256.json').write_text(json.dumps(manifests, indent=2) + '\n')
            (root / 'recovery-base.json').write_text(json.dumps({'archive': BASE_ARCHIVE,
                'sha256': '4b29e326c44bb2c26f2e92541e68b3aaa99d20338ba0d75f00c7459e452bd72f',
                'base_directory': 'mutable-rehearsals/40593832809-1',
                'recovery': 'Use final manifest with unchanged base files and delta overrides.'}) + '\n')
            keyring = root / 'public-keyring'
            streaming.import_recipient(keyring, Path(__file__).with_name('offsite-recovery-public.asc'), streaming.FINGERPRINT)
            archive = root / ('CUTOVER-core-' + identifier + '.tar.gz.gpg')
            streaming.encrypted_archive(root, list(hashes) + ['SHA256SUMS.json', 'files.sha256.json',
                'recovery-base.json', 'delta'], keyring, streaming.FINGERPRINT, archive)
            backup_ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
                '-o', 'UserKnownHostsFile=' + str(STAGE / 'backup-known-hosts'), '-i', '/root/.ssh/umsa_offsite_20261027']
            backup = 'umbak@76.13.234.213'
            listing = subprocess.check_output(backup_ssh + [backup, 'listar'], text=True)
            if common.available_gb(listing) < 8 + math.ceil(archive.stat().st_size / 1024**3):
                raise RuntimeError('Offsite reserve is insufficient for core final data')
            run(['rsync', '-a', '-e', shlex.join(backup_ssh), str(archive), backup + ':/opt/remote-backups/directus/'])
            listing = subprocess.check_output(backup_ssh + [backup, 'listar'], text=True)
            matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
            if len(matches) != 1 or matches[0][4] != str(archive.stat().st_size):
                raise RuntimeError('Core offsite final backup size was not confirmed')
            fence('verify')
            run(['docker', 'stop', *CONTAINERS])
            stopped = True
            run(['systemctl', 'stop', 'umsa-clean-astro-ultimamilla'])
            for kind, (_, _, database) in DATABASES.items():
                staged, previous = database_names(kind, identifier)
                pg(kind, "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='" + database +
                   "' AND backend_type='client backend';")
                rename(kind, database, previous)
                try:
                    rename(kind, staged, database)
                except Exception:
                    rename(kind, previous, database)
                    raise
                swapped.append(kind)
            for group in paths:
                active = Path('/srv/umsa-clean-containers') / group
                if active.is_symlink() or not active.is_dir():
                    raise RuntimeError('Unexpected core active data directory')
                old = root / (group + '.before')
                active.rename(old)
                replaced.append((active, old))
                run(['cp', '-a', '--reflink=always', str(files / group), str(active)])
                owner = 1000 if group == 'directus-uploads' else old.stat().st_uid
                for file in [active, *active.rglob('*')]:
                    os.chown(file, owner, owner)
                    file.chmod(0o750 if file.is_dir() else 0o640)
            fence('commit')
            committed = True
            (root / 'target-writes-authorized').write_text('Keep the source databases read-only.\n')
            run(['docker', 'start', *CONTAINERS])
            run(['systemctl', 'start', 'umsa-clean-astro-ultimamilla'])
            for _ in range(45):
                result = subprocess.run(['curl', '-fsS', '--max-time', '5', '-o', '/dev/null',
                                         'http://127.0.0.1:8055/server/health'], stdout=log, stderr=log)
                if result.returncode == 0:
                    break
                time.sleep(1)
            else:
                raise RuntimeError('New CMS did not become healthy')
            public.activate('umsa', root)
            for route in ('/antecedentes', '/estilo/fuentes/plantilla', '/dge/login', '/status/'):
                public.probe('www.ultimamilla.com.ar', route, {'200'})
            (root / 'cutover.complete.json').write_text(json.dumps({'run': identifier,
                'database_sha256': hashes, 'files': {group: len(rows) for group, rows in manifests.items()},
                'backup': archive.name, 'backup_sha256': sha256(archive), 'backup_bytes': archive.stat().st_size,
                'source_fenced': True, 'public_target_ready': True, 'dns_pending': True}) + '\n')
        except Exception:
            if not committed:
                for active, old in reversed(replaced):
                    if active.exists():
                        active.rename(root / (active.name + '.failed'))
                    old.rename(active)
                for kind in reversed(swapped):
                    _, _, database = DATABASES[kind]
                    staged, previous = database_names(kind, identifier)
                    rename(kind, database, staged)
                    rename(kind, previous, database)
                if stopped:
                    run(['docker', 'start', *CONTAINERS])
                    run(['systemctl', 'start', 'umsa-clean-astro-ultimamilla'])
                if fenced:
                    fence('recover')
            raise
    print('Final CMS/DGE/ARCA data and public UMSA routes are ready on Hostinger. DNS is next.')


if __name__ == '__main__':
    main(sys.argv[1])
