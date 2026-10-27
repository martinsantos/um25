#!/usr/bin/env python3
"""Restore reviewed Plan overview data only in the isolated rehearsal."""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
PLAN = Path('/srv/umsa-clean-plan')
MUTABLE = STAGE / 'mutable-rehearsals/40593832809-1'
PUBLIC_SOURCE = STAGE / 'source/home/umbot.com.ar/public_html/plan/site-data/overview.json'
PUBLIC_SHA = '603fcb22ee73dcdd68d6a4f7586114c5cae0221c8c68002f8d408f18f557fa08'
SOURCE_SHA = '7672799c810efe907b53b3b0816c50f830fb17890470a2737893b7c427707f90'


def read_reviewed(path, expected):
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 1024 * 1024:
        raise ValueError('Unexpected overview data file')
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError('Overview data differs from the reviewed copy')
    if not isinstance(json.loads(data), dict):
        raise ValueError('Overview data is not a JSON object')
    return data


def validate_destination(directory):
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError('Unexpected parent directory')
    child = directory / 'site-data'
    if child.exists() or child.is_symlink():
        raise ValueError('Existing site-data requires inspection')
    return child


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()
            or not (MUTABLE / 'transfer.complete').is_file()):
        raise RuntimeError('Not the isolated, staged target')
    started = STAGE / 'plan-site-data-rehearsal.started'
    complete = STAGE / 'plan-site-data-rehearsal.complete'
    if started.exists() or complete.exists() or PLAN.is_symlink():
        raise RuntimeError('Unexpected prior attempt or Plan root')
    docs = read_reviewed(MUTABLE / 'plan-docs/site-data/overview.json', SOURCE_SHA)
    root = read_reviewed(MUTABLE / 'plan-site-data/overview.json', SOURCE_SHA)
    public = read_reviewed(PUBLIC_SOURCE, PUBLIC_SHA)
    live = subprocess.check_output(['curl', '--noproxy', '*', '-fsS', '--max-time', '20',
        'https://www.umbot.com.ar/plan/site-data/overview.json'])
    if hashlib.sha256(live).hexdigest() != PUBLIC_SHA:
        raise RuntimeError('Published Plan data changed since review')
    entries = [(validate_destination(PLAN / 'docs'), docs),
               (validate_destination(PLAN), root),
               (validate_destination(PLAN / 'public'), public)]
    started.write_text('Only three absent data files in isolated Plan; no existing file is replaced.\n')
    for directory, data in entries:
        directory.mkdir(mode=0o755)
        directory.chmod(0o755)
        target = directory / 'overview.json'
        with target.open('xb') as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        target.chmod(0o644)
    actual = subprocess.check_output(['curl', '--noproxy', '*', '-fsS', '--max-time', '20',
        '--resolve', 'www.umbot.com.ar:443:127.0.0.1',
        'https://www.umbot.com.ar/plan/site-data/overview.json'])
    if hashlib.sha256(actual).hexdigest() != PUBLIC_SHA:
        raise RuntimeError('Private Plan response differs from the published copy')
    complete.write_text('Three data files added; private HTTPS matches current public data. No production cutover.\n')
    print('Plan data restored in isolated rehearsal; private HTTPS matches the current published file.')


if __name__ == '__main__':
    main()
