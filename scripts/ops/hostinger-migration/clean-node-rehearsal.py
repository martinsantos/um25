#!/usr/bin/env python3
"""Exercise freshly built Node applications on the isolated destination only."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import sqlite3
import subprocess

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-clean-apps')
NODE_SHA256 = 'c947ad4ce9dfea2d1fbade5103507e07d3f0d1463ebaa30f7af910354e45b6ec'
APPS = {
    'astro-ultimamilla': ('web', '', 'dist/server/entry.mjs', 4321),
    'sgi': ('sgi', '', 'src/server.js', 3000),
    'sitrep-backend': ('sitrep', 'backend', 'dist/index.js', 3002),
    'umbot-aceite': ('aceite', '', 'server.js', 3022),
}
DATA = {
    'sgi': ('/home/sgi.ultimamilla.com.ar', ('private', 'imports', 'uploads', 'src/public/uploads')),
    'sitrep-backend': ('/var/www/sitrep-backend', ('data', 'uploads')),
}


def safe_environment(source, name, root):
    result = {}
    for key, value in source.items():
        if not re.fullmatch('[A-Za-z_][A-Za-z0-9_]*', key):
            continue
        if key.startswith(('SSH_', 'LD_', 'DYLD_', 'XDG_', 'npm_', 'PM2_')) or key in {
            'NODE_PATH', 'NODE_OPTIONS', 'BASH_ENV', 'ENV', 'PYTHONPATH', 'PYTHONHOME', 'PWD', 'OLDPWD', '_'}:
            continue
        value = str(value)
        if '\n' in value or '\r' in value or '\x00' in value:
            raise ValueError('Unsupported multiline environment setting')
        result[key] = value
    result.update(PATH='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin', HOME='/root', NODE_ENV='production',
        HOST='127.0.0.1', HOSTNAME='127.0.0.1', PORT=str(APPS[name][3]),
        NODE_APP_INSTANCE='migration-rehearsal', INSTANCE_ID='migration-rehearsal',
        DISABLE_EMAILS='true', SGI_OPERATIONAL_WATCHDOG='false', BLOCKCHAIN_ENABLED='false')
    if name == 'umbot-aceite':
        result['DATABASE_URL'] = 'file:' + str(root / 'db/custom.db')
    if name == 'astro-ultimamilla':
        # All CMS requests in this rehearsal must use the destination CMS.
        for key in ('PUBLIC_DIRECTUS_URL', 'DIRECTUS_URL', 'DIRECTUS_INTERNAL_URL'):
            result[key] = 'http://127.0.0.1:8055'
    return result


def environment_text(values):
    # systemd EnvironmentFile quoting, independent of shell expansion.
    return ''.join(key + '="' + value.replace('\\', '\\\\').replace('"', '\\"') + '"\n'
                   for key, value in sorted(values.items()))


def trusted_application(pointer, subdir, entry):
    base = Path(pointer.strip())
    if base.parent != STAGE / 'trusted' or base.is_symlink() or not base.is_dir():
        raise RuntimeError('Untrusted application pointer')
    root = base / 'application' / subdir
    if not (root / entry).is_file() or not (root / 'node_modules').is_dir():
        raise RuntimeError('Fresh application artifact incomplete')
    return root


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    for name in ('internal-rotation.complete', 'database-restore.complete', 'application-files.complete'):
        if not (STAGE / name).is_file():
            raise RuntimeError('Missing prerequisite: ' + name)
    if Path('/etc/ld.so.preload').exists() or Path('/usr/local/lib/libsend.so').exists():
        raise RuntimeError('Destination has unexpected preload artifacts')
    if hashlib.sha256(Path('/usr/bin/node').read_bytes()).hexdigest() != NODE_SHA256:
        raise RuntimeError('Node binary differs from verified official distribution')
    if ROOT.exists() or (STAGE / 'clean-node-rehearsal.started').exists():
        raise RuntimeError('Clean rehearsal already attempted; inspect receipt before retry')
    source_env = json.loads((STAGE / 'internal-credentials/node-environments.json').read_text())
    plans = {}
    for name, (pointer, subdir, entry, port) in APPS.items():
        app = trusted_application((STAGE / ('trusted-' + pointer)).read_text(), subdir, entry)
        plans[name] = (app, safe_environment(source_env[name], name, ROOT / name))
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', port))
    snapshot = Path((STAGE / 'latest-snapshot').read_text().strip())
    with (STAGE / 'receipts/clean-node-rehearsal.log').open('ab') as log:
        def run(args):
            subprocess.run(args, check=True, stdout=log, stderr=log)
        gate = 'import socket,sys; s=socket.socket(); s.settimeout(3); c=s.connect_ex(("1.1.1.1",443)); sys.exit(0 if c in (1,13) else 1)'
        run(['systemd-run', '--unit=umsa-clean-egress-proof', '--wait', '--pipe', '--collect',
             '--property=IPAddressDeny=any', '--property=IPAddressAllow=localhost', '/usr/bin/python3', '-c', gate])
        (STAGE / 'clean-node-rehearsal.started').write_text(str(snapshot) + '\n')
        ROOT.mkdir(mode=0o755)
        for name, (app, values) in plans.items():
            destination = ROOT / name
            run(['cp', '-a', '--reflink=always', str(app), str(destination)])
            # No copied launch configuration or dependencies from the old server.
            if (destination / '.env').exists() or (destination / '.env.local').exists():
                raise RuntimeError('Build unexpectedly contains an environment file')
            if name in DATA:
                old, paths = DATA[name]
                for relative in paths:
                    data = Path(old) / relative
                    if not data.exists():
                        continue
                    target = destination / relative
                    if target.exists():
                        def hashes(directory):
                            return {p.relative_to(directory).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                                    for p in directory.rglob('*') if p.is_file()}
                        if name != 'sitrep-backend' or relative != 'data' or hashes(data) != hashes(target):
                            raise RuntimeError('Data location overlaps the verified build: ' + relative)
                        continue
                    target.parent.mkdir(parents=True, exist_ok=True)
                    run(['cp', '-a', '--reflink=always', str(data.resolve()), str(target)])
            if name == 'umbot-aceite':
                (destination / 'db').mkdir()
                with sqlite3.connect(destination / 'db/custom.db') as database:
                    with gzip.open(snapshot / 'aceite.sql.gz', 'rt') as stream:
                        database.executescript(stream.read())
                    if database.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                        raise RuntimeError('Restored SQLite integrity failure')
            environment = STAGE / ('clean-' + name + '.environment')
            environment.write_text(environment_text(values))
            unit = '[Unit]\nDescription=Clean isolated UMSA rehearsal ' + name + '\n[Service]\nType=simple\n'
            unit += 'WorkingDirectory=' + str(destination) + '\nEnvironmentFile=' + str(environment) + '\n'
            unit += 'ExecStart=/usr/bin/node ' + str(destination / APPS[name][2]) + '\n'
            unit += 'IPAddressDeny=any\nIPAddressAllow=localhost\nRestart=no\nUMask=0027\n'
            Path('/etc/systemd/system/umsa-clean-' + name + '.service').write_text(unit)
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'start', 'redis', 'memcached'])
        for name in sorted(plans):
            run(['systemctl', 'start', 'umsa-clean-' + name])
    (STAGE / 'clean-node-rehearsal.ready').write_text(str(snapshot) + '\n')
    print('Fresh Node applications started in isolated rehearsal. Public listeners, source, DNS and schedules unchanged.')


if __name__ == '__main__':
    main()
