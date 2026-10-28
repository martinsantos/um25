#!/usr/bin/env python3
"""Preserve the existing non-final migration snapshots in encrypted offsite storage.

No source services are touched and historical backups are not modified.  These
snapshots were made while the source was live and are not a final cutover.
"""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shlex
import shutil
import socket
import stat
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
DATA_ID = '40593506617-1'
FILES_ID = '40593832809-1'
LINKS = {
    'plan-docs': ('wiki', '../wiki'),
    'umsa-public-archive': ('imagenes_antecedentes_versionproduccion', '../imagenes_antecedentes_versionproduccion'),
}


def file_hash(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def verify_tree(root, name, expected):
    digest = hashlib.sha256()
    count = total = 0
    found_links = []
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root).as_posix()
        mode = path.lstat().st_mode
        if stat.S_ISLNK(mode):
            link = (relative, os.readlink(path))
            if LINKS.get(name) != link:
                raise RuntimeError('Unexpected link in archived staging tree')
            found_links.append(link)
            digest.update(b'link\0' + relative.encode() + b'\0' + link[1].encode())
        elif stat.S_ISREG(mode):
            digest.update(relative.encode() + b'\0' + bytes.fromhex(file_hash(path)))
            count += 1
            total += path.stat().st_size
        elif not stat.S_ISDIR(mode):
            raise RuntimeError('Unexpected special file in archived staging tree')
    if (found_links != ([LINKS[name]] if name in LINKS else [])
            or count != expected['files'] or total != expected['bytes']
            or digest.hexdigest() != expected['content_sha256']):
        raise RuntimeError('Staged file inventory changed since the rehearsal')


def available_gb(listing):
    matches = re.findall(r'^libre ([0-9]+) GB$', listing, re.MULTILINE)
    if len(matches) != 1:
        raise RuntimeError('Offsite free space could not be checked')
    return int(matches[0])


def encrypted_archive(base, paths, certificate, output):
    # The private recovery key is not present on the destination or receiver.
    with output.open('xb') as stream:
        priority = ['nice', '-n', '19'] + (['ionice', '-c3'] if shutil.which('ionice') else [])
        tar = subprocess.Popen(priority + ['tar', '-czf', '-', '-C', str(base), *paths], stdout=subprocess.PIPE)
        try:
            crypt = subprocess.Popen(['openssl', 'cms', '-encrypt', '-aes-256-cbc', '-binary', '-stream',
                                      '-outform', 'DER', str(certificate)], stdin=tar.stdout, stdout=stream)
        finally:
            tar.stdout.close()
        crypt_result = crypt.wait()
        tar_result = tar.wait()
        if crypt_result != 0 or tar_result != 0:
            raise RuntimeError('Encrypted archive creation failed')


def main(identifier):
    if not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier):
        raise ValueError('Invalid CI identifier')
    os.umask(0o077)
    data = STAGE / 'data-refreshes' / DATA_ID
    files = STAGE / 'mutable-rehearsals' / FILES_ID
    cert = Path(__file__).with_name('offsite-recovery-cert.pem')
    key = Path('/root/.ssh/umsa_offsite_20261027')
    known = STAGE / 'backup-known-hosts'
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or any(path.is_symlink() or not path.is_file() for path in
                   (data / 'refresh.complete', data / 'REHEARSAL-ONLY', data / 'SHA256SUMS.json',
                    files / 'transfer.complete', files / 'REHEARSAL-ONLY', files / 'manifest.json',
                    cert, key, known, STAGE / 'backup-identity.prepared'))
            or data.is_symlink() or files.is_symlink() or shutil.disk_usage(STAGE).free < 10 * 1024**3):
        raise RuntimeError('Reviewed recovery inputs, identity, or target capacity are unavailable')
    hashes = json.loads((data / 'SHA256SUMS.json').read_text())
    if not hashes or 'mariadb.sql' not in hashes or 'dge-demo-db-dge_demo.dump' not in hashes:
        raise RuntimeError('Expected database snapshots are missing')
    for name, expected in hashes.items():
        if not re.fullmatch(r'[A-Za-z0-9_.-]+', name) or not re.fullmatch(r'[0-9a-f]{64}', expected):
            raise RuntimeError('Unexpected snapshot checksum entry')
        path = data / name
        if path.is_symlink() or not path.is_file() or file_hash(path) != expected:
            raise RuntimeError('Database snapshot checksum differs')
    manifest = json.loads((files / 'manifest.json').read_text())
    if len(manifest) != 19:
        raise RuntimeError('Unexpected staged file inventory')
    for name, expected in manifest.items():
        if not re.fullmatch(r'[a-z0-9-]+', name) or (files / name).is_symlink() or not (files / name).is_dir():
            raise RuntimeError('Unexpected staged file root')
        verify_tree(files / name, name, expected)
    root = STAGE / 'offsite-encrypted-rehearsals' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    archive = root / ('REHEARSAL-umsa-all-' + identifier + '.tar.gz.cms')
    paths = ['data-refreshes/' + DATA_ID + '/' + name for name in sorted(hashes)]
    paths += ['data-refreshes/' + DATA_ID + '/' + name for name in
              ('inventory.json', 'SHA256SUMS.json', 'REHEARSAL-ONLY')]
    paths += ['mutable-rehearsals/' + FILES_ID]
    encrypted_archive(STAGE, paths, cert, archive)
    digest = file_hash(archive)
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
           '-o', 'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-i', str(key)]
    remote = 'umbak@76.13.234.213'
    listing = subprocess.check_output(ssh + [remote, 'listar'], text=True)
    if available_gb(listing) < 8 + math.ceil(archive.stat().st_size / 1024**3):
        raise RuntimeError('Offsite receiver must retain at least 8 GiB free')
    if any(line.split() and line.split()[-1] == archive.name for line in listing.splitlines()):
        raise RuntimeError('Offsite backup name already exists')
    subprocess.run(['rsync', '-a', '-e', shlex.join(ssh), str(archive),
                    remote + ':/opt/remote-backups/directus/'], check=True)
    listing = subprocess.check_output(ssh + [remote, 'listar'], text=True)
    matches = [line.split() for line in listing.splitlines() if line.split() and line.split()[-1] == archive.name]
    if len(matches) != 1 or len(matches[0]) < 5 or matches[0][4] != str(archive.stat().st_size):
        raise RuntimeError('Offsite encrypted archive size could not be confirmed')
    receipt = {'run': identifier, 'archive': archive.name, 'bytes': archive.stat().st_size,
               'sha256': digest, 'databases': DATA_ID, 'files': FILES_ID,
               'offsite_size_confirmed': True, 'independent_hash_and_restore_pending': True,
               'final_cutover_snapshot': False}
    (root / 'recovery.complete.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('Encrypted rehearsal snapshots sent offsite; independent hash and recovery checks remain.')


if __name__ == '__main__':
    main(sys.argv[1])
