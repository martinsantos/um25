#!/usr/bin/env python3
"""Retire fixed inactive dependency volumes and proven duplicate QA archives."""
import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import tarfile
import time
from pathlib import Path

VOLUMES = ('astro_node_modules', 'fumbling-field_astro_node_modules')
VOLUME_ROOT = Path('/var/lib/docker/volumes')
QA_ROOTS = [
    "sitrep-actor-support-20261008-r1",
    "sitrep-field-context-20261003-r1",
    "sitrep-field-flow-20261007-r2",
    "sitrep-license-ocr-20261011-r1",
    "sitrep-license-product-test-38083528073-vENDfM83",
    "sitrep-license-product-test-38095003841-dB9Ddp1B",
    "sitrep-license-product-test-38143913464-0cdIUPpk",
    "sitrep-mail-safety-20261011-r1",
    "sitrep-monitor30d-20261004-r1",
    "sitrep-multiuser-20261008-r1",
    "sitrep-native-support-20261006-r1",
    "sitrep-number-spacing-20261008-r1",
    "sitrep-production-go-20261007-r1",
    "sitrep-registration-20261009-r1",
    "sitrep-registration-recovery-20261009-r1",
    "sitrep-registration-unified-20261010-r1",
    "sitrep-shared-ui-followup-final-20261004-r1",
    "sitrep-support-actions-20261006-r1",
    "sitrep-support-recovery-20261006-r1",
    "sitrep-support-submit-20261006-r1",
    "sitrep-support-triage-20261007-r1",
    "sitrep-tef-authority-20261009-r1",
    "vlc-accessories-copy-20261008",
    "vlc-alignment-final-20261007",
    "vlc-alignment-header-20261007",
    "vlc-alignment-seals-20261007",
    "vlc-banner-design-20261005",
    "vlc-banner-design-finish-20261005",
    "vlc-banner-design-polish-20261005",
    "vlc-care-all-photos-20261006",
    "vlc-care-seo-20261005",
    "vlc-catalog-journey-20261011-a1",
    "vlc-category-routing-20261008",
    "vlc-conicas-retirement-20261007",
    "vlc-cultivo-withhold-20261004",
    "vlc-customer-controls-cleanup-20261004",
    "vlc-experiencias-20261007",
    "vlc-experiencias-20261007-coverage",
    "vlc-experiencias-20261007-final",
    "vlc-experiencias-20261007-mobile",
    "vlc-experiencias-20261007-narrow",
    "vlc-experiencias-20261007-refinement",
    "vlc-experiencias-20261007-titles",
    "vlc-fibrocemento-merge-20261007",
    "vlc-ficus473-care-20261004",
    "vlc-final56-accessory-copy",
    "vlc-final56-confirmed-identity",
    "vlc-final56-equivalent-copy",
    "vlc-final56-identity",
    "vlc-final56-probable-identity",
    "vlc-guides-kits-20261007",
    "vlc-guides-kits-20261007-controls",
    "vlc-guides-kits-20261007-figure",
    "vlc-guides-kits-20261007-season",
    "vlc-guides-kits-20261007-visual",
    "vlc-identity-peruviano-20261004",
    "vlc-identity-recovery-20261004",
    "vlc-identity-recovery-20261004-raw-v2",
    "vlc-interaction-checkout-20261008",
    "vlc-interaction-final-20261008",
    "vlc-interaction-selection-20261008",
    "vlc-interaction-states-release-20261008",
    "vlc-kit-composition-20261007",
    "vlc-kit-contact-layer-20261007",
    "vlc-kit-expanded-20261007",
    "vlc-kit-mobile-controls-20261007",
    "vlc-kit-naming-publish-20261005",
    "vlc-kit-native-cart-check-20261005",
    "vlc-kit-native-cart-finish-20261005",
    "vlc-kit-native-cart-publish-20261005",
    "vlc-kit-native-cart-receipt-20261005",
    "vlc-kit-native-cart-visual-20261005",
    "vlc-kit-optimized-20261007",
    "vlc-kit-photos-20261007",
    "vlc-kit-refine-20261005",
    "vlc-kit-visual-20261007",
    "vlc-kits-guides-20261006",
    "vlc-kits-seo-20261005",
    "vlc-lawn-amable-20261007",
    "vlc-lawn-amable-js-fix-20261007",
    "vlc-lawn-amable-return-20261007",
    "vlc-lawn-final-refine-20261006",
    "vlc-lawn-focus-20261006",
    "vlc-lawn-refine-20261006",
    "vlc-lawn-widget-20261006",
    "vlc-local-guides-ui-20261004",
    "vlc-mano-motion-20261006",
    "vlc-mano-motion-affordance-20261006",
    "vlc-manoverde-flow-20261006",
    "vlc-manoverde-learning-20261006",
    "vlc-manoverde-learning-fix-20261006",
    "vlc-manoverde-plant-identity-20261006",
    "vlc-market-kits-20261005",
    "vlc-market-kits-check-20261005",
    "vlc-market-kits-publish-20261005",
    "vlc-mv-cart-return-20261006",
    "vlc-mv-offer-order-20261007",
    "vlc-mv-one-flow-20261006",
    "vlc-mv-one-flow-polish-20261006",
    "vlc-mv-one-flow-session-20261006",
    "vlc-mv-sales-flow-20261006",
    "vlc-mv-sales-flow-refine-20261006",
    "vlc-mv-xp-20261006",
    "vlc-mv-xp-close-20261006",
    "vlc-mv-xp-continuity-20261006",
    "vlc-offers-kits-20261005",
    "vlc-offers-kits-message-20261005",
    "vlc-offers-kits-publish-20261005",
    "vlc-order-flow-20261010-01a0fd01",
    "vlc-overlap-20261004",
    "vlc-overlap-finish-20261004",
    "vlc-photo-integration-qa-kits-discovery-20261007",
    "vlc-photo-integration-qa-macetas-navigation-20261007",
    "vlc-photo-integration-qa-rotomoldeadas-primary-20261007",
    "vlc-photo-integration-qa-terracota-portada-20261007",
    "vlc-photo-integration-qa-terracota-rotation-20261007",
    "vlc-photo-recovery-20261004-01",
    "vlc-photo-recovery-20261004-02",
    "vlc-photo-recovery-20261004-03",
    "vlc-photo-recovery-20261004-04",
    "vlc-photo-recovery-20261004-05",
    "vlc-photo-recovery-20261004-06",
    "vlc-photo-recovery-20261004-07",
    "vlc-photo-recovery-20261004-08",
    "vlc-photo-recovery-20261004-09",
    "vlc-photo-recovery-20261004-10",
    "vlc-photo-recovery-20261004-11",
    "vlc-photo-recovery-20261004-12",
    "vlc-photo-recovery-20261004-13",
    "vlc-photo-recovery-20261004-14",
    "vlc-photo-recovery-20261004-15",
    "vlc-photo-recovery-20261004-16",
    "vlc-photo-recovery-20261004-17",
    "vlc-picasso-20261006-publish",
    "vlc-pot-references-20261011-b1",
    "vlc-pots-integrated-20261011-035424-a1",
    "vlc-pots-production-20261011-0225-a4f1",
    "vlc-pots-variant-repair-20261011-0436-a1",
    "vlc-profile-repairs-20261004",
    "vlc-reference-notice-20261004",
    "vlc-refresh-20261004",
    "vlc-refresh-refine-20261004",
    "vlc-related-picasso-20261006",
    "vlc-returns-readability-20261004",
    "vlc-returns-width-final-20261004",
    "vlc-reviewed-production-20261010",
    "vlc-rmc-20261007-package",
    "vlc-rmc-20261007-run",
    "vlc-rocio-breadcrumb-20261011-merge1",
    "vlc-seo-banner-20261004",
    "vlc-seo-cesped-20261006",
    "vlc-seo-feed-20261004",
    "vlc-seo-geo-20261004",
    "vlc-seo-geo-20261009-01a0fd01",
    "vlc-seo-returns-20261004",
    "vlc-seo-returns-refine-20261004",
    "vlc-terracota-retirement-20261007",
    "vlc-triage-paths-20261006",
    "vlc-variation-photo-notice-20261004",
    "vlc-wa-20261006-publish"
]
TOP_ARCHIVES = {
    '/tmp/vlc-plastic-qa-input-20261010.tar.gz': '/tmp/vlc-plastic-groups-qa-20261010',
    '/tmp/vlc-plastic-qa-update-20261010.tar.gz': '/tmp/vlc-plastic-groups-qa-20261010',
}
MIN_AGE = 48 * 3600
# Release folders: code copies, rebuildable from git. Uploads, data and .env of the live backend
# are symlinked INTO some old releases, so each one referenced from anywhere stays.
RELEASE_ROOTS = (Path('/var/www/sitrep-releases'), Path('/var/www/sitrep-backend-releases'))
KEEP_NEWEST = 12
# Directus uploads snapshots: the backup writes a new archive only when uploads change, but the
# liveness probe file used to count as a change, so many archives repeat the same images.
DIRECTUS_BACKUPS = Path('/opt/directus-backups')
DIRECTUS_STATE = DIRECTUS_BACKUPS / 'directus-uploads-content.state'
DIRECTUS_BACKUP_SCRIPT = '/opt/scripts-cicd/backup_directus.sh'
HEALTH_MARKER = 'directus-health-file'
REF_TEXTS = ('/root/.pm2/dump.pm2', '/etc/crontab', '/var/spool/cron', '/etc/cron.d', '/etc/systemd/system')

