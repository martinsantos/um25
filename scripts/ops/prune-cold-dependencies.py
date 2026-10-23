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
import stat
import tarfile
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


# Human-approved 23 October lot. This list deliberately excludes all UMSA
# deployment paths, database volumes, source trees and historical backups.
AUDITED_LOT = (
    ('/home/astro-app/node_modules', 'dependencies'),
    ('/home/sgi.ultimamilla.com.ar.bak/node_modules', 'dependencies'),
    ('/home/sgi.ultimamilla.com.ar.bak/sistema-vistas/node_modules', 'dependencies'),
    ('/opt/sitrep-qa-stabilization-20260905/node_modules', 'dependencies'),
    ('/root/.windsurf-server/bin', 'binary-cache'),
    ('/var/cache/dnf', 'package-cache'),
    ('/opt/sitrep-release-20260905-stabilization/frontend', 'duplicate'),
)
STALE_DOMAIN = 'gestion-viveroloscocos.23.105.176.45.nip.io'
STALE_RENEWAL = Path('/etc/letsencrypt/renewal') / (STALE_DOMAIN + '.conf')
PRESERVED_SNAPSHOTS = Path('/opt/gestion-vivero/shared/backups/snapshots')


def lot_signature(path):
    s = path.lstat()
    return [s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_mode, s.st_uid]


def lot_tree(path, exclude=(), files_only=False):
    records = []
    device = path.stat().st_dev
    for base, dirs, files in os.walk(path, followlinks=False):
        dirs[:] = sorted(n for n in dirs if Path(base, n) not in exclude)
        for name in sorted(dirs + files):
            item = Path(base, name)
            if item in exclude:
                continue
            s = item.lstat()
            if s.st_dev != device or not (stat.S_ISREG(s.st_mode) or stat.S_ISDIR(s.st_mode) or item.is_symlink()):
                raise RuntimeError('Preserve a cross-filesystem or special entry')
            if files_only and stat.S_ISDIR(s.st_mode):
                continue
            records.append([str(item.relative_to(path)), lot_signature(item),
                            os.readlink(item) if item.is_symlink() else None])
    return hashlib.sha256(json.dumps(records, separators=(',', ':')).encode()).hexdigest()


def lot_idle():
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            command = (proc / 'cmdline').read_bytes().replace(b'\0', b' ').decode(errors='replace')
            name = (proc / 'comm').read_text().strip()
            if name in ('dnf', 'yum', 'rpm', 'npm', 'npx', 'certbot') or any(
                    word in command for word in ('deploy-scoped-dist.sh', 'certbot renew', 'npm ci', 'npm install')):
                raise RuntimeError('Deployment, installer or renewal is active; retry later')
        except (FileNotFoundError, ProcessLookupError):
            pass


def lot_protected():
    result = protected_paths()
    ids = subprocess.check_output(['docker', 'ps', '-aq'], text=True).split()
    if ids:
        for item in json.loads(subprocess.check_output(['docker', 'inspect', *ids], text=True)):
            result.update(Path(m['Source']).resolve() for m in item.get('Mounts', []) if m.get('Source'))
    # Includes mapped shared libraries and open files; no contents or credentials
    # from process environments are written to the receipt.
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            for line in (proc / 'maps').read_text().splitlines():
                fields = line.split(None, 5)
                if len(fields) == 6 and fields[5].startswith('/'):
                    result.add(Path(fields[5].removesuffix(' (deleted)')).resolve())
        except (FileNotFoundError, ProcessLookupError):
            pass
    return result


def assert_lot_path(path, kind, protected):
    if (path.is_symlink() or path.resolve() != path or not path.is_dir() or
            path.stat().st_uid != os.geteuid() or has_mount(path)):
        raise RuntimeError('Audited target identity or ownership changed: ' + str(path))
    scope = path.parent if kind == 'dependencies' else path
    if any(within(p, scope) for p in protected):
        raise RuntimeError('Audited target became active: ' + str(path))
    ids = subprocess.check_output(['docker', 'ps', '-aq'], text=True).split()
    if ids:
        for item in json.loads(subprocess.check_output(['docker', 'inspect', *ids], text=True)):
            for mount in item.get('Mounts', []):
                if mount.get('Source'):
                    source = Path(mount['Source']).resolve()
                    if within(path, source) or within(source, path):
                        raise RuntimeError('Audited target intersects a container mount')


