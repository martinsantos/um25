#!/usr/bin/env python3
"""Start a localhost-only rehearsal with isolated application egress and no cron."""
import gzip
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import socket
import sqlite3
import subprocess
from urllib.parse import urlsplit, urlunsplit

STAGE = Path('/srv/umsa-migration')
APP_NAMES = {'sgi', 'sitrep-backend', 'astro-ultimamilla', 'umbot-aceite', 'cannaval-plan-admin'}
CONTAINERS = {'dge-demo-web', 'dge-demo-rollback-cf24407ee8ee', 'directus-admin-directus-app-1', 'arca_app'}
NETWORKS = {'dge-demo-network': ('172.18.0.0/16', '172.18.0.1'),
            'fumbling-field_umbot-network': ('172.20.0.0/16', '172.20.0.1')}


def local_listeners(text):
    def replace(match):
        address = match.group(1)
        if address in ('80', '443'):
            return 'listen 127.0.0.1:' + address
        if address in ('[::]:80', '[::]:443'):
            return 'listen [::1]:' + address.rsplit(':', 1)[1]
        if address in ('127.0.0.1:80', '127.0.0.1:443', '[::1]:80', '[::1]:443'):
            return match.group(0)
        raise ValueError('Unrecognized Nginx listener: ' + address)
    return re.sub(r'\blisten\s+([^;\s]+)', replace, text)