def within(path, parent):
    return path == parent or parent in path.parents

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

def signature(path):
    s = path.lstat()
    return [s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_mode, s.st_uid, s.st_gid]

def has_mount(path):
    return any(within(Path(line.split()[4].replace('\\040', ' ')), path)
               for line in Path('/proc/self/mountinfo').read_text().splitlines())

def protection():
    paths = set()
    mounts = set()
    busy = False
    ids = subprocess.check_output(['docker', 'ps', '-aq'], text=True).split()
    if ids:
        for container in json.loads(subprocess.check_output(['docker', 'inspect', *ids], text=True)):
            mounts.update(Path(m['Source']).resolve() for m in container['Mounts'] if m.get('Source'))
    nginx = subprocess.run(['nginx', '-T'], capture_output=True, text=True, check=True)
    mounts.update(Path(p).resolve() for p in re.findall(r'^\s*(?:root|alias)\s+(/[^;\s]+)\s*;', nginx.stdout, re.M))
    for proc in Path('/proc').glob('[0-9]*'):
        if proc.name == str(os.getpid()):
            continue
        try:
            tokens = (proc / 'cmdline').read_bytes().split(b'\0')
            busy |= any(os.fsdecode(t).rsplit('/', 1)[-1] in ('npm','npx','pip','pip3','dnf','yum') for t in tokens)
            for token in tokens:
                if token.startswith(b'/'):
                    p = Path(os.fsdecode(token))
                    if p.exists():
                        paths.add(p.resolve())
            for item in ('cwd', 'exe'):
                try:
                    paths.add((proc / item).resolve(strict=True))
                except FileNotFoundError:
                    pass
            for item in (proc / 'fd').iterdir():
                try:
                    paths.add(item.resolve(strict=True))
                except (FileNotFoundError, RuntimeError):
                    pass
            for line in (proc / 'maps').read_text().splitlines():
                fields = line.split(None, 5)
                if len(fields) == 6 and fields[5].startswith('/'):
                    paths.add(Path(fields[5].removesuffix(' (deleted)')).resolve())
        except (FileNotFoundError, ProcessLookupError):
            pass
        except PermissionError as error:
            raise RuntimeError('Cannot inspect every process; nothing retired') from error
    return paths, mounts, busy

