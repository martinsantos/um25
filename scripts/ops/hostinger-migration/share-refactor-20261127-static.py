"""Share identical static files in the one inactive release approved for the November 27 UI publication."""
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
UNIT = 'umsa-share-refactor-20261127.service'
ACTIVE = '22d51a5e7b55947a320ce8a976eaf3e63b1c368e-45722065914-1'
RETURNS = ('855a98433a502f18dfcd593fa82b4ceb6c5af8ea-45621741427-1', '7e944561a9c3be41da67c10b00926612fac9e2ff-45596604717-1')
TARGETS = ('8abba85ba4faa623fe361dc2b91bb18b4b5789d6-45471738890-1',)

def static_dir(target):
    return ROOT / target / 'application/dist/client'

def command(required):
    writable = ' '.join(str(static_dir(name)) for name in TARGETS)
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

def run(apply, required=0):
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
            available = pilot.free()
            if apply and available >= required:
                print(json.dumps(dict(target=name, mode='sufficient_space', available=available)), flush=True)
            else:
                pilot.release(name,reference,active,apply)
        check_targets(pilot,state)

def verify(stream, required):
    rows = [json.loads(line) for line in stream if line.strip()]
    if [r['target'] for r in rows] != list(TARGETS):
        raise RuntimeError('Incomplete or unexpected release receipts')
    for r in rows:
        if r['mode'] == 'sufficient_space' and r['available'] >= required:
            continue
        if r['mode'] != 'apply' or r['pairs'] <= 0 or r['exclusive_after'] != 0 or r['recovered'] != r['exclusive_before']:
            raise RuntimeError('Unexpected receipt for '+r['target'])
    print('Verified physical bytes recovered:', sum(r.get('recovered', 0) for r in rows))

if __name__ == '__main__':
    if sys.argv[1:] == ['inspect']:
        run(False)
    elif len(sys.argv) == 3 and sys.argv[2].isdecimal() and int(sys.argv[2]) > 0:
        required = int(sys.argv[2])
        if sys.argv[1] == 'command':
            print(command(required))
        elif sys.argv[1] == 'apply':
            run(True, required)
        elif sys.argv[1] == 'verify':
            verify(sys.stdin, required)
        else:
            raise SystemExit('Unknown operation')
    else:
        raise SystemExit('Expected inspect or command/apply/verify with required bytes')
