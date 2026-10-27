#!/usr/bin/env python3
"""Publish a fresh UMSA build on Hostinger; keep releases, data and other services."""
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import socket
import subprocess
import sys
import tarfile
import time

STAGE = Path('/srv/umsa-migration')
RELEASES = Path('/srv/umsa-web-releases')
FRONT = Path('/srv/umsa-clean-proxy/nginx/nginx.conf')
STATE = STAGE / 'web-publication-state.json'
INITIAL = {'port': 4321, 'unit': 'umsa-clean-astro-ultimamilla.service',
           'config': '/srv/umsa-clean-proxy/nginx',
           'assets': '/srv/umsa-clean-apps/astro-ultimamilla/dist/client'}
ROUTES = ('/', '/servicios', '/antecedentes', '/estilo/fuentes/plantilla', '/status/')


def validate_archive(archive):
    regular = set()
    seen = set()
    for member in archive.getmembers():
        name = PurePosixPath(member.name)
        if name.is_absolute() or '..' in name.parts or not name.parts:
            raise ValueError('Unsafe archive path')
        if name.parts[0] not in ('dist', 'node_modules', 'package.json', 'package-lock.json'):
            raise ValueError('Unexpected release payload')
        if name in seen:
            raise ValueError('Duplicate archive member')
        seen.add(name)
        if member.isdev() or member.isfifo():
            raise ValueError('Unsupported archive entry')
        if member.islnk():
            # npm installs esbuild's executable as a hardlink. Only accept a
            # backward reference to a regular member already validated here.
            target = PurePosixPath(member.linkname)
            if target.is_absolute() or '..' in target.parts or target not in regular:
                raise ValueError('Unsafe hardlink target')
            regular.add(name)
        elif member.isfile():
            regular.add(name)
        if member.issym():
            target = PurePosixPath(member.linkname)
            if target.is_absolute():
                raise ValueError('Absolute archive link')
            parts = list(name.parent.parts)
            for item in target.parts:
                if item == '..':
                    if not parts: raise ValueError('Escaping archive link')
                    parts.pop()
                elif item != '.': parts.append(item)
            if not parts or parts[0] != 'node_modules':
                raise ValueError('Link outside dependency tree')


def transform_config(text, previous, root, assets, port):
    return (text.replace(previous['config'], str(root)).replace(previous['assets'], str(assets))
        .replace('http://127.0.0.1:' + str(previous['port']) + ';', 'http://127.0.0.1:' + str(port) + ';'))


def atomic_text(path, text, mode=0o600):
    temp = path.with_name(path.name + '.pending')
    with temp.open('x') as stream:
        stream.write(text)
        stream.flush()
        os.fsync(stream.fileno())
    temp.chmod(mode)
    os.replace(temp, path)


def validate_previous(previous):
    if previous == INITIAL:
        return
    root = Path(previous['config'])
    if (root.parent.parent != RELEASES or root.name != 'nginx' or root.is_symlink()
            or not re.fullmatch(r'[0-9a-f]{40}-[0-9]+-[0-9]+', root.parent.name)
            or previous['assets'] != str(root.parent / 'application/dist/client')
            or previous['unit'] != 'umsa-web-' + root.parent.name + '.service'
            or previous['port'] not in (4321, 4322)):
        raise ValueError('Invalid current release state')


