#!/usr/bin/env python3
"""Remove two audited, unreferenced backups and stop health-marker duplicates."""
import argparse
import hashlib
import json
import os
import subprocess
import time
from pathlib import Path

ROOT = Path('/opt/directus-backups')
SCRIPT = Path('/opt/scripts-cicd/backup_directus.sh')
SCRIPT_SHA = '0582f5cfd36dfbdcb8987161ec4f8a749e8d26d9016589b1437cd02d6d5dc282'
KEEP = 'directus-uploads-20260711-221307.tar.gz'
DUPLICATE = 'directus-uploads-20260630-020001.tar.gz'
INVALID = 'directus-uploads-20260711-020001.tar.gz.INVALID-TRUNCATED'
EXPECTED = {
    KEEP: '81dbad3c5b88ff8aa0482ce0b6a938be1aa30dff051a3a5a3e820e75987ba226',
    DUPLICATE: '81dbad3c5b88ff8aa0482ce0b6a938be1aa30dff051a3a5a3e820e75987ba226',
    INVALID: '5b7053bcd49f291883ad99a6a65fb3ffac34ee6d03cfffe4bb93d30a13a16df7',
}
LOOP = "for path in sorted(item for item in root.rglob('*') if item.is_file()):\n"


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            h.update(chunk)
    return h.hexdigest()


def patch_script(source):
    if source.count(LOOP) != 1:
        raise RuntimeError('Fingerprint function changed; refusing patch')
    return source.replace(LOOP, LOOP +
        "    if root.name == 'uploads' and path.relative_to(root).as_posix() == 'directus-health-file':\n"
        "        continue  # Directus liveness probe is not business content.\n")


def verify_references(root, names):
    metadata = set(root.glob('directus-checkpoint-*.txt')) | set(root.glob('*.state')) | set(root.glob('*.sha256'))
    for path in metadata:
        if any(name in path.read_text() for name in names):
            raise RuntimeError('Backup still referenced by ' + path.name)


def verify_files(root, expected):
    for name, digest in expected.items():
        path = root / name
        if path.is_symlink() or not path.is_file() or path.resolve() != path or sha(path) != digest:
            raise RuntimeError('Audited backup changed: ' + name)


def ensure_backup_idle():
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            command = (proc / 'cmdline').read_bytes().split(b'\0')
            if any(token == os.fsencode(SCRIPT) for token in command):
                raise RuntimeError('Backup is running; retry after completion')
        except (FileNotFoundError, ProcessLookupError):
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    if SCRIPT.is_symlink() or sha(SCRIPT) != SCRIPT_SHA:
        raise RuntimeError('Backup script differs from audited version')
    patched = patch_script(SCRIPT.read_text())
    subprocess.run(['bash', '-n'], input=patched, text=True, check=True)
    verify_files(ROOT, EXPECTED)
    verify_references(ROOT, (DUPLICATE, INVALID))
    subprocess.run(['gzip', '-t', str(ROOT / KEEP)], check=True)
    if subprocess.run(['gzip', '-t', str(ROOT / INVALID)], capture_output=True).returncode == 0:
        raise RuntimeError('Quarantined backup is readable; reassess before deleting')
    plan = {'script_before_sha256': SCRIPT_SHA,
            'script_after_sha256': hashlib.sha256(patched.encode()).hexdigest(),
            'keep': {'file': KEEP, 'sha256': EXPECTED[KEEP]},
            'remove': [{'file': n, 'sha256': EXPECTED[n], 'inode': (ROOT / n).stat().st_ino,
                        'bytes': (ROOT / n).stat().st_size} for n in (DUPLICATE, INVALID)]}
    digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    print(json.dumps({'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest, 'plan': plan}), flush=True)
    if not args.apply:
        return
    if args.expected_plan_sha != digest:
        raise RuntimeError('Plan fingerprint differs; nothing changed')
    ensure_backup_idle()
    databases = sorted(ROOT.glob('directus-db-*.sql.gz'))
    if not databases or time.time() - databases[-1].stat().st_mtime > 86400:
        raise RuntimeError('A fresh database backup is required')
    subprocess.run(['gzip', '-t', str(databases[-1])], check=True)
    previous = SCRIPT.with_name(SCRIPT.name + '.before-health-dedup-20261008')
    if previous.exists():
        raise RuntimeError('Script recovery copy already exists; inspect first')
    temporary = SCRIPT.with_name('.backup_directus.sh.health-dedup.tmp')
    stat = SCRIPT.stat()
    with previous.open('xb') as stream:
        stream.write(SCRIPT.read_bytes())
    os.chmod(previous, stat.st_mode)
    os.chown(previous, stat.st_uid, stat.st_gid)
    with temporary.open('x') as stream:
        stream.write(patched)
    os.chmod(temporary, stat.st_mode)
    os.chown(temporary, stat.st_uid, stat.st_gid)
    if sha(SCRIPT) != SCRIPT_SHA:
        raise RuntimeError('Backup script changed during maintenance')
    os.replace(temporary, SCRIPT)
    ensure_backup_idle()
    verify_references(ROOT, (DUPLICATE, INVALID))
    for target in plan['remove']:
        path = ROOT / target['file']
        if path.is_symlink() or path.stat().st_ino != target['inode'] or sha(path) != target['sha256']:
            raise RuntimeError('Removal target changed')
        path.unlink()
    subprocess.run(['bash', '-n', str(SCRIPT)], check=True)
    print(json.dumps({'removed_bytes': sum(t['bytes'] for t in plan['remove']),
                      'retained_archive': KEEP, 'script_sha256': sha(SCRIPT),
                      'recovery_script': str(previous)}))


if __name__ == '__main__':
    main()
