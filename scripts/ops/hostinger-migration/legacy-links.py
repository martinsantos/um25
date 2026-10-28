#!/usr/bin/env python3
"""Move the retired access names to the clean ingress without restoring old services."""
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import socket
import subprocess
import sys

TARGET = '179.198.115.115'
STAGE = Path('/srv/umsa-migration')
FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
SITE = Path('/srv/umsa-public-vhosts/legacy-access.conf')
LINEAGE = 'legacy-access.ultimamilla.com.ar'
ACME = Path('/etc/letsencrypt-hostinger')
HOSTS = [name + '.ultimamilla.com.ar' for name in
         ('cpanel', 'cpcalendars', 'cpcontacts', 'mail', 'webdisk', 'webmail', 'whm')]


def render(tls=False):
    challenge = '''    location ^~ /.well-known/acme-challenge/ {
        root /var/www/umsa-acme;
        default_type text/plain;
        auth_basic off;
        allow all;
        try_files $uri =404;
    }
'''
    parts = []
    for host in HOSTS:
        if host.split('.')[0] in ('mail', 'webmail'):
            action = '        return 302 https://mail.google.com/a/ultimamilla.com.ar/;\n'
        else:
            action = ('        default_type text/plain;\n'
                      '        return 410 "Este acceso anterior fue retirado. Estado de los servicios: '
                      'https://www.ultimamilla.com.ar/status/\\n";\n')
        ports = [False, True] if tls else [False]
        for secure in ports:
            text = 'server {\n    listen ' + TARGET + (':443 ssl;\n' if secure else ':80;\n')
            text += '    server_name ' + host + ';\n'
            if secure:
                cert = str(ACME / 'live' / LINEAGE)
                text += '    ssl_certificate ' + cert + '/fullchain.pem;\n'
                text += '    ssl_certificate_key ' + cert + '/privkey.pem;\n'
                text += '    ssl_protocols TLSv1.2 TLSv1.3;\n'
            text += challenge + '    location / {\n' + action + '    }\n}\n'
            parts.append(text)
    return '\n'.join(parts)


def atomic(path, text):
    temp = path.with_name(path.name + '.pending')
    with temp.open('x') as stream:
        stream.write(text)
        stream.flush()
        os.fsync(stream.fileno())
    temp.chmod(0o600)
    os.replace(temp, path)


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=600)


def validate_context(expected):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != TARGET
            or not (STAGE / 'production.active').is_file()
            or FRONT.is_symlink() or SITE.is_symlink() or SITE.parent.is_symlink()):
        raise RuntimeError('Wrong clean production identity or unsafe path')
    if not re.fullmatch(r'[a-f0-9]{64}', expected):
        raise RuntimeError('Expected ingress hash is required')
    if hashlib.sha256(FRONT.read_bytes()).hexdigest() != expected:
        raise RuntimeError('Ingress changed: review before another attempt')
    if FRONT.read_text().count('include /srv/umsa-public-vhosts/*.conf;') != 1:
        raise RuntimeError('Expected isolated public-vhost include is missing')
    for f in SITE.parent.glob('*.conf'):
        if f == SITE:
            continue
        for line in f.read_text().splitlines():
            if re.match(r'\s*server_name\s', line) and any(h in line.replace(';', ' ').split() for h in HOSTS):
                raise RuntimeError('Access name already belongs to another vhost')


def reload_ingress():
    run(['/usr/sbin/nginx', '-t', '-c', str(FRONT)])
    run(['systemctl', 'reload', 'umsa-sitrep-ingress'])


def probe(host, path, codes, tls=True):
    scheme, port = ('https', '443') if tls else ('http', '80')
    result = run(['curl', '--noproxy', '*', '-sS', '--max-time', '15',
                  '--resolve', host + ':' + port + ':' + TARGET,
                  '-o', '/dev/null', '-w', '%{http_code}', scheme + '://' + host + path])
    if result.stdout not in codes:
        raise RuntimeError('Unexpected route status: ' + host + path + ' ' + result.stdout)


