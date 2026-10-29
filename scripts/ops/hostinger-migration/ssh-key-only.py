"""Pin Hostinger SSH to existing keys with an independent timed rollback."""
import fcntl
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import stat
import subprocess
import sys
import time

HOST_SHA = '315fee7b2c6314049537fc82c6b2168500d14f416911a2b1226a3569aaf91c1c'
BASE = Path('/srv/umsa-migration/ssh-key-only')
DROPIN = Path('/etc/ssh/sshd_config.d/00-umsa-key-only.conf')
MAIN = Path('/etc/ssh/sshd_config')
KEYS = Path('/root/.ssh/authorized_keys')
LOCK = Path('/run/umsa-ssh-key-only.lock')
OWNER = (0, 0)
EXPECTED_KEYS = {'SHA256:06qC0ZXBT3yiJF9IkvD2lGmf98Dnyr7P80llKE6NIDM',
                 'SHA256:XK2RWnbZC93pZZmOpAT4LAhCRP7lokKFgbXKKKo6cQo'}
CONTENT = b'''# Reviewed UMSA key-only SSH policy; existing authorized keys are preserved.
PubkeyAuthentication yes
AuthenticationMethods publickey
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin prohibit-password
PermitEmptyPasswords no
GSSAPIAuthentication no
HostbasedAuthentication no
'''
WANTED = {'pubkeyauthentication': 'yes', 'authenticationmethods': 'publickey',
          'passwordauthentication': 'no', 'kbdinteractiveauthentication': 'no',
          'permitemptypasswords': 'no', 'gssapiauthentication': 'no',
          'hostbasedauthentication': 'no'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run(args):
    p = subprocess.run(args, capture_output=True, text=True, timeout=30)
    if p.returncode:
        raise RuntimeError('Required SSH validation or timed rollback operation failed')
    return p.stdout.strip()


def guard():
    if (os.geteuid() != 0 or socket.gethostname() != 'srv2101069.hstgr.cloud' or
            sha(Path('/etc/machine-id').read_bytes()) != HOST_SHA):
        raise RuntimeError('Wrong Hostinger machine')


def safe(path, directory=False):
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise RuntimeError('Unexpected symlink in SSH operation')
    s = path.lstat()
    expected = stat.S_ISDIR(s.st_mode) if directory else stat.S_ISREG(s.st_mode)
    if not expected or (s.st_uid, s.st_gid) != OWNER or s.st_mode & 0o022 or (not directory and s.st_nlink != 1):
        raise RuntimeError('Unexpected SSH ownership, mode or hardlink')
    return s


def fingerprint_file(path):
    s = path.lstat()
    return {'sha256': sha(path.read_bytes()), 'mode': s.st_mode,
            'uid': s.st_uid, 'gid': s.st_gid,
            'link': os.readlink(path) if path.is_symlink() else None}


def snapshot():
    guard()
    safe(MAIN)
    safe(DROPIN.parent, True)
    safe(KEYS)
    safe(KEYS.parent, True)
    paths = [MAIN, *sorted(DROPIN.parent.glob('*.conf'))]
    crypto = Path('/etc/crypto-policies/back-ends/opensshserver.config')
    if crypto.exists():
        paths.append(crypto)
    configs = {str(p): fingerprint_file(p) for p in paths if p != DROPIN}
    fingerprints = set()
    for line in KEYS.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        p = subprocess.run(['ssh-keygen', '-lf', '-'], input=line, capture_output=True, text=True)
        if p.returncode or len(p.stdout.split()) < 2:
            raise RuntimeError('Cannot verify existing authorized key')
        fingerprints.add(p.stdout.split()[1])
    if not EXPECTED_KEYS.issubset(fingerprints):
        raise RuntimeError('Both existing administrative keys are required')
    value = {'configs': configs, 'authorized_keys': fingerprint_file(KEYS),
             'key_fingerprints': sorted(fingerprints)}
    return value, sha(json.dumps(value, sort_keys=True).encode())


def effective(config=None, user='root'):
    args = ['sshd', '-T']
    if config:
        args += ['-f', str(config)]
    connection = os.environ.get('SSH_CONNECTION', '').split()
    addr = str(ipaddress.ip_address(connection[0])) if connection else '127.0.0.1'
    args += ['-C', 'user=' + user + ',host=srv2101069.hstgr.cloud,addr=' + addr]
    return dict(line.split(None, 1) for line in run(args).splitlines() if ' ' in line)


def verify_policy(config=None):
    for user in ('root', 'nobody'):
        values = effective(config, user)
        if (any(values.get(k) != v for k, v in WANTED.items()) or
                values.get('permitrootlogin') not in ('prohibit-password', 'without-password')):
            raise RuntimeError('Effective SSH configuration is not key-only')
    return {k: values[k] for k in [*WANTED, 'permitrootlogin']}


def daemon():
    return run(['systemctl', 'show', 'sshd', '-p', 'MainPID', '-p', 'ExecMainStartTimestamp'])


def operation_id(value):
    if not re.fullmatch(r'[0-9]+-[0-9]+', value):
        raise RuntimeError('Unexpected operation ID')
    return value


def save(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(data, stream, sort_keys=True)
        stream.write('\n')


def timer(operation):
    return 'umsa-ssh-key-rollback-' + operation


def rollback(operation):
    folder = BASE / operation_id(operation)
    safe(folder, True)
    state = json.loads((folder / 'state.json').read_text())
    if (folder / 'confirmed.json').exists():
        return {'ok': True, 'rollback': 'not-required-after-confirmation'}
    if DROPIN.exists():
        safe(DROPIN)
        if DROPIN.read_bytes() != CONTENT:
            raise RuntimeError('Preserve an unexpected external SSH configuration')
        DROPIN.unlink()
    current, _ = snapshot()
    if current != state['before']:
        raise RuntimeError('Legacy SSH configuration changed independently')
    run(['sshd', '-t'])
    run(['systemctl', 'reload', 'sshd'])
    if daemon() != state['daemon']:
        raise RuntimeError('SSH process identity changed during rollback')
    result = {'ok': True, 'rollback': 'restored', 'keys_preserved': True,
              'checked_utc_epoch': time.time()}
    save(folder / 'rolled-back.json', result)
    return result


def execute(phase, operation, expected=''):
    guard()
    operation_id(operation)
    os.umask(0o077)
    if phase not in ('inspect', 'apply', 'confirm', 'rollback'):
        raise RuntimeError('Unknown phase')
    if phase != 'rollback' and os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Manual CI context required')
    with LOCK.open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if phase == 'rollback':
            return rollback(operation)
        before, snapshot_sha = snapshot()
        if phase == 'inspect':
            return {'ok': True, 'snapshot_sha256': snapshot_sha,
                    'key_fingerprints': before['key_fingerprints'],
                    'already_hardened': DROPIN.exists(), 'daemon': daemon(),
                    'effective': {k: effective().get(k) for k in [*WANTED, 'permitrootlogin']}}
        if phase == 'confirm':
            folder = BASE / operation
            safe(folder, True)
            state = json.loads((folder / 'state.json').read_text())
            if not re.fullmatch('[a-f0-9]{64}', expected):
                raise RuntimeError('Independent administrative verification receipt required')
            if time.time() >= state['deadline'] - 15 or (folder / 'rolled-back.json').exists():
                raise RuntimeError('Rollback window expired; inspect before retrying')
            safe(DROPIN)
            if before != state['before'] or DROPIN.read_bytes() != CONTENT or daemon() != state['daemon']:
                raise RuntimeError('SSH or authorized keys changed after apply')
            policy = verify_policy()
            if (folder / 'confirmed.json').exists():
                previous = json.loads((folder / 'confirmed.json').read_text())
                if previous['admin_receipt_sha256'] != expected:
                    raise RuntimeError('Different confirmation receipt')
                run(['systemctl', 'stop', timer(operation) + '.timer'])
                return previous
            # Confirm marker is written first: an already queued timer can only
            # observe confirmation or restore the old policy under this lock.
            result = {'ok': True, 'phase': 'confirmed', 'operation': operation,
                      'admin_receipt_sha256': expected, 'policy': policy,
                      'authorized_keys_preserved': True, 'ssh_restarted': False}
            save(folder / 'confirmed.json', result)
            run(['systemctl', 'stop', timer(operation) + '.timer'])
            return result
        if expected != snapshot_sha or DROPIN.exists():
            raise RuntimeError('Inspection drift or an existing key-only policy')
        if run(['systemctl', 'show', 'umsa-active-backup.service', '-p', 'Result', '--value']) != 'success':
            raise RuntimeError('Restore the external backup before SSH hardening')
        BASE.mkdir(mode=0o700, exist_ok=True)
        safe(BASE, True)
        folder = BASE / operation
        folder.mkdir(mode=0o700, exist_ok=False)
        candidate = folder / 'candidate.conf'
        candidate.write_bytes(b'Include ' + str(folder / 'policy.conf').encode() + b'\n' + MAIN.read_bytes())
        (folder / 'policy.conf').write_bytes(CONTENT)
        run(['sshd', '-t', '-f', str(candidate)])
        verify_policy(candidate)
        state = {'before': before, 'daemon': daemon(), 'deadline': time.time() + 900,
                 'tool': str(Path(__file__).resolve())}
        save(folder / 'state.json', state)
        run(['systemd-run', '--unit=' + timer(operation), '--on-active=15m',
             '--timer-property=AccuracySec=1s', '/usr/bin/python3',
             state['tool'], 'rollback', operation])
        try:
            fd = os.open(DROPIN, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(CONTENT)
                stream.flush()
                os.fsync(stream.fileno())
            run(['sshd', '-t'])
            policy = verify_policy()
            run(['systemctl', 'reload', 'sshd'])
            if daemon() != state['daemon'] or snapshot()[0] != before:
                raise RuntimeError('Administrative keys or daemon identity changed')
            result = {'ok': True, 'phase': 'applied', 'operation': operation,
                      'rollback_deadline_epoch': state['deadline'],
                      'policy': policy, 'authorized_keys_preserved': True,
                      'ssh_restarted': False}
            save(folder / 'applied.json', result)
            return result
        except BaseException:
            rollback(operation)
            raise


if __name__ == '__main__':
    try:
        print(json.dumps(execute(*sys.argv[1:]), sort_keys=True))
    except Exception as error:
        print(json.dumps({'ok': False, 'detail': str(error)}))
        raise SystemExit(1)
