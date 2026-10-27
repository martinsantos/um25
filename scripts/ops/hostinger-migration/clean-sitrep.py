#!/usr/bin/env python3
"""Rebuild dependencies in ephemeral CI from independently verified release files."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile
import tempfile

REVISION = '8fb6277ecabaace83671a9dfb251147a43c9ccbf'
PACKAGES = {
    'backend': '7bb435e0ed1313ce7f5a119fd8531c6572f048e487f81e352d7c46937f76fc61',
    'web': 'a8cda6de69c8a106b189a976a966da2bce7caa102eff49fcda0ba4c1dee784bc',
    'app': '9c18ceefd174a1d4408c3ed29d2543965d123d95b3adce4b53d6bcd8623fa542',
    'client': '35c75fdd71185d69f9dec794680fe30ad1066f2bd7954aa21e2cd39546262145',
}
TARGET = 'root@179.198.115.115'
STAGE = '/srv/umsa-migration'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def validate_members(members):
    if len(members) > 5000:
        raise ValueError('Unexpected release size')
    total = 0
    names = set()
    for member in members:
        path = PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
            raise ValueError('Unsafe release member')
        if str(path) in names:
            raise ValueError('Duplicate release member')
        names.add(str(path))
        total += member.size
    if total > 1024 * 1024 * 1024:
        raise ValueError('Unexpected expanded release size')


def extract_verified(archive, expected, destination):
    if digest(archive) != expected:
        raise ValueError('Independent release checksum mismatch')
    destination.mkdir()
    with tarfile.open(archive) as stream:
        members = stream.getmembers()
        validate_members(members)
        stream.extractall(destination, members=members, filter='data')


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('GITHUB_REF') != 'refs/heads/master':
        raise RuntimeError('Run only from reviewed master in GitHub Actions')
    os.umask(0o077)
    known = Path(__file__).with_name('known_hosts').resolve()
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', f'UserKnownHostsFile={known}']
    def run(args, **kwargs):
        return subprocess.run(args, check=True, **kwargs)
    hostname = subprocess.check_output(['ssh', *options, TARGET, 'hostname'], text=True).strip()
    if hostname != 'srv2101069.hstgr.cloud':
        raise RuntimeError('Wrong target')
    root = Path(tempfile.mkdtemp(prefix='sitrep-clean-', dir=os.environ['RUNNER_TEMP']))
    for name, expected in PACKAGES.items():
        filename = f'sitrep-{name}.tar.gz'
        run(['scp', *options, f'{TARGET}:{STAGE}/source/var/backups/sitrep/20261024-producto-8fb6277e/{filename}', str(root / filename)])
        extract_verified(root / filename, expected, root / name)
    backend = root / 'backend'
    # Locked package integrity is verified by npm; no package lifecycle scripts run.
    run(['npm', 'ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], cwd=backend)
    client = backend / 'node_modules/.prisma/client'
    if client.exists():
        raise RuntimeError('Unexpected generated client after script-free installation')
    client.parent.mkdir(exist_ok=True)
    shutil.copytree(root / 'client', client)
    run(['node', '--check', 'dist/index.js'], cwd=backend)
    run(['node', '-e', "const p=require('@prisma/client');if(typeof p.PrismaClient!=='function')process.exit(1);require('sharp')({create:{width:1,height:1,channels:3,background:'#fff'}}).png().toBuffer().then(b=>{if(!b.length)process.exit(1)})"], cwd=backend)
    provenance = dict(source_revision=REVISION, original_packages=PACKAGES,
        dependencies='fresh npm ci --omit=dev --ignore-scripts',
        github_run=os.environ['GITHUB_RUN_ID'], code='independent pre-existing release manifest verified')
    (root / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    archive = root / 'clean-sitrep.tar.gz'
    with tarfile.open(archive, 'w:gz') as stream:
        for name in ('backend', 'web', 'app', 'provenance.json'):
            stream.add(root / name, arcname=name)
    expected = digest(archive)
    destination = f'{STAGE}/trusted/sitrep-{REVISION}'
    run(['ssh', *options, TARGET, f'test ! -e {destination} && install -d -m 0700 {destination}'])
    run(['scp', *options, str(archive), f'{TARGET}:{destination}/package.tar.gz'])
    # The uploaded archive was assembled in clean CI, never in the old server.
    command = f'''set -eu
test "$(hostname)" = srv2101069.hstgr.cloud
test "$(cat {STAGE}/.target)" = 179.198.115.115
cd {destination}
printf '%s  package.tar.gz\\n' {expected} | sha256sum --check
mkdir application
tar --no-same-owner -xzf package.tar.gz -C application
printf '%s\\n' {expected} > archive.sha256
printf '%s\\n' {destination} > {STAGE}/trusted-sitrep
'''
    run(['ssh', *options, TARGET, 'bash', '-s'], input=command, text=True)
    print('SITREP verified release and fresh dependencies staged; no application activated.')


if __name__ == '__main__':
    main()