def main(mode, revision, run_id, attempt, expected):
    os.umask(0o022)
    if mode not in ('rehearse', 'publish') or not re.fullmatch('[0-9a-f]{40}', revision):
        raise ValueError('Invalid mode or revision')
    if not re.fullmatch('[0-9]+', run_id) or not re.fullmatch('[0-9]+', attempt) or not re.fullmatch('[0-9a-f]{64}', expected):
        raise ValueError('Invalid release identity')
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'persist-rehearsal.complete').is_file():
        raise RuntimeError('Persistent target rehearsal must pass first')
    production = (STAGE / 'production.active').is_file()
    if (mode == 'publish') != production:
        raise RuntimeError('Publishing requires the completed migration cutover; rehearsal is pre-cutover only')
    identifier = revision + '-' + run_id + '-' + attempt
    package = STAGE / 'incoming' / (identifier + '.tar.gz')
    if package.is_symlink() or not package.is_file():
        raise RuntimeError('Missing immutable CI package')
    h = hashlib.sha256()
    with package.open('rb') as stream:
        while chunk := stream.read(1024 * 1024): h.update(chunk)
    if h.hexdigest() != expected:
        raise RuntimeError('CI package digest differs')
    lock = open('/run/umsa-web-publish.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    previous = json.loads(STATE.read_text()) if STATE.exists() else INITIAL.copy()
    validate_previous(previous)
    port = 4322 if previous['port'] == 4321 else 4321
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', port))
    if RELEASES.is_symlink() or shutil.disk_usage('/srv').free < max(5 * 1024**3, package.stat().st_size * 5):
        raise RuntimeError('Unsafe release root or insufficient free disk')
    RELEASES.mkdir(mode=0o755, exist_ok=True)
    release = RELEASES / identifier
    release.mkdir(mode=0o755)
    application = release / 'application'
    application.mkdir()
    with tarfile.open(package) as archive:
        validate_archive(archive)
    with (release / 'publication.log').open('xb') as log:
        os.chmod(log.name, 0o600)
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        run(['tar', '--no-same-owner', '-xzf', str(package), '-C', str(application)])
        if not (application / 'dist/server/entry.mjs').is_file() or (application / '.env').exists():
            raise RuntimeError('Incomplete or credential-bearing runtime')
        assets = application / 'dist/client'
        # Preserve historical URLs missing from the new build. Never remove data.
        run(['rsync', '-a', '--ignore-existing', previous['assets'] + '/', str(assets) + '/'])
        env = (STAGE / 'clean-astro-ultimamilla.environment').read_text()
        env, count = re.subn(r'(?m)^PORT=.*$', 'PORT="' + str(port) + '"', env)
        if count != 1 or 'HOST="127.0.0.1"' not in env:
            raise RuntimeError('Unexpected reviewed web environment')
        envfile = release / 'web.environment'
        atomic_text(envfile, env)
        unit_name = 'umsa-web-' + identifier + '.service'
        unit = ('[Unit]\nDescription=UMSA verified web release ' + identifier + '\nAfter=network-online.target\n'
            '[Service]\nType=simple\nWorkingDirectory=' + str(application) + '\nEnvironmentFile=' + str(envfile) + '\n'
            'ExecStart=/usr/bin/node ' + str(application / 'dist/server/entry.mjs') + '\n'
            'Restart=on-failure\nRestartSec=3\nUMask=0027\n')
        if not production: unit += 'IPAddressDeny=any\nIPAddressAllow=localhost\n'
        unit += '[Install]\nWantedBy=multi-user.target\n'
        unit_path = Path('/etc/systemd/system') / unit_name
        atomic_text(unit_path, unit, 0o644)
        run(['systemd-analyze', 'verify', str(unit_path)])
        run(['systemctl', 'daemon-reload'])
        old_front = FRONT.read_text()
        front_unit_path = Path('/etc/systemd/system/umsa-clean-front.service')
        old_unit = front_unit_path.read_text()
        if old_unit.count(previous['unit']) != 2:
            raise RuntimeError('Persistent proxy dependencies differ from current web release')
        switched = False
        unit_switched = False
        committed = False
        try:
            run(['systemctl', 'start', unit_name])
            for trial in range(30):
                result = subprocess.run(['curl', '-fsS', '--max-time', '3', '-o', '/dev/null',
                    'http://127.0.0.1:' + str(port) + '/'], stdout=log, stderr=log)
                if result.returncode == 0: break
                time.sleep(1)
            else: raise RuntimeError('Candidate did not become ready')
            for route in ROUTES:
                run(['curl', '-fsS', '--max-time', '20', '-o', '/dev/null', 'http://127.0.0.1:' + str(port) + route])
            config = release / 'nginx'
            shutil.copytree(previous['config'], config)
            changes = 0
            for path in config.rglob('*'):
                if path.is_symlink(): raise RuntimeError('Unexpected proxy config symlink')
                if not path.is_file(): continue
                text = path.read_text()
                changes += text.count('http://127.0.0.1:' + str(previous['port']) + ';')
                path.write_text(transform_config(text, previous, config, assets, port))
            if changes < 1: raise RuntimeError('UMSA upstream missing from active config')
            run(['/usr/sbin/nginx', '-t', '-c', str(config / 'nginx.conf')])
            if mode == 'rehearse':
                run(['systemctl', 'stop', unit_name])
                atomic_text(release / 'rehearsal.complete', 'Candidate HTTP routes and Nginx configuration passed. Live proxy unchanged.\n')
                print('Fresh publisher rehearsal passed. No public route, DNS, database or other service changed.')
                return
            atomic_text(release / 'previous-front.conf', old_front)
            atomic_text(FRONT, 'include ' + str(config / 'nginx.conf') + ';\n', 0o644)
            switched = True
            run(['systemctl', 'reload', 'umsa-clean-front'])
            for route in ROUTES:
                run(['curl', '-fsS', '--max-time', '20', '--resolve', 'www.ultimamilla.com.ar:443:127.0.0.1',
                    '-o', '/dev/null', 'https://www.ultimamilla.com.ar' + route])
            current = {'port': port, 'unit': unit_name, 'config': str(config), 'assets': str(assets)}
            run(['systemctl', 'enable', unit_name])
            atomic_text(release / 'previous-front.service', old_unit)
            atomic_text(front_unit_path, old_unit.replace(previous['unit'], unit_name), 0o644)
            unit_switched = True
            run(['systemctl', 'daemon-reload'])
            atomic_text(STATE, json.dumps(current) + '\n')
            committed = True
            # Existing workers may still finish requests against the old runtime.
            for trial in range(30):
                processes = subprocess.check_output(['ps', '-eo', 'args'], text=True)
                if 'nginx: worker process is shutting down' not in processes:
                    run(['systemctl', 'disable', previous['unit']])
                    run(['systemctl', 'stop', previous['unit']])
                    break
                time.sleep(2)
            atomic_text(release / 'publication.complete', json.dumps(current) + '\n')
        except Exception:
            if not committed:
                if unit_switched:
                    atomic_text(front_unit_path, old_unit, 0o644)
                    run(['systemctl', 'daemon-reload'])
                if switched:
                    atomic_text(FRONT, old_front, 0o644)
                    run(['systemctl', 'reload', 'umsa-clean-front'])
                run(['systemctl', 'stop', unit_name])
                run(['systemctl', 'disable', unit_name])
            raise
    print('UMSA release activated and checked on Hostinger. Previous files retained; other services and databases unchanged.')


if __name__ == '__main__':
    main(*sys.argv[1:])