def duplicate_frontend(path):
    archive = path.parent / 'frontend.tar.gz'
    if archive.is_symlink() or not archive.is_file():
        raise RuntimeError('Keep the original frontend archive')
    covered = set()
    with tarfile.open(archive) as compressed:
        for member in compressed:
            if member.isdir():
                continue
            rel = Path(member.name)
            if not member.isfile() or rel.is_absolute() or '..' in rel.parts:
                raise RuntimeError('Archive has an unsafe member')
            target = path / rel
            if target.is_symlink() or not target.is_file() or not within(target.resolve(), path):
                raise RuntimeError('Expanded frontend differs from retained archive')
            digest = hashlib.sha256()
            with compressed.extractfile(member) as stream:
                for chunk in iter(lambda: stream.read(1048576), b''):
                    digest.update(chunk)
            if digest.hexdigest() != hash_file(target):
                raise RuntimeError('Expanded frontend has unique content')
            covered.add(str(target.relative_to(path)))
    actual = set()
    for base, dirs, files in os.walk(path, followlinks=False):
        for name in dirs + files:
            target = Path(base, name)
            if target.is_symlink():
                raise RuntimeError('Preserve a frontend with symlinks')
        actual.update(str((Path(base) / n).relative_to(path)) for n in files)
    if not covered or actual != covered:
        raise RuntimeError('Preserve unarchived frontend files')
    return {'archive': str(archive), 'sha256': hash_file(archive), 'files': len(covered)}


def stale_renewal_plan():
    nginx = subprocess.run(['nginx', '-T'], check=True, capture_output=True, text=True).stdout
    if STALE_DOMAIN in nginx:
        raise RuntimeError('Old certificate is referenced by active Nginx; preserve it')
    if not STALE_RENEWAL.exists() and not STALE_RENEWAL.is_symlink():
        return None
    s = STALE_RENEWAL.lstat()
    if STALE_RENEWAL.is_symlink() or not stat.S_ISREG(s.st_mode) or s.st_uid != 0 or s.st_nlink != 1:
        raise RuntimeError('Unexpected renewal file identity')
    cert = Path('/etc/letsencrypt/live') / STALE_DOMAIN / 'cert.pem'
    subprocess.run(['openssl', 'x509', '-in', str(cert), '-noout', '-enddate'], check=True, capture_output=True)
    expiry = subprocess.run(['openssl', 'x509', '-in', str(cert), '-noout', '-checkend', '0'], capture_output=True)
    if expiry.returncode != 1:
        raise RuntimeError('Preserve a valid or unreadable certificate')
    text = STALE_RENEWAL.read_text()
    if STALE_DOMAIN not in text or 'authenticator = webroot' not in text:
        raise RuntimeError('Unexpected old renewal configuration')
    return {'path': str(STALE_RENEWAL), 'signature': lot_signature(STALE_RENEWAL), 'sha256': hash_file(STALE_RENEWAL)}


def audited_lot_plan():
    lot_idle()
    protected = lot_protected()
    targets = []
    for name, kind in AUDITED_LOT:
        path = Path(name)
        if not path.exists() and not path.is_symlink():
            continue
        assert_lot_path(path, kind, protected)
        item = {'path': name, 'kind': kind, 'signature': lot_signature(path), 'tree_sha256': lot_tree(path)}
        if kind == 'dependencies':
            item['manifests'] = {}
            for name in ('package.json', 'package-lock.json'):
                file = path.parent / name
                if file.is_symlink() or not file.is_file():
                    raise RuntimeError('Keep dependencies lacking reproducible manifests')
                item['manifests'][name] = hash_file(file)
        if kind == 'duplicate':
            item['retained'] = duplicate_frontend(path)
        targets.append(item)
    return {'scope': 'human-approved-cold-lot-20261023', 'targets': targets, 'renewal': stale_renewal_plan()}


