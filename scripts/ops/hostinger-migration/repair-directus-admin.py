#!/usr/bin/env python3
"""Restore the dedicated Directus origin without changing the running CMS."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import socket
import ssl
import stat
import subprocess
import sys
from urllib.parse import urljoin

TARGET = '179.198.115.115'
HOST = 'admin.ultimamilla.com.ar'
STAGE = Path('/srv/umsa-migration')
PUBLIC = Path('/srv/umsa-public-vhosts')
FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
PRIVATE_FRONT = Path('/srv/umsa-clean-proxy/nginx/nginx.conf')
STATE = STAGE / 'web-publication-state.json'
RELEASES = Path('/srv/umsa-web-releases')
ACME = Path('/etc/letsencrypt-hostinger')
WEBROOT = Path('/var/www/umsa-acme')
RENEW_SERVICE = Path('/etc/systemd/system/umsa-certificate-renew.service')
RENEW_TIMER = Path('/etc/systemd/system/umsa-certificate-renew.timer')
RENEW_HOOK = Path('/usr/local/sbin/umsa-certificate-reload')
BEGIN = '    # DIRECTUS-ADMIN-MANAGED-BEGIN\n'
END = '    # DIRECTUS-ADMIN-MANAGED-END\n'
ANCHOR = '    # ============ DIRECTUS HTTPS PROXY ============\n'


def render_admin(tls=False, address=TARGET):
    challenge = '''    location ^~ /.well-known/acme-challenge/ {
        root /var/www/umsa-acme;
        default_type text/plain;
        auth_basic off;
        allow all;
        try_files $uri =404;
    }
'''
    text = 'server {\n    listen ' + address + ':80;\n    server_name ' + HOST + ';\n' + challenge
    action = 'return 308 https://' + HOST + '$request_uri;' if tls else 'return 503;'
    text += '    location / { ' + action + ' }\n}\n'
    if tls:
        cert = str(ACME / 'live' / HOST)
        text += '''
server {
    listen ADDRESS:443 ssl;
    server_name HOSTNAME;
    ssl_certificate CERT/fullchain.pem;
    ssl_certificate_key CERT/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 50m;
    location = / { return 302 /admin/$is_args$args; }
    location / {
        proxy_pass http://127.0.0.1:8055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_buffering off;
    }
}
'''.replace('ADDRESS', address).replace('HOSTNAME', HOST).replace('CERT', cert)
    return text


def redirects():
    # Match the original request URI to preserve escaped suffixes and queries.
    return BEGIN + '''    location = /directus/admin {
        return 302 https://admin.ultimamilla.com.ar/admin$is_args$args;
    }
    location ^~ /directus/admin/ {
        if ($request_uri ~ "^/directus(/admin/.*)$") {
            return 302 https://admin.ultimamilla.com.ar$1;
        }
        return 400;
    }
''' + END


def add_redirects(text):
    block = redirects()
    if BEGIN in text or END in text:
        if text.count(block) != 1 or text.count(BEGIN) != 1 or text.count(END) != 1:
            raise RuntimeError('Unknown Directus admin redirect block')
        text = text.replace(block, '')
    if text.count(ANCHOR) != 1 or text.count('    location /directus/ {') != 1:
        raise RuntimeError('Reviewed Directus API location is missing or duplicated')
    if re.search(r'location\s+[^{;\n]*?/directus/admin', text):
        raise RuntimeError('Another Directus admin route already exists')
    return text.replace(ANCHOR, block + ANCHOR)


def public_version(text):
    result, count = re.subn(r'\blisten 127\.0\.0\.1:(80|443)\b',
                            r'listen ' + TARGET + r':\1', text)
    if not count or re.search(r'\blisten\s+(?!179\.198\.115\.115:)', result):
        raise RuntimeError('Unexpected UMSA listener')
    return result


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
             'public_admin': PUBLIC / 'directus-admin.conf',
             'public_umsa': PUBLIC / 'ultimamilla.com.ar.conf',
             'private_admin': config / 'sites-enabled/directus-admin',
             'private_umsa': config / 'sites-enabled/ultimamilla.com.ar',
             'renew_service': RENEW_SERVICE, 'renew_timer': RENEW_TIMER, 'renew_hook': RENEW_HOOK}
    records = {key: read_record(path) for key, path in paths.items()}
    records['state'] = state_record
    if records['private_front']['data'].decode() != 'include ' + str(config / 'nginx.conf') + ';\n':
        raise RuntimeError('Effective private ingress differs from the publisher state')
    if records['ingress']['data'].decode().count('include /srv/umsa-public-vhosts/*.conf;') != 1:
        raise RuntimeError('Isolated public vhost include is missing')
    for name in ('admin', 'umsa'):
        if public_version(records['private_' + name]['data'].decode()) != records['public_' + name]['data'].decode():
            raise RuntimeError('Publisher source and public vhost differ: ' + name)
    for path in PUBLIC.glob('*.conf'):
        if path == paths['public_admin']:
            continue
        if re.search(r'(?m)^\s*server_name\s+[^;]*\badmin\.ultimamilla\.com\.ar\b', read_record(path)['data'].decode()):
            raise RuntimeError('Another public vhost owns the admin hostname')
    service = records['renew_service']['data'].decode()
    hook = records['renew_hook']['data'].decode()
    if ('certbot renew --quiet --config-dir ' + str(ACME) not in service
            or '--deploy-hook /usr/local/sbin/umsa-certificate-reload' not in service
            or str(FRONT) not in hook or 'umsa-clean-front umsa-sitrep-ingress' not in hook):
        raise RuntimeError('Managed certificate renewal differs from the reviewed chain')
    return records


def assert_current(records):
    current = {key: read_record(record['path']) for key, record in records.items()}
    if fingerprint(current) != fingerprint(records):
        raise RuntimeError('Reviewed configuration changed; inspect again before retrying')


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=600)


def cms_identity():
    value = run(['docker', 'inspect', '--format', '{{.Id}} {{.State.StartedAt}} {{.State.Running}}',
                 'directus-admin-directus-app-1']).stdout.strip()
    if not value.endswith(' true'):
        raise RuntimeError('The existing Directus container is not running')
    return value


def reload_ingresses():
    for config in (PRIVATE_FRONT, FRONT):
        run(['/usr/sbin/nginx', '-t', '-c', str(config)])
    for unit in ('umsa-clean-front', 'umsa-sitrep-ingress'):
        run(['systemctl', 'reload', unit])


def atomic(record, data, folder):
    path = record['path']
    pending = folder / ('pending-' + secrets.token_hex(12))
    try:
        with pending.open('xb') as stream:
            stream.write(data)
            stream.flush()
            os.fchmod(stream.fileno(), record['mode'])
            os.fchown(stream.fileno(), record['uid'], record['gid'])
            os.fsync(stream.fileno())
        os.replace(pending, path)
    finally:
        if pending.exists():
            pending.unlink()


def backup(records, folder):
    for key, record in records.items():
        if record['path'].parent.stat().st_dev != folder.stat().st_dev:
            raise RuntimeError('Configuration replacement must stay on one filesystem')
        target = folder / (key + '.before')
        with target.open('xb') as stream:
            stream.write(record['data'])
            stream.flush()
            os.fsync(stream.fileno())
        if target.read_bytes() != record['data']:
            raise RuntimeError('Private configuration backup verification failed')
    (folder / 'before.json').write_text(json.dumps(inventory(records), indent=2) + '\n')


def transaction(records, steps, folder):
    expected = {key: value.copy() for key, value in records.items()}
    changed = set()
    try:
        for changes, verify in steps:
            assert_current(expected)
            for key, data in changes.items():
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


def request(host, path, tls=True, resolve=True):
    scheme, port = ('https', '443') if tls else ('http', '80')
    args = ['curl', '--noproxy', '*', '--globoff', '--path-as-is', '-sS', '--max-time', '20']
    if resolve:
        args += ['--resolve', host + ':' + port + ':' + TARGET]
    result = run(args + ['-w', '\n%{http_code}\n%{content_type}', scheme + '://' + host + path])
    body, status, kind = result.stdout.rsplit('\n', 2)
    return body, status, kind


def verify_ui(host, tls=True):
    html, status, kind = request(host, '/admin/', tls)
    if status != '200' or 'text/html' not in kind or not re.search(r'<base\s+href="/admin/"\s*/?>', html):
        raise RuntimeError('Directus admin HTML/base path verification failed')
    assets = re.findall(r'(?:src|href)="(\./assets/[^"]+)"', html)
    for extension, content_type in (('.js', 'javascript'), ('.css', 'text/css')):
        matches = [asset for asset in assets if asset.endswith(extension)]
        if not matches:
            raise RuntimeError('Directus admin asset reference is missing')
        body, status, kind = request(host, urljoin('/admin/', matches[0]), tls)
        if status != '200' or content_type not in kind or '<!doctype html' in body.lower():
            raise RuntimeError('Directus admin asset did not load as its real content type')
    if request(host, '/server/health', tls)[1] != '200' or request(host, '/users/me', tls)[1] not in ('401', '403'):
        raise RuntimeError('Directus API health or anonymous authorization changed')


def verify_existing(identity):
    for host, path, codes in (
            ('www.ultimamilla.com.ar', '/', ('200',)),
            ('www.ultimamilla.com.ar', '/admin/', ('404',)),
            ('www.ultimamilla.com.ar', '/admin/audit-sectores', ('200',)),
            ('www.ultimamilla.com.ar', '/directus/users/me', ('401', '403')),
            ('www.ultimamilla.com.ar', '/dge/login', ('200',)),
            ('sitrep.ultimamilla.com.ar', '/api/health', ('200',)),
            ('sgi.ultimamilla.com.ar', '/auth/login', ('200', '302'))):
        if request(host, path)[1] not in codes:
            raise RuntimeError('Existing public route failed: ' + host + path)
    if cms_identity() != identity:
        raise RuntimeError('The existing Directus container identity/start time changed')


def verify_redirect(path, destination, host='www.ultimamilla.com.ar'):
    result = run(['curl', '--noproxy', '*', '--globoff', '--path-as-is', '-sS', '--max-time', '20',
                  '--resolve', host + ':443:' + TARGET, '-o', '/dev/null',
                  '-w', '%{http_code}\n%{redirect_url}', 'https://' + host + path]).stdout
    if result != '302\n' + destination:
        raise RuntimeError('Directus admin redirect did not preserve the expected URL')


def certificate():
    cert = ACME / 'live' / HOST
    run(['certbot', 'certonly', '--non-interactive', '--webroot', '-w', str(WEBROOT),
         '--config-dir', str(ACME), '--work-dir', '/var/lib/letsencrypt-hostinger',
         '--logs-dir', '/var/log/letsencrypt-hostinger', '--cert-name', HOST,
         '--key-type', 'rsa', '--rsa-key-size', '3072', '--keep-until-expiring', '-d', HOST])
    run(['openssl', 'x509', '-in', str(cert / 'fullchain.pem'), '-noout', '-checkhost', HOST])
    run(['openssl', 'x509', '-in', str(cert / 'fullchain.pem'), '-noout', '-checkend', '604800'])
    ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER).load_cert_chain(str(cert / 'fullchain.pem'), str(cert / 'privkey.pem'))
    renewal = read_record(ACME / 'renewal' / (HOST + '.conf'))['data'].decode()
    if not re.search(r'(?m)^authenticator\s*=\s*webroot\s*$', renewal) or str(WEBROOT) not in renewal:
        raise RuntimeError('The dedicated certificate is missing managed webroot renewal')
    run(['systemctl', 'is-active', '--quiet', 'umsa-certificate-renew.timer'])


def main(phase, identifier=None, expected_sha=None):
    if phase == 'inspect' and identifier is None and expected_sha is None:
        records = snapshot()
        print(json.dumps({'snapshot_sha256': fingerprint(records), 'files': inventory(records)}, indent=2))
        return
    if (phase not in ('prepare', 'activate') or not re.fullmatch(r'[0-9]+-[0-9]+', identifier or '')
            or not re.fullmatch(r'[a-f0-9]{64}', expected_sha or '')):
        raise RuntimeError('Unexpected phase, run identity or reviewed snapshot hash')
    os.umask(0o077)
    # Use the publisher's lock: its next release must copy the repaired sources.
    with open('/run/umsa-web-publish.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        records = snapshot()
        if fingerprint(records) != expected_sha:
            raise RuntimeError('Configuration differs from the reviewed snapshot')
        identity = cms_identity()
        folder = STAGE / 'directus-admin-repairs' / identifier
        folder.mkdir(mode=0o700, parents=True, exist_ok=False)
        backup(records, folder)
        admin = {'public_admin': render_admin(phase == 'activate').encode(),
                 'private_admin': render_admin(phase == 'activate', '127.0.0.1').encode()}
        marker = 'umsa-directus-' + secrets.token_hex(16)
        challenge = WEBROOT / '.well-known/acme-challenge' / marker
        if any(p.is_symlink() for p in (challenge.parent, *challenge.parent.parents)) or not challenge.parent.is_dir():
            raise RuntimeError('Reviewed local challenge webroot is missing or unsafe')
        with challenge.open('x') as stream:
            stream.write(marker)
        challenge.chmod(0o644)
        try:
            if phase == 'prepare':
                if records['public_admin']['data'].decode() == render_admin(True):
                    raise RuntimeError('Preparation cannot downgrade an active TLS vhost')
                def prepared():
                    body, status, _ = request(HOST, '/.well-known/acme-challenge/' + marker, False)
                    if status != '200' or body != marker:
                        raise RuntimeError('Prepared HTTP challenge did not reach the local webroot')
                    if request(HOST, '/admin/', False)[1] != '503':
                        raise RuntimeError('Prepared origin must wait for TLS before serving the panel')
                    verify_existing(identity)
                after = transaction(records, [(admin, prepared)], folder)
            else:
                if records['public_admin']['data'].decode() not in (render_admin(), render_admin(True)):
                    raise RuntimeError('Prepare the exact dedicated HTTP vhost first')
                body, status, _ = request(HOST, '/.well-known/acme-challenge/' + marker, False, False)
                if status != '200' or body != marker:
                    raise RuntimeError('Public DNS/challenge did not reach the prepared origin')
                certificate()
                def tls_ready():
                    verify_ui(HOST)
                    verify_redirect('/?from=panel', 'https://' + HOST + '/admin/?from=panel', HOST)
                    verify_existing(identity)
                def redirects_ready():
                    for path, target in (('/directus/admin?next=%2Fcontent', '/admin?next=%2Fcontent'),
                                         ('/directus/admin/content/a%20b?x=%2F&y=1', '/admin/content/a%20b?x=%2F&y=1')):
                        verify_redirect(path, 'https://' + HOST + target)
                    tls_ready()
                umsa = {name: add_redirects(records[name]['data'].decode()).encode()
                        for name in ('public_umsa', 'private_umsa')}
                # First activate and verify TLS; only then enable the old-path redirects.
                after = transaction(records, [(admin, tls_ready), (umsa, redirects_ready)], folder)
        finally:
            if challenge.is_file() and challenge.read_text() == marker:
                challenge.unlink()
        (folder / 'complete.json').write_text(json.dumps({
            'phase': phase, 'run': identifier, 'host': HOST,
            'before_snapshot_sha256': expected_sha, 'snapshot_sha256': fingerprint(after),
            'files': inventory(after), 'cms_identity_unchanged': True,
            'publisher_sources_preserved': True, 'https_verified': phase == 'activate'}, indent=2) + '\n')
    print('Directus dedicated admin ' + phase + ' completed; CMS identity and existing routes passed.')


if __name__ == '__main__':
    main(*sys.argv[1:])
