#!/usr/bin/env python3
"""Retire the unused demo API proxy and preserve the live SGI upstream."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import socket
import stat
import subprocess
import sys
import time

TARGET = '179.198.115.115'
STAGE = Path('/srv/umsa-migration')
PUBLIC = Path('/srv/umsa-public-vhosts')
FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
PRIVATE_FRONT = Path('/srv/umsa-clean-proxy/nginx/nginx.conf')
STATE = STAGE / 'web-publication-state.json'
RELEASES = Path('/srv/umsa-web-releases')
SGI_STATE = STAGE / 'sgi-production-state.json'
SGI_UNIT = Path('/etc/systemd/system/umsa-operational-sgi.service')
SGI_ENV = STAGE / 'production-sgi.environment'
FAMILIES = ('auth', 'manifiestos', 'catalogos', 'pdf', 'reportes', 'actores', 'notificaciones')
OLD_BLOCK = '''    # === EMERGENCY FIX: Route demo API requests correctly (Frontend misconfig mitigation) ===
    # Rutas especificas de la demo que el frontend busca incorrectamente en la raiz
    location ~ ^/api/(auth|manifiestos|catalogos|pdf|reportes|actores|analytics|notificaciones) {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # === END EMERGENCY FIX ===
'''
NEW_BLOCK = '''    # UMSA-RETIRED-DEMO-API-BEGIN
    # Analytics and current APIs keep the existing Astro proxy below.
    location ~ ^/api/(auth|manifiestos|catalogos|pdf|reportes|actores|notificaciones)(/|$) {
        add_header Cache-Control "no-store" always;
        return 410;
    }
    # UMSA-RETIRED-DEMO-API-END
'''


def retire_demo_api(text):
    if text.count(OLD_BLOCK) == 1 and text.count('127.0.0.1:3010') == 1 and NEW_BLOCK not in text:
        result = text.replace(OLD_BLOCK, NEW_BLOCK)
    elif text.count(NEW_BLOCK) == 1 and OLD_BLOCK not in text and '127.0.0.1:3010' not in text:
        result = text
    else:
        raise RuntimeError('Retired demo proxy differs from the reviewed block')
    if result.count('    location /api/ {') != 1 or 'location = /api/status.json {' not in result:
        raise RuntimeError('Existing Astro API/status routes must remain in place')
    return result


def repair_sgi_source(text):
    old, new = 'proxy_pass http://127.0.0.1:3000;', 'proxy_pass http://127.0.0.1:3001;'
    if text.count(old) == 1 and new not in text:
        return text.replace(old, new)
    if text.count(new) == 1 and old not in text:
        return text
    raise RuntimeError('Unexpected SGI source upstream')


def public_version(text):
    text = re.sub(r'(?m)^\s*listen \[::1\]:(?:80|443)[^;]*;\s*\n', '\n', text)
    text, count = re.subn(r'\blisten 127\.0\.0\.1:(80|443)\b', r'listen ' + TARGET + r':\1', text)
    if not count or re.search(r'\blisten\s+(?!179\.198\.115\.115:)', text):
        raise RuntimeError('Unexpected private vhost listener')
    return text


def read_record(path):
    if any(parent.is_symlink() for parent in (path, *path.parents)):
        raise RuntimeError('Symlink in reviewed configuration path')
    metadata = path.stat()
    if not stat.S_ISREG(metadata.st_mode):
        raise RuntimeError('Reviewed configuration is not a regular file')
    return {'path': path, 'data': path.read_bytes(), 'mode': stat.S_IMODE(metadata.st_mode),
            'uid': metadata.st_uid, 'gid': metadata.st_gid}


def inventory(records):
    return {key: {'path': str(value['path']), 'sha256': hashlib.sha256(value['data']).hexdigest(),
                  'mode': value['mode'], 'uid': value['uid'], 'gid': value['gid']}
            for key, value in records.items()}


def fingerprint(records):
    return hashlib.sha256(json.dumps(inventory(records), sort_keys=True,
                                     separators=(',', ':')).encode()).hexdigest()


def snapshot():
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != TARGET
            or not (STAGE / 'production.active').is_file()):
        raise RuntimeError('Wrong production target')
    state_record = read_record(STATE)
    state = json.loads(state_record['data'])
    config = Path(state['config'])
    if (config.parent.parent != RELEASES or config.name != 'nginx'
            or not re.fullmatch(r'[a-f0-9]{40}-[0-9]+-[0-9]+', config.parent.name)
            or state['assets'] != str(config.parent / 'application/dist/client')
            or state['unit'] != 'umsa-web-' + config.parent.name + '.service'
            or state['port'] not in (4321, 4322)):
        raise RuntimeError('Unexpected current publisher state')
    paths = {'ingress': FRONT, 'private_front': PRIVATE_FRONT, 'private_config': config / 'nginx.conf',
             'public_umsa': PUBLIC / 'ultimamilla.com.ar.conf',
             'private_umsa': config / 'sites-enabled/ultimamilla.com.ar',
             'public_sgi': PUBLIC / 'sgi.ultimamilla.com.ar.conf',
             'private_sgi': config / 'sites-enabled/sgi.ultimamilla.com.ar',
             'sgi_state': SGI_STATE, 'sgi_unit': SGI_UNIT, 'sgi_environment': SGI_ENV}
    records = {key: read_record(path) for key, path in paths.items()}
    records['state'] = state_record
    if records['private_front']['data'].decode() != 'include ' + str(config / 'nginx.conf') + ';\n':
        raise RuntimeError('Private ingress differs from the current publisher state')
    if records['ingress']['data'].decode().count('include /srv/umsa-public-vhosts/*.conf;') != 1:
        raise RuntimeError('The isolated public vhost include is missing')
    umsa, sgi = records['private_umsa']['data'].decode(), records['private_sgi']['data'].decode()
    if public_version(umsa) != records['public_umsa']['data'].decode():
        raise RuntimeError('UMSA public vhost and publisher source differ')
    if public_version(repair_sgi_source(sgi)) != records['public_sgi']['data'].decode():
        raise RuntimeError('The SGI source differs beyond the reviewed dead port')
    retire_demo_api(umsa)
    sgi_state = json.loads(records['sgi_state']['data'])
    if (sgi_state.get('service') != 'umsa-operational-sgi' or sgi_state.get('port') != 3001
            or not sgi_state.get('same_session_secret')
            or 'EnvironmentFile=/srv/umsa-migration/production-sgi.environment\n' not in records['sgi_unit']['data'].decode()):
        raise RuntimeError('The live SGI production identity changed')
    return records


def changes(records):
    return {'public_umsa': retire_demo_api(records['public_umsa']['data'].decode()).encode(),
            'private_umsa': retire_demo_api(records['private_umsa']['data'].decode()).encode(),
            'private_sgi': repair_sgi_source(records['private_sgi']['data'].decode()).encode()}


def assert_current(records):
    current = {key: read_record(record['path']) for key, record in records.items()}
    if fingerprint(current) != fingerprint(records):
        raise RuntimeError('Reviewed configuration changed; inspect again before retrying')


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=60)


def reload_ingresses():
    for config in (PRIVATE_FRONT, FRONT):
        run(['/usr/sbin/nginx', '-t', '-c', str(config)])
    for unit in ('umsa-clean-front', 'umsa-sitrep-ingress'):
        run(['systemctl', 'reload', unit])


def atomic(record, data, folder):
    pending = folder / ('pending-' + secrets.token_hex(12))
    try:
        with pending.open('xb') as stream:
            stream.write(data)
            stream.flush()
            os.fchmod(stream.fileno(), record['mode'])
            os.fchown(stream.fileno(), record['uid'], record['gid'])
            os.fsync(stream.fileno())
        os.replace(pending, record['path'])
    finally:
        if pending.exists():
            pending.unlink()


def backup(records, folder):
    for key, record in records.items():
        if record['path'].parent.stat().st_dev != folder.stat().st_dev:
            raise RuntimeError('Configuration replacement must stay on one filesystem')
        path = folder / (key + '.before')
        with path.open('xb') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(record['data'])
            stream.flush()
            os.fsync(stream.fileno())
        if path.read_bytes() != record['data']:
            raise RuntimeError('Private backup verification failed')
    (folder / 'before.json').write_text(json.dumps(inventory(records), indent=2) + '\n')


def transaction(records, replacements, verify, folder):
    expected = {key: value.copy() for key, value in records.items()}
    changed = set()
    try:
        assert_current(expected)
        for key, data in replacements.items():
            if data == expected[key]['data']:
                continue
            atomic(expected[key], data, folder)
            expected[key]['data'] = data
            changed.add(key)
        reload_ingresses()
        verify()
        assert_current(expected)
    except BaseException:
        for key in sorted(changed):
            if fingerprint({key: read_record(expected[key]['path'])}) != fingerprint({key: expected[key]}):
                raise RuntimeError('Rollback refused to overwrite a concurrent configuration change')
        for key in sorted(changed):
            atomic(records[key], records[key]['data'], folder)
        if changed:
            reload_ingresses()
        raise
    return expected


def request(host, path, timeout=15, address=TARGET):
    result = run(['curl', '--noproxy', '*', '--globoff', '--path-as-is', '-sS',
                  '--max-time', str(timeout), '--resolve', host + ':443:' + address,
                  '-w', '\n%{http_code}', 'https://' + host + path])
    return result.stdout.rsplit('\n', 1)


def wait_ready(check):
    deadline, successes = time.monotonic() + 10, 0
    last = 'no response'
    while time.monotonic() < deadline:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        try:
            check(min(1, remaining))
            successes += 1
            if successes == 3:
                return
        except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
            successes = 0
            last = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        remaining = deadline - time.monotonic()
        if remaining > 0:
            time.sleep(min(0.25, remaining))
    raise RuntimeError('Reloaded routes did not converge: ' + last)


def runtime_identity(unit):
    return run(['systemctl', 'show', unit, '--property=MainPID,ExecMainStartTimestampMonotonic',
                '--value']).stdout.strip()


def verify_routes(identities):
    def retired_ready(budget):
        if request('www.ultimamilla.com.ar', '/api/auth/profile', timeout=budget)[1] != '410':
            raise RuntimeError('Retired API route has not converged to 410')
    wait_ready(retired_ready)
    def private_sgi_ready(budget):
        if request('sgi.ultimamilla.com.ar', '/auth/login', timeout=budget, address='127.0.0.1')[1] != '200':
            raise RuntimeError('Private SGI has not converged to its live upstream')
    wait_ready(private_sgi_ready)
    for family in FAMILIES:
        if request('www.ultimamilla.com.ar', '/api/' + family + '/route-readiness?scope=retired')[1] != '410':
            raise RuntimeError('Retired demo API family failed: ' + family)
    for host, path, codes in (
            ('www.ultimamilla.com.ar', '/', ('200',)),
            ('www.ultimamilla.com.ar', '/api/analytics', ('404',)),
            ('www.ultimamilla.com.ar', '/api/analytics2', ('404',)),
            ('www.ultimamilla.com.ar', '/api/monitoring/health', ('200',)),
            ('www.ultimamilla.com.ar', '/directus/users/me', ('401', '403')),
            ('www.ultimamilla.com.ar', '/dge/login', ('200',)),
            ('admin.ultimamilla.com.ar', '/admin/', ('200',)),
            ('sitrep.ultimamilla.com.ar', '/api/health', ('200',)),
            ('sgi.ultimamilla.com.ar', '/auth/login', ('200',))):
        if request(host, path)[1] not in codes:
            raise RuntimeError('Existing public route failed: ' + host + path)
    if request('sgi.ultimamilla.com.ar', '/auth/login', address='127.0.0.1')[1] != '200':
        raise RuntimeError('The private SGI source did not reach the live service')
    for unit, identity in identities.items():
        if runtime_identity(unit) != identity:
            raise RuntimeError('An application process changed during the route operation')


def main(phase, identifier=None, expected_sha=None):
    if phase == 'inspect' and identifier is None and expected_sha is None:
        records = snapshot()
        print(json.dumps({'snapshot_sha256': fingerprint(records), 'files': inventory(records),
                          'candidate_sha256': {key: hashlib.sha256(data).hexdigest()
                                               for key, data in changes(records).items()
                                               if data != records[key]['data']},
                          'retired_families': FAMILIES,
                          'analytics_contract': 'Existing Astro proxy; GET and JSON POST currently return 404.'}, indent=2))
        return
    if (phase != 'repair' or not re.fullmatch(r'[0-9]+-[0-9]+', identifier or '')
            or not re.fullmatch(r'[a-f0-9]{64}', expected_sha or '')):
        raise RuntimeError('Unexpected operation or reviewed snapshot')
    os.umask(0o077)
    with open('/run/umsa-web-publish.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        records = snapshot()
        if fingerprint(records) != expected_sha:
            raise RuntimeError('Configuration differs from the reviewed snapshot')
        state = json.loads(records['state']['data'])
        units = (state['unit'], 'umsa-operational-sgi.service')
        for unit in units:
            run(['systemctl', 'is-active', '--quiet', unit])
        identities = {unit: runtime_identity(unit) for unit in units}
        folder = STAGE / 'retired-route-repairs' / identifier
        folder.mkdir(mode=0o700, parents=True, exist_ok=False)
        backup(records, folder)
        after = transaction(records, changes(records), lambda: verify_routes(identities), folder)
        (folder / 'complete.json').write_text(json.dumps({
            'run': identifier, 'before_snapshot_sha256': expected_sha, 'snapshot_sha256': fingerprint(after),
            'files': inventory(after), 'retired_families': FAMILIES, 'application_processes_unchanged': True,
            'analytics_uses_existing_astro_proxy': True, 'public_sgi_unchanged': True}, indent=2) + '\n')
    print('Retired demo API families return 410; current APIs and live SGI sources verified.')


if __name__ == '__main__':
    main(*sys.argv[1:])
