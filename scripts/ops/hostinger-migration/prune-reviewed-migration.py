#!/usr/bin/env python3
"""One reviewed migration-artifact batch; no runtime, backup or config changes."""
import collections
import fcntl
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import stat
import struct
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
RELEASES = Path('/srv/umsa-web-releases')
STATE = STAGE / 'web-publication-state.json'
CURRENT = 'f0a2c1e5c7b680ca7e44ddc815f8b8c57ce7ca31-40773817646-1'
PREVIOUS = 'c764001c51d95efe07daeae8ca976fbf3d36335c-40674613617-1'
OBSOLETE = ('7d7298d56963a07708591008774b8967b666a147-40551865293-1',
            '3c90cfd3a9e22d055d4831276d882c2dffdc7b4b-40670423635-1',
            'c800030efd012f98986a1757eede47689b1ed2d2-40771030413-1')
DELIVERIES = (OBSOLETE[0], OBSOLETE[1], PREVIOUS, OBSOLETE[2], CURRENT)
CANDIDATES = tuple(STAGE / 'incoming' / (name + '.tar.gz') for name in DELIVERIES) + tuple(
    RELEASES / name / 'application' for name in OBSOLETE)
PROTECTED = (STAGE / 'source', STAGE / 'trusted', STAGE / 'mutable-rehearsals',
             STAGE / 'snapshots', STAGE / 'offsite-streaming-rehearsals',
             STAGE / 'offsite-encrypted-rehearsals', STAGE / 'sgi-dedicated-rehearsals',
             STAGE / 'dge-source-preservation', Path('/srv/umsa-operational-backups'),
             Path('/root/fumbling-field/backups'), RELEASES / CURRENT, RELEASES / PREVIOUS)
EXPECTED_FILES = 104906
EXPECTED_DATA_BYTES = 16787042304
MACHINE_SHA = '315fee7b2c6314049537fc82c6b2168500d14f416911a2b1226a3569aaf91c1c'
HDR, EXT = struct.Struct('=QQIIII'), struct.Struct('=QQQQQIIII')
ESSENTIAL = {'docker.service', 'mariadb.service', 'redis.service', 'postfix.service',
             'php-fpm.service', 'php74-php-fpm.service', 'vivero-relay-hostinger.service'}


def run(args, timeout=40):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout).stdout


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def metadata(info):
    # atime is deliberately excluded: ordinary reads do not invalidate a review.
    return [info.st_dev, info.st_ino, info.st_mode, info.st_uid, info.st_gid,
            info.st_size, info.st_mtime_ns, info.st_ctime_ns, info.st_nlink, info.st_blocks * 512]


def secure_ancestors(path, ownership=True):
    for parent in reversed((path, *path.parents)):
        info = parent.lstat()
        if (not stat.S_ISDIR(info.st_mode) or ownership and (info.st_uid != 0 or info.st_mode & 0o022)):
            raise RuntimeError('Unsafe artifact ancestor: ' + str(parent))


def overlaps(a, b):
    return a == b or a in b.parents or b in a.parents


def inventory(roots, candidate=False):
    rows = {}
    def visit(path):
        info = path.lstat()
        if info.st_dev != roots[0].lstat().st_dev:
            raise RuntimeError('Unexpected filesystem boundary')
        kind = stat.S_IFMT(info.st_mode)
        if kind not in (stat.S_IFDIR, stat.S_IFREG, stat.S_IFLNK):
            if candidate:
                raise RuntimeError('Special entry in artifact tree')
            return  # Keyring sockets are not backup data.
        if candidate and (info.st_uid != 0 or kind != stat.S_IFLNK and info.st_mode & 0o022):
            raise RuntimeError('Artifact is not root-owned and immutable to other users')
        rows[str(path)] = {'meta': metadata(info), 'link': os.readlink(path) if kind == stat.S_IFLNK else None}
        if kind == stat.S_IFDIR:
            with os.scandir(path) as children:
                for child in children:
                    visit(Path(child.path))
    for root in roots:
        visit(root)
    return rows