def active(path, paths, mounts, parent_scope=False):
    scope = path.parent if parent_scope and path.parent != Path('/tmp') else path
    return (any(within(p, scope) for p in paths)
            or any(within(p, path) or within(path, p) for p in mounts)
            or has_mount(path))

def tree_identity(path):
    records = []
    device = path.stat().st_dev
    for base, dirs, files in os.walk(path, followlinks=False):
        for name in sorted(dirs + files):
            item = Path(base, name)
            s = item.lstat()
            if s.st_dev != device:
                raise RuntimeError('Dependency subtree crosses filesystem')
            if item.is_symlink():
                if not within(item.resolve(), path):
                    raise RuntimeError('Dependency has an external symlink')
                records.append([str(item.relative_to(path)), signature(item), os.readlink(item)])
            elif stat.S_ISREG(s.st_mode) or stat.S_ISDIR(s.st_mode):
                records.append([str(item.relative_to(path)), signature(item)])
            else:
                raise RuntimeError('Dependency subtree has a special file')
    return hashlib.sha256(json.dumps(sorted(records), separators=(',', ':')).encode()).hexdigest()

def volume_target(name, paths, mounts, now=None):
    now = time.time() if now is None else now
    value = json.loads(subprocess.check_output(['docker', 'volume', 'inspect', name], text=True))[0]
    path = VOLUME_ROOT / name / '_data'
    if value['Driver'] != 'local' or value['Mountpoint'] != str(path):
        raise RuntimeError('Unexpected Docker volume identity')
    if path.is_symlink() or path.resolve() != path or not path.is_dir():
        raise RuntimeError('Dependency volume path changed')
    if active(path, paths, mounts) or now - path.stat().st_mtime < MIN_AGE:
        return None
    lock = path / '.package-lock.json'
    data = json.loads(lock.read_text())
    installed = data.get('packages', {})
    if not installed:
        raise RuntimeError('Volume has no reproducible dependency inventory')
    for item in path.iterdir():
        if item.name in ('.package-lock.json', '.bin', '.astro', '.vite'):
            continue
        if item.is_dir() and not any(item.iterdir()):
            continue  # npm leaves empty scopes after uninstalling optional packages.
        prefix = 'node_modules/' + item.name
        if not item.is_dir() or not any(k == prefix or k.startswith(prefix + '/') for k in installed):
            raise RuntimeError('Volume contains content outside its dependency inventory: ' + name + '/' + item.name)
    return {'kind': 'volume', 'name': name, 'path': str(path), 'signature': signature(path),
            'tree_sha256': tree_identity(path), 'lock_sha256': sha(lock),
            'bytes_estimated': int(subprocess.check_output(['du','-sk',str(path)], text=True).split()[0]) * 1024}

