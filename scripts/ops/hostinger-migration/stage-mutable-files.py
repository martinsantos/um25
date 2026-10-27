#!/usr/bin/env python3
"""Copy mutable source data into private rehearsal staging; do not activate it."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
SOURCE = 'root@23.105.176.45'
PATHS = {
    'directus-uploads': '/opt/directus-admin/uploads',
    'sgi-private': '/home/sgi.ultimamilla.com.ar/private',
    'sgi-imports': '/home/sgi.ultimamilla.com.ar/imports',
    'sgi-uploads': '/home/sgi.ultimamilla.com.ar/uploads',
    'sgi-arca-archive': '/var/lib/sgi-arca/archive',
    'sitrep-data': '/var/www/sitrep-backend/data',
    'sitrep-uploads': '/var/www/sitrep-backend-releases/20260925-064551-inspections/uploads',
    'arca-output': '/opt/plantilla-arca-app/output',
    'wordpress-uploads': '/home/vecinorabioso.com.ar/public_html/wp-content/uploads',
    'wiki-images': '/home/wiki.ultimamilla.com.ar/images',
    'plan-docs': '/home/umbot.com.ar/cannaval-plan-repo/docs',
    'plan-acciones': '/home/umbot.com.ar/cannaval-plan-repo/acciones',
    'plan-registro': '/home/umbot.com.ar/cannaval-plan-repo/registro',
    'plan-plantillas': '/home/umbot.com.ar/cannaval-plan-repo/plantillas',
    'plan-site-data': '/home/umbot.com.ar/cannaval-plan-repo/site-data',
    'plan-exports': '/home/umbot.com.ar/cannaval-plan-repo/exports',
    'plan-wiki': '/home/umbot.com.ar/cannaval-plan-repo/wiki',
}


def validate_identifier(identifier):
    if not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Invalid CI run identifier')
    return identifier


def main(identifier):
    identifier = validate_identifier(identifier)
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or not os.environ.get('SSH_AUTH_SOCK')):
        raise RuntimeError('Not an isolated CI target')
    if shutil.disk_usage(STAGE).free < 10 * 1024**3:
        raise RuntimeError('Insufficient target free space')
    known = STAGE / 'known_hosts'
    if known.is_symlink() or not known.is_file():
        raise RuntimeError('Missing pinned source host key')
    root = STAGE / 'mutable-rehearsals' / identifier
    root.mkdir(parents=True, mode=0o700, exist_ok=False)
    (root / 'REHEARSAL-ONLY').write_text('Copied while source was live; not a consistent final cutover.\n')
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
               'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15',
               '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=6']
    ssh = shlex.join(['ssh', *options])
    manifest = {}
    with (root / 'transfer.log').open('ab') as log:
        for name, source in PATHS.items():
            # Refuse missing roots and symlinked roots; never follow a new path
            # under a potentially compromised source installation.
            if name == 'sitrep-uploads':
                target = subprocess.check_output(['ssh', *options, SOURCE,
                    'readlink /var/www/sitrep-backend/uploads'], stderr=log, text=True).strip()
                if target != source:
                    raise RuntimeError('SITREP upload link changed; inspect before copying')
            subprocess.run(['ssh', *options, SOURCE,
                'test -d ' + shlex.quote(source) + ' && test ! -L ' + shlex.quote(source)],
                check=True, stdout=log, stderr=log)
            unsafe = subprocess.check_output(['ssh', *options, SOURCE,
                'find ' + shlex.quote(source) + r' \( -type b -o -type c -o -type p -o -type s \) -print -quit'],
                stderr=log, text=True)
            if unsafe:
                raise RuntimeError('Source data contains a special file: ' + name)
            links = subprocess.check_output(['ssh', *options, SOURCE,
                'find ' + shlex.quote(source) + ' -type l -print'], stderr=log, text=True).splitlines()
            expected = [source + '/wiki'] if name == 'plan-docs' else []
            if links != expected:
                raise RuntimeError('Unexpected source link inventory: ' + name)
            if links:
                target = subprocess.check_output(['ssh', *options, SOURCE, 'readlink ' + shlex.quote(links[0])],
                                                 stderr=log, text=True).strip()
                if target != '../wiki':
                    raise RuntimeError('Unexpected Plan documentation link')
            dest = root / name
            dest.mkdir(mode=0o700)
            subprocess.run(['rsync', '-a', '--numeric-ids', '--no-specials', '--no-devices',
                '--rsync-path=ionice -c3 nice -n 19 rsync', '-e', ssh, SOURCE + ':' + source + '/', str(dest) + '/'],
                check=True, stdout=log, stderr=log)
            digest = hashlib.sha256()
            count = total = 0
            for path in sorted(dest.rglob('*')):
                if path.is_symlink():
                    if name != 'plan-docs' or path.relative_to(dest).as_posix() != 'wiki' or os.readlink(path) != '../wiki':
                        raise RuntimeError('Unexpected staged link: ' + name)
                    digest.update(b'link\0wiki\0../wiki')
                    continue
                if not path.is_file():
                    continue
                relative = path.relative_to(dest).as_posix().encode('utf-8')
                file_hash = hashlib.sha256()
                with path.open('rb') as stream:
                    for block in iter(lambda: stream.read(1024 * 1024), b''):
                        file_hash.update(block)
                digest.update(relative + b'\0' + file_hash.digest())
                count += 1
                total += path.stat().st_size
            manifest[name] = {'source': source, 'files': count, 'bytes': total, 'content_sha256': digest.hexdigest()}
            (root / 'manifest.partial.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (root / 'manifest.partial.json').rename(root / 'manifest.json')
    (root / 'transfer.complete').write_text('Staging only; live source, no activation or final consistency claimed.\n')
    print('Mutable data staged privately; current applications and source remain unchanged. Final consistent synchronization still required.')


if __name__ == '__main__':
    main(sys.argv[1])
