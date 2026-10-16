#!/usr/bin/env python3
"""Remove inactive, reproducible download caches; never application dependencies."""
import argparse
import hashlib
import json
import os
import shutil
import stat
import subprocess
import time
from pathlib import Path

CACHES = ('/root/.npm/_cacache', '/root/.npm/_npx', '/root/.cache/pip', '/root/.cache/prisma', '/var/cache/dnf')
INSTALLERS = {'npm', 'npx', 'pip', 'pip3', 'dnf', 'yum', 'prisma'}
MIN_AGE = 3600


def within(path, parent):
    return path == parent or parent in path.parents


def engine_override_paths(environment, working_directory):
    keys = {b'PRISMA_QUERY_ENGINE_BINARY', b'PRISMA_QUERY_ENGINE_LIBRARY', b'PRISMA_SCHEMA_ENGINE_BINARY'}
    paths = {Path(os.fsdecode(value)) for entry in environment.split(b'\0')
            for key, separator, value in [entry.partition(b'=')]
            if separator and key in keys and value}
    return {p if p.is_absolute() else (working_directory / p).resolve() for p in paths}


def inspect_protection():
    protected = set()
    busy = False
    containers = subprocess.check_output(['docker', 'ps', '-q'], text=True).split()
    if containers:
        data = json.loads(subprocess.check_output(['docker', 'inspect', *containers], text=True))
        protected.update(Path(m['Source']).resolve() for c in data for m in c['Mounts'] if m.get('Source'))
    nginx = subprocess.run(['nginx', '-T'], check=True, capture_output=True, text=True)
    import re
    protected.update(Path(p).resolve() for p in re.findall(r'^\s*(?:root|alias)\s+(/[^;\s]+)\s*;', nginx.stdout, re.M))
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            process_paths = set()
            tokens = (proc / 'cmdline').read_bytes().split(b'\0')
            busy |= any(os.fsdecode(t).rsplit('/', 1)[-1] in INSTALLERS for t in tokens)
            busy |= b'generate' in tokens and any(b'/prisma/' in t for t in tokens)
            try:
                process_paths.update(engine_override_paths((proc / 'environ').read_bytes(), (proc / 'cwd').resolve(strict=True)))
            except (FileNotFoundError, ProcessLookupError):
                pass
            for token in tokens:
                if token.startswith(b'/'):
                    process_paths.add(Path(os.fsdecode(token)))
                    process_paths.add(Path(os.fsdecode(token)).resolve())
            for item in ('cwd', 'exe'):
                try:
                    process_paths.add((proc / item).resolve(strict=True))
                except FileNotFoundError:
                    pass
            for line in (proc / 'maps').read_text().splitlines():
                fields = line.split(None, 5)
                if len(fields) == 6 and fields[5].startswith('/'):
                    process_paths.add(Path(fields[5].removesuffix(' (deleted)')).resolve())
            for fd in (proc / 'fd').iterdir():
                try:
                    process_paths.add(fd.resolve(strict=True))
                except (FileNotFoundError, RuntimeError):
                    pass
            # Merely working in /root does not mean a process uses its caches.
            protected.update(p for p in process_paths if any(within(p, Path(c)) for c in CACHES))
        except (FileNotFoundError, ProcessLookupError):
            pass
        except PermissionError as error:
            raise RuntimeError('Cannot inspect every process; refusing cleanup') from error
    # A direct reference in a service or cron job makes the cache persistent.
    configs = list(Path('/etc/systemd/system').rglob('*')) + list(Path('/etc/cron.d').glob('*'))
    configs += list(Path('/var/spool/cron').glob('*'))
    if Path('/etc/crontab').exists():
        configs.append(Path('/etc/crontab'))
    for config in configs:
        if config.is_file() and config.stat().st_size < 4 * 1024 * 1024:
            content = config.read_text(errors='replace')
            protected.update(Path(c) for c in CACHES if c in content)
    return protected, busy


def has_mount(path):
    return any(within(Path(line.split()[4].replace('\\040', ' ')), path)
               for line in Path('/proc/self/mountinfo').read_text().splitlines())


def identity(path):
    info = path.lstat()
    return [info.st_ino, info.st_size, info.st_mtime_ns, info.st_mode, info.st_uid, info.st_gid, info.st_dev]