def audited_lot_apply(plan, expected):
    digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    if not re.fullmatch('[a-f0-9]{64}', expected) or expected != digest:
        raise RuntimeError('Reviewed lot fingerprint required; nothing removed')
    if hashlib.sha256(json.dumps(audited_lot_plan(), sort_keys=True).encode()).hexdigest() != digest:
        raise RuntimeError('Audited lot changed; nothing removed')
    backups = sorted(Path('/opt/directus-backups').glob('directus-db-*.sql.gz'))
    if not backups or time.time() - backups[-1].stat().st_mtime > 86400:
        raise RuntimeError('Fresh database backup required')
    subprocess.run(['gzip', '-t', str(backups[-1])], check=True)
    os.umask(0o077)
    receipt = Path('/root/backups') / ('audited-cold-lot-' + digest)
    receipt.mkdir(mode=0o700)
    (receipt / 'plan.json').write_text(json.dumps(plan, sort_keys=True, indent=2))
    excluded = {Path(t['path']) for t in plan['targets']}
    retained_roots = {Path(t['path']).parent for t in plan['targets'] if t['kind'] == 'dependencies'}
    before = {str(p): lot_tree(p, exclude=excluded, files_only=True) for p in retained_roots}
    snapshots_before = lot_tree(PRESERVED_SNAPSHOTS)
    nginx_before = subprocess.run(['nginx', '-T'], check=True, capture_output=True).stdout
    for number, target in enumerate(plan['targets']):
        path = Path(target['path'])
        for name, checksum in target.get('manifests', {}).items():
            source = path.parent / name
            if hash_file(source) != checksum:
                raise RuntimeError('Manifest changed')
            shutil.copyfile(source, receipt / ('%d-%s' % (number, name)))
        inventory = path / '.package-lock.json'
        if inventory.is_file() and not inventory.is_symlink():
            shutil.copyfile(inventory, receipt / ('%d-installed-lock.json' % number))
    free_before = shutil.disk_usage('/').free
    removed = []
    for target in plan['targets']:
        lot_idle()
        path = Path(target['path'])
        assert_lot_path(path, target['kind'], lot_protected())
        if lot_signature(path) != target['signature'] or lot_tree(path) != target['tree_sha256']:
            raise RuntimeError('Target changed; stopping')
        if target['kind'] == 'duplicate' and duplicate_frontend(path) != target['retained']:
            raise RuntimeError('Retained archive changed; stopping')
        shutil.rmtree(path)
        removed.append(str(path))
        (receipt / 'removed.json').write_text(json.dumps(removed))
    renewal = plan['renewal']
    if renewal:
        lot_idle()
        if stale_renewal_plan() != renewal:
            raise RuntimeError('Renewal changed; preserve it')
        shutil.copyfile(STALE_RENEWAL, receipt / 'retired-renewal.conf')
        if hash_file(receipt / 'retired-renewal.conf') != renewal['sha256']:
            raise RuntimeError('Renewal recovery copy failed')
        STALE_RENEWAL.unlink()
    retained_ok = all(lot_tree(p, exclude=excluded, files_only=True) == before[str(p)] for p in retained_roots)
    snapshots_ok = lot_tree(PRESERVED_SNAPSHOTS) == snapshots_before
    nginx_ok = subprocess.run(['nginx', '-T'], check=True, capture_output=True).stdout == nginx_before
    result = {'removed': removed, 'renewal_retired': bool(renewal), 'receipt': str(receipt),
              'bytes_free_delta': shutil.disk_usage('/').free - free_before,
              'retained_files_verified': retained_ok, 'vivero_snapshots_unchanged': snapshots_ok,
              'nginx_configuration_unchanged': nginx_ok, 'services_restarted': 0}
    (receipt / 'result.json').write_text(json.dumps(result, indent=2))
    if not retained_ok or not snapshots_ok:
        raise RuntimeError('Preservation check failed; inspect receipt ' + str(receipt))
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    parser.add_argument('--audited-lot', action='store_true')
    args = parser.parse_args()
    if args.audited_lot:
        if args.apply and os.geteuid() != 0:
            raise RuntimeError('Only the root CI maintenance operator may apply this lot')
        plan = audited_lot_plan()
        digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
        print(json.dumps({'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest, 'plan': plan}), flush=True)
        if args.apply:
            print(json.dumps(audited_lot_apply(plan, args.expected_plan_sha)), flush=True)
        return
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
