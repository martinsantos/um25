#!/usr/bin/env python3
"""Send existing non-final snapshots offsite with streaming OpenPGP encryption."""
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

STAGE = Path('/srv/umsa-migration')
FINGERPRINT = '4EF63B55AB0612141ACBB63C2E959F17EDDE7600'


def common():
    spec = importlib.util.spec_from_file_location('recovery_common', Path(__file__).with_name('rehearse-encrypted-recovery.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def import_recipient(keyring, public_key, fingerprint):
    keyring.mkdir(mode=0o700)
    subprocess.run(['gpg', '--homedir', str(keyring), '--batch', '--import', str(public_key)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    listing = subprocess.check_output(['gpg', '--homedir', str(keyring), '--batch', '--with-colons', '--list-keys'],
                                      text=True, stderr=subprocess.DEVNULL)
    rows = [line.split(':') for line in listing.splitlines()]
    public = [row for row in rows if row[0] == 'pub']
    fingerprints = [row[9] for row in rows if row[0] == 'fpr']
    if len(public) != 1 or fingerprints != [fingerprint]:
        raise RuntimeError('Recovery encryption key fingerprint differs')


def encrypted_archive(base, paths, keyring, fingerprint, output):
    priority = ['nice', '-n', '19'] + (['ionice', '-c3'] if shutil.which('ionice') else [])
    with output.open('xb') as stream:
        tar = subprocess.Popen(priority + ['tar', '-czf', '-', '-C', str(base), *paths], stdout=subprocess.PIPE)
        try:
            crypt = subprocess.Popen(['gpg', '--homedir', str(keyring), '--batch', '--yes', '--trust-model', 'always',
                                      '--compress-algo', 'none', '--cipher-algo', 'AES256', '--recipient', fingerprint,
                                      '--output', '-', '--encrypt'], stdin=tar.stdout, stdout=stream)
        finally:
            tar.stdout.close()
        crypt_result, tar_result = crypt.wait(), tar.wait()
        if crypt_result or tar_result:
            raise RuntimeError('Streaming encrypted archive creation failed')


def main(identifier):
    if not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier):
        raise ValueError('Invalid CI identifier')
    os.umask(0o077)
    helper = common()
    data = STAGE / 'data-refreshes' / helper.DATA_ID
    files = STAGE / 'mutable-rehearsals' / helper.FILES_ID
    public_key = Path(__file__).with_name('offsite-recovery-public.asc')
    key = Path('/root/.ssh/umsa_offsite_20261027')
    known = STAGE / 'backup-known-hosts'
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or any(path.is_symlink() or not path.is_file() for path in
                   (data / 'refresh.complete', data / 'REHEARSAL-ONLY', data / 'SHA256SUMS.json',
                    files / 'transfer.complete', files / 'REHEARSAL-ONLY', files / 'manifest.json',
                    public_key, key, known, STAGE / 'backup-identity.prepared'))
            or data.is_symlink() or files.is_symlink() or shutil.disk_usage(STAGE).free < 10 * 1024**3):
        raise RuntimeError('Reviewed recovery inputs, identity, or target capacity are unavailable')
    hashes = json.loads((data / 'SHA256SUMS.json').read_text())
    if not hashes or 'mariadb.sql' not in hashes or 'dge-demo-db-dge_demo.dump' not in hashes:
        raise RuntimeError('Expected database snapshots are missing')
    for name, expected in hashes.items():
        if (not re.fullmatch(r'[A-Za-z0-9_.-]+', name) or not re.fullmatch(r'[0-9a-f]{64}', expected)
                or (data / name).is_symlink() or not (data / name).is_file()
                or helper.file_hash(data / name) != expected):
            raise RuntimeError('Database snapshot checksum differs')
    manifest = json.loads((files / 'manifest.json').read_text())
    if len(manifest) != 19:
        raise RuntimeError('Unexpected staged file inventory')
    for name, expected in manifest.items():
        if not re.fullmatch(r'[a-z0-9-]+', name) or (files / name).is_symlink() or not (files / name).is_dir():
            raise RuntimeError('Unexpected staged file root')
        helper.verify_tree(files / name, name, expected)
    root = STAGE / 'offsite-streaming-rehearsals' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    keyring = root / 'public-keyring'
    import_recipient(keyring, public_key, FINGERPRINT)
    archive = root / ('REHEARSAL-umsa-stream-' + identifier + '.tar.gz.gpg')
    paths = ['data-refreshes/' + helper.DATA_ID + '/' + name for name in sorted(hashes)]
    paths += ['data-refreshes/' + helper.DATA_ID + '/' + name for name in
              ('inventory.json', 'SHA256SUMS.json', 'REHEARSAL-ONLY')]
    paths += ['mutable-rehearsals/' + helper.FILES_ID]
    encrypted_archive(STAGE, paths, keyring, FINGERPRINT, archive)
    digest = helper.file_hash(archive)
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
           '-o', 'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-i', str(key)]
    remote = 'umbak@76.13.234.213'
    listing = subprocess.check_output(ssh + [remote, 'listar'], text=True)
    if helper.available_gb(listing) < 8 + math.ceil(archive.stat().st_size / 1024**3):
        raise RuntimeError('Offsite receiver must retain at least 8 GiB free')
    if any(line.split() and line.split()[-1] == archive.name for line in listing.splitlines()):
        raise RuntimeError('Offsite backup name already exists')
    subprocess.run(['rsync', '-a', '-e', shlex.join(ssh), str(archive),
                    remote + ':/opt/remote-backups/directus/'], check=True)
    listing = subprocess.check_output(ssh + [remote, 'listar'], text=True)
    matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
    if len(matches) != 1 or len(matches[0]) < 5 or matches[0][4] != str(archive.stat().st_size):
        raise RuntimeError('Offsite encrypted archive size could not be confirmed')
    (root / 'recovery.complete.json').write_text(json.dumps({
        'run': identifier, 'archive': archive.name, 'bytes': archive.stat().st_size, 'sha256': digest,
        'databases': helper.DATA_ID, 'files': helper.FILES_ID, 'public_key_fingerprint': FINGERPRINT,
        'offsite_size_confirmed': True, 'independent_hash_and_restore_pending': True,
        'final_cutover_snapshot': False}, indent=2) + '\n')
    print('Streaming-encrypted rehearsal snapshots sent offsite; independent recovery verification remains.')


if __name__ == '__main__':
    main(sys.argv[1])
