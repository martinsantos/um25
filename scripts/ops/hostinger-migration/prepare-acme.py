#!/usr/bin/env python3
"""Prepare and test HTTP-01 paths on the isolated target; never issue certificates."""
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
CONFIG = Path('/srv/umsa-clean-proxy/nginx')
WEBROOT = Path('/var/www/umsa-acme')
PLANS = {
    'sites-enabled/ultimamilla.com.ar': ('ultimamilla.com.ar-0001', ['ultimamilla.com.ar', 'www.ultimamilla.com.ar']),
    'sites-enabled/sgi.ultimamilla.com.ar': ('sgi.ultimamilla.com.ar-0001', ['sgi.ultimamilla.com.ar', 'www.sgi.ultimamilla.com.ar']),
    'conf.d/sitrep.conf': ('sitrep.ultimamilla.com.ar', ['sitrep.ultimamilla.com.ar']),
    'sites-enabled/wiki.ultimamilla.com.ar': ('wiki.ultimamilla.com.ar', ['wiki.ultimamilla.com.ar']),
    'sites-enabled/umbot.com.ar': ('www.umbot.com.ar', ['umbot.com.ar', 'www.umbot.com.ar']),
    'conf.d/vecinorabioso.conf': ('vecinorabioso.com.ar', ['vecinorabioso.com.ar', 'www.vecinorabioso.com.ar']),
}
LOCATION = ('\n    location ^~ /.well-known/acme-challenge/ {\n'
            '        root /var/www/umsa-acme;\n'
            '        default_type text/plain;\n'
            '        auth_basic off;\n'
            '        allow all;\n'
            '        try_files $uri =404;\n'
            '    }\n')


def prepare_text(text, domains):
    if '/.well-known/acme-challenge/' in text:
        raise ValueError('Existing challenge route needs review')
    matches = list(re.finditer(r'^\s*server_name\s+([^;]+);[^\n]*', text, re.M))
    found = {name for match in matches for name in match[1].split()}
    if not set(domains).issubset(found):
        raise ValueError('Expected domains absent')
    # Redirect-only blocks retain their redirects. Tests follow HTTP to the final
    # HTTPS canonical host, where this location wins over dot-file regex denials.
    return re.sub(r'(^\s*server_name\s+[^;]+;[^\n]*)', lambda m: m[0] + LOCATION, text, flags=re.M)


def wait_for_challenge(command, expected, log):
    # systemctl reload only confirms that HUP was sent. Existing workers may
    # still answer briefly with the previous config, so require actual readiness.
    for attempt in range(20):
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=log, text=True)
        if result.returncode == 0 and result.stdout == expected:
            return
        if attempt < 19:
            time.sleep(0.5)
    raise RuntimeError('Challenge route did not become ready')


def main(resume=False):
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    backup = STAGE / 'before-acme-preparation'
    if (not (STAGE / 'persist-rehearsal.complete').is_file() or (STAGE / 'production.active').exists()
            or (STAGE / 'acme-preparation.complete').exists() or WEBROOT.is_symlink()):
        raise RuntimeError('Unexpected ACME preparation state; inspect before retry')
    if resume:
        if not backup.is_dir() or not WEBROOT.is_dir() or 'curl: (22) The requested URL returned error: 403' not in (STAGE / 'receipts/acme-preparation.log').read_text():
            raise RuntimeError('Not the reviewed rolled-back readiness failure')
        for relative in PLANS:
            if (CONFIG / relative).read_bytes() != (backup / relative).read_bytes():
                raise RuntimeError('Original configuration was not restored')
    elif backup.exists() or WEBROOT.exists():
        raise RuntimeError('Existing attempt requires explicit reviewed recovery')
    prepared = {}
    for relative, (_, domains) in PLANS.items():
        path = CONFIG / relative
        if path.is_symlink():
            raise RuntimeError('Unexpected config symlink')
        prepared[path] = prepare_text(path.read_text(), domains)
    if not resume:
        backup.mkdir(mode=0o700)
        for path in prepared:
            dest = backup / path.relative_to(CONFIG)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)
    challenge = WEBROOT / '.well-known/acme-challenge'
    challenge.mkdir(parents=True, exist_ok=resume)
    for path in (WEBROOT, WEBROOT / '.well-known', challenge):
        path.chmod(0o755)
    token = 'migration-probe-' + secrets.token_hex(16)
    (challenge / token).write_text(token)
    (challenge / token).chmod(0o644)
    hosts = sorted({host for _, hosts in PLANS.values() for host in hosts})
    resolve = [part for host in hosts for port in (80, 443) for part in ('--resolve', f'{host}:{port}:127.0.0.1')]
    with (STAGE / 'receipts/acme-preparation.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        try:
            for path, text in prepared.items():
                path.write_text(text)
            run(['/usr/sbin/nginx', '-t', '-c', str(CONFIG / 'nginx.conf')])
            run(['systemctl', 'reload', 'umsa-clean-front'])
            for host in hosts:
                wait_for_challenge(['curl', '--noproxy', '*', '-fsSL', '--max-redirs', '5', '--max-time', '20',
                    *resolve, f'http://{host}/.well-known/acme-challenge/{token}'], token, log)
        except Exception:
            for path in prepared:
                shutil.copy2(backup / path.relative_to(CONFIG), path)
            run(['/usr/sbin/nginx', '-t', '-c', str(CONFIG / 'nginx.conf')])
            run(['systemctl', 'reload', 'umsa-clean-front'])
            raise
        # Only official distro packaging. No copied ACME account, hooks or timer
        # is executed; public issuance must follow the single-writer cutover.
        # Prevent package presets from scheduling copied legacy renewal configs.
        for timer in ('certbot-renew.timer', 'certbot.timer'):
            if subprocess.run(['systemctl', 'is-active', '--quiet', timer]).returncode == 0:
                raise RuntimeError('An existing certificate timer needs review')
        run(['systemctl', 'mask', 'certbot-renew.timer', 'certbot.timer'])
        run(['dnf', '-y', 'install', 'certbot'])
        run(['certbot', '--version'])
    (STAGE / 'acme-plan.json').write_text(json.dumps({
        'webroot': str(WEBROOT), 'lineages': {name: hosts for name, hosts in PLANS.values()},
        'tested_hosts': hosts, 'issuance_performed': False, 'automatic_renewal_enabled': False,
        'next_step': 'Issue with a fresh ACME account after public challenge routing is verified; use umsa-clean-front deploy hook.'
    }, indent=2) + '\n')
    (STAGE / 'acme-preparation.complete').write_text('Private HTTP-01 paths passed with validated HTTPS redirects. Public issuance and renewal activation pending.\n')
    print(f'Private challenge paths passed for {len(hosts)} hostnames. Certbot installed; no public issuance, timer or DNS changes.')


if __name__ == '__main__':
    if sys.argv[1:] not in ([], ['--resume-after-reload']):
        raise RuntimeError('Unsupported operation')
    main(bool(sys.argv[1:]))
