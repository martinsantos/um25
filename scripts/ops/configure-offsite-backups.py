#!/usr/bin/env python3
"""Point the off-site backup copies at the restricted umbak account and stop false successes.

Since 16/05 the root key was no longer accepted on the licitómetro server (76.13.234.213), and
since 17/10 its fail2ban banned this server, so nothing reached it. The new account only accepts
rsync uploads into /opt/remote-backups/{directus,sitrep}, `retener` and `listar`.
"""
import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path

ROOT = Path('/opt/scripts-cicd')
STAMP = '20261023'
EXPECTED = {
    'backup_directus.sh': 'ce22e2f8f1bc4fc38d94740bb8c96297f396ec3c0ce55de5bd2bfa88f966a690',
    'backup_sitrep.sh': 'eb72d27417e454b2328b99ddee1cc29e8d17d03400758b84d45e93cff55293c9',
    'verify_remote_backups.sh': 'cc3e3bd140757c1c0dcae73647ab18c4d25ded953a02ce35053461c6eafb7389',
}
VERIFY = '''#!/bin/bash
# Remote Backup Verification Script
# The umbak account on the remote only answers `listar` (no shell).

REMOTE_HOST=76.13.234.213
SSH_KEY=/root/.ssh/backup_sync_key

echo "=== Remote Backup Verification Report ==="
echo "Server: $REMOTE_HOST (licitómetro, cuenta umbak)"
echo "Date: $(date)"
echo ""
ssh -i $SSH_KEY -o BatchMode=yes umbak@$REMOTE_HOST listar
'''


def sha(data):
    return hashlib.sha256(data.encode()).hexdigest()


def replace_once(source, old, new, name):
    if source.count(old) != 1:
        raise RuntimeError('%s changed near %r; refusing patch' % (name, old[:40]))
    return source.replace(old, new)


def patch(name, source):
    if name == 'backup_directus.sh':
        return replace_once(source, '"root@$REMOTE_HOST:$REMOTE_DIR/"', '"umbak@$REMOTE_HOST:$REMOTE_DIR/"', name)
    if name == 'backup_sitrep.sh':
        source = replace_once(source, '  root@$REMOTE_HOST:$REMOTE_DIR/ 2>&1 | tee -a $LOG_FILE\n\nif [ $? -eq 0 ]; then',
                              '  umbak@$REMOTE_HOST:$REMOTE_DIR/ 2>&1 | tee -a $LOG_FILE\n\n'
                              '# $? was tee\'s status, so a failed rsync was reported as success.\n'
                              'if [ "${PIPESTATUS[0]}" -eq 0 ]; then', name)
        return replace_once(source, 'ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$REMOTE_HOST \\\n'
                                    '  "find $REMOTE_DIR -name \\"sitrep-db-*.sql.gz\\" -mtime +30 -delete" 2>&1',
                            'ssh -i $SSH_KEY -o BatchMode=yes umbak@$REMOTE_HOST retener 2>&1', name)
    if name == 'verify_remote_backups.sh':
        return VERIFY
    raise RuntimeError('Unexpected script ' + name)


def make_plan(root=ROOT):
    plan = {}
    for name, digest in sorted(EXPECTED.items()):
        path = root / name
        if path.is_symlink() or not path.is_file():
            raise RuntimeError('Script missing or replaced: ' + name)
        source = path.read_text()
        if sha(source) != digest:
            raise RuntimeError('Script differs from audited version: ' + name)
        patched = patch(name, source)
        subprocess.run(['bash', '-n'], input=patched, text=True, check=True)
        plan[name] = {'before_sha256': digest, 'after_sha256': sha(patched)}
    return plan


def backups_idle(root=ROOT):
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            tokens = (proc / 'cmdline').read_bytes().split(b'\0')
        except (FileNotFoundError, ProcessLookupError):
            continue
        if any(os.fsencode(str(root / name)) in tokens for name in EXPECTED):
            raise RuntimeError('A backup script is running; retry after it finishes')


def apply(plan, root=ROOT):
    backups_idle(root)
    for name, item in sorted(plan.items()):
        path = root / name
        source = path.read_text()
        if sha(source) != item['before_sha256']:
            raise RuntimeError('Script changed during maintenance: ' + name)
        previous = path.with_name(name + '.antes-umbak-' + STAMP)
        if previous.exists():
            raise RuntimeError('Recovery copy already exists; inspect first: ' + previous.name)
        status = path.stat()
        temporary = path.with_name('.' + name + '.umbak.tmp')
        for target, text in ((previous, source), (temporary, patch(name, source))):
            with target.open('x') as stream:
                stream.write(text)
            os.chmod(target, status.st_mode)
            os.chown(target, status.st_uid, status.st_gid)
        os.replace(temporary, path)
        subprocess.run(['bash', '-n', str(path)], check=True)
    return {name: sha((root / name).read_text()) for name in plan}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    plan = make_plan()
    digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    print(json.dumps({'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest, 'plan': plan}), flush=True)
    if not args.apply:
        return
    if args.expected_plan_sha != digest:
        raise RuntimeError('Plan fingerprint differs; nothing changed')
    print(json.dumps({'scripts_sha256': apply(plan)}), flush=True)


if __name__ == '__main__':
    main()
