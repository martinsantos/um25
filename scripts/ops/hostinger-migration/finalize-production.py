#!/usr/bin/env python3
"""Issue fresh certificates and enable the reviewed Hostinger web publisher."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
PRIVATE = Path('/srv/umsa-clean-proxy/nginx')
PUBLIC = Path('/srv/umsa-public-vhosts')
FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
ACME = Path('/etc/letsencrypt-hostinger')
PLANS = {
    'ultimamilla.com.ar-0001': ['ultimamilla.com.ar', 'www.ultimamilla.com.ar'],
    'sgi.ultimamilla.com.ar-0001': ['sgi.ultimamilla.com.ar', 'www.sgi.ultimamilla.com.ar'],
    'sitrep.ultimamilla.com.ar': ['sitrep.ultimamilla.com.ar'],
    'wiki.ultimamilla.com.ar': ['wiki.ultimamilla.com.ar'],
    'www.umbot.com.ar': ['umbot.com.ar', 'www.umbot.com.ar'],
    'vecinorabioso.com.ar': ['vecinorabioso.com.ar', 'www.vecinorabioso.com.ar'],
}


def load_public():
    spec = importlib.util.spec_from_file_location('final_public', Path(__file__).with_name('public-vhost.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def update_certificate_paths(text):
    for lineage in PLANS:
        text = text.replace('/etc/letsencrypt/live/' + lineage + '/', str(ACME / 'live' / lineage) + '/')
    return text


def update_cms_token(text, token):
    if not re.fullmatch(r'[A-Za-z0-9_-]{16,128}', token):
        raise ValueError('Unexpected rotated CMS token')
    result, count = re.subn(r'(proxy_set_header\s+Authorization\s+"Bearer )[^"\r\n]+(";)',
                            lambda match: match[1] + token + match[2], text)
    if count != 2:
        raise RuntimeError('Unexpected number of legacy CMS authorization directives')
    return result


def completed_receipt(group):
    matches = list((STAGE / group).glob('*/cutover.complete.json'))
    if len(matches) != 1 or matches[0].is_symlink():
        raise RuntimeError('Expected exactly one completed cutover: ' + group)
    value = json.loads(matches[0].read_text())
    if not value.get('source_fenced') or not value.get('public_target_ready'):
        raise RuntimeError('Cutover is not ready: ' + group)
    return value


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'web-publication-state.json').exists()):
        raise RuntimeError('Unexpected first Hostinger production finalization state')
    os.umask(0o077)
    receipts = {group: completed_receipt(group) for group in ('core-cutovers', 'sgi-cutovers', 'remaining-cutovers')}
    public = load_public()
    root = STAGE / 'production-finalizations' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    files = [PRIVATE / 'sites-enabled/ultimamilla.com.ar', PRIVATE / 'sites-enabled/sgi.ultimamilla.com.ar',
             PRIVATE / 'sites-enabled/umbot.com.ar', PRIVATE / 'sites-enabled/wiki.ultimamilla.com.ar',
             PRIVATE / 'conf.d/sitrep.conf', PRIVATE / 'conf.d/vecinorabioso.conf', FRONT]
    files += [PUBLIC / (name + '.conf') for name in ('ultimamilla.com.ar', 'sgi.ultimamilla.com.ar',
              'umbot.com.ar', 'wiki.ultimamilla.com.ar', 'vecinorabioso')]
    if any(file.is_symlink() or not file.is_file() for file in files):
        raise RuntimeError('Expected active vhost is missing')
    token = json.loads((STAGE / 'internal-credentials/vault.json').read_text())['directus_api']
    previous = {file: file.read_text() for file in files}
    modes = {file: file.stat().st_mode & 0o777 for file in files}
    for index, (file, text) in enumerate(previous.items()):
        (root / ('before-' + str(index) + '.conf')).write_text(text)
    (root / 'paths.json').write_text(json.dumps([str(p) for p in files], indent=2) + '\n')
    marker = 'umsa-acme-' + secrets.token_hex(16)
    challenge = Path('/var/www/umsa-acme/.well-known/acme-challenge') / marker
    if challenge.parent.is_symlink() or not challenge.parent.is_dir():
        raise RuntimeError('Reviewed ACME webroot is missing')
    challenge.write_text(marker)
    challenge.chmod(0o644)
    hosts = sorted({host for names in PLANS.values() for host in names})
    with (root / 'finalization.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log, timeout=600)
        # Public routing must already reach this exact target before requesting certificates.
        for host in hosts:
            output = subprocess.check_output(['curl', '--noproxy', '*', '-fsSL', '--max-time', '25',
                '--max-redirs', '5', 'http://' + host + '/.well-known/acme-challenge/' + marker],
                text=True, stderr=log, timeout=30)
            if output != marker:
                raise RuntimeError('Public HTTP-01 challenge did not reach Hostinger: ' + host)
        for lineage, names in PLANS.items():
            args = ['certbot', 'certonly', '--non-interactive', '--agree-tos', '--email', 'martin@ultimamilla.com.ar',
                '--webroot', '-w', '/var/www/umsa-acme', '--config-dir', str(ACME),
                '--work-dir', '/var/lib/letsencrypt-hostinger', '--logs-dir', '/var/log/letsencrypt-hostinger',
                '--cert-name', lineage, '--key-type', 'rsa', '--rsa-key-size', '3072', '--keep-until-expiring']
            for host in names:
                args += ['-d', host]
            run(args)
            for host in names:
                run(['openssl', 'x509', '-in', str(ACME / 'live' / lineage / 'fullchain.pem'),
                     '-noout', '-checkhost', host])
        changed = False
        try:
            for file, text in previous.items():
                replacement = update_certificate_paths(text)
                if file.name in ('ultimamilla.com.ar', 'ultimamilla.com.ar.conf'):
                    replacement = update_cms_token(replacement, token)
                public.atomic(file, replacement, modes[file])
                changed = True
            run(['/usr/sbin/nginx', '-t', '-c', str(PRIVATE / 'nginx.conf')])
            run(['/usr/sbin/nginx', '-t', '-c', str(FRONT)])
            run(['systemctl', 'reload', 'umsa-clean-front'])
            run(['systemctl', 'reload', 'umsa-sitrep-ingress'])
            for host in hosts:
                public.probe(host, '/', {'200', '301', '302'})
            public.probe('www.ultimamilla.com.ar', '/dge/login', {'200'})
            public.probe('sitrep.ultimamilla.com.ar', '/api/health', {'200'})
        except Exception:
            if changed:
                for file, text in previous.items():
                    public.atomic(file, text, modes[file])
                run(['/usr/sbin/nginx', '-t', '-c', str(PRIVATE / 'nginx.conf')])
                run(['/usr/sbin/nginx', '-t', '-c', str(FRONT)])
                run(['systemctl', 'reload', 'umsa-clean-front'])
                run(['systemctl', 'reload', 'umsa-sitrep-ingress'])
            raise
        hook = Path('/usr/local/sbin/umsa-certificate-reload')
        hook_text = ('#!/usr/bin/env bash\nset -euo pipefail\n/usr/sbin/nginx -t -c ' + str(PRIVATE / 'nginx.conf') +
                     '\n/usr/sbin/nginx -t -c ' + str(FRONT) + '\nsystemctl reload umsa-clean-front umsa-sitrep-ingress\n')
        public.atomic(hook, hook_text, 0o755)
        unit = Path('/etc/systemd/system/umsa-certificate-renew.service')
        timer = Path('/etc/systemd/system/umsa-certificate-renew.timer')
        public.atomic(unit, '[Unit]\nDescription=Renew clean UMSA Hostinger certificates\n[Service]\nType=oneshot\n'
            'ExecStart=/usr/bin/certbot renew --quiet --config-dir ' + str(ACME) +
            ' --work-dir /var/lib/letsencrypt-hostinger --logs-dir /var/log/letsencrypt-hostinger'
            ' --deploy-hook /usr/local/sbin/umsa-certificate-reload\n', 0o644)
        public.atomic(timer, '[Unit]\nDescription=Scheduled UMSA certificate renewal\n[Timer]\n'
            'OnCalendar=*-*-* 03,15:17:00 UTC\nRandomizedDelaySec=1800\nPersistent=true\n'
            '[Install]\nWantedBy=timers.target\n', 0o644)
        run(['systemd-analyze', 'verify', str(unit), str(timer)])
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'enable', '--now', 'umsa-certificate-renew.timer'])
        run(['systemctl', 'is-active', '--quiet', 'umsa-certificate-renew.timer'])
        # This gate enables only the already reviewed UMSA web publisher.
        public.atomic(STAGE / 'production.active', json.dumps({'scope': 'umsa-web', 'run': identifier,
                      'public_challenges_passed': hosts}) + '\n')
        (root / 'finalization.complete.json').write_text(json.dumps({'run': identifier, 'certificates': PLANS,
            'cutovers': {key: value['run'] for key, value in receipts.items()}, 'renewal_timer': True,
            'publisher_gate': True, 'cms_token_references_updated': True}, indent=2) + '\n')
    print('Fresh certificates, renewal and the UMSA publisher gate are active; existing services stayed running.')


if __name__ == '__main__':
    main(sys.argv[1])