def node_plan(metadata):
    result = {}
    for row in metadata:
        env = row['pm2_env']
        name = row['name']
        if name not in APP_NAMES or env.get('status') != 'online' or name in result:
            continue
        values = {str(k): str(v) for k, v in env.get('env', {}).items()
                  if isinstance(v, (str, int, float)) and re.fullmatch('[A-Za-z_][A-Za-z0-9_]*', k)}
        for key in ('SSH_AUTH_SOCK', 'SSH_CONNECTION', 'SSH_CLIENT', 'PM2_HOME', 'NODE_OPTIONS'):
            values.pop(key, None)
        values.update(HOST='127.0.0.1', NODE_APP_INSTANCE='migration-rehearsal',
                      INSTANCE_ID='migration-rehearsal', DISABLE_EMAILS='true',
                      SGI_OPERATIONAL_WATCHDOG='false', BLOCKCHAIN_ENABLED='false')
        interpreter = env.get('exec_interpreter', 'node')
        if interpreter == 'node':
            interpreter = '/usr/bin/node'
        if not str(interpreter).startswith('/'):
            raise ValueError('Unexpected process interpreter')
        result[name] = dict(cwd=env['pm_cwd'], command=[interpreter, env['pm_exec_path']] + (env.get('args') or []), env=values)
    if set(result) != APP_NAMES:
        raise ValueError('Missing or stopped application in current source metadata')
    return result


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong target')
    for marker in ('database-restore.complete', 'application-files.complete'):
        if not (STAGE / marker).is_file():
            raise RuntimeError('Missing prerequisite: ' + marker)
    started = STAGE / 'rehearsal.started'
    if started.exists():
        raise RuntimeError('Rehearsal already attempted; inspect before retry')
    snapshot = Path((STAGE / 'latest-snapshot').read_text().strip())
    nodes = node_plan(json.loads((snapshot / 'pm2.json').read_text()))
    containers = {x['Name'].lstrip('/'): x for x in json.loads((snapshot / 'docker-inspect.json').read_text())}
    with (STAGE / 'receipts/rehearsal.log').open('ab') as log:
        def run(args):
            subprocess.run(args, check=True, stdout=log, stderr=log)

        # Verify systemd's egress enforcement before any host application starts.
        gate = 'import socket,sys; s=socket.socket(); s.settimeout(3); code=s.connect_ex(("1.1.1.1",443)); sys.exit(0 if code in (1,13) else 1)'
        run(['systemd-run', '--unit=umsa-rehearsal-egress-proof', '--wait', '--pipe', '--collect',
             '--property=IPAddressDeny=any', '--property=IPAddressAllow=localhost', '/usr/bin/python3', '-c', gate])
        started.write_text(str(snapshot) + '\n')

        # Restore the online SQLite snapshot rather than trusting the live file copy.
        database = Path('/var/www/umbot-aceite/current/db/custom.db').resolve(strict=True)
        if not database.is_relative_to(Path('/var/www/umbot-aceite/releases')):
            raise RuntimeError('Unexpected SQLite destination')
        restored = database.with_name('custom.db.migration-restored')
        if restored.exists():
            raise RuntimeError('SQLite rehearsal destination already exists')
        with sqlite3.connect(restored) as connection:
            with gzip.open(snapshot / 'aceite.sql.gz', 'rt') as stream:
                connection.executescript(stream.read())
            if connection.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                raise RuntimeError('Restored SQLite failed integrity check')
        shutil.copystat(database, restored)
        for suffix in ('-wal', '-shm'):
            sidecar = Path(str(database) + suffix)
            if sidecar.exists():
                sidecar.rename(Path(str(sidecar) + '.before-rehearsal'))
        database.rename(database.with_name('custom.db.before-rehearsal'))
        restored.rename(database)

        # Internal networks deny Internet egress, while preserving application DNS.
        for network, (subnet, gateway) in NETWORKS.items():
            run(['docker', 'network', 'create', '--internal', '--subnet', subnet, '--gateway', gateway, network])
        run(['docker', 'network', 'connect', '--ip', '172.18.0.2', 'dge-demo-network', 'dge-demo-db'])
        run(['docker', 'network', 'connect', '--ip', '172.20.0.4', 'fumbling-field_umbot-network', 'directus-admin-database-1'])
        for name in sorted(CONTAINERS):
            row = containers[name]
            host, config = row['HostConfig'], row['Config']
            network = host['NetworkMode']
            if network not in NETWORKS or host.get('Privileged'):
                raise RuntimeError('Unexpected container networking/privilege')
            env = dict(value.split('=', 1) for value in config['Env'] if '=' in value)
            if name == 'arca_app':
                value = urlsplit(env['DATABASE_URL'])
                if value.hostname != '172.20.0.3':
                    raise RuntimeError('ARCA database configuration differs from audit')
                # Correct the audited self-reference only in the destination rehearsal.
                hostport = 'directus-admin-database-1:' + str(value.port or 5432)
                userinfo = value.netloc.rsplit('@', 1)[0] + '@' if '@' in value.netloc else ''
                env['DATABASE_URL'] = urlunsplit((value.scheme, userinfo + hostport, value.path, value.query, value.fragment))
            envfile = STAGE / ('rehearsal-' + name + '.env')
            if any('\n' in value or '\r' in value for value in env.values()):
                raise RuntimeError('Multiline environment needs explicit handling')
            envfile.write_text(''.join(f'{key}={value}\n' for key, value in env.items()))
            command = ['docker', 'create', '--name', name, '--network', network, '--restart', 'no', '--env-file', str(envfile)]
            if host.get('ReadonlyRootfs'):
                command += ['--read-only']
            for key, flag in [('Memory', '--memory'), ('PidsLimit', '--pids-limit')]:
                if host.get(key):
                    command += [flag, str(host[key])]
            if host.get('NanoCpus'):
                command += ['--cpus', str(host['NanoCpus'] / 1_000_000_000)]
            for key, flag in [('CapDrop', '--cap-drop'), ('CapAdd', '--cap-add'), ('SecurityOpt', '--security-opt')]:
                for value in host.get(key) or []:
                    command += [flag, value]
            for path, options in (host.get('Tmpfs') or {}).items():
                command += ['--tmpfs', path + ':' + options]
            for mount in row['Mounts']:
                if mount['Type'] != 'bind' or not Path(mount['Source']).exists():
                    raise RuntimeError('Unexpected or missing application mount')
                argument = 'type=bind,source=' + mount['Source'] + ',target=' + mount['Destination']
                if not mount['RW']:
                    argument += ',readonly'
                command += ['--mount', argument]
            for port, bindings in (host['PortBindings'] or {}).items():
                for binding in bindings:
                    command += ['--publish', '127.0.0.1:' + binding['HostPort'] + ':' + port]
            if config.get('User'):
                command += ['--user', config['User']]
            if config.get('WorkingDir'):
                command += ['--workdir', config['WorkingDir']]
            entrypoint = config.get('Entrypoint') or []
            if entrypoint:
                command += ['--entrypoint', entrypoint[0]]
            command += [row['Image']] + entrypoint[1:] + (config.get('Cmd') or [])
            run(command)
            run(['docker', 'start', name])

        # Keep an untouched copy for the later explicit public cutover phase.
        run(['cp', '-a', '--reflink=always', '/etc/nginx', str(STAGE / 'nginx-public-ready')])
        config_dump = subprocess.check_output(['nginx', '-T'], stderr=log, text=True)
        active_files = {Path(name).resolve() for name in re.findall(r'^# configuration file (.+):$', config_dump, re.M)}
        for path in active_files:
            text = path.read_text()
            if re.search(r'\blisten\s+', text):
                if not path.is_relative_to(Path('/etc/nginx')):
                    raise RuntimeError('Unexpected listener configuration outside Nginx')
                path.write_text(local_listeners(text))
        for name, item in nodes.items():
            envfile = STAGE / ('rehearsal-' + name + '.environment')
            if any('\n' in value or '\r' in value for value in item['env'].values()):
                raise RuntimeError('Multiline process environment needs explicit handling')
            envfile.write_text(''.join(f'{key}={shlex.quote(value)}\n' for key, value in item['env'].items()))
            unit = '[Unit]\nDescription=UMSA migration rehearsal ' + name + '\n[Service]\nType=simple\n'
            unit += 'WorkingDirectory=' + item['cwd'] + '\nEnvironmentFile=' + str(envfile) + '\n'
            unit += 'ExecStart=' + ' '.join('"' + arg.replace('\\', '\\\\').replace('"', '\\"').replace('%', '%%') + '"' for arg in item['command']) + '\n'
            unit += 'IPAddressDeny=any\nIPAddressAllow=localhost\nRestart=no\n'
            Path('/etc/systemd/system/umsa-rehearsal-' + name + '.service').write_text(unit)
        for name in ('php-fpm', 'php74-php-fpm'):
            dropin = Path('/etc/systemd/system') / (name + '.service.d')
            dropin.mkdir(parents=True, exist_ok=True)
            (dropin / 'umsa-rehearsal.conf').write_text('[Service]\nIPAddressDeny=any\nIPAddressAllow=localhost\n')
        for directory in ('/etc/php.d', '/etc/opt/remi/php74/php.d'):
            (Path(directory) / '99-umsa-rehearsal.ini').write_text('sendmail_path = /bin/false\n')
        run(['nginx', '-t'])
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'start', 'redis', 'memcached', 'php-fpm', 'php74-php-fpm'])
        for name in sorted(nodes):
            run(['systemctl', 'start', 'umsa-rehearsal-' + name])
        run(['systemctl', 'start', 'nginx'])
    (STAGE / 'rehearsal.ready').write_text(str(snapshot) + '\n')
    print('Localhost rehearsal started. Application Internet egress restricted; DNS, mail and cron unchanged.')


if __name__ == '__main__':
    main()
