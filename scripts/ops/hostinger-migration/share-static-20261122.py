"""One-off Hostinger maintenance for two inactive UMSA web installations."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import socket
import stat
import struct
import subprocess
import sys

ROOT = Path('/srv/umsa-web-releases')
STATE = Path('/srv/umsa-migration/web-publication-state.json')
ACTIVE = '9d6b7c00f53be508bf0414f61c5788ba060d2472-44951482589-1'
RETURNS = ('2e3f76b99044bbd05fe3bc30a555f6dba598398a-44924065945-1',
           'cd55cedf308e4904916cf57e8a3a29871c6cbd82-44913286978-1')
TARGETS = ('866d00cdb5855c0488dcd74cda7d9f1b318dee00-44828517985-1',
           'a5d3fbaf8dfecd08c43aba7900eab486c1ba573b-44789660605-1')
HDR = struct.Struct('=QQIIII')
EXT = struct.Struct('=QQQQQIIII')
CHUNK = 8 * 1024 * 1024

def require(condition, description):
    if not condition:
        raise RuntimeError(description)

def system_state(unit, prop):
    return subprocess.check_output(['systemctl', 'show', unit, '-p', prop, '--value'], text=True).strip()

def guard():
    require(socket.gethostname() == 'srv2101069.hstgr.cloud', 'Wrong host')
    active = ROOT / ACTIVE / 'application/dist/client'
    require(system_state('umsa-active-backup.service', 'ActiveState') == 'inactive', 'Backup running or in transition')
    current = json.loads(STATE.read_bytes())
    require(current['assets'] == str(active) and current['unit'] == 'umsa-web-' + ACTIVE + '.service', 'Active installation changed')
    require(system_state(current['unit'], 'ActiveState') == 'active', 'Web service inactive')
    installed = [p for p in ROOT.glob('*/publication.complete') if (p.parent/'application/dist/server/entry.mjs').is_file()]
    installed.sort(key=lambda p: p.stat().st_mtime_ns, reverse=True)
    require([p.parent.name for p in installed[:3]] == [ACTIVE, *RETURNS], 'Protected versions changed')
    for name in TARGETS:
        unit = 'umsa-web-' + name + '.service'
        require(system_state(unit, 'ActiveState') == 'inactive' and system_state(unit, 'UnitFileState') == 'disabled', 'Target in use')
        directory = ROOT / name / 'application/dist/client'
        require(directory.is_dir() and directory.resolve() == directory and (directory.parents[2]/'publication.complete').is_file(), 'Unexpected target path')
    require(active.resolve() == active, 'Unexpected reference path')
    return current

def opened(path, writable=False):
    flags = os.O_NOFOLLOW | os.O_NOATIME | (os.O_RDWR if writable else os.O_RDONLY)
    return os.fdopen(os.open(path, flags), 'r+b' if writable else 'rb')

def signature(stream):
    h = hashlib.sha256()
    for block in iter(lambda: stream.read(1024*1024), b''):
        h.update(block)
    return h.digest()

def meta(st):
    return (st.st_dev, st.st_ino, st.st_nlink, st.st_size, st.st_mode, st.st_uid, st.st_gid, st.st_mtime_ns)

def manifest(root):
    records = {}
    for folder, dirs, files in os.walk(root, followlinks=False, onerror=raise_error):
        for name in dirs + files:
            p = Path(folder) / name
            st = p.lstat()
            content = None
            if stat.S_ISREG(st.st_mode):
                with opened(p) as stream:
                    require(meta(os.fstat(stream.fileno())) == meta(st), 'File changed during inventory')
                    content = signature(stream)
            elif stat.S_ISLNK(st.st_mode):
                content = os.readlink(p)
            records[p.relative_to(root)] = (meta(st), content)
    return records

def raise_error(error):
    raise error

def exclusive_bytes(fd):
    start = total = 0
    while True:
        buf = bytearray(HDR.pack(start, 2**64-1-start, 0, 0, 128, 0) + bytes(EXT.size * 128))
        fcntl.ioctl(fd, 0xC020660B, buf, True)
        count = HDR.unpack_from(buf)[3]
        if not count:
            return total
        for index in range(count):
            logical, _, length, _, _, flags, *_ = EXT.unpack_from(buf, HDR.size + index * EXT.size)
            require(length > 0 and logical >= start, 'Invalid FIEMAP extent')
            if not flags & ~(1 | 0x800):
                total += length
            start = logical + length
        if flags & 1:
            return total

def share(source, dest, size):
    for offset in range(0, size, CHUNK):
        length = min(CHUNK, size-offset)
        buf = bytearray(struct.pack('=QQHHI', offset, length, 1, 0, 0) + struct.pack('=qQQiI', dest, offset, 0, 0, 0))
        fcntl.ioctl(source, 0xC0189436, buf, True)
        _, _, done, status, _ = struct.unpack_from('=qQQiI', buf, 24)
        require(status == 0 and done == length, 'XFS did not confirm identical range')

def free():
    s = os.statvfs(ROOT)
    return s.f_bavail * s.f_frsize

def release(name, reference, active, apply):
    target = ROOT / name / 'application/dist/client'
    entries = manifest(target)
    initial = free()
    before = after = count = 0
    for k, (m, digest) in entries.items():
        if k not in reference or not stat.S_ISREG(m[4]) or m[2] != 1 or not m[3]:
            continue
        original, h = reference[k]
        if not stat.S_ISREG(original[4]) or original[2] != 1 or original[3] != m[3] or h != digest:
            continue
        require(original[0] == m[0] and original[1] != m[1], 'Unexpected identity')
        with opened(active/k) as src, opened(target/k, apply) as dst:
            require(meta(os.fstat(src.fileno())) == original and meta(os.fstat(dst.fileno())) == m, 'File changed after comparison')
            size = exclusive_bytes(dst.fileno())
            before += size
            if apply and size:
                share(src.fileno(), dst.fileno(), m[3])
            after += exclusive_bytes(dst.fileno()) if apply else size
            count += 1
    if apply:
        require(manifest(target) == entries and manifest(active) == reference, 'File identity or content changed')
    guard()
    print(json.dumps(dict(target=name, mode='apply' if apply else 'inspect', pairs=count, exclusive_before=before, exclusive_after=after, recovered=before-after, free_before=initial, free_after=free(), checked_entries=len(entries))), flush=True)

if __name__ == '__main__':
    require(sys.argv[1:] in (['inspect'], ['apply']), 'Expected inspect or apply')
    apply = sys.argv[1] == 'apply'
    if apply:
        # systemd and its root-owned unit define the command and writable paths.
        groups = Path('/proc/self/cgroup').read_text().splitlines()
        require(any(line.split(':', 2)[-1] == '/system.slice/umsa-share-static.service'
                    for line in groups), 'Apply only inside the designated system service')
    # Use the publisher's existing lock without creating or truncating it.
    with open('/run/umsa-web-publish.lock', 'rb') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = guard()
        active = Path(state['assets'])
        reference = manifest(active)
        for target_name in TARGETS:
            require(guard() == state, 'Publisher state changed')
            release(target_name, reference, active, apply)
