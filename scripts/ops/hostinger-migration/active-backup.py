#!/usr/bin/env python3
"""Append encrypted backups of active Hostinger data; never prune old versions."""
from datetime import datetime, timezone
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import shutil
import socket
import sqlite3
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-operational-backups')
BASE = STAGE / 'mutable-rehearsals/40593832809-1'
GIB = 1024**3
PG = {'directus': ('directus-admin-database-1', 'directus'),
      'arca': ('directus-admin-database-1', 'arca_facturas'),
      'sitrep': ('directus-admin-database-1', 'trazabilidad_rrpp'), 'dge': ('dge-demo-db', 'dge_demo')}
DATA = {
    'directus-uploads': Path('/srv/umsa-clean-containers/directus-uploads'),
    'arca-output': Path('/srv/umsa-clean-containers/arca-output'),
    'arca-certs': Path('/srv/umsa-clean-containers/arca-certs'),
    'sitrep-data': Path('/srv/umsa-clean-apps/sitrep-backend/data'),
    'sitrep-uploads': Path('/srv/umsa-clean-apps/sitrep-backend/uploads'),
    'sgi-private': Path('/srv/umsa-clean-apps/sgi/private'),
    'sgi-imports': Path('/srv/umsa-clean-apps/sgi/imports'),
    'sgi-uploads': Path('/srv/umsa-clean-apps/sgi/uploads'),
    'sgi-arca-archive': Path('/var/lib/sgi-arca/archive'),
    'wordpress-uploads': Path('/srv/umsa-clean-php/wordpress/wp-content/uploads'),
    'wiki-images': Path('/srv/umsa-clean-php/wiki/images'),
    'aceite-vault': Path('/srv/umsa-clean-apps/umbot-aceite/obsidian-vault'),
    'aceite-wiki': Path('/srv/umsa-clean-apps/umbot-aceite/cannabis-wiki'),
}
DATA.update({'plan-' + name: Path('/srv/umsa-clean-plan') / name
             for name in ('docs', 'acciones', 'registro', 'plantillas', 'site-data', 'exports', 'wiki')})


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


def receiver_has_reserve(rounded_gib, incoming_bytes):
    # The existing receiver reports df -BG, which rounds UP. Use a lower bound.
    # Preserve at least 7 GiB after transfer, above its PSICOLE 5 GB requirement.
    return (rounded_gib - 1) * GIB - incoming_bytes >= 7 * GIB


def snapshot_files(destination):
    manifest = {}
    for group, root in DATA.items():
        if root.is_symlink() or not root.is_dir():
            raise RuntimeError('Active data root is missing or symlinked: ' + group)
        manifest[group] = {}
        for path in root.rglob('*'):
            relative = path.relative_to(root).as_posix()
            if path.is_symlink():
                if (group, relative, os.readlink(path)) != ('plan-docs', 'wiki', '../wiki'):
                    raise RuntimeError('Unexpected active data symlink')
                digest = 'LINK:../wiki'
            elif path.is_file():
                digest = sha256(path)
            elif path.is_dir():
                continue
            else:
                raise RuntimeError('Unexpected active data file type')
            manifest[group][relative] = digest
            old = BASE / group / relative
            same = old.is_symlink() and digest == 'LINK:' + os.readlink(old)
            same = same or (not old.is_symlink() and old.is_file() and digest == sha256(old))
            if not same:
                target = destination / group / relative
                target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                if digest.startswith('LINK:'):
                    target.symlink_to('../wiki')
                else:
                    shutil.copy2(path, target)
                    if sha256(target) != digest:
                        raise RuntimeError('A mutable file changed while being backed up; retry')
    return manifest


def target_guard():
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or os.geteuid() != 0 or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file() or ROOT.is_symlink()):
        raise RuntimeError('Active Hostinger production gate is required')