def archive_target(path, root, paths, mounts, now=None):
    now = time.time() if now is None else now
    if (path.is_symlink() or path.resolve() != path or not path.is_file()
            or now - path.stat().st_mtime < MIN_AGE or active(path, paths, mounts, True)):
        return None
    if root.is_symlink() or root.resolve() != root or not root.is_dir():
        return None
    # Preserve unpacked payloads, source scripts, reports, metadata and images.
    by_size_name = {}
    for base, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = [n for n in dirs if not Path(base, n).is_symlink()]
        for n in files:
            p = Path(base, n)
            if (p.is_symlink() or p.resolve() != p or p == path
                    or n.endswith(('.tar','.tar.gz','.tgz')) or not p.is_file()):
                continue
            by_size_name.setdefault((n, p.stat().st_size), []).append(p)
    proof = []
    before = signature(path)
    cache = {}
    try:
        with tarfile.open(path, 'r:*') as archive:
            for item in archive:
                if item.isdir():
                    continue
                if not item.isfile() or Path(item.name).is_absolute() or '..' in Path(item.name).parts:
                    return None
                digest = hashlib.sha256()
                stream = archive.extractfile(item)
                if stream is None:
                    return None
                with stream:
                    for block in iter(lambda: stream.read(1048576), b''):
                        digest.update(block)
                found = None
                for candidate in by_size_name.get((Path(item.name).name, item.size), []):
                    if candidate not in cache:
                        identity = signature(candidate)
                        checksum = sha(candidate)
                        if signature(candidate) != identity:
                            raise RuntimeError('Retained unpacked payload changed')
                        cache[candidate] = (identity, checksum)
                    identity, checksum = cache[candidate]
                    if checksum == digest.hexdigest():
                        found = {'member': item.name, 'retained': str(candidate), 'signature': identity,
                                 'sha256': checksum, 'mode': item.mode, 'uid': item.uid,
                                 'gid': item.gid, 'mtime': item.mtime}
                        break
                if found is None:
                    return None
                proof.append(found)
    except (tarfile.TarError, EOFError):
        return None
    if not proof or signature(path) != before:
        return None
    return {'kind': 'archive', 'path': str(path), 'retained_root': str(root),
            'signature': before, 'sha256': sha(path), 'proof': proof,
            'bytes_estimated': path.stat().st_blocks * 512}

