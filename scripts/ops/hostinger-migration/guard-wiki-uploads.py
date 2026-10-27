#!/usr/bin/env python3
"""Prevent executable files in wiki uploads in the isolated target proxy."""
import os
from pathlib import Path
import shutil
import socket
import subprocess
import time
from urllib.parse import quote

STAGE = Path('/srv/umsa-migration')
CONFIG = Path('/srv/umsa-clean-proxy/nginx')
WIKI = CONFIG / 'sites-enabled/wiki.ultimamilla.com.ar'
NEEDLE = r'    location ~ \.php$ {'
GUARD = r'    location ~* ^/images/.*\.(?:php[0-9]*|phtml|phar|shtml)(?:/|$) { return 403; }' + '\n'


def guarded(text):
    if text.count(NEEDLE) != 1 or GUARD in text:
        raise ValueError('Unexpected wiki PHP configuration')
    return text.replace(NEEDLE, GUARD + NEEDLE, 1)


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()
            or not (STAGE / 'acme-preparation.complete').is_file() or WIKI.is_symlink()):
        raise RuntimeError('Not an isolated, validated target')
    previous = STAGE / 'wiki-config-before-uploads-guard'
    if previous.exists() or (STAGE / 'wiki-uploads-guard.complete').exists():
        raise RuntimeError('Prior attempt exists; inspect before retry')
    images = Path('/srv/umsa-clean-php/wiki/images')
    if images.is_symlink():
        raise RuntimeError('Unexpected wiki images directory')
    sample = next((p for p in images.rglob('*') if not p.is_symlink() and p.is_file()
                   and p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.gif')), None)
    if sample is None:
        raise RuntimeError('No existing wiki image available for validation')
    updated = guarded(WIKI.read_text())
    shutil.copy2(WIKI, previous)
    urls = [('/wiki/Alcance', '200'), ('/images/migration-security-probe.php', '403'),
            ('/images/migration-security-probe.PHTML', '403'),
            ('/images/' + quote(sample.relative_to(images).as_posix()), '200')]
    with (STAGE / 'receipts/wiki-uploads-guard.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        try:
            WIKI.write_text(updated)
            run(['/usr/sbin/nginx', '-t', '-c', str(CONFIG / 'nginx.conf')])
            run(['systemctl', 'reload', 'umsa-clean-front'])
            for path, status in urls:
                for attempt in range(20):
                    result = subprocess.run(['curl', '--noproxy', '*', '-sS', '-o', '/dev/null', '-w', '%{http_code}',
                        '--max-time', '10', '--resolve', 'wiki.ultimamilla.com.ar:443:127.0.0.1',
                        'https://wiki.ultimamilla.com.ar' + path], stdout=subprocess.PIPE, stderr=log, text=True)
                    if result.returncode == 0 and result.stdout == status:
                        break
                    time.sleep(0.5)
                else:
                    raise RuntimeError('Wiki route failed isolated validation: ' + path)
        except Exception:
            shutil.copy2(previous, WIKI)
            run(['/usr/sbin/nginx', '-t', '-c', str(CONFIG / 'nginx.conf')])
            run(['systemctl', 'reload', 'umsa-clean-front'])
            raise
    (STAGE / 'wiki-uploads-guard.complete').write_text('Wiki upload script requests denied; page and image passed.\n')
    print('Wiki upload execution guard verified in the isolated target. Public source and DNS unchanged.')


if __name__ == '__main__':
    main()