def backup():
    target_guard()
    os.umask(0o077)
    lock = open('/run/umsa-active-backup.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    if shutil.disk_usage('/srv').free < 10 * GIB:
        raise RuntimeError('Target free disk is below 10 GiB; no versions were removed')
    identifier = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + secrets.token_hex(4)
    root = ROOT / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    databases, config, delta = root / 'databases', root / 'configuration', root / 'delta'
    for directory in (databases, config, delta):
        directory.mkdir(mode=0o700)
    receipts = list((STAGE / 'sgi-cutovers').glob('*/cutover.complete.json'))
    if len(receipts) != 1:
        raise RuntimeError('The active SGI database identity needs review')
    candidate = json.loads(receipts[0].read_text())['candidate']
    if not re.fullmatch(r'[0-9]+-[0-9]+', candidate):
        raise RuntimeError('Unexpected active SGI candidate')
    with (root / 'backup.log').open('ab') as log:
        def capture(args, path):
            with path.open('xb') as output:
                subprocess.run(args, stdout=output, stderr=log, check=True, timeout=600)
            if not path.stat().st_size:
                raise RuntimeError('Empty active database snapshot')
        for name, (container, database) in PG.items():
            file = databases / (name + '.dump')
            capture(['docker', 'exec', container, 'pg_dump', '-U', 'umsa_restore_admin_20261027', '-Fc', '-Z1', database], file)
            with file.open('rb') as source:
                subprocess.run(['docker', 'exec', '-i', container, 'pg_restore', '--list'], stdin=source,
                               stdout=log, stderr=log, check=True, timeout=60)
        for container in ('directus-admin-database-1', 'dge-demo-db'):
            capture(['docker', 'exec', container, 'pg_dumpall', '-U', 'umsa_restore_admin_20261027', '--globals-only'],
                    databases / (container + '-roles.sql'))
        # Each MariaDB instance is read-locked only for its logical dump; readers continue.
        capture(['docker', 'exec', 'umsa-sgi-db-' + candidate, 'mariadb-dump',
                 '--defaults-extra-file=/run/secrets/root.cnf', '--lock-all-tables', '--routines', '--events',
                 '--triggers', '--hex-blob', '--databases', 'sgi_production'], databases / 'sgi.sql')
        capture(['mariadb-dump', '--no-defaults', '-uroot', '--lock-all-tables', '--routines', '--events',
                 '--triggers', '--hex-blob', '--databases', 'ultimami_wiki', 'ultimami_wiki_new', 'vecinorabioso'],
                databases / 'wiki-wordpress.sql')
        sqlite_path = '/srv/umsa-clean-apps/umbot-aceite/db/custom.db'
        with sqlite3.connect('file:' + sqlite_path + '?mode=ro', uri=True) as source:
            with sqlite3.connect(databases / 'aceite.db') as destination:
                source.backup(destination)
                if destination.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                    raise RuntimeError('Active SQLite backup integrity failed')
        for path in [*STAGE.glob('*.environment'), Path('/srv/umsa-clean-containers/dge-runtime.json'),
                     Path('/srv/umsa-clean-containers/directus.env'), Path('/srv/umsa-clean-containers/arca.env')]:
            if path.is_symlink() or not path.is_file():
                raise RuntimeError('Expected active configuration is missing')
            shutil.copy2(path, config / path.as_posix().replace('/', '__'))
        for path in (STAGE / 'internal-credentials', Path('/etc/letsencrypt-hostinger'),
                     Path('/etc/postfix'), Path('/etc/postfix-vivero'), Path('/etc/opendkim')):
            if path.is_symlink() or not path.is_dir():
                raise RuntimeError('Expected active secrets/configuration directory is missing')
            shutil.copytree(path, config / path.as_posix().replace('/', '__'), symlinks=True)
        files = snapshot_files(delta)
        hashes = {p.name: sha256(p) for p in databases.iterdir() if p.is_file()}
        (root / 'manifest.json').write_text(json.dumps({'created_utc': identifier,
            'databases': hashes, 'files': files,
            'base_archive': 'REHEARSAL-umsa-stream-40614031828-1.tar.gz.gpg',
            'base_sha256': '4b29e326c44bb2c26f2e92541e68b3aaa99d20338ba0d75f00c7459e452bd72f',
            'base_files_directory': 'mutable-rehearsals/40593832809-1',
            'restore': 'Use the final inventory, unchanged base files and delta overrides. Database snapshots are individually consistent.'}, indent=2) + '\n')
        crypto = load('active_streaming', 'rehearse-streaming-recovery.py')
        helper = load('active_receiver', 'rehearse-encrypted-recovery.py')
        keyring = root / 'public-keyring'
        crypto.import_recipient(keyring, Path(__file__).with_name('offsite-recovery-public.asc'), crypto.FINGERPRINT)
        archive = root / ('HOSTINGER-active-' + identifier + '.tar.gz.gpg')
        crypto.encrypted_archive(root, ['databases', 'configuration', 'delta', 'manifest.json'],
                                 keyring, crypto.FINGERPRINT, archive)
        ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
               '-o', 'UserKnownHostsFile=' + str(STAGE / 'backup-known-hosts'), '-o', 'ConnectTimeout=15',
               '-i', '/root/.ssh/umsa_offsite_20261027']
        receiver = 'umbak@76.13.234.213'
        listing = subprocess.check_output(ssh + [receiver, 'listar'], text=True)
        if not receiver_has_reserve(helper.available_gb(listing), archive.stat().st_size):
            raise RuntimeError('Local encrypted backup retained; offsite transfer cannot preserve 7 GiB reserve')
        subprocess.run(['rsync', '-a', '-e', shlex.join(ssh), str(archive), receiver + ':/opt/remote-backups/directus/'],
                       stdout=log, stderr=log, check=True, timeout=1200)
        listing = subprocess.check_output(ssh + [receiver, 'listar'], text=True)
        matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
        if len(matches) != 1 or matches[0][4] != str(archive.stat().st_size):
            raise RuntimeError('Offsite backup size was not confirmed')
        receipt = {'created_utc': identifier, 'archive': archive.name, 'bytes': archive.stat().st_size,
                   'sha256': sha256(archive), 'database_files': len(hashes),
                   'data_files': sum(len(v) for v in files.values()), 'encrypted_offsite': True,
                   'independent_recovery_verification_pending': True}
        (root / 'backup.complete.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


def install(identifier):
    target_guard()
    if not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Unexpected backup installation identity')
    os.umask(0o077)
    public = load('backup_public', 'public-vhost.py')
    directory = Path('/usr/local/lib/umsa-operational-backups')
    directory.mkdir(mode=0o700, exist_ok=True)
    if directory.is_symlink():
        raise RuntimeError('Unexpected managed backup directory')
    for name in ('active-backup.py', 'rehearse-streaming-recovery.py', 'rehearse-encrypted-recovery.py', 'offsite-recovery-public.asc', 'public-vhost.py'):
        public.atomic(directory / name, Path(__file__).with_name(name).read_text(), 0o600)
    unit = Path('/etc/systemd/system/umsa-active-backup.service')
    timer = Path('/etc/systemd/system/umsa-active-backup.timer')
    public.atomic(unit, '[Unit]\nDescription=Encrypted active UMSA data backup\n'
        'After=network-online.target docker.service mariadb.service\n[Service]\nType=oneshot\n'
        'ExecStart=/usr/bin/python3 /usr/local/lib/umsa-operational-backups/active-backup.py\n'
        'TimeoutStartSec=2700\nNice=19\nIOSchedulingClass=idle\nUMask=0077\n', 0o644)
    public.atomic(timer, '[Unit]\nDescription=Daily UMSA data backup\n[Timer]\n'
        'OnCalendar=*-*-* 06:10:00 UTC\nRandomizedDelaySec=600\nPersistent=true\n'
        '[Install]\nWantedBy=timers.target\n', 0o644)
    subprocess.run(['systemd-analyze', 'verify', str(unit), str(timer)], check=True)
    subprocess.run(['systemctl', 'daemon-reload'], check=True)
    subprocess.run(['systemctl', 'enable', '--now', 'umsa-active-backup.timer'], check=True)
    subprocess.run(['systemctl', 'start', 'umsa-active-backup.service'], check=True, timeout=2700)
    print('Daily encrypted backups installed and the first backup completed; no historical version was removed.')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--install':
        install(sys.argv[2])
    elif len(sys.argv) == 1:
        backup()
    else:
        raise ValueError('Unsupported active backup operation')