def release_refs():
    """Every path inside a release root that something on the server points at."""
    pattern = re.compile(r'(?:%s)/[^/\s"\';:,]+' % '|'.join(re.escape(str(r)) for r in RELEASE_ROOTS))
    refs = set()
    links = subprocess.run(['find', '/', '-xdev', '-type', 'l', '-print0'], capture_output=True).stdout
    for raw in links.split(b'\0'):
        if not raw:
            continue
        link = os.fsdecode(raw)
        try:
            refs.add(Path(os.path.normpath(os.path.join(os.path.dirname(link), os.readlink(link)))))
            refs.add(Path(os.path.realpath(link)))
        except OSError:
            pass
    texts = [subprocess.run(['nginx', '-T'], capture_output=True, text=True).stdout]
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            texts.append((proc / 'environ').read_bytes().replace(b'\0', b'\n').decode(errors='replace'))
        except (FileNotFoundError, ProcessLookupError):
            pass
    for name in REF_TEXTS:
        base = Path(name)
        for item in ([base] if base.is_file() else sorted(base.rglob('*')) if base.is_dir() else []):
            if item.is_file():
                texts.append(item.read_text(errors='replace'))
    for text in texts:
        refs.update(Path(m) for m in pattern.findall(text))
    return refs

def release_candidates(paths, mounts, now=None):
    now = time.time() if now is None else now
    refs = release_refs() | paths
    roots = []
    for root in RELEASE_ROOTS:
        if root.is_symlink() or root.resolve() != root or not root.is_dir():
            raise RuntimeError('Release root changed: ' + str(root))
        releases = sorted((p for p in root.iterdir() if p.is_dir() and not p.is_symlink()),
                          key=lambda p: (p.stat().st_mtime_ns, p.name), reverse=True)
        keep = releases[:KEEP_NEWEST]
        referenced = [p for p in releases if any(within(r, p) for r in refs)]
        old = [p for p in releases[KEEP_NEWEST:]
               if p not in referenced and now - p.stat().st_mtime >= MIN_AGE
               and not active(p, paths, mounts)]
        roots.append((root, keep, referenced, old))
    return roots

def release_target(path, keep, root_device):
    if path.is_symlink() or path.resolve() != path or path.stat().st_dev != root_device:
        raise RuntimeError('Release folder changed identity: ' + str(path))
    # Hardlinks with kept releases are counted against those, so this is what really frees.
    out = subprocess.check_output(['du', '-sk', *map(str, keep), str(path)], text=True).splitlines()
    return {'kind': 'release', 'path': str(path), 'signature': signature(path),
            'bytes_estimated': int(out[-1].split()[0]) * 1024}

def archive_members(path):
    """Content of every regular member except the 5-byte liveness marker."""
    members = {}
    with tarfile.open(path, 'r:gz') as archive:
        for item in archive:
            if item.isdir():
                continue
            if not item.isfile():
                raise RuntimeError('Uploads archive has a non-regular member: ' + path.name)
            if item.name.rsplit('/', 1)[-1] == HEALTH_MARKER:
                continue
            digest = hashlib.sha256()
            with archive.extractfile(item) as stream:
                for block in iter(lambda: stream.read(1048576), b''):
                    digest.update(block)
            members[item.name] = [item.size, item.mode, digest.hexdigest()]
    return members

def directus_backup_idle():
    for proc in Path('/proc').glob('[0-9]*'):
        try:
            if os.fsencode(DIRECTUS_BACKUP_SCRIPT) in (proc / 'cmdline').read_bytes().split(b'\0'):
                raise RuntimeError('Directus backup is running; retry after it finishes')
        except (FileNotFoundError, ProcessLookupError):
            pass

