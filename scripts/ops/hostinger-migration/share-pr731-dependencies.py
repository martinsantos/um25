"""Share only identical dependency blocks in the 12 releases approved for PR 731."""
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shlex
import stat
import sys

ROOT = Path('/srv/umsa-web-releases')
PILOT = Path('/usr/local/libexec/umsa/share-static.py')
PILOT_SHA256 = 'f93180d7381417194fcbf54fb0a2b64f976b3cb9ae66a1f09c4dce1689999839'
UNIT = 'umsa-share-pr731-dependencies.service'
ACTIVE = '838f085d0c66cc824eb58d2b9d2cd932f3f477fa-46034898409-1'
RETURNS = (
    '5db725a2f8af15564cb355b2d0f557d4118f03db-46014069327-1',
    '5b3126173e887f1cb51879b39f8ff4d2def3a05c-45978067788-1',
)
TARGETS = (
    '855a98433a502f18dfcd593fa82b4ceb6c5af8ea-45621741427-1',
    '7e944561a9c3be41da67c10b00926612fac9e2ff-45596604717-1',
    '8abba85ba4faa623fe361dc2b91bb18b4b5789d6-45471738890-1',
    '1d6710163b0181bb35b7f85664246708208d4743-45449832120-1',
    '28f931c73838064aaafe0febde1a58ebb75a4910-45432902505-1',
    'ed55f07fbcf4a28869996a71bb0e29b2638d6441-45249789027-1',
    '8ed527635d8c0f3bbdf869c7cb31c3d38457df05-45209428218-1',
    '14f54947c91902fe9bdb390d41aa16d1c74f8a37-45188287522-1',
    'e4c8024ab6231aa6e8eab99dc9191ce77cbd5bf2-45165225906-1',
    '18ad104d50345dccd160a53796ffd78d3af77ba3-45073185167-1',
    'bb35338156cbb55fe87109e1e824090140d644ac-45032835173-1',
    '9d6b7c00f53be508bf0414f61c5788ba060d2472-44951482589-1',
)

def dependencies(target):
    return ROOT / target / 'application/node_modules'

def command(required):
    writable = ' '.join(str(dependencies(name)) for name in TARGETS)
    properties = ['ProtectSystem=strict', 'ReadWritePaths=' + writable,
                  'ProtectHome=yes', 'PrivateNetwork=yes', 'PrivateTmp=yes',
                  'NoNewPrivileges=yes', 'RestrictAddressFamilies=AF_UNIX',
                  'CapabilityBoundingSet=CAP_DAC_OVERRIDE CAP_FOWNER',
                  'UMask=0077', 'Nice=19', 'IOSchedulingClass=idle', 'RuntimeMaxSec=45min']
    return shlex.join(['systemd-run', '--quiet', '--wait', '--pipe', '--collect',
                       '--service-type=exec', '--unit='+UNIT,
                       *['--property='+v for v in properties], '/usr/bin/python3', '-IBu', '-', 'apply', str(required)])

def checked_pilot():
    if PILOT.resolve() != PILOT or PILOT.stat().st_uid != 0 or PILOT.stat().st_mode & 0o022:
        raise RuntimeError('Unexpected pilot ownership or permissions')
    if hashlib.sha256(PILOT.read_bytes()).hexdigest() != PILOT_SHA256:
        raise RuntimeError('Installed pilot differs from the reviewed implementation')
    spec = importlib.util.spec_from_file_location('umsa_static_pilot', PILOT)
    pilot = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pilot)
    pilot.ACTIVE = ACTIVE
    pilot.RETURNS = RETURNS
    pilot.TARGETS = ()
    return pilot

def check_targets(pilot, state):
    pilot.require(pilot.guard() == state, 'Publication or backup state changed')
    for name in TARGETS:
        path = dependencies(name)
        unit = 'umsa-web-' + name + '.service'
        receipt = path.parents[1] / 'publication.complete'
        pilot.require(name not in (ACTIVE, *RETURNS), 'Protected release selected')
        pilot.require(path.is_dir() and path.resolve() == path and receipt.is_file()
                      and not receipt.is_symlink(), 'Unexpected release path')
        pilot.require(pilot.system_state(unit, 'ActiveState') == 'inactive'
                      and pilot.system_state(unit, 'UnitFileState') == 'disabled'
                      and pilot.system_state(unit, 'MainPID') == '0', 'Target in use')


