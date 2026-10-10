#!/usr/bin/env python3
"""Use XFS copy-on-write clones in retained and failed runtime copies."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

SOURCE = Path('/root/fumbling-field/dist/client')
BACKUPS = Path('/root/fumbling-field/backups')


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for data in iter(lambda: stream.read(1048576), b''):
            h.update(data)
    return h.hexdigest()


def signature(path):
    s = path.stat()
    return [s.st_ino, s.st_size, s.st_mtime_ns, s.st_mode, s.st_uid, s.st_gid]


def select(source, backups):
    targets = []
    cached = {}
    for release in sorted(backups.iterdir()):
        if release.is_symlink() or not re.fullmatch(r'umsa-campaign-[0-9]+-[0-9]+', release.name):
            continue
        # Rollback leaves failed-dist; incoming-dist can still be staging.
        for name in ('previous-dist', 'failed-dist'):
            root = release / name / 'client'
            if root.resolve() != root or not root.is_dir():
                continue
            for path in sorted(root.rglob('*')):
                if path.is_symlink() or not path.is_file() or path.resolve() != path:
                    continue
                original = source / path.relative_to(root)
                if not original.is_file() or original.is_symlink() or original.resolve() != original:
                    continue
                before, current = signature(path), signature(original)
                if before[1] < 65536 or before[1] != current[1] or before[0] == current[0]:
                    continue
                if path.stat().st_dev != original.stat().st_dev:
                    continue
                if str(original) not in cached:
                    cached[str(original)] = sha(original)
                digest = cached[str(original)]
                if sha(path) != digest or signature(path) != before or signature(original) != current:
                    continue
                targets.append({'path': str(path), 'source': str(original), 'sha256': digest,
                                'target_signature': before, 'source_signature': current})
    return targets


def compact(target, copier=None):
    path, original = Path(target['path']), Path(target['source'])
    if path.is_symlink() or original.is_symlink() or path.resolve() != path or original.resolve() != original:
        raise RuntimeError('Asset path changed')
    if signature(path) != target['target_signature'] or signature(original) != target['source_signature']:
        raise RuntimeError('Asset changed since audit')
    if sha(path) != target['sha256'] or sha(original) != target['sha256']:
        raise RuntimeError('Content changed since audit')
    descriptor, name = tempfile.mkstemp(prefix='.um-reflink-', dir=path.parent)
    os.close(descriptor)
    temporary = Path(name)
    try:
        if copier is None:
            subprocess.run(['cp', '--reflink=always', '--preserve=all', '--', str(original), str(temporary)], check=True)
        else:
            copier(original, temporary)
        if sha(temporary) != target['sha256']:
            raise RuntimeError('Cloned content differs')
        os.chown(temporary, target['target_signature'][4], target['target_signature'][5])
        shutil.copystat(path, temporary)
        if signature(path) != target['target_signature']:
            raise RuntimeError('Backup changed during clone')
        os.replace(temporary, path)
        if sha(path) != target['sha256']:
            raise RuntimeError('Backup content verification failed')
    finally:
        if temporary.exists():
            temporary.unlink()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    targets = select(SOURCE, BACKUPS)
    plan = {'source_inode': SOURCE.stat().st_ino, 'targets': targets}
    digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    print(json.dumps({'plan_sha256': digest, 'target_count': len(targets),
                      'bytes_identical': sum(t['target_signature'][1] for t in targets), 'plan': plan}), flush=True)
    if not args.apply:
        return
    if args.expected_plan_sha != digest:
        raise RuntimeError('Plan changed; no backup modified')
    before = shutil.disk_usage(BACKUPS).free
    for target in targets:
        if SOURCE.stat().st_ino != plan['source_inode']:
            raise RuntimeError('Runtime changed; retry after deployment')
        compact(target)
    print(json.dumps({'compacted_files': len(targets), 'bytes_reclaimed': shutil.disk_usage(BACKUPS).free - before,
                      'all_backup_contents_verified': True}))


if __name__ == '__main__':
    main()