def directus_duplicates(paths, mounts):
    directus_backup_idle()
    state = dict(line.split('=', 1) for line in DIRECTUS_STATE.read_text().split())
    keep = DIRECTUS_BACKUPS / state['archive']
    archives = sorted(DIRECTUS_BACKUPS.glob('directus-uploads-*.tar.gz'))
    if not archives or archives[-1] != keep or keep.is_symlink() or not keep.is_file():
        raise RuntimeError('Newest uploads archive is not the one the backup state names')
    reference = archive_members(keep)
    if not reference:
        raise RuntimeError('Retained uploads archive is empty')
    retained = {'path': str(keep), 'signature': signature(keep), 'member_count': len(reference),
                'members_sha256': fingerprint(reference)}
    targets = []
    for path in archives[:-1]:
        if path.is_symlink() or path.resolve() != path or not path.is_file() or active(path, paths, mounts):
            continue
        before = signature(path)
        if archive_members(path) != reference or signature(path) != before:
            continue  # holds something the retained archive does not: stays
        checkpoints = sorted(c.name for c in DIRECTUS_BACKUPS.glob('directus-checkpoint-*.txt')
                             if ('uploads=' + path.name) in c.read_text().split())
        targets.append({'kind': 'directus-uploads', 'path': str(path), 'signature': before,
                        'checkpoints': checkpoints, 'bytes_estimated': path.stat().st_blocks * 512})
    return retained, targets

def make_plan(operation):
    paths, mounts, busy = protection()
    if busy:
        raise RuntimeError('Installer active; retry after it finishes')
    targets = []
    if operation == 'volume-dependencies':
        existing = set(subprocess.check_output(['docker','volume','ls','-q'],text=True).split())
        for name in VOLUMES:
            if name in existing:
                item = volume_target(name, paths, mounts)
                if item:
                    targets.append(item)
    elif operation == 'temporary-archives':
        candidates = dict(TOP_ARCHIVES)
        for name in QA_ROOTS:
            root = Path('/tmp') / name
            if root.is_symlink() or root.resolve() != root or not root.is_dir():
                continue
            for path in root.rglob('*'):
                if path.is_file() and path.name.endswith(('.tar','.tar.gz','.tgz')):
                    candidates[str(path)] = str(root)
        for name, retained in sorted(candidates.items()):
            path = Path(name)
            if path.exists():
                item = archive_target(path, Path(retained), paths, mounts)
                if item:
                    targets.append(item)
    elif operation == 'directus-upload-duplicates':
        retained, targets = directus_duplicates(paths, mounts)
        return {'operation': operation, 'retained': retained, 'targets': targets}
    elif operation == 'release-folders':
        kept = {}
        freed = 0
        for root, keep, referenced, old in release_candidates(paths, mounts):
            kept[str(root)] = {'newest': [p.name for p in keep], 'referenced': [p.name for p in referenced]}
            device = root.stat().st_dev
            targets.extend(release_target(p, keep, device) for p in sorted(old))
            if old:
                # One du over kept + candidates counts each shared hardlink once.
                held = sorted(set(keep) | set(referenced))
                out = subprocess.check_output(['du', '-sk', *map(str, held + sorted(old))], text=True)
                freed += sum(int(line.split()[0]) for line in out.splitlines()[len(held):]) * 1024
        return {'operation': operation, 'kept': kept, 'bytes_freed_estimated': freed, 'targets': targets}
    else:
        raise RuntimeError('Unsupported cleanup scope')
    return {'operation': operation, 'targets': targets}

