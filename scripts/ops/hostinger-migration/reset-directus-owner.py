#!/usr/bin/env python3
"""Change only the existing owner's login, using a short-lived encrypted CI input."""
import base64
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path('/srv/umsa-migration')
USER = '70393e6e-f5b6-4a12-917f-5563710feabf'
ROLE = '456bebc3-3040-4202-ba63-aa252213725d'
CERT_KEY = Path('/etc/letsencrypt-hostinger/live/admin.ultimamilla.com.ar/privkey.pem')
FIELDS = ('id', 'email', 'password', 'status', 'role', 'token', 'provider', 'tfa_secret')


def command(args, data=None):
    result = subprocess.run(args, input=data, capture_output=True, timeout=30)
    if result.returncode:
        raise RuntimeError('Required private operation failed; output suppressed')
    return result.stdout


def pg(sql):
    return command(['docker', 'exec', '-i', 'directus-admin-database-1', 'psql',
                    '-X', '-w', '-U', 'umsa_restore_admin_20261027', '-d', 'directus',
                    '-At', '-v', 'ON_ERROR_STOP=1'], sql.encode()).decode().strip()


def literal(value):
    if not isinstance(value, str) or '\x00' in value:
        raise RuntimeError('Unexpected SQL value')
    return "'" + value.replace("'", "''") + "'"


def account():
    value = pg('SELECT row_to_json(t) FROM (SELECT ' + ','.join(FIELDS) +
               ' FROM directus_users WHERE id=' + literal(USER) + ') t;')
    row = json.loads(value)
    if (set(row) != set(FIELDS) or row['id'] != USER or row['role'] != ROLE or
            row['status'] != 'active' or row['provider'] != 'default' or row['tfa_secret']):
        raise RuntimeError('Preserve the reviewed existing owner, role, status and MFA')
    return row


