#!/usr/bin/env python3
"""Finish approved UMBot, Wiki and WordPress handoffs without replacing code."""
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
import sqlite3
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
SOURCE = 'root@23.105.176.45'
BASE = STAGE / 'mutable-rehearsals/40593832809-1'
DBS = ['ultimami_wiki', 'ultimami_wiki_new', 'vecinorabioso']
ACEITE = '/var/www/umbot-aceite/releases/20260627-2002-e960e06'
PLAN = '/home/umbot.com.ar/cannaval-plan-repo'
PLAN_ROOT = Path('/srv/umsa-clean-plan')
ACEITE_ROOT = Path('/srv/umsa-clean-apps/umbot-aceite')
PATHS = {'wordpress-uploads': ('/home/vecinorabioso.com.ar/public_html/wp-content/uploads', Path('/srv/umsa-clean-php/wordpress/wp-content/uploads')),
         'wiki-images': ('/home/wiki.ultimamilla.com.ar/images', Path('/srv/umsa-clean-php/wiki/images')),
         'aceite-vault': (ACEITE + '/obsidian-vault', ACEITE_ROOT / 'obsidian-vault'),
         'aceite-wiki': (ACEITE + '/cannabis-wiki', ACEITE_ROOT / 'cannabis-wiki')}
PATHS.update({'plan-' + name: (PLAN + '/' + name, PLAN_ROOT / name)
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


def manifest(root, group):
    result = {}
    for file in root.rglob('*'):
        name = file.relative_to(root).as_posix()
        if file.is_symlink():
            if (group, name, os.readlink(file)) != ('plan-docs', 'wiki', '../wiki'):
                raise RuntimeError('Unexpected remaining mutable link')
            result[name] = 'LINK:../wiki'
        elif file.is_file():
            result[name] = sha256(file)
        elif not file.is_dir():
            raise RuntimeError('Unexpected remaining mutable file type')
    return result


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or not os.environ.get('SSH_AUTH_SOCK')
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'):
        raise RuntimeError('Unexpected target or cutover identity')
    os.umask(0o077)
    root = STAGE / 'remaining-cutovers' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    public = load('public_vhost', 'public-vhost.py')
    stream = load('streaming_recovery', 'rehearse-streaming-recovery.py')
    common = load('recovery_common', 'rehearse-encrypted-recovery.py')
    # Each preflight gets its own directory; active ingress is still unchanged.
    for service in ('umbot', 'wiki', 'wordpress'):
        directory = root / ('preflight-' + service)
        directory.mkdir()
        public.preflight(service, directory)
    opts = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
            'UserKnownHostsFile=' + str(STAGE / 'known_hosts'), '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=30']
    def remote(args):
        return ['ssh', *opts, SOURCE, shlex.join(args)]
    source_tool = '/root/umsa-remaining-cutover-tooling/' + identifier + '/remaining-source-cutover.py'
    def fence(mode):
        subprocess.run(remote(['python3', source_tool, mode, identifier]), check=True, timeout=240)
    def db(sql):
        return subprocess.check_output(['mariadb', '--no-defaults', '-uroot', '-N', '-e', sql], text=True, timeout=120)
    fenced, committed, stopped, imported = False, False, False, False
    replaced = []
    with (root / 'cutover.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        def capture(args, path, stdin=None):
            with path.open('xb') as output:
                subprocess.run(args, stdin=stdin, stdout=output, stderr=log, check=True, timeout=600)
            if path.stat().st_size == 0:
                raise RuntimeError('Empty remaining database snapshot')
        try:
            if subprocess.check_output(remote(['readlink', '-f', '/var/www/umbot-aceite/current']), text=True).strip() != ACEITE:
                raise RuntimeError('Source Aceite release changed')
            fence('fence')
            fenced = True
            sql = root / 'php-FINAL.sql'
            capture(remote(['mariadb-dump', '--no-defaults', '-uroot', '--single-transaction', '--skip-lock-tables',
                '--routines', '--events', '--triggers', '--hex-blob', '--add-drop-database', '--databases', *DBS]), sql)
            with Path(__file__).with_name('sqlite-snapshot.py').open('rb') as helper:
                capture(remote(['python3', '-']), root / 'aceite-FINAL.sql', helper)
            candidate_sqlite = root / 'aceite-FINAL.db'
            with sqlite3.connect(candidate_sqlite) as database:
                database.executescript((root / 'aceite-FINAL.sql').read_text())
                if database.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                    raise RuntimeError('Final Aceite SQLite integrity failure')
            files, delta = root / 'files', root / 'delta'
            files.mkdir()
            delta.mkdir()
            manifests = {}
            for group, (source_path, _) in PATHS.items():
                target = files / group
                target.mkdir()
                run(remote(['test', '-d', source_path]))
                run(['rsync', '-a', '--no-specials', '--no-devices', '-e', shlex.join(['ssh', *opts]),
                     SOURCE + ':' + source_path + '/', str(target) + '/'], timeout=600)
                manifests[group] = manifest(target, group)
                for relative, digest in manifests[group].items():
                    old = BASE / group / relative
                    same = old.is_symlink() and digest == 'LINK:' + os.readlink(old)
                    same = same or (not old.is_symlink() and old.is_file() and digest == sha256(old))
                    if not same:
                        destination = delta / group / relative
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        if digest.startswith('LINK:'):
                            destination.symlink_to('../wiki')
                        else:
                            shutil.copy2(target / relative, destination)
            capture(remote(['cat', '/home/umbot.com.ar/public_html/plan/site-data/overview.json']), root / 'plan-public-overview.json')
            json.loads((root / 'plan-public-overview.json').read_text())
            hashes = {name: sha256(root / name) for name in ('php-FINAL.sql', 'aceite-FINAL.sql', 'aceite-FINAL.db', 'plan-public-overview.json')}
            (root / 'SHA256SUMS.json').write_text(json.dumps(hashes, indent=2) + '\n')
            (root / 'files.sha256.json').write_text(json.dumps(manifests, indent=2) + '\n')
            (root / 'recovery-base.json').write_text(json.dumps({'archive': 'REHEARSAL-umsa-stream-40614031828-1.tar.gz.gpg',
                'sha256': '4b29e326c44bb2c26f2e92541e68b3aaa99d20338ba0d75f00c7459e452bd72f',
                'base_directory': 'mutable-rehearsals/40593832809-1'}) + '\n')
            keyring = root / 'public-keyring'
            stream.import_recipient(keyring, Path(__file__).with_name('offsite-recovery-public.asc'), stream.FINGERPRINT)
            archive = root / ('CUTOVER-remaining-' + identifier + '.tar.gz.gpg')
            stream.encrypted_archive(root, list(hashes) + ['SHA256SUMS.json', 'files.sha256.json', 'recovery-base.json', 'delta'],
                                     keyring, stream.FINGERPRINT, archive)
            backup_ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
                '-o', 'UserKnownHostsFile=' + str(STAGE / 'backup-known-hosts'), '-i', '/root/.ssh/umsa_offsite_20261027']
            backup = 'umbak@76.13.234.213'
            listing = subprocess.check_output(backup_ssh + [backup, 'listar'], text=True)
            if common.available_gb(listing) < 8 + math.ceil(archive.stat().st_size / 1024**3):
                raise RuntimeError('Offsite reserve is insufficient')
            run(['rsync', '-a', '-e', shlex.join(backup_ssh), str(archive), backup + ':/opt/remote-backups/directus/'])
            listing = subprocess.check_output(backup_ssh + [backup, 'listar'], text=True)
            matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
            if len(matches) != 1 or matches[0][4] != str(archive.stat().st_size):
                raise RuntimeError('Remaining offsite backup size was not confirmed')
            fence('verify')
            # Save the three prior target schemas before importing only these schemas.
            capture(['mariadb-dump', '--no-defaults', '-uroot', '--routines', '--events', '--triggers',
                     '--hex-blob', '--add-drop-database', '--databases', *DBS], root / 'php-target.before.sql')
            run(['systemctl', 'stop', 'php-fpm', 'umsa-clean-umbot-aceite', 'umsa-clean-plan'])
            stopped = True
            imported = True
            with sql.open('rb') as source:
                run(['mariadb', '--no-defaults', '-uroot'], stdin=source, timeout=600)
            run(['mariadb-check', '--no-defaults', '-uroot', '--databases', *DBS, '--check'], timeout=300)
            inventory_sql = ("SELECT TABLE_SCHEMA,TABLE_NAME FROM information_schema.TABLES WHERE TABLE_TYPE='BASE TABLE' "
                             "AND TABLE_SCHEMA IN ('ultimami_wiki','ultimami_wiki_new','vecinorabioso') ORDER BY 1,2;")
            source_inventory = subprocess.check_output(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', inventory_sql]), text=True)
            if db(inventory_sql) != source_inventory:
                raise RuntimeError('Restored PHP schema inventory differs')
            for line in source_inventory.splitlines():
                database, table = line.split('\t')
                if database not in DBS or not re.fullmatch(r'[A-Za-z0-9_]+', table):
                    raise RuntimeError('Unsafe PHP row count identifier')
                count = 'SELECT COUNT(*) FROM `' + database + '`.`' + table + '`;'
                if db(count) != subprocess.check_output(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', count]), text=True):
                    raise RuntimeError('Final PHP table row count differs')
            for group, (_, active) in PATHS.items():
                if active.is_symlink():
                    raise RuntimeError('Unexpected active data symlink')
                previous = root / (group + '.before')
                owner = active.stat() if active.exists() else None
                if active.exists():
                    active.rename(previous)
                replaced.append((active, previous))
                run(['cp', '-a', '--reflink=always', str(files / group), str(active)])
                if owner:
                    for file in [active, *active.rglob('*')]:
                        if not file.is_symlink():
                            os.chown(file, owner.st_uid, owner.st_gid)
                            file.chmod(0o750 if file.is_dir() else 0o640)
            active_db = ACEITE_ROOT / 'db'
            before_db = root / 'aceite-db.before'
            active_db.rename(before_db)
            replaced.append((active_db, before_db))
            active_db.mkdir(mode=0o700)
            run(['cp', '--reflink=always', str(candidate_sqlite), str(active_db / 'custom.db')])
            overview = PLAN_ROOT / 'public/site-data/overview.json'
            shutil.copy2(overview, root / 'overview.before.json')
            shutil.copy2(root / 'plan-public-overview.json', overview)
            overview.chmod(0o644)
            fence('commit')
            committed = True
            (root / 'target-writes-authorized').write_text('Keep old PHP and UMBot writers fenced.\n')
            run(['systemctl', 'start', 'php-fpm', 'umsa-clean-umbot-aceite', 'umsa-clean-plan'])
            for service in ('umbot', 'wiki', 'wordpress'):
                directory = root / ('public-' + service)
                directory.mkdir()
                public.activate(service, directory)
            public.probe('www.umbot.com.ar', '/plan/', {'200'})
            public.probe('www.umbot.com.ar', '/plan/admin/login', {'200'})
            (root / 'cutover.complete.json').write_text(json.dumps({'run': identifier, 'databases': DBS,
                'database_hashes': hashes, 'files': {k: len(v) for k, v in manifests.items()},
                'backup': archive.name, 'backup_sha256': sha256(archive), 'backup_bytes': archive.stat().st_size,
                'source_fenced': True, 'public_target_ready': True, 'dns_pending': True}) + '\n')
        except Exception:
            if not committed:
                for active, previous in reversed(replaced):
                    if active.exists():
                        active.rename(root / (active.name + '.failed-' + str(len(list(root.iterdir())))))
                    if previous.exists():
                        previous.rename(active)
                if imported:
                    with (root / 'php-target.before.sql').open('rb') as source:
                        run(['mariadb', '--no-defaults', '-uroot'], stdin=source, timeout=600)
                if stopped:
                    run(['systemctl', 'start', 'php-fpm', 'umsa-clean-umbot-aceite', 'umsa-clean-plan'])
                if fenced:
                    fence('recover')
            raise
    print('UMBot/Aceite/Plan, Wiki and WordPress final data and public target routes are ready. DNS is next.')


if __name__ == '__main__':
    main(sys.argv[1])
