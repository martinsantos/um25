#!/usr/bin/env python3
"""Remove only the three transfer archives reviewed on 2026-11-13.

Installed releases, rollback packages and backups are never deletion targets.
After this one-off batch is gone the publication preflight is a read-only no-op.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import socket
import stat
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
INCOMING = STAGE / 'incoming'
RELEASES = Path('/srv/umsa-web-releases')
CURRENT = '67cc8e80581792a71a8854fc5d1a10f1cdea9b72-43331723354-1'
RETAINED = (CURRENT,
    '35b332522497ed3efa427c8e388f3a0052ee8408-43066659226-1',
    '7052328ccecfe9d156ea012529cdf492fa6a3be0-43032203710-1',
)
APPROVED = {
    '0135aeb32866f903a9054313e23a8915d704174f-42999718049-1':
        (2099553758, '7a34754ac45651f5285d62d95cd05b5a12c0e80a2f3eee306561d2321c527137'),
    '131a2c6afde2cd880ab36986c5d0e853f0d5b477-43004196764-1':
        (2099561583, 'd07cd05dc413c6fc1b6ca308ca26e33c63ba58d3574893e33039c1831a0be9ef'),
    '9a78665ffb65562d52e8384d90dd9f823dbb1140-43015066244-1':
        (2102439782, '70388bf85c17f44a23624cb1f399ef80c41db961157e227df6c634684d63a569'),
}
MACHINE_SHA = '315fee7b2c6314049537fc82c6b2168500d14f416911a2b1226a3569aaf91c1c'
ROOT_UID = 0


def run(*args):
    return subprocess.check_output(args, text=True, timeout=40).strip()


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def metadata(info):
    return [info.st_dev, info.st_ino, info.st_mode, info.st_uid, info.st_gid,
            info.st_size, info.st_mtime_ns, info.st_ctime_ns, info.st_nlink]


def secure_directory(path):
    for part in reversed((path, *path.parents)):
        info = part.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != ROOT_UID or info.st_mode & 0o022:
            raise RuntimeError('Unsafe directory: ' + str(part))


def validate_archive(path, expected):
    secure_directory(path.parent)
    with open(os.open(path, os.O_RDONLY | os.O_NOFOLLOW), 'rb') as stream:
        before = os.fstat(stream.fileno())
        if (not stat.S_ISREG(before.st_mode) or before.st_nlink != 1 or
                before.st_uid != ROOT_UID or before.st_mode & 0o022 or before.st_size != expected[0]):
            raise RuntimeError('Archive identity or permissions changed: ' + str(path))
        hasher = hashlib.sha256()
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(block)
        sha = hasher.hexdigest()
        if sha != expected[1] or metadata(before) != metadata(os.fstat(stream.fileno())):
            raise RuntimeError('Archive contents changed: ' + str(path))
    if metadata(path.lstat()) != metadata(before):
        raise RuntimeError('Archive replaced while reading: ' + str(path))
    return {'meta': metadata(before), 'sha256': sha}


def receipt(name):
    root = RELEASES / name
    secure_directory(root / 'application/dist/server')
    if not (root / 'application/dist/server/entry.mjs').is_file():
        raise RuntimeError('Missing installed runtime: ' + name)
    path = root / 'publication.complete'
    if not stat.S_ISREG(path.lstat().st_mode):
        raise RuntimeError('Invalid release receipt')
    data = json.loads(path.read_text())
    if data != {'port': data.get('port'), 'unit': 'umsa-web-' + name + '.service',
                'config': str(root / 'nginx'), 'assets': str(root / 'application/dist/client')}:
        raise RuntimeError('Release receipt mismatch')
    return data


def runtime():
    unit = 'umsa-web-' + CURRENT + '.service'
    data = dict(line.split('=', 1) for line in run('systemctl', 'show', unit,
        '--property=ActiveState,MainPID,NRestarts,ExecMainStartTimestampMonotonic').splitlines())
    if data['ActiveState'] != 'active' or data['MainPID'] == '0':
        raise RuntimeError('Reviewed runtime is not active')
    if run('systemctl', 'is-active', 'umsa-sitrep-ingress.service') != 'active':
        raise RuntimeError('Public ingress is not active')
    return data


def preserved():
    paths = [STAGE / 'web-publication-state.json', STAGE / 'production.active']
    for directory in RELEASES.iterdir():
        paths.append(directory)
        if (directory / 'publication.complete').exists():
            paths.append(directory / 'publication.complete')
    paths.extend(path for path in INCOMING.iterdir() if path.name not in
                 {name + '.tar.gz' for name in APPROVED})
    paths.extend([Path('/srv/umsa-operational-backups'), Path('/root/fumbling-field/backups')])
    return {str(path): metadata(path.lstat()) for path in paths}


def no_open_consumers(paths):
    selected = {str(path) for path in paths}
    for proc in Path('/proc').iterdir():
        if not proc.name.isdigit():
            continue
        try:
            for fd in (proc / 'fd').iterdir():
                try:
                    if os.readlink(fd).removesuffix(' (deleted)') in selected:
                        raise RuntimeError('An archive is in use')
                except FileNotFoundError:
                    pass
        except (FileNotFoundError, ProcessLookupError):
            pass


def snapshot():
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or
            hashlib.sha256(Path('/etc/machine-id').read_bytes()).hexdigest() != MACHINE_SHA or
            (STAGE / '.target').read_text().strip() != '179.198.115.115'):
        raise RuntimeError('Wrong target')
    secure_directory(INCOMING)
    selected = {name: INCOMING / (name + '.tar.gz') for name in APPROVED
                if os.path.lexists(INCOMING / (name + '.tar.gz'))}
    if not selected:
        return {'status': 'already_removed', 'artifacts': {}}
    active = json.loads((STAGE / 'web-publication-state.json').read_text())
    if active != receipt(CURRENT) or not (STAGE / 'production.active').is_file():
        raise RuntimeError('Active release changed; a fresh review is required')
    for name in RETAINED:
        receipt(name)
        if not (INCOMING / (name + '.tar.gz')).is_file():
            raise RuntimeError('A retained rollback archive is missing')
    for name in APPROVED:
        receipt(name)
        if run('systemctl', 'show', 'umsa-web-' + name + '.service', '--property=ActiveState', '--value') != 'inactive':
            raise RuntimeError('A selected old version is active')
    no_open_consumers(selected.values())
    artifacts = {name: validate_archive(path, APPROVED[name]) for name, path in selected.items()}
    return {'status': 'ready', 'artifacts': artifacts, 'runtime': runtime(), 'preserved': preserved()}


def remove_exact(artifacts):
    if not set(artifacts) <= set(APPROVED):
        raise RuntimeError('Unapproved deletion target')
    secure_directory(INCOMING)
    fd = os.open(INCOMING, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for name, row in artifacts.items():
            filename = name + '.tar.gz'
            info = os.stat(filename, dir_fd=fd, follow_symlinks=False)
            if metadata(info) != row['meta']:
                raise RuntimeError('Archive replaced before deletion')
        no_open_consumers(INCOMING / (name + '.tar.gz') for name in artifacts)
        for name, row in artifacts.items():
            filename = name + '.tar.gz'
            if metadata(os.stat(filename, dir_fd=fd, follow_symlinks=False)) != row['meta']:
                raise RuntimeError('Archive replaced during deletion')
            os.unlink(filename, dir_fd=fd)
    finally:
        os.close(fd)


def main():
    phase = sys.argv[1]
    if phase not in ('inspect', 'apply'):
        raise RuntimeError('Unknown phase')
    if phase == 'inspect':
        state = snapshot()
        print(json.dumps({'snapshot_sha256': digest(state), 'snapshot': state}, sort_keys=True))
        return
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Only GitHub Actions may apply the authorized cleanup')
    with open('/run/umsa-web-publish.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = snapshot()
        if len(sys.argv) != 3 or digest(state) != sys.argv[2]:
            raise RuntimeError('Inspection snapshot changed')
        if state['status'] == 'already_removed':
            print(json.dumps({'status': 'already_removed', 'deleted': []}))
            return
        free_before = os.statvfs(INCOMING).f_bavail * os.statvfs(INCOMING).f_frsize
        remove_exact(state['artifacts'])
        if preserved() != state['preserved'] or runtime() != state['runtime']:
            raise RuntimeError('Preserved files or runtime changed during cleanup')
        free_after = os.statvfs(INCOMING).f_bavail * os.statvfs(INCOMING).f_frsize
        print(json.dumps({'status': 'removed', 'deleted': list(state['artifacts']),
            'data_bytes': sum(APPROVED[name][0] for name in state['artifacts']),
            'free_before': free_before, 'free_after': free_after, 'runtime': state['runtime']}))


if __name__ == '__main__':
    main()
