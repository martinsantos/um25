#!/usr/bin/env python3
"""Rehearse original Nginx routing against clean applications on loopback only."""
import hashlib
import importlib.util
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-clean-proxy')
STATIC = ROOT / 'static'
PRECRIMEN = '13331a19df6cee47ba2cfd36dc6b7ede949856f3f22121b16d58d24d5b5f59b2'


def retire_unused_routes(text, name):
    if name == 'ultimamilla.com.ar':
        for location in ('/demoambiente/assets/', '/demoambiente/api/', '/demoambiente/api-DISABLED/', '/demoambiente/', '= /demoambiente'):
            pattern = r'(?m)^[ \t]*location ' + re.escape(location) + r'\s*\{[^{}]*\}'
            text, count = re.subn(pattern, '    location ' + location + ' { return 410; }', text)
            if count != 1:
                raise RuntimeError('Unexpected retired demo location')
    if name == 'umbot.com.ar':
        old = 'try_files $uri $uri/ /index.html;'
        if text.count(old) != 1:
            raise RuntimeError('Unexpected legacy game fallback')
        text = text.replace(old, 'return 410;')
    return text


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if ROOT.exists():
        raise RuntimeError('Proxy rehearsal already attempted; inspect before retry')
    for marker in ('clean-node-rehearsal.ready','clean-container-rehearsal.ready','clean-php-rehearsal.ready',
                   'clean-tools-plan.ready','rehearsal-bridges.ready','clean-runtime-configuration.complete',
                   'database-network-restricted.complete'):
        if not (STAGE / marker).is_file():
            raise RuntimeError('Missing rehearsal prerequisite: ' + marker)
    if subprocess.run(['systemctl','is-active','--quiet','nginx']).returncode == 0:
        raise RuntimeError('Main Nginx already running')
    for port in (80,443):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1',port))
    pre = Path('/var/www/sitrep-precrimen/current')
    rows = sorted((p.relative_to(pre).as_posix(),hashlib.sha256(p.read_bytes()).hexdigest()) for p in pre.rglob('*') if p.is_file())
    if len(rows) != 26 or hashlib.sha256(''.join(h + '  ' + n + '\n' for n,h in rows).encode()).hexdigest() != PRECRIMEN:
        raise RuntimeError('Precrimen differs from independently verified original Site v17')
    sitrep = Path((STAGE / 'trusted-sitrep').read_text().strip())
    if sitrep.parent != STAGE / 'trusted' or sitrep.is_symlink():
        raise RuntimeError('Invalid SITREP artifact pointer')
    spec = importlib.util.spec_from_file_location('legacy_rehearsal',Path(__file__).with_name('rehearsal.py'))
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    with (STAGE / 'receipts/clean-proxy-rehearsal.log').open('ab') as log:
        def run(args):
            subprocess.run(args,check=True,stdout=log,stderr=log)
        ROOT.mkdir(mode=0o755)
        ROOT.chmod(0o755)
        STATIC.mkdir(mode=0o755)
        STATIC.chmod(0o755)
        # Explicit modes are needed because the migration process uses umask 077.
        for root in ('/srv/umsa-clean-php','/srv/umsa-clean-apps'):
            Path(root).chmod(0o755)
        run(['cp','-a','--reflink=always',str(sitrep / 'application/web'),str(STATIC / 'sitrep')])
        run(['cp','-a','--reflink=always',str(sitrep / 'application/app'),str(STATIC / 'sitrep/app')])
        run(['cp','-a','--reflink=always',str(pre.resolve()),str(STATIC / 'precrimen')])
        (STATIC / 'legacy-pending').mkdir()
        # User confirmed these applications are unused: archive only, never serve.
        config = ROOT / 'nginx'
        shutil.copytree('/etc/nginx',config,symlinks=False)
        dump = subprocess.check_output(['/usr/sbin/nginx','-T'],stderr=log,text=True)
        active = [Path(name).relative_to('/etc/nginx') for name in re.findall(r'^# configuration file (/etc/nginx/.+):$',dump,re.M)]
        for path in (config / 'sites-enabled').iterdir():
            if '.backup-' in path.name:
                path.rename(ROOT / ('inactive-' + path.name))
        mappings = [('/etc/nginx',str(config)),('/var/www/sitrep-precrimen/current',str(STATIC / 'precrimen')),
                    ('/var/www/sitrep',str(STATIC / 'sitrep')),
                    ('/home/vecinorabioso.com.ar/public_html','/srv/umsa-clean-php/wordpress'),
                    ('/home/wiki.ultimamilla.com.ar','/srv/umsa-clean-php/wiki'),
                    ('/root/fumbling-field/public','/srv/umsa-clean-apps/astro-ultimamilla/dist/client'),
                    ('/home/umbot.com.ar/public_html',str(STATIC / 'legacy-pending')),
                    ('/var/www/demoambiente',str(STATIC / 'legacy-pending'))]
        for relative in active:
            path = config / relative
            if not path.is_file():
                continue
            text = retire_unused_routes(path.read_text(), path.name)
            for old,new in mappings:
                text = text.replace(old,new)
            if 'listen ' in text:
                text = helper.local_listeners(text)
            text = text.replace('/run/nginx.pid','/run/nginx-clean-rehearsal.pid')
            if path.name == 'umbot.com.ar':
                marker = '    location = /plan/admin {'
                if text.count(marker) != 1:
                    raise RuntimeError('Unexpected UMBot Plan configuration')
                text = text.replace(marker,'    location = /plan { return 308 /plan/; }\n'
                    '    location ^~ /plan/ { alias /srv/umsa-clean-plan/public/; index index.html; }\n' + marker)
            path.write_text(text)
        for base in (STATIC,Path('/srv/umsa-clean-apps/astro-ultimamilla/dist/client'),Path('/srv/umsa-clean-plan/public')):
            for item in [base,*base.rglob('*')]:
                if item.is_symlink():
                    raise RuntimeError('Unexpected public asset symlink')
                item.chmod(0o755 if item.is_dir() else 0o644)
        for path in ('/srv/umsa-clean-apps/astro-ultimamilla','/srv/umsa-clean-apps/astro-ultimamilla/dist','/srv/umsa-clean-plan'):
            Path(path).chmod(0o755)
        run(['/usr/sbin/nginx','-t','-c',str(config / 'nginx.conf')])
        run(['systemd-run','--unit=umsa-clean-proxy','--property=IPAddressDeny=any',
             '--property=IPAddressAllow=localhost','--property=IPAddressAllow=68.168.218.28/32',
             '/usr/sbin/nginx','-c',str(config / 'nginx.conf'),'-g','daemon off;'])
    (STAGE / 'clean-proxy-rehearsal.ready').write_text('Localhost only; legacy Cannaval frontend and demoambiente are archive-only by user instruction.\n')
    print('Clean Nginx rehearsal started on loopback. Legacy unverified frontends remain excluded; no DNS/public cutover.')


if __name__ == '__main__':
    main()
