#!/usr/bin/env python3
"""Prepare application files/configuration on the new host without starting apps."""
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink():
        raise RuntimeError('Wrong target')
    if (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong target marker')
    run = json.loads((STAGE / 'receipts/initial-copy-run.json').read_text())
    if (run.get('id') != 40498669903 or run.get('conclusion') != 'success'
            or run.get('head_branch') != 'master' or run.get('event') != 'workflow_dispatch'
            or run.get('path') != '.github/workflows/hostinger-migration.yml'):
        raise RuntimeError('Initial copy not verified by CI')
    marker = STAGE / 'application-files.started'
    if marker.exists():
        raise RuntimeError('Materialization already attempted; inspect before retry')
    source = STAGE / 'source'
    if not (source / 'var/lib/sgi-arca/archive').is_dir():
        raise RuntimeError('SGI ARCA persistent archive missing')
    roots = [Path('/home'), Path('/var/www'), Path('/var/lib/sgi-arca'),
             Path('/root/fumbling-field'), Path('/root/dge-demo'), Path('/root/.nvm'),
             Path('/opt/directus-admin'), Path('/opt/directus-releases'), Path('/opt/directus-current'),
             Path('/opt/plantilla-arca-app')]
    roots += [Path('/root') / path.name for path in sorted((source / 'root').glob('sgi-*'))]
    for path in roots:
        incoming = source / str(path).lstrip('/')
        if not incoming.exists() and not incoming.is_symlink():
            raise RuntimeError('Missing application root: ' + str(path))
        if path.exists() and (not path.is_dir() or any(path.iterdir())):
            raise RuntimeError('Destination is not empty: ' + str(path))
    marker.write_text('Initial copy verified; reflink materialization started.\n')
    with (STAGE / 'receipts/application-files.log').open('ab') as log:
        def command(args):
            subprocess.run(args, check=True, stdout=log, stderr=log)

        for path in roots:
            incoming = source / str(path).lstrip('/')
            path.parent.mkdir(parents=True, exist_ok=True)
            # XFS reflinks preserve a private initial snapshot without duplicating data blocks.
            if path.is_dir():
                command(['cp', '-a', '--reflink=always', str(incoming) + '/.', str(path) + '/'])
            else:
                command(['cp', '-a', '--reflink=always', str(incoming), str(path)])
        originals = STAGE / 'original-target-config'
        originals.mkdir(mode=0o700)
        configs = ('/etc/nginx', '/etc/letsencrypt', '/etc/sgi-arca', '/etc/php.ini',
                   '/etc/php-fpm.conf', '/etc/php-fpm.d', '/etc/opt/remi/php74/php.ini',
                   '/etc/opt/remi/php74/php-fpm.conf', '/etc/opt/remi/php74/php-fpm.d')
        for name in configs:
            path = Path(name)
            incoming = source / name.lstrip('/')
            if not incoming.exists():
                raise RuntimeError('Missing source configuration: ' + name)
            if path.exists():
                backup = originals / name.lstrip('/')
                backup.parent.mkdir(parents=True, exist_ok=True)
                command(['cp', '-a', '--reflink=always', str(path), str(backup)])
            path.parent.mkdir(parents=True, exist_ok=True)
            if incoming.is_dir():
                path.mkdir(exist_ok=True)
                command(['cp', '-a', '--reflink=always', str(incoming) + '/.', str(path) + '/'])
            else:
                command(['cp', '-a', '--reflink=always', str(incoming), str(path)])
        # Preserve the legacy duplicate, but keep it outside the active Nginx include.
        duplicate = Path('/etc/nginx/sites-enabled/sgi.ultimamilla.com.ar.backup-20260823-153556')
        if duplicate.exists() or duplicate.is_symlink():
            inactive = STAGE / 'inactive-nginx'
            inactive.mkdir(mode=0o700)
            shutil.move(str(duplicate), str(inactive / duplicate.name))
        # Package-created directories need the same write/read identities as the source pools.
        for path in ('/var/lib/php/session', '/var/opt/remi/php74/lib/php/session'):
            directory = Path(path)
            directory.mkdir(parents=True, exist_ok=True)
            command(['chown', 'nginx:nginx', str(directory)])
        command(['nginx', '-t'])
        command(['php-fpm', '-t'])
        command(['/opt/remi/php74/root/usr/sbin/php-fpm', '-t'])
    (STAGE / 'application-files.complete').write_text('Files and Nginx/PHP configuration prepared; applications not started.\n')
    print('Application files materialized; Nginx and both PHP configurations validate. Services remain inactive.')


if __name__ == '__main__':
    main()