def unshared_bytes(path):
    """Read FIEMAP metadata only, without SYNC and without block-device I/O."""
    start, total = 0, 0
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        for _ in range(10000):
            buffer = bytearray(HDR.pack(start, 0xffffffffffffffff - start, 0, 0, 128, 0)
                               + bytes(EXT.size * 128))
            fcntl.ioctl(fd, 0xC020660B, buffer, True)
            _, _, flags, count, _, _ = HDR.unpack_from(buffer)
            if flags:
                raise RuntimeError('Unexpected extent request flags')
            if count == 0:
                return total
            for index in range(count):
                values = EXT.unpack_from(buffer, HDR.size + index * EXT.size)
                logical, _, length = values[:3]
                extent_flags = values[5]
                if extent_flags & (0x2000 | 0x2 | 0x4 | 0x8 | 0x80 | 0x100 | 0x200 | 0x400):
                    raise RuntimeError('Shared, pending or unsupported artifact extent')
                total += length
            if extent_flags & 1:
                return total
            next_start = logical + length
            if next_start <= start:
                break
            start = next_start
    finally:
        os.close(fd)
    raise RuntimeError('Artifact extent mapping did not converge')


def validate_batch(rows):
    inodes, counts = {}, collections.Counter()
    for path, row in rows.items():
        values = row['meta']
        if stat.S_ISREG(values[2]):
            key = tuple(values[:2])
            counts[key] += 1
            inodes[key] = (path, values)
    if len(inodes) != EXPECTED_FILES:
        raise RuntimeError('Reviewed artifact file count changed')
    total = 0
    for key, (path, values) in inodes.items():
        if counts[key] != values[8]:
            raise RuntimeError('An artifact has a hardlink outside the reviewed batch')
        mapped = unshared_bytes(path)
        if mapped > values[9]:
            raise RuntimeError('Extent allocation differs from inode accounting')
        total += mapped
    if total != EXPECTED_DATA_BYTES:
        raise RuntimeError('Reviewed reclaimable data allocation changed')
    return total


def runtime():
    units = {}
    text = run(['systemctl', 'list-units', '--type=service', '--state=running', '--no-legend', '--plain'])
    for line in text.splitlines():
        name = line.split()[0]
        if name.startswith(('umsa-', 'sitrep-')) or name in ESSENTIAL:
            units[name] = run(['systemctl', 'show', name,
                               '--property=MainPID,ExecMainStartTimestampMonotonic,ActiveState']).strip()
    ids = run(['docker', 'ps', '-aq', '--no-trunc']).split()
    containers = json.loads(run(['docker', 'inspect', *ids]))
    timers = {name: run(['systemctl', 'show', name, '--property=ActiveState,UnitFileState']).strip()
              for name in ('umsa-active-backup.timer', 'umsa-certificate-renew.timer')}
    return {'units': units, 'containers': {c['Id']: [c['State']['Status'], c['State']['StartedAt']]
                                         for c in containers}, 'timers': timers}


def consumers():
    def selected(value):
        value = value.removesuffix(' (deleted)')
        return any(value == str(root) or value.startswith(str(root) + '/') for root in CANDIDATES)
    for path in Path('/proc').iterdir():
        if not path.name.isdigit():
            continue
        try:
            values = [os.readlink(path / name) for name in ('cwd', 'exe')]
            values += (path / 'cmdline').read_bytes().decode(errors='replace').split('\0')
            values += [line.split(maxsplit=5)[5] for line in (path / 'maps').read_text().splitlines()
                       if len(line.split(maxsplit=5)) == 6]
            for fd in (path / 'fd').iterdir():
                try:
                    values.append(os.readlink(fd))
                except FileNotFoundError:
                    pass
        except (FileNotFoundError, ProcessLookupError):
            continue
        if any(selected(value) for value in values):
            raise RuntimeError('A process is using a reviewed artifact')
    ids = run(['docker', 'ps', '-aq']).split()
    for container in json.loads(run(['docker', 'inspect', *ids])):
        for mount in container['Mounts']:
            if any(overlaps(Path(mount['Source']), root) for root in CANDIDATES):
                raise RuntimeError('A container references a reviewed artifact')
    for line in Path('/proc/self/mountinfo').read_text().splitlines():
        mount = Path(line.split()[4].replace('\\040', ' '))
        if mount != Path('/') and any(overlaps(mount, root) for root in CANDIDATES):
            raise RuntimeError('Mount inside a reviewed artifact')
    for name in OBSOLETE:
        values = run(['systemctl', 'show', 'umsa-web-' + name + '.service',
                      '--property=MainPID,ActiveState,UnitFileState'])
        props = dict(line.split('=', 1) for line in values.splitlines())
        if props != {'MainPID': '0', 'ActiveState': 'inactive', 'UnitFileState': 'disabled'}:
            raise RuntimeError('An obsolete application is active or enabled')
    config_roots = (Path(json.loads(STATE.read_text())['config']), Path('/srv/umsa-public-vhosts'),
                    STAGE / 'sitrep-public-ingress')
    for root in config_roots:
        for path in root.rglob('*'):
            if path.is_file() and path.stat().st_size < 1024 * 1024 and path.suffix != '.log':
                text = path.read_text(errors='replace')
                if any(str(candidate) in text for candidate in CANDIDATES):
                    raise RuntimeError('An ingress file references a reviewed artifact')