def fingerprint(plan):
    return hashlib.sha256(json.dumps(plan, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def fresh_backup():
    snapshots = sorted(Path('/opt/directus-backups').glob('directus-db-*.sql.gz'))
    if not snapshots or time.time() - snapshots[-1].stat().st_mtime > 86400:
        raise RuntimeError('A fresh database backup is required')
    subprocess.run(['gzip','-t',str(snapshots[-1])],check=True)

def apply(plan, digest, expected):
    if digest != expected or fingerprint(make_plan(plan['operation'])) != digest:
        raise RuntimeError('Reviewed candidates changed; nothing retired')
    fresh_backup()
    receipt = Path('/root/backups') / ('storage-retention-dge-' + digest)
    receipt.mkdir(mode=0o700)
    (receipt / 'plan.json').write_text(json.dumps(plan,sort_keys=True,indent=2))
    os.chmod(receipt / 'plan.json',0o600)
    for target in plan['targets']:
        if target['kind'] == 'volume':
            destination = receipt / (target['name'] + '-package-lock.json')
            shutil.copyfile(Path(target['path']) / '.package-lock.json',destination)
            os.chmod(destination,0o600)
            if sha(destination) != target['lock_sha256']:
                raise RuntimeError('Dependency lock retention failed')
    before = shutil.disk_usage('/').free
    refs = release_refs() if any(t['kind'] == 'release' for t in plan['targets']) else set()
    completed = []
    for target in plan['targets']:
        paths, mounts, busy = protection()
        if busy:
            raise RuntimeError('An installer started; stopping')
        path = Path(target['path'])
        if target['kind'] == 'volume':
            if volume_target(target['name'],paths,mounts) != target:
                raise RuntimeError('Dependency volume changed or became active')
            subprocess.run(['docker','volume','rm',target['name']],check=True,capture_output=True,text=True)
        elif target['kind'] == 'directus-uploads':
            directus_backup_idle()
            if active(path, paths, mounts) or signature(path) != target['signature']:
                raise RuntimeError('Uploads archive changed or became active: ' + str(path))
            retained = Path(plan['retained']['path'])
            for name in target['checkpoints']:
                # Old checkpoints keep their line and gain the equivalent archive to restore from.
                checkpoint = DIRECTUS_BACKUPS / name
                shutil.copy2(checkpoint, receipt / name)
                with checkpoint.open('a') as stream:
                    stream.write('uploads_equivalent=%s\n' % retained.name)
            path.unlink()
        elif target['kind'] == 'release':
            # Symlinks were re-scanned by make_plan just before; here, live processes per folder.
            if active(path, paths, mounts) or any(within(r, path) for r in refs):
                raise RuntimeError('Release became referenced: ' + str(path))
            if signature(path) != target['signature']:
                raise RuntimeError('Release folder changed: ' + str(path))
            shutil.rmtree(path)
        else:
            if archive_target(path,Path(target['retained_root']),paths,mounts) != target:
                raise RuntimeError('Archive or retained payload changed or became active')
            path.unlink()
            for item in target['proof']:
                retained = Path(item['retained'])
                if signature(retained) != item['signature'] or sha(retained) != item['sha256']:
                    raise RuntimeError('Retained payload verification failed')
        completed.append(str(path))
        (receipt / 'completed.json').write_text(json.dumps(completed))
        os.chmod(receipt / 'completed.json',0o600)
    return {'retired_count':len(completed),'bytes_reclaimed':shutil.disk_usage('/').free-before,
            'receipt':str(receipt),'locks_and_unique_payloads_preserved':True,'services_restarted':0}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--operation',choices=('volume-dependencies','temporary-archives','release-folders','directus-upload-duplicates'),required=True)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--expected-plan-sha',default='')
    args = parser.parse_args()
    plan = make_plan(args.operation)
    digest = fingerprint(plan)
    print(json.dumps({'mode':'apply' if args.apply else 'plan','operation':args.operation,
                      'plan_sha256':digest,'target_count':len(plan['targets']),
                      'bytes_estimated':plan.get('bytes_freed_estimated',
                                                 sum(t['bytes_estimated'] for t in plan['targets'])),
                      'targets':[{'path':t['path'],'kind':t['kind'],'bytes_estimated':t['bytes_estimated']}
                                 for t in plan['targets']],
                      'kept':plan.get('kept'),'retained':plan.get('retained')}),flush=True)
    if args.apply:
        print(json.dumps(apply(plan,digest,args.expected_plan_sha)),flush=True)

if __name__ == '__main__':
    main()