def fingerprint(row):
    return hashlib.sha256(json.dumps(row, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def runtime():
    if (os.geteuid() != 0 or socket.gethostname() != 'srv2101069.hstgr.cloud' or
            (ROOT / '.target').read_text().strip() != '179.198.115.115' or
            not (ROOT / 'production.active').is_file()):
        raise RuntimeError('Wrong production target')
    state = json.loads((ROOT / 'web-publication-state.json').read_text())
    unit = state['unit']
    if not re.fullmatch(r'umsa-web-[a-f0-9]{40}-[0-9]+-[0-9]+\.service', unit):
        raise RuntimeError('Unexpected active frontend identity')
    pid = command(['systemctl', 'show', unit, '--property=MainPID', '--value']).decode().strip()
    if not pid.isdigit() or int(pid) < 2:
        raise RuntimeError('Frontend is not running')
    cms = command(['docker', 'inspect', '--format', '{{.Id}} {{.State.StartedAt}} {{.State.Running}}',
                   'directus-admin-directus-app-1']).decode().strip()
    if not cms.endswith(' true'):
        raise RuntimeError('CMS is not running')
    env = dict(x.split('=', 1) for x in Path('/proc/' + pid + '/environ').read_text().split('\0') if '=' in x)
    token = env['DIRECTUS_ADMIN_TOKEN']
    if env['DIRECTUS_INTERNAL_URL'] != 'http://127.0.0.1:8055':
        raise RuntimeError('Unexpected CMS endpoint')
    return (unit, pid, cms), token


def credentials(envelope, now=None, key=CERT_KEY):
    if not re.fullmatch(r'[A-Za-z0-9+/]{512}', envelope):
        raise RuntimeError('Expected one RSA3072 encrypted input')
    value = command(['openssl', 'pkeyutl', '-decrypt', '-inkey', str(key),
                     '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256',
                     '-pkeyopt', 'rsa_mgf1_md:sha256'], base64.b64decode(envelope, validate=True))
    result = json.loads(value)
    now = time.time() if now is None else now
    if (set(result) != {'email', 'password', 'expires', 'purpose'} or
            result['purpose'] != 'directus-owner-login' or
            type(result['expires']) is not int or not now < result['expires'] <= now + 1800 or
            not isinstance(result['email'], str) or len(result['email']) > 254 or
            not re.fullmatch(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', result['email']) or
            not isinstance(result['password'], str) or not 8 <= len(result['password']) <= 128 or
            any(c in result['password'] for c in '\r\n\0')):
        raise RuntimeError('Encrypted request is expired, malformed or has a different purpose')
    return {'email': result['email'], 'password': result['password']}


def api(path, token=None, data=None, method=None, public=False):
    headers = {'Content-Type': 'application/json', 'User-Agent': 'UMSA-owner-account-maintenance/20261028'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(
        ('https://admin.ultimamilla.com.ar' if public else 'http://127.0.0.1:8055') + path,
        headers=headers, data=None if data is None else json.dumps(data).encode(), method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read(1024 * 1024)
            return json.loads(body).get('data') if body else None
    except urllib.error.HTTPError as error:
        raise RuntimeError('Directus request failed with HTTP ' + str(error.code)) from None


def same_permissions(before, after):
    return all(before[key] == after[key] for key in FIELDS if key not in ('email', 'password'))


def restore(before, expected):
    if account() != expected:
        raise RuntimeError('Restore refused to overwrite a concurrent account change')
    sql = ('UPDATE directus_users SET email=' + literal(before['email']) + ',password=' +
           literal(before['password']) + ' WHERE id=' + literal(USER) + ' AND email=' +
           literal(expected['email']) + ' AND password=' + literal(expected['password']) +
           ' AND to_jsonb(directus_users) @> ' + literal(json.dumps(expected)) + '::jsonb' +
           ' RETURNING id;')
    if pg(sql).splitlines()[0] != USER or account() != before:
        raise RuntimeError('Private account recovery requires investigation')


def change(before, requested, identity, token, folder=None):
    def record(phase):
        if folder:
            (folder / 'status.json').write_text(json.dumps({'phase': phase, 'user_id': USER}) + '\n')

    if api('/users/me?fields=id', token)['id'] != USER or account() != before:
        raise RuntimeError('Service account changed before reset')
    installed = None
    refresh = None
    try:
        record('patch-pending')
        try:
            api('/users/' + USER + '?fields=id', token, requested, 'PATCH')
        finally:
            # A lost PATCH response is ambiguous. Always attempt private readback,
            # including one transient retry, before deciding whether recovery is safe.
            for attempt in range(2):
                try:
                    installed = account()
                    break
                except Exception:
                    if attempt:
                        raise
                    time.sleep(0.1)
        if (installed['email'] != requested['email'] or installed['password'] == before['password'] or
                not same_permissions(before, installed)):
            raise RuntimeError('Password reset changed an unexpected account field')
        session = api('/auth/login', data=requested, public=True)
        refresh = session['refresh_token']
        me = api('/users/me?fields=id,email,role,status', session['access_token'], public=True)
        if me != {k: installed[k] for k in ('id', 'email', 'role', 'status')}:
            raise RuntimeError('Public login did not authenticate the reviewed owner')
        if runtime()[0] != identity or api('/users/me?fields=id', token)['id'] != USER:
            raise RuntimeError('CMS or frontend service identity changed')
        if account() != installed:
            raise RuntimeError('Account changed during verification')
        api('/auth/logout', data={'refresh_token': refresh}, public=True)
        refresh = None
        record('verified')
    except Exception:
        if refresh:
            try:
                api('/auth/logout', data={'refresh_token': refresh}, public=True)
            except Exception:
                pass
        if installed is not None and installed != before and same_permissions(before, installed):
            try:
                restore(before, installed)
                record('restored')
            except Exception:
                record('recovery-required')
                raise
        else:
            # If readback stays unavailable, never guess or overwrite another
            # administrator's change. Persist the unresolved state and original.
            record('unchanged' if installed == before else 'recovery-required')
        raise


def main(args):
    os.umask(0o077)
    if args == ['inspect']:
        runtime()
        row = account()
        print(json.dumps({'snapshot_sha256': fingerprint(row), 'id': USER,
                          'email': row['email'], 'role': ROLE, 'read_only': True}))
        return
    if (len(args) != 4 or args[0] != 'apply' or not re.fullmatch(r'[0-9]+-[0-9]+', args[1]) or
            not re.fullmatch(r'[a-f0-9]{64}', args[2])):
        raise RuntimeError('Unexpected phase, CI run or reviewed snapshot')
    with Path('/run/umsa-web-publish.lock').open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        identity, token = runtime()
        before = account()
        if fingerprint(before) != args[2]:
            raise RuntimeError('Owner account changed; inspect before retrying')
        requested = credentials(args[3])
        if pg('SELECT count(*) FROM directus_users WHERE email=' + literal(requested['email']) +
              ' AND id<>' + literal(USER) + ';') != '0':
            raise RuntimeError('The requested email already belongs to another account')
        folder = ROOT / 'owner-account-recoveries' / args[1]
        if any(p.is_symlink() for p in (folder, *folder.parents)):
            raise RuntimeError('Unexpected recovery path')
        folder.mkdir(mode=0o700, parents=True, exist_ok=False)
        with (folder / 'account.before.json').open('x') as stream:
            os.fchmod(stream.fileno(), 0o600)
            json.dump(before, stream, sort_keys=True)
            stream.flush()
            os.fsync(stream.fileno())
        if json.loads((folder / 'account.before.json').read_text()) != before:
            raise RuntimeError('Private original account backup did not verify')
        change(before, requested, identity, token, folder)
        receipt = {'run': args[1], 'user_id': USER, 'email': requested['email'],
                   'public_login_verified': True, 'role_and_api_token_preserved': True,
                   'services_restarted': False, 'plaintext_password_stored': False}
        (folder / 'receipt.json').write_text(json.dumps(receipt, sort_keys=True) + '\n')
        print(json.dumps(receipt, sort_keys=True))


if __name__ == '__main__':
    try:
        main(sys.argv[1:])
    except Exception as error:
        # Never print a request body, response token, decrypted input or traceback.
        print('Owner credential operation stopped (' + type(error).__name__ + '); private backup preserved.', file=sys.stderr)
        raise SystemExit(1)
