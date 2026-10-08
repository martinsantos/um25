#!/usr/bin/env python3
"""Audit and remove reproducible dependencies from inactive release folders."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path

ROOTS = (
    '/var/www/sitrep-backend-release-candidates',
    '/var/www/sitrep-backend-releases',
    '/var/www/sitrep-releases',
    '/var/www/umbot-aceite/releases',
    '/opt/gestion-vivero/releases',
)
ALIASES = ('/var/www/sitrep', '/var/www/sitrep-backend',
           '/var/www/umbot-aceite/current', '/opt/gestion-vivero/current')

def within(path, parent):
    return path == parent or parent in path.parents

def protected_paths():
    paths = {Path(p).resolve() for p in ALIASES if Path(p).exists()}
    containers = subprocess.check_output(['docker', 'ps', '-q'], text=True).split()
    if containers:
        for container in json.loads(subprocess.check_output(['docker', 'inspect', *containers], text=True)):
            paths.update(Path(m['Source']).resolve() for m in container['Mounts'] if m.get('Source'))
    nginx = subprocess.run(['nginx', '-T'], check=True, capture_output=True, text=True)
    paths.update(Path(p).resolve() for p in re.findall(r'^\s*(?:root|alias)\s+(/[^;\s]+)\s*;', nginx.stdout, re.M))
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            paths.add((proc / 'cwd').resolve(strict=True))
            for token in (proc / 'cmdline').read_bytes().split(b'\0'):
                if token.startswith(b'/'):
                    paths.add(Path(os.fsdecode(token)).resolve())
            for descriptor in (proc / 'fd').iterdir():
                try:
                    paths.add(descriptor.resolve(strict=True))
                except (OSError, RuntimeError):
                    pass
        except (FileNotFoundError, ProcessLookupError):
            pass
        except PermissionError as error:
            raise RuntimeError('Cannot inspect a process; refusing cleanup') from error
    return paths

def has_mount(target):
    mounts = Path('/proc/self/mountinfo').read_text().splitlines()
    return any(within(Path(line.split()[4].replace('\\040', ' ')), target) for line in mounts)

def hash_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()

def select_targets(roots, protected, now=None):
    now = time.time() if now is None else now
    targets = []
    for directory in roots:
        root = Path(directory)
        if not root.is_dir() or root.is_symlink():
            continue
        releases = sorted(p for p in root.iterdir() if p.is_dir()
                          and not p.is_symlink() and re.fullmatch(r'[0-9]{8}[0-9A-Za-z._-]*', p.name))
        keep = set(releases[-2:])
        for release in releases:
            target = release / 'node_modules'
            if release in keep or now - release.stat().st_mtime < 7 * 86400:
                continue
            if any(within(path, release) for path in protected):
                continue
            if not target.is_dir() or target.is_symlink() or target.resolve() != target:
                continue
            if os.path.ismount(target) or has_mount(target) or target.stat().st_dev != root.stat().st_dev:
                continue
            lock = release / 'package-lock.json'
            if not lock.is_file() or not (release / 'package.json').is_file() or not (target / '.package-lock.json').is_file():
                continue
            usage = subprocess.check_output(['du', '-sk', str(target)], text=True).split()[0]
            targets.append({'path': str(target), 'release': str(release),
                            'bytes_estimated': int(usage) * 1024,
                            'inode': target.stat().st_ino,
                            'lock_sha256': hash_file(lock)})
    return targets

def plan_sha(targets):
    identity = [{k: target[k] for k in ('path', 'inode', 'lock_sha256')} for target in targets]
    return hashlib.sha256(json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def retained_snapshot(releases):
    result = {}
    for release in releases:
        for root, dirs, files in os.walk(release, followlinks=False):
            dirs[:] = [name for name in dirs if Path(root, name) != release / 'node_modules']
            for name in dirs:
                path = Path(root, name)
                if path.is_symlink():
                    result[str(path)] = 'symlink:' + os.readlink(path)
            for name in files:
                path = Path(root, name)
                if path.is_symlink():
                    result[str(path)] = 'symlink:' + os.readlink(path)
                else:
                    result[str(path)] = hash_file(path)
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    protected = protected_paths()
    targets = select_targets(ROOTS, protected)
    digest = plan_sha(targets)
    report = {'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest,
              'reclaimable_bytes_estimated': sum(t['bytes_estimated'] for t in targets),
              'target_count': len(targets), 'targets': targets}
    print(json.dumps(report, indent=2), flush=True)
    if not args.apply:
        return
    if not re.fullmatch(r'[0-9a-f]{64}', args.expected_plan_sha) or args.expected_plan_sha != digest:
        raise RuntimeError('Plan changed or approval fingerprint missing; nothing removed')
    # Database backups must be current and readable before any maintenance.
    backups = sorted(Path('/opt/directus-backups').glob('directus-db-*.sql.gz'))
    if not backups or time.time() - backups[-1].stat().st_mtime > 86400:
        raise RuntimeError('Fresh Directus backup required; nothing removed')
    subprocess.run(['gzip', '-t', str(backups[-1])], check=True)
    for target in targets:
        inventory = Path(target['release']) / '.retained-node-modules-lock.json'
        source = Path(target['path']) / '.package-lock.json'
        if inventory.exists() and hash_file(inventory) != hash_file(source):
            raise RuntimeError('Existing dependency inventory differs; stopping')
        if not inventory.exists():
            with inventory.open('xb') as stream:
                stream.write(source.read_bytes())
    releases = {Path(t['release']) for t in targets}
    before = retained_snapshot(releases)
    receipt = Path('/tmp') / ('cold-dependency-retention-' + digest + '.json')
    receipt.write_text(json.dumps({'plan': report, 'retained_sha256': before}, indent=2))
    for target in targets:
        path = Path(target['path'])
        release = Path(target['release'])
        if path.is_symlink() or path.resolve() != path or path.stat().st_ino != target['inode'] or has_mount(path):
            raise RuntimeError('Target changed; stopping')
        if hash_file(release / 'package-lock.json') != target['lock_sha256']:
            raise RuntimeError('Package lock changed; stopping')
        if any(within(active, release) for active in protected_paths()):
            raise RuntimeError('Release became active; stopping')
        shutil.rmtree(path)
    if retained_snapshot(releases) != before:
        raise RuntimeError('Retained files changed; inspect receipt ' + str(receipt))
    print(json.dumps({'removed': len(targets), 'retained_files_verified': len(before), 'receipt': str(receipt)}))

if __name__ == '__main__':
    main()
