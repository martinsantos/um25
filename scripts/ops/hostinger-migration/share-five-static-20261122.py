"""Share identical static files in the five remaining approved inactive releases."""
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shlex
import sys

ROOT = Path('/srv/umsa-web-releases')
PILOT = Path('/usr/local/libexec/umsa/share-static.py')
PILOT_SHA256 = 'f93180d7381417194fcbf54fb0a2b64f976b3cb9ae66a1f09c4dce1689999839'
UNIT = 'umsa-share-static-five-20261122.service'
TARGETS = (
    '50a46ceb966aaa68f64c1560ccb9d8a0d23dab48-44776779756-1',
    '22bfe60bbcd4ec829a012d9c0b5fd1deabe6e972-44757462414-1',
    'ba766adae1e187e28d50965cc16063c279a61766-44716855504-1',
    'df6f62343c2baa5c1ba18607e8ce21970a0b7acb-44638324784-1',
    '9dc036d676abca2b930af5f1fe5432a0f6a11273-44353844332-1',
)

def static_dir(target):
    return ROOT / target / 'application/dist/client'

def command():
    writable = ' '.join(str(static_dir(name)) for name in TARGETS)
    properties = ['ProtectSystem=strict', 'ReadWritePaths=' + writable,
                  'ProtectHome=yes', 'PrivateNetwork=yes', 'PrivateTmp=yes',
                  'NoNewPrivileges=yes', 'RestrictAddressFamilies=AF_UNIX',
                  'CapabilityBoundingSet=CAP_DAC_OVERRIDE CAP_FOWNER',
                  'UMask=0077', 'Nice=19', 'IOSchedulingClass=idle', 'RuntimeMaxSec=45min']
    return shlex.join(['systemd-run', '--quiet', '--wait', '--pipe', '--collect',
                       '--service-type=exec', '--unit='+UNIT,
                       *['--property='+v for v in properties], '/usr/bin/python3', '-IBu', '-', 'apply'])

def checked_pilot():
    if PILOT.resolve() != PILOT or PILOT.stat().st_uid != 0 or PILOT.stat().st_mode & 0o022:
        raise RuntimeError('Unexpected pilot ownership or permissions')
    if hashlib.sha256(PILOT.read_bytes()).hexdigest() != PILOT_SHA256:
        raise RuntimeError('Installed pilot differs from the reviewed implementation')
    spec = importlib.util.spec_from_file_location('umsa_static_pilot', PILOT)
    pilot = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pilot)
    return pilot

def check_targets(pilot, state):
    pilot.require(pilot.guard() == state, 'Publication or backup state changed')
    for name in TARGETS:
        path = static_dir(name)
        unit = 'umsa-web-' + name + '.service'
        pilot.require(name not in (pilot.ACTIVE, *pilot.RETURNS, *pilot.TARGETS), 'Protected release')
        pilot.require(path.resolve() == path and path.is_dir() and (ROOT/name/'publication.complete').is_file(),
                      'Unexpected static directory')
        pilot.require(pilot.system_state(unit,'ActiveState') == 'inactive'
                      and pilot.system_state(unit,'UnitFileState') == 'disabled', 'Target in use')

def run(apply):
    pilot = checked_pilot()
    if apply:
        groups = Path('/proc/self/cgroup').read_text().splitlines()
        pilot.require(any(g.split(':',2)[-1] == '/system.slice/'+UNIT for g in groups),
                      'Apply only in the designated transient unit')
        for path in [static_dir(n) for n in [pilot.ACTIVE, *pilot.RETURNS, *pilot.TARGETS]]:
            pilot.require(os.statvfs(path).f_flag & os.ST_RDONLY, 'Expected a read-only protected mount')
        for name in TARGETS:
            pilot.require(not os.statvfs(static_dir(name)).f_flag & os.ST_RDONLY, 'Expected writable candidate')
    with open('/run/umsa-web-publish.lock','rb') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = pilot.guard()
        check_targets(pilot,state)
        active = Path(state['assets'])
        reference = pilot.manifest(active)
        for name in TARGETS:
            check_targets(pilot,state)
            pilot.release(name,reference,active,apply)
        check_targets(pilot,state)

def verify(stream):
    rows = [json.loads(line) for line in stream if line.strip()]
    if [r['target'] for r in rows] != list(TARGETS):
        raise RuntimeError('Incomplete or unexpected release receipts')
    for r in rows:
        if r['mode'] != 'apply' or r['pairs'] <= 0 or r['exclusive_after'] != 0 or r['recovered'] != r['exclusive_before']:
            raise RuntimeError('Unexpected receipt for '+r['target'])
    print('Verified physical bytes recovered:', sum(r['recovered'] for r in rows))

if __name__ == '__main__':
    if sys.argv[1:] == ['command']:
        print(command())
    elif sys.argv[1:] == ['verify']:
        verify(sys.stdin)
    elif sys.argv[1:] in (['inspect'], ['apply']):
        run(sys.argv[1] == 'apply')
    else:
        raise SystemExit('Expected command, inspect, apply or verify')
