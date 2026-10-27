#!/usr/bin/env python3
"""Correct one visually verified regression in the isolated rehearsal."""
import hashlib
import os
from pathlib import Path
import shutil
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
ROOT = STAGE / 'mutable-rehearsals/40586524354-1'
NAME = '5b62a290-0878-43fa-9b9b-e057e8074069.jpg'
SOURCE = ROOT / 'umsa-public-archive/uploads/antecedentes' / NAME
TARGET = Path('/srv/umsa-clean-apps/astro-ultimamilla/dist/client/uploads/antecedentes') / NAME
SOURCE_SHA = 'ad7079ee6319a013ed7c8f0912d056badfc6f14096be002e25d71488132f0495'
WRONG_SHA = '0f91fb24665cec5b0065f6fdd205f9e62c7b799b25281d87e27d848f45eda4b7'


def checked_hash(path, expected):
    if path.is_symlink() or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise RuntimeError('Image differs from reviewed evidence')


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or not (ROOT / 'transfer.complete').is_file()):
        raise RuntimeError('Not the isolated, fully staged target')
    checked_hash(SOURCE, SOURCE_SHA)
    checked_hash(TARGET, WRONG_SHA)
    backup = ROOT / 'case-image-before-correction.jpg'
    pending = TARGET.with_name(TARGET.name + '.migration-pending')
    marker = STAGE / 'case-image-correction.complete'
    if backup.exists() or pending.exists() or marker.exists():
        raise RuntimeError('Previous attempt exists; inspect first')
    shutil.copy2(TARGET, backup)
    shutil.copy2(SOURCE, pending)
    pending.chmod(0o644)
    os.replace(pending, TARGET)
    try:
        checked_hash(TARGET, SOURCE_SHA)
        body = subprocess.check_output(['curl', '--noproxy', '*', '-fsS', '--max-time', '20',
            '--resolve', 'www.ultimamilla.com.ar:443:127.0.0.1',
            'https://www.ultimamilla.com.ar/uploads/antecedentes/' + NAME])
        if hashlib.sha256(body).hexdigest() != SOURCE_SHA:
            raise RuntimeError('Private HTTPS did not serve the verified image')
    except Exception:
        shutil.copy2(backup, pending)
        os.replace(pending, TARGET)
        raise
    marker.write_text('Existing production photograph restored in private rehearsal; previous contact sheet retained.\n')
    print('Visually verified case image restored in isolated target; previous image retained. Source and DNS unchanged.')


if __name__ == '__main__':
    main()
