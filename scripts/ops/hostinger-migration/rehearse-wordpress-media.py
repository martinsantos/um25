#!/usr/bin/env python3
"""Add reviewed missing WordPress images to the isolated target only."""
import hashlib
import imghdr
import json
import os
from pathlib import Path
import pwd
import socket
import subprocess
from urllib.parse import quote

STAGE = Path('/srv/umsa-migration')
ROOT = STAGE / 'mutable-rehearsals/40586524354-1'
SOURCE = ROOT / 'wordpress-uploads'
TARGET = Path('/srv/umsa-clean-php/wordpress/wp-content/uploads')


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def missing_images(source, target):
    missing = []
    for item in sorted(source.rglob('*')):
        if item.is_symlink():
            raise ValueError('Unexpected source link')
        if not item.is_file():
            continue
        relative = item.relative_to(source)
        current = target / relative
        if current.is_symlink():
            raise ValueError('Unexpected target link')
        if current.exists():
            if not current.is_file() or digest(item) != digest(current):
                raise ValueError('Existing image differs; inspect before copying')
            continue
        if relative.parts[:2] != ('2026', '10') or item.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.gif'):
            raise ValueError('Unreviewed missing file')
        if imghdr.what(item) not in ('jpeg', 'png', 'gif'):
            raise ValueError('Missing file is not a supported image')
        missing.append(relative)
    if len(missing) != 11:
        raise ValueError('Missing image inventory changed; inspect first')
    return missing


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or not (ROOT / 'transfer.complete').is_file()
            or SOURCE.is_symlink() or TARGET.is_symlink()):
        raise RuntimeError('Not the isolated, staged target')
    marker = STAGE / 'wordpress-media-rehearsal.complete.json'
    if marker.exists() or (STAGE / 'wordpress-media-rehearsal.started').exists():
        raise RuntimeError('Prior attempt exists; inspect before retry')
    missing = missing_images(SOURCE, TARGET)
    worker = pwd.getpwnam('nginx')
    # The reviewed parent already exists and remains writable by the wiki/WP worker.
    parent = TARGET / '2026/10'
    if parent.is_symlink() or parent.parent.is_symlink() or not parent.is_dir() or parent.stat().st_uid != worker.pw_uid:
        raise RuntimeError('Unexpected uploads ownership or path')
    (STAGE / 'wordpress-media-rehearsal.started').write_text('Only new, verified image files; no existing file is replaced.\n')
    hashes = {}
    for relative in missing:
        src = SOURCE / relative
        dst = TARGET / relative
        tmp = parent / ('.' + dst.name + '.umsa-rehearsal-pending')
        if dst.parent != parent or tmp.exists() or tmp.is_symlink():
            raise RuntimeError('Unexpected image path')
        with src.open('rb') as inp, tmp.open('xb') as out:
            for block in iter(lambda: inp.read(1024 * 1024), b''):
                out.write(block)
            out.flush()
            os.fsync(out.fileno())
        os.chown(tmp, worker.pw_uid, worker.pw_gid)
        tmp.chmod(0o644)
        if digest(src) != digest(tmp):
            raise RuntimeError('Image copy differs')
        os.link(tmp, dst, follow_symlinks=False)
        tmp.unlink()
        body = subprocess.check_output(['curl', '--noproxy', '*', '-fsS', '--max-time', '20',
            '--resolve', 'vecinorabioso.com.ar:443:127.0.0.1',
            'https://vecinorabioso.com.ar/wp-content/uploads/' + quote(relative.as_posix())])
        if hashlib.sha256(body).hexdigest() != digest(src):
            raise RuntimeError('Private HTTPS image differs')
        hashes[relative.as_posix()] = digest(src)
    marker.write_text(json.dumps({'files': len(hashes), 'sha256': hashes, 'scope': 'rehearsal only'}, indent=2) + '\n')
    print(f'{len(hashes)} new WordPress images verified via private HTTPS; no prior file replaced. Final sync still pending.')


if __name__ == '__main__':
    main()