def same_file_data(source, destination):
    src, src_digest = source
    dst, dst_digest = destination
    # The manifest preserves inode, link count, mode, owner, size, mtime and content.
    return (
        stat.S_ISREG(src[4]) and src[2] == 1
        and stat.S_ISREG(dst[4]) and dst[2] == 1 and dst[3] > 0
        and src[0] == dst[0] and src[1] != dst[1] and src[3:7] == dst[3:7]
        and src[5] == 0 and not src[4] & 0o022
        and src_digest == dst_digest
    )


def share_release(pilot, name, source, reference):
    target = dependencies(name)
    entries = pilot.manifest(target)
    initial = pilot.free()
    pairs = before = after = 0
    for relative in entries.keys() & reference.keys():
        original, _ = reference[relative]
        reviewed, _ = entries[relative]
        if not same_file_data(reference[relative], entries[relative]):
            continue
        with pilot.opened(source / relative) as src, pilot.opened(target / relative, True) as dst:
            pilot.require(pilot.meta(os.fstat(src.fileno())) == original
                          and pilot.meta(os.fstat(dst.fileno())) == reviewed,
                          'File identity changed after comparison')
            exclusive = pilot.exclusive_bytes(dst.fileno())
            if exclusive:
                pilot.share(src.fileno(), dst.fileno(), reviewed[3])
                remaining = pilot.exclusive_bytes(dst.fileno())
                pilot.require(remaining == 0, 'XFS left exclusive blocks in the matched file')
                before += exclusive
                after += remaining
            pairs += 1
    pilot.require(pairs > 0 and pilot.manifest(target) == entries,
                  'Missing matching files or changed target contents')
    print(json.dumps(dict(target=name, pairs=pairs, recovered=before-after,
                          exclusive_before=before, exclusive_after=after,
                          free_before=initial, free_after=pilot.free(),
                          checked_entries=len(entries))), flush=True)


def apply(required):
    pilot = checked_pilot()
    groups = Path('/proc/self/cgroup').read_text().splitlines()
    pilot.require(any(g.split(':', 2)[-1] == '/system.slice/' + UNIT for g in groups),
                  'Apply only in the designated transient unit')
    for name in (ACTIVE, *RETURNS):
        pilot.require(os.statvfs(dependencies(name)).f_flag & os.ST_RDONLY,
                      'Expected a read-only protected path')
    for name in TARGETS:
        pilot.require(not os.statvfs(dependencies(name)).f_flag & os.ST_RDONLY,
                      'Expected writable candidate')

    with open('/run/umsa-web-publish.lock', 'rb') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = pilot.guard()
        check_targets(pilot, state)
        source = dependencies(ACTIVE)
        pilot.require(source.is_dir() and source.resolve() == source, 'Unexpected reference path')
        reference = pilot.manifest(source)
        for name in TARGETS:
            check_targets(pilot, state)
            share_release(pilot, name, source, reference)
        pilot.require(pilot.manifest(source) == reference, 'Reference contents changed')
        check_targets(pilot, state)
        available = pilot.free()
        print(json.dumps(dict(available=available, required=required)), flush=True)


def verify(stream, required):
    *receipts, final = [json.loads(line) for line in stream if line.strip()]
    if [r['target'] for r in receipts] != list(TARGETS):
        raise RuntimeError('Incomplete or unexpected release receipts')
    for row in receipts:
        if (row['pairs'] <= 0 or row['exclusive_after'] != 0
                or row['recovered'] != row['exclusive_before'] or row['recovered'] < 0):
            raise RuntimeError('Unexpected receipt for ' + row['target'])
    print('Verified physical bytes recovered:', sum(r['recovered'] for r in receipts))
    if final['required'] != required or final['available'] < required:
        raise RuntimeError('Insufficient disk for publication and next backup')


if __name__ == '__main__':
    if len(sys.argv) != 3 or not sys.argv[2].isdecimal() or int(sys.argv[2]) <= 0:
        raise SystemExit('Expected command/apply/verify with required bytes')
    requested = int(sys.argv[2])
    if sys.argv[1] == 'command':
        print(command(requested))
    elif sys.argv[1] == 'apply':
        apply(requested)
    elif sys.argv[1] == 'verify':
        verify(sys.stdin, requested)
    else:
        raise SystemExit('Unknown operation')