def inventory(path):
    root = identity(path)
    records = []
    for directory, dirs, files in os.walk(path, followlinks=False):
        for name in sorted(dirs + files):
            item = Path(directory, name)
            info = item.lstat()
            if item.is_symlink():
                if not within(item.resolve(), path):
                    raise RuntimeError('Cache contains an indirect or special entry')
                records.append([str(item.relative_to(path)), *identity(item), os.readlink(item)])
                continue
            if info.st_dev != root[-1] or not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
                raise RuntimeError('Cache contains an indirect or special entry')
            records.append([str(item.relative_to(path)), *identity(item)])
    digest = hashlib.sha256(json.dumps(sorted(records), separators=(',', ':')).encode()).hexdigest()
    return {'identity': root, 'inventory_sha256': digest, 'entries': len(records)}


def select(caches, protected, busy=False, now=None):
    if busy:
        return []
    now = time.time() if now is None else now
    targets = []
    for value in caches:
        path = Path(value)
        if path.is_symlink() or not path.is_dir() or path.resolve() != path:
            continue
        if now - path.stat().st_mtime < MIN_AGE or has_mount(path):
            continue
        if any(within(p, path) or within(path, p) for p in protected):
            continue
        snapshot = inventory(path)
        if snapshot['entries']:
            size = int(subprocess.check_output(['du', '-sk', str(path)], text=True).split()[0]) * 1024
            targets.append({'path': str(path), 'bytes_estimated': size, **snapshot})
    return targets


def fingerprint(targets):
    return hashlib.sha256(json.dumps(targets, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def verify(target):
    path = Path(target['path'])
    if path.is_symlink() or path.resolve() != path or has_mount(path):
        raise RuntimeError('Cache became indirect or mounted')
    expected = {key: target[key] for key in ('identity', 'inventory_sha256', 'entries')}
    if inventory(path) != expected:
        raise RuntimeError('Cache changed since audit; refusing cleanup')


def clear(target):
    verify(target)
    path = Path(target['path'])
    original = target['identity']
    shutil.rmtree(path)
    path.mkdir(mode=stat.S_IMODE(original[3]))
    os.chmod(path, stat.S_IMODE(original[3]))
    os.chown(path, original[4], original[5])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    protected, busy = inspect_protection()
    targets = select(CACHES, protected, busy)
    digest = fingerprint(targets)
    plan = {'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest,
            'installer_active': busy, 'target_count': len(targets),
            'bytes_estimated': sum(t['bytes_estimated'] for t in targets), 'targets': targets}
    print(json.dumps(plan), flush=True)
    if not args.apply:
        return
    if args.expected_plan_sha != digest or busy:
        raise RuntimeError('Plan changed or installer active; nothing removed')
    backups = sorted(Path('/opt/directus-backups').glob('directus-db-*.sql.gz'))
    if not backups or time.time() - backups[-1].stat().st_mtime > 86400:
        raise RuntimeError('Fresh database backup required; nothing removed')
    subprocess.run(['gzip', '-t', str(backups[-1])], check=True)
    for target in targets:
        verify(target)
    receipt = Path('/tmp') / ('package-cache-retention-' + digest + '.json')
    # Preserve npx manifests so exact cached tool versions remain identifiable.
    locks = {}
    npx = Path('/root/.npm/_npx')
    if any(t['path'] == str(npx) for t in targets):
        for name in ('package.json', 'package-lock.json'):
            locks.update({str(p.relative_to(npx)): p.read_text() for p in npx.glob('*/' + name)})
    receipt.write_text(json.dumps({'plan': plan, 'npx_manifests': locks}, indent=2))
    os.chmod(receipt, 0o600)
    before = shutil.disk_usage('/').free
    removed = []
    for target in targets:
        protected, busy = inspect_protection()
        path = Path(target['path'])
        if busy or any(within(p, path) or within(path, p) for p in protected):
            raise RuntimeError('Cache became active; stopping')
        clear(target)
        removed.append(target['path'])
    print(json.dumps({'cleared': removed, 'bytes_reclaimed': shutil.disk_usage('/').free - before,
                      'receipt': str(receipt)}), flush=True)


if __name__ == '__main__':
    main()
