#!/usr/bin/env python3
"""Finish an approved SGI cutover after the source has been durably fenced."""
import hashlib
import importlib.util
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
SOURCE = 'root@23.105.176.45'
APP = Path('/srv/umsa-clean-apps/sgi')
UNIT = Path('/etc/systemd/system/umsa-clean-sgi.service')


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256(file):
    digest = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def activate(identifier, candidate):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or not os.environ.get('SSH_AUTH_SOCK')
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or any(not re.fullmatch(r'[0-9]+-[0-9]+', value) for value in (identifier, candidate))):
        raise RuntimeError('Unexpected target or cutover identity')
    os.umask(0o077)
    root = STAGE / 'sgi-cutovers' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    dedicated = STAGE / 'sgi-dedicated-rehearsals' / candidate
    receipt = json.loads((dedicated / 'rehearsal.complete.json').read_text())
    container = 'umsa-sgi-db-' + candidate
    if (receipt.get('container') != container or receipt.get('network') != 'none'
            or dedicated.is_symlink() or not (dedicated / 'socket/mysqld.sock').is_socket()
            or 'DB_SOCKET=' in (STAGE / 'clean-sgi.environment').read_text()):
        raise RuntimeError('Private SGI database candidate changed or is already used')
    info = json.loads(subprocess.check_output(['docker', 'inspect', container], text=True))[0]
    if info['HostConfig']['NetworkMode'] != 'none' or info['HostConfig'].get('PortBindings'):
        raise RuntimeError('SGI database network isolation changed')
    expected_socket = str(dedicated / 'socket/mysqld.sock')
    environment = (dedicated / 'sgi-candidate.environment').read_text()
    if environment.count('DB_SOCKET=' + expected_socket + '\n') != 1:
        raise RuntimeError('Private SGI candidate environment changed')
    original_unit = UNIT.read_text()
    if original_unit.count('EnvironmentFile=' + str(STAGE / 'clean-sgi.environment')) != 1:
        raise RuntimeError('Target SGI service environment changed')
    (root / 'target-unit.before').write_text(original_unit)
    known = STAGE / 'known_hosts'
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
               'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=30']
    source_script = '/root/umsa-sgi-cutover-tooling/' + identifier + '/sgi-source-cutover.py'
    def remote(args):
        return ['ssh', *options, SOURCE, shlex.join(args)]
    def fence(mode):
        subprocess.run(remote(['python3', source_script, mode, identifier]), check=True, timeout=120)
    helper = load('sgi_inventory', 'rehearse-sgi-real-snapshot.py')
    public = load('public_vhost', 'public-vhost.py')
    stream = load('streaming_backup', 'rehearse-streaming-recovery.py')
    common = load('backup_common', 'rehearse-encrypted-recovery.py')
    public.preflight('sgi', root)
    committed = False
    source_fenced = False
    app_changed = False
    with (root / 'cutover.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        def db(sql):
            return subprocess.check_output(['docker', 'exec', container, 'mariadb',
                '--defaults-extra-file=/run/secrets/root.cnf', '-N', '-e', sql], text=True, timeout=60)
        def source_db(sql):
            return subprocess.check_output(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', sql]),
                                           text=True, timeout=60)
        try:
            fence('fence')
            source_fenced = True
            inventory = helper.parse_inventory(source_db(helper.SQL))
            dump = root / 'SGI-FINAL.sql'
            with dump.open('xb') as destination:
                subprocess.run(remote(['mariadb-dump', '--no-defaults', '-uroot', '--single-transaction',
                    '--skip-lock-tables', '--routines', '--events', '--triggers', '--hex-blob',
                    '--databases', 'sgi_production']), check=True, stdout=destination, stderr=log, timeout=600)
            fence('verify')
            with dump.open('rb') as source:
                run(['docker', 'exec', '-i', container, 'mariadb', '--defaults-extra-file=/run/secrets/root.cnf'],
                    stdin=source, timeout=600)
            if helper.parse_inventory(db(helper.SQL)) != inventory:
                raise RuntimeError('Final SGI restored metadata differs')
            tables = [row.split('|')[1] for row in inventory if row.startswith('T|')]
            counts_sql = ' UNION ALL '.join("SELECT '" + table + "',COUNT(*) FROM `sgi_production`.`" + table + '`'
                                          for table in tables) + ';'
            if source_db(counts_sql) != db(counts_sql):
                raise RuntimeError('Final SGI table row counts differ')
            run(['docker', 'exec', container, 'mariadb-check', '--defaults-extra-file=/run/secrets/root.cnf',
                 '--databases', 'sgi_production', '--check'], timeout=300)
            for row in inventory:
                if row.startswith('V|'):
                    db('SELECT * FROM `sgi_production`.`' + row.split('|')[1] + '` LIMIT 0;')
            paths = {'private': '/home/sgi.ultimamilla.com.ar/private',
                     'imports': '/home/sgi.ultimamilla.com.ar/imports',
                     'uploads': '/home/sgi.ultimamilla.com.ar/uploads',
                     'arca-archive': '/var/lib/sgi-arca/archive'}
            files = root / 'files'
            files.mkdir()
            for name, source_path in paths.items():
                unsafe = subprocess.check_output(['ssh', *options, SOURCE,
                    'test -d ' + source_path + ' && test ! -L ' + source_path + ' && find ' + source_path +
                    r' \( -type l -o -type b -o -type c -o -type p -o -type s \) -print -quit'], text=True)
                if unsafe:
                    raise RuntimeError('Unexpected SGI mutable file type')
                destination = files / name
                destination.mkdir()
                run(['rsync', '-a', '--no-specials', '--no-devices', '-e', shlex.join(['ssh', *options]),
                     SOURCE + ':' + source_path + '/', str(destination) + '/'], timeout=600)
                if any(path.is_symlink() for path in destination.rglob('*')):
                    raise RuntimeError('Unexpected SGI staged symlink')
            hashes = {'SGI-FINAL.sql': sha256(dump)}
            (root / 'SHA256SUMS.json').write_text(json.dumps(hashes, indent=2) + '\n')
            manifest = {file.relative_to(files).as_posix(): sha256(file)
                        for file in files.rglob('*') if file.is_file()}
            (root / 'files.sha256.json').write_text(json.dumps(manifest, indent=2) + '\n')
            keyring = root / 'public-keyring'
            stream.import_recipient(keyring, Path(__file__).with_name('offsite-recovery-public.asc'), stream.FINGERPRINT)
            archive = root / ('CUTOVER-sgi-' + identifier + '.tar.gz.gpg')
            stream.encrypted_archive(root, ['SGI-FINAL.sql', 'SHA256SUMS.json', 'files', 'files.sha256.json'],
                                     keyring, stream.FINGERPRINT, archive)
            backup_ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
                '-o', 'UserKnownHostsFile=' + str(STAGE / 'backup-known-hosts'), '-i', '/root/.ssh/umsa_offsite_20261027']
            backup = 'umbak@76.13.234.213'
            if common.available_gb(subprocess.check_output(backup_ssh + [backup, 'listar'], text=True)) < 9:
                raise RuntimeError('Offsite receiver reserve is insufficient')
            run(['rsync', '-a', '-e', shlex.join(backup_ssh), str(archive), backup + ':/opt/remote-backups/directus/'])
            listing = subprocess.check_output(backup_ssh + [backup, 'listar'], text=True)
            matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
            if len(matches) != 1 or matches[0][4] != str(archive.stat().st_size):
                raise RuntimeError('Final SGI offsite backup size was not confirmed')
            fence('verify')
            run(['systemctl', 'stop', 'umsa-clean-sgi'])
            for name, original in paths.items():
                destinations = [Path(original)] + ([APP / name] if name != 'arca-archive' else [])
                for index, destination in enumerate(destinations):
                    if destination.is_symlink() or not destination.is_dir():
                        raise RuntimeError('Unexpected SGI target data directory')
                    before = root / 'before-files' / (name + '-' + str(index))
                    run(['rsync', '-a', '--backup', '--backup-dir=' + str(before),
                         str(files / name) + '/', str(destination) + '/'])
            live_env = root / 'sgi-live.environment'
            live_env.write_text(environment)
            replacement = original_unit.replace(str(STAGE / 'clean-sgi.environment'), str(live_env))
            # Keep outbound integrations disabled until they are explicitly verified.
            public.atomic(UNIT, replacement, 0o644)
            app_changed = True
            run(['systemctl', 'daemon-reload'])
            # This is the one-way boundary: never automatically restart the old writer afterwards.
            fence('commit')
            committed = True
            (root / 'target-writes-authorized').write_text('Source write privileges remain revoked.\n')
            run(['systemctl', 'start', 'umsa-clean-sgi'])
            for _ in range(30):
                result = subprocess.run(['curl', '-fsS', '--max-time', '5', '-o', '/dev/null',
                                         'http://127.0.0.1:3000/'], stdout=log, stderr=log)
                if result.returncode == 0:
                    break
                time.sleep(1)
            else:
                raise RuntimeError('Target SGI application did not become ready')
            public.activate('sgi', root)
            (root / 'cutover.complete.json').write_text(json.dumps({'run': identifier,
                'candidate': candidate, 'database_sha256': hashes['SGI-FINAL.sql'], 'files': len(manifest),
                'backup': archive.name, 'backup_sha256': sha256(archive), 'backup_bytes': archive.stat().st_size,
                'source_fenced': True, 'public_target_ready': True, 'dns_pending': True,
                'external_integrations_pending': True}) + '\n')
        except Exception:
            if not committed:
                if app_changed:
                    public.atomic(UNIT, original_unit, 0o644)
                    run(['systemctl', 'daemon-reload'])
                run(['systemctl', 'start', 'umsa-clean-sgi'])
                if source_fenced:
                    fence('recover')
            raise
    print('SGI final data restored and writer active on Hostinger. Source remains fenced. DNS change is next.')


if __name__ == '__main__':
    activate(*sys.argv[1:])