def replace_site(text, folder):
    previous = SITE.read_text() if SITE.exists() else None
    if previous is not None:
        (folder / 'legacy-access.before.conf').write_text(previous)
    try:
        atomic(SITE, text)
        reload_ingress()
        for host, path in [('www.ultimamilla.com.ar', '/'),
                           ('www.ultimamilla.com.ar', '/dge/login'),
                           ('sitrep.ultimamilla.com.ar', '/api/health'),
                           ('sgi.ultimamilla.com.ar', '/auth/login')]:
            probe(host, path, {'200', '302'})
        for host in HOSTS:
            if ':443 ssl;' in text:
                probe(host, '/', {'302'} if host.split('.')[0] in ('mail', 'webmail') else {'410'})
            else:
                probe(host, '/.well-known/acme-challenge/missing', {'404'}, tls=False)
    except BaseException:
        if previous is None:
            if SITE.exists():
                SITE.rename(folder / 'legacy-access.failed.conf')
        else:
            atomic(SITE, previous)
        reload_ingress()
        raise


def main(phase, identifier, expected):
    if phase not in ('prepare', 'activate') or not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise RuntimeError('Unexpected operation')
    os.umask(0o077)
    validate_context(expected)
    folder = STAGE / 'legacy-access-retirement' / identifier
    folder.mkdir(mode=0o700, parents=True, exist_ok=False)
    (folder / 'ingress.before.conf').write_bytes(FRONT.read_bytes())
    if phase == 'prepare':
        if SITE.exists() and SITE.read_text() != render(False):
            raise RuntimeError('Preparation cannot overwrite another or TLS-enabled vhost')
        replace_site(render(False), folder)
    else:
        if not SITE.is_file() or SITE.read_text() not in (render(False), render(True)):
            raise RuntimeError('Prepare the exact HTTP vhost before changing DNS')
        marker = 'umsa-legacy-' + secrets.token_hex(16)
        challenge = Path('/var/www/umsa-acme/.well-known/acme-challenge') / marker
        if challenge.parent.is_symlink() or not challenge.parent.is_dir():
            raise RuntimeError('Reviewed challenge webroot is missing')
        with challenge.open('x') as f:
            f.write(marker)
        challenge.chmod(0o644)
        try:
            for host in HOSTS:
                result = run(['curl', '--noproxy', '*', '-fsSL', '--max-time', '20',
                              '--max-redirs', '3', 'http://' + host +
                              '/.well-known/acme-challenge/' + marker])
                if result.stdout != marker:
                    raise RuntimeError('Public DNS/challenge did not reach the new server: ' + host)
            args = ['certbot', 'certonly', '--non-interactive', '--webroot', '-w', '/var/www/umsa-acme',
                    '--config-dir', str(ACME), '--work-dir', '/var/lib/letsencrypt-hostinger',
                    '--logs-dir', '/var/log/letsencrypt-hostinger', '--cert-name', LINEAGE,
                    '--key-type', 'rsa', '--rsa-key-size', '3072', '--keep-until-expiring']
            for host in HOSTS:
                args += ['-d', host]
            run(args)
            for host in HOSTS:
                run(['openssl', 'x509', '-in', str(ACME / 'live' / LINEAGE / 'fullchain.pem'),
                     '-noout', '-checkhost', host])
            replace_site(render(True), folder)
            run(['systemctl', 'is-active', '--quiet', 'umsa-certificate-renew.timer'])
        finally:
            # Remove only the one random challenge created by this operation.
            if challenge.is_file() and challenge.read_text() == marker:
                challenge.unlink()
    (folder / 'complete.json').write_text(json.dumps({
        'phase': phase, 'run': identifier, 'hosts': HOSTS, 'target': TARGET,
        'site_sha256': hashlib.sha256(SITE.read_bytes()).hexdigest(),
        'ingress_sha256': hashlib.sha256(FRONT.read_bytes()).hexdigest(),
        'old_services_reinstalled': False}) + '\n')
    print('Legacy access ' + phase + ' completed on Hostinger; main services passed.')


if __name__ == '__main__':
    main(*sys.argv[1:])
