#!/usr/bin/env python3
"""Use XFS copy-on-write clones in retained and failed runtime copies."""
import argparse
import fcntl
import hashlib
import json
import os
import re
import shutil
import subprocess
import struct
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



# Three existing gzip archives, independently audited on 2026-10-10.
# Their complete bytes differ; only identical aligned ranges may share storage.
ARCHIVE_ROOT = Path('/opt/directus-backups')
ARCHIVES = {
    'directus-uploads-20260713-020002.tar.gz': 'cc40274797180683a8d91cce502d9ff502abb6be3758adfb5f6f874e8dab746d',
    'directus-uploads-20260714-020001.tar.gz': 'df02957c94122748af26ab82ef2fc25475904cb561a346bb49c793966cc56546',
    'directus-uploads-20260923-020001.tar.gz': '8a3e90b913c8140fd41fd31074c7ec59322349aae2894c52253d13bed6c91d46',
}
ARCHIVE_CHUNK = 1024 * 1024
# Linux include/uapi/linux/fs.h: _IOWR(0x94, 54, struct file_dedupe_range).
FIDEDUPERANGE = 0xC0189436


def verify_archives(plan):
    root = Path(plan['root'])
    if root.is_symlink() or root.resolve() != root or root.stat().st_ino != plan['root_inode']:
        raise RuntimeError('Archive directory changed')
    for item in plan['archives']:
        path = root / item['name']
        if path.is_symlink() or not path.is_file() or path.resolve() != path:
            raise RuntimeError('Archive path changed')
        if path.stat().st_dev != root.stat().st_dev or signature(path) != item['signature']:
            raise RuntimeError('Archive metadata changed')
        if sha(path) != item['sha256'] or signature(path) != item['signature']:
            raise RuntimeError('Archive bytes changed')


def select_archive_ranges(root, expected=ARCHIVES):
    root = Path(root)
    if root.is_symlink() or root.resolve() != root:
        raise RuntimeError('Archive directory is indirect')
    archives = []
    for name, digest in sorted(expected.items()):
        path = root / name
        if path.is_symlink() or not path.is_file() or path.resolve() != path:
            raise RuntimeError('Audited archive is unavailable: ' + name)
        archives.append({'name': name, 'sha256': digest, 'signature': signature(path)})
    plan = {'root': str(root), 'root_inode': root.stat().st_ino,
            'archives': archives, 'source': archives[-1]['name'], 'targets': []}
    verify_archives(plan)
    original = root / plan['source']
    for item in archives[:-1]:
        path = root / item['name']
        if path.stat().st_size != original.stat().st_size:
            raise RuntimeError('Audited archive sizes differ')
        limit = path.stat().st_size // 4096 * 4096
        ranges = []
        with original.open('rb') as current, path.open('rb') as previous:
            for offset in range(0, limit, ARCHIVE_CHUNK):
                length = min(ARCHIVE_CHUNK, limit - offset)
                if current.read(length) != previous.read(length):
                    continue
                if ranges and ranges[-1][0] + ranges[-1][1] == offset:
                    ranges[-1][1] += length
                else:
                    ranges.append([offset, length])
        if ranges:
            plan['targets'].append({'name': item['name'], 'ranges': ranges})
    verify_archives(plan)
    return plan


def dedupe_archive_ranges(plan, ioctl=None):
    verify_archives(plan)
    root = Path(plan['root'])
    for item in plan['archives']:
        subprocess.run(['gzip', '-t', str(root / item['name'])], check=True)
    verify_archives(plan)
    before = shutil.disk_usage(root).free
    ioctl = fcntl.ioctl if ioctl is None else ioctl
    source_fd = os.open(root / plan['source'], os.O_RDONLY | os.O_NOFOLLOW)
    shared = 0
    calls = 0
    snapshots = {item['name']: item['signature'] for item in plan['archives']}
    def verify_descriptor(descriptor, name):
        value = os.fstat(descriptor)
        actual = [value.st_ino, value.st_size, value.st_mtime_ns,
                  value.st_mode, value.st_uid, value.st_gid]
        if actual != snapshots[name]:
            raise RuntimeError('Opened archive differs from audited inode')
    try:
        verify_descriptor(source_fd, plan['source'])
        for target in plan['targets']:
            destination_fd = os.open(root / target['name'], os.O_RDWR | os.O_NOFOLLOW)
            try:
                verify_descriptor(destination_fd, target['name'])
                for start, total in target['ranges']:
                    for offset in range(start, start + total, ARCHIVE_CHUNK):
                        length = min(ARCHIVE_CHUNK, start + total - offset)
                        # 24-byte header followed by one 32-byte destination.
                        request = bytearray(struct.pack('=QQHHIqQQiI', offset, length,
                            1, 0, 0, destination_fd, offset, 0, 0, 0))
                        ioctl(source_fd, FIDEDUPERANGE, request, True)
                        deduped, status = struct.unpack_from('=Qi', request, 40)
                        if status != 0 or deduped != length:
                            raise RuntimeError('Kernel refused an exact range: ' + str(status))
                        shared += deduped
                        calls += 1
            finally:
                os.close(destination_fd)
    finally:
        os.close(source_fd)
    verify_archives(plan)
    for item in plan['archives']:
        subprocess.run(['gzip', '-t', str(root / item['name'])], check=True)
    return {'archive_count': len(plan['archives']), 'kernel_verified_ranges': calls,
            'bytes_shared': shared, 'bytes_reclaimed': shutil.disk_usage(root).free - before,
            'all_archive_bytes_verified': True, 'all_archive_metadata_verified': True}


def archive_main(args):
    plan = select_archive_ranges(ARCHIVE_ROOT)
    digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    print(json.dumps({'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest,
                      'bytes_identical': sum(length for target in plan['targets']
                                             for _, length in target['ranges']),
                      'plan': plan}), flush=True)
    if args.apply:
        if args.expected_plan_sha != digest:
            raise RuntimeError('Archive plan changed; no storage modified')
        print(json.dumps(dedupe_archive_ranges(plan)), flush=True)


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
    parser.add_argument('--archive-ranges', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    if args.archive_ranges:
        archive_main(args)
        return
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