def health():
    response = json.loads(run(['curl', '--noproxy', '*', '-fsS', '--max-time', '40',
                              'https://www.ultimamilla.com.ar/api/monitoring/services'], 45))
    if (response.get('status') != 'healthy' or response.get('stats', {}).get('total') != 23
            or response['stats'].get('online') != 23):
        raise RuntimeError('The 23 application probes must be healthy')
    return response['stats']


def snapshot():
    if (socket.gethostname() != 'srv2101069.hstgr.cloud'
            or hashlib.sha256(Path('/etc/machine-id').read_bytes()).hexdigest() != MACHINE_SHA
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file()):
        raise RuntimeError('Wrong production target')
    state = json.loads(STATE.read_text())
    if state != {'port': 4322, 'unit': 'umsa-web-' + CURRENT + '.service',
                 'config': str(RELEASES / CURRENT / 'nginx'),
                 'assets': str(RELEASES / CURRENT / 'application/dist/client')}:
        raise RuntimeError('Active release changed since the authorized diagnosis')
    if not (RELEASES / PREVIOUS / 'publication.complete').is_file():
        raise RuntimeError('The previous working release is missing')
    for root in PROTECTED:
        # Historical backup checkouts retain their original ownership/modes.
        # They are never mutation targets; still reject redirected ancestors.
        secure_ancestors(root, ownership=False)
    for root in CANDIDATES:
        secure_ancestors(root.parent)
        if any(overlaps(root, protected) for protected in PROTECTED):
            raise RuntimeError('Batch overlaps preserved data')
    for name in OBSOLETE:
        if set(p.name for p in (RELEASES / name / 'application').iterdir()) != {
                'dist', 'node_modules', 'package.json', 'package-lock.json'}:
            raise RuntimeError('Unexpected content in an obsolete application')
    consumers()
    rows = inventory(CANDIDATES, True)
    amount = validate_batch(rows)
    protected = inventory(PROTECTED)
    for path, row in protected.items():
        if row['link'] is not None and any(overlaps(Path(path).resolve(), root) for root in CANDIDATES):
            raise RuntimeError('Preserved data links to a reviewed artifact')
    identities = runtime()
    current_unit = 'umsa-web-' + CURRENT + '.service'
    if current_unit not in identities['units']:
        raise RuntimeError('The active web runtime is missing')
    return {'state': state, 'artifacts': rows, 'data_bytes': amount,
            'protected': protected, 'runtime': identities}


def remove_reviewed(roots, rows):
    """Unlink through verified directory descriptors; never follow a link."""
    removed_links = collections.Counter()
    children = collections.defaultdict(set)
    for path in rows:
        children[str(Path(path).parent)].add(Path(path).name)
    def check(path, info):
        expected = rows[str(path)]['meta']
        actual = metadata(info)
        # Own child removals change directory mtime/nlink and hardlink ctime.
        indices = (0, 1, 2, 3, 4) if stat.S_ISDIR(actual[2]) else (0, 1, 2, 3, 4, 5, 6, 9)
        if any(actual[index] != expected[index] for index in indices):
            raise RuntimeError('Artifact identity changed during the operation')
        if stat.S_ISREG(actual[2]) and actual[8] != expected[8] - removed_links[tuple(expected[:2])]:
            raise RuntimeError('Artifact link count changed')
        if stat.S_ISLNK(actual[2]) and os.readlink(path) != rows[str(path)]['link']:
            raise RuntimeError('Artifact link target changed')
    def visit(path, parent):
        info = os.stat(path.name, dir_fd=parent, follow_symlinks=False)
        check(path, info)
        if stat.S_ISDIR(info.st_mode):
            fd = os.open(path.name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
            try:
                check(path, os.fstat(fd))
                with os.scandir(fd) as entries:
                    names = {entry.name for entry in entries}
                if names != children[str(path)]:
                    raise RuntimeError('Unexpected artifact directory entries')
                for name in sorted(names):
                    visit(path / name, fd)
                check(path, os.stat(path.name, dir_fd=parent, follow_symlinks=False))
                os.rmdir(path.name, dir_fd=parent)
            finally:
                os.close(fd)
        else:
            os.unlink(path.name, dir_fd=parent)
            if stat.S_ISREG(info.st_mode):
                removed_links[(info.st_dev, info.st_ino)] += 1
    for root in roots:
        fd = os.open(root.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            visit(root, fd)
        finally:
            os.close(fd)


def assert_preserved(before):
    after = inventory(PROTECTED)
    for path, row in before.items():
        if stat.S_ISDIR(row['meta'][2]):
            indices = (0, 1, 2, 3, 4)
            if path not in after or any(row['meta'][i] != after[path]['meta'][i] for i in indices):
                raise RuntimeError('A preserved directory changed identity')
        elif after.get(path) != row:
            raise RuntimeError('A preserved file changed')


def main(phase, identifier, expected=''):
    if phase not in ('inspect', 'apply') or not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Unexpected CI operation')
    if phase == 'apply' and (os.environ.get('GITHUB_ACTIONS') != 'true'
                             or not re.fullmatch(r'[a-f0-9]{64}', expected)):
        raise RuntimeError('Application requires CI and a reviewed snapshot')
    os.umask(0o077)
    os.nice(19)
    subprocess.run(['ionice', '-c', '3', '-p', str(os.getpid())], check=True, capture_output=True)
    # This is the same inode/lock used by the live publisher, opened read-only.
    with open('/run/umsa-web-publish.lock', 'rb') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        before = snapshot()
        sha = digest(before)
        probes = health()
        if phase == 'inspect':
            print(json.dumps({'snapshot_sha256': sha, 'data_bytes': before['data_bytes'],
                              'paths': [str(p) for p in CANDIDATES], 'stats': probes,
                              'runtime': before['runtime']}, indent=2))
            return
        if sha != expected:
            raise RuntimeError('Artifacts, preserved data or runtime changed since inspection')
        folder = STAGE / 'reviewed-prunes' / identifier
        secure_ancestors(STAGE)
        if folder.parent.exists():
            secure_ancestors(folder.parent)
        folder.mkdir(mode=0o700, parents=True, exist_ok=False)
        with (folder / 'before.json.gz').open('xb') as raw:
            os.fchmod(raw.fileno(), 0o600)
            with gzip.GzipFile(fileobj=raw, mode='wb', compresslevel=1) as stream:
                stream.write(json.dumps(before, sort_keys=True).encode())
            raw.flush()
            os.fsync(raw.fileno())
        # Revalidate after writing the audit receipt and immediately before unlink.
        if inventory(CANDIDATES, True) != before['artifacts'] or runtime() != before['runtime']:
            raise RuntimeError('The reviewed batch or runtime changed before application')
        consumers()
        free_before = os.statvfs('/srv').f_bavail * os.statvfs('/srv').f_frsize
        try:
            remove_reviewed(CANDIDATES, before['artifacts'])
            if any(path.exists() or path.is_symlink() for path in CANDIDATES):
                raise RuntimeError('A reviewed artifact remains after application')
            assert_preserved(before['protected'])
            if runtime() != before['runtime']:
                raise RuntimeError('A service or container changed identity')
            after_probes = health()
            free_after = os.statvfs('/srv').f_bavail * os.statvfs('/srv').f_frsize
            receipt = {'ok': True, 'run': identifier, 'snapshot_sha256': sha,
                       'data_bytes': before['data_bytes'], 'freed_bytes': free_after - free_before,
                       'free_before': free_before, 'free_after': free_after,
                       'paths_absent': all(not p.exists() and not p.is_symlink() for p in CANDIDATES),
                       'protected_files_verified': sum(not stat.S_ISDIR(r['meta'][2])
                                                       for r in before['protected'].values()),
                       'active_release': CURRENT, 'previous_release': PREVIOUS,
                       'backups_preserved': True, 'runtime_unchanged': True,
                       'services_restarted': False, 'stats': after_probes}
            (folder / 'complete.json').write_text(json.dumps(receipt, indent=2) + '\n')
            print(json.dumps(receipt))
        except BaseException as error:
            # No automatic restore into live paths: originals are redundant artifacts.
            (folder / 'failed.json').write_text(json.dumps({'ok': False, 'error': type(error).__name__,
                                                          'snapshot_sha256': sha}) + '\n')
            raise


if __name__ == '__main__':
    main(*sys.argv[1:])
