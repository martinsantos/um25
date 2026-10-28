#!/usr/bin/env python3
"""Prepare a private SGI database candidate without changing the existing MariaDB.

The live source remains online. Its MyISAM tables make this a rehearsal, not a
final cutover snapshot. The new listener is bound to loopback and its Docker
network is internal; no other database or application is replaced.
"""
import configparser
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
IMAGE = 'mariadb:10.11@sha256:d769e37960821dfdcf096954f6e7ac89f747e116c1bba98e48edd265dfc7deae'
SOURCE = 'root@23.105.176.45'
PORT = 13306


def load_inventory_helper():
    spec = importlib.util.spec_from_file_location('sgi_snapshot', Path(__file__).with_name('rehearse-sgi-real-snapshot.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def app_password(file):
    config = configparser.ConfigParser(interpolation=None)
    config.read(file)
    if config.sections() != ['client'] or config['client'].get('user') != 'sgi_app':
        raise RuntimeError('Unexpected SGI credential file')
    value = shlex.split(config['client']['password'])
    if len(value) != 1 or not re.fullmatch(r'[A-Za-z0-9_-]{16,128}', value[0]):
        raise RuntimeError('Unexpected SGI credential format')
    return value[0]


def override_environment(original):
    replacements = {'DB_HOST': '127.0.0.1', 'DB_PORT': str(PORT)}
    lines, seen = [], set()
    for line in original.splitlines():
        key = line.split('=', 1)[0]
        if key in replacements:
            if key in seen:
                raise RuntimeError('Duplicate SGI database setting')
            seen.add(key)
            line = key + '=' + replacements[key]
        lines.append(line)
    if seen != set(replacements):
        raise RuntimeError('Missing SGI database setting')
    return '\n'.join(lines) + '\n'


def sha256(file):
    value = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def main(identifier):
    if (not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier)
            or socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not os.environ.get('SSH_AUTH_SOCK')):
        raise RuntimeError('Expected isolated migration target and source identity are required')
    os.umask(0o077)
    known = STAGE / 'known_hosts'
    credentials = STAGE / 'internal-credentials/sgi_app.cnf'
    original_env = STAGE / 'clean-sgi.environment'
    if any(p.is_symlink() or not p.is_file() for p in (known, credentials, original_env)):
        raise RuntimeError('Reviewed SGI configuration is missing')
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', PORT))
    helper = load_inventory_helper()
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=30', SOURCE]
    def remote(args):
        return ssh + [shlex.join(args)]
    def source_query(query):
        return subprocess.check_output(remote(['mariadb', '--no-defaults', '-uroot', '-N', '-e', query]),
                                       text=True, timeout=30)
    expected = helper.parse_inventory(source_query(helper.SQL))
    directory = STAGE / 'sgi-dedicated-rehearsals' / identifier
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    (directory / 'REHEARSAL-ONLY').write_text('Source remained live; this is not a final consistent SGI cutover.\n')
    password = secrets.token_urlsafe(36)
    root_pass, root_cnf = directory / 'root-pass', directory / 'root.cnf'
    root_pass.write_text(password + '\n')
    root_cnf.write_text('[client]\nuser=root\npassword=' + password + '\n')
    environment = directory / 'sgi-candidate.environment'
    environment.write_text(override_environment(original_env.read_text()))
    network, container = 'umsa-sgi-candidate-' + identifier, 'umsa-sgi-db-' + identifier
    data = directory / 'data'
    data.mkdir(mode=0o700)
    log = (directory / 'candidate.log').open('ab')
    started = False
    try:
        subprocess.run(['docker', 'pull', IMAGE], check=True, stdout=log, stderr=log)
        subprocess.run(['docker', 'network', 'create', '--internal', network], check=True, stdout=log, stderr=log)
        subprocess.run(['docker', 'run', '-d', '--name', container, '--network', network,
            '--publish', '127.0.0.1:' + str(PORT) + ':3306', '--restart', 'unless-stopped',
            '--memory', '1500m', '--pids-limit', '256', '--volume', str(data) + ':/var/lib/mysql',
            '--volume', str(root_pass) + ':/run/secrets/root-pass:ro',
            '--volume', str(root_cnf) + ':/run/secrets/root.cnf:ro',
            '--env', 'MARIADB_ROOT_PASSWORD_FILE=/run/secrets/root-pass', IMAGE,
            '--skip-name-resolve', '--event-scheduler=OFF'], check=True, stdout=log, stderr=log)
        started = True
        info = json.loads(subprocess.check_output(['docker', 'inspect', container], text=True))[0]
        network_info = json.loads(subprocess.check_output(['docker', 'network', 'inspect', network], text=True))[0]
        bindings = info['HostConfig'].get('PortBindings', {}).get('3306/tcp', [])
        if (not network_info.get('Internal') or len(bindings) != 1 or bindings[0].get('HostIp') != '127.0.0.1'
                or bindings[0].get('HostPort') != str(PORT) or info['HostConfig'].get('Privileged')):
            raise RuntimeError('Candidate MariaDB isolation does not match the reviewed setup')
        def db(query):
            return subprocess.check_output(['docker', 'exec', container, 'mariadb',
                '--defaults-extra-file=/run/secrets/root.cnf', '-N', '-e', query], text=True, timeout=30)
        for _ in range(90):
            logs = subprocess.run(['docker', 'logs', container], capture_output=True, timeout=10)
            if helper.ENTRYPOINT_READY in logs.stdout + logs.stderr:
                try:
                    if db('SELECT 1;').strip() == '1':
                        break
                except subprocess.CalledProcessError:
                    pass
            time.sleep(1)
        else:
            raise RuntimeError('Dedicated candidate database did not become ready')
        dump = directory / 'SGI-REHEARSAL.sql'
        with dump.open('xb') as stream:
            subprocess.run(remote(['mariadb-dump', '--no-defaults', '-uroot', '--single-transaction',
                '--skip-lock-tables', '--routines', '--events', '--triggers', '--hex-blob', '--databases',
                'sgi_production']), stdout=stream, stderr=log, check=True, timeout=600)
        if not dump.stat().st_size:
            raise RuntimeError('Empty SGI rehearsal snapshot')
        with dump.open('rb') as stream:
            subprocess.run(['docker', 'exec', '-i', container, 'mariadb',
                '--defaults-extra-file=/run/secrets/root.cnf'], stdin=stream, stdout=log, stderr=log,
                check=True, timeout=600)
        if helper.parse_inventory(db(helper.SQL)) != expected or helper.parse_inventory(source_query(helper.SQL)) != expected:
            raise RuntimeError('SGI rehearsal schema differs from the live source')
        for row in expected:
            if row.startswith('V|'):
                db('SELECT * FROM `sgi_production`.`' + row.split('|')[1] + '` LIMIT 0;')
        secret = app_password(credentials)
        sql = ("CREATE USER 'sgi_app'@'%' IDENTIFIED BY '" + secret + "';\n"
               "GRANT SELECT,INSERT,UPDATE,DELETE,EXECUTE,CREATE TEMPORARY TABLES ON sgi_production.* "
               "TO 'sgi_app'@'%';\n")
        subprocess.run(['docker', 'exec', '-i', container, 'mariadb', '--defaults-extra-file=/run/secrets/root.cnf'],
                       input=sql, text=True, stdout=log, stderr=log, check=True)
        node = ("const mysql=require('mysql2/promise'); (async()=>{const db=await mysql.createConnection({"
                "host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,"
                "password:process.env.DB_PASS,database:process.env.DB_NAME});"
                "const [rows]=await db.query('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema=DATABASE()');"
                "await db.end(); if(Number(rows[0].n)<168) process.exit(2); console.log('SGI candidate driver connected');"
                "})().catch(()=>process.exit(1));")
        subprocess.run(['systemd-run', '--quiet', '--wait', '--pipe', '--collect',
            '--unit=umsa-sgi-driver-test-' + identifier, '--property=WorkingDirectory=/srv/umsa-clean-apps/sgi',
            '--property=EnvironmentFile=' + str(environment), '--property=IPAddressDeny=any',
            '--property=IPAddressAllow=localhost', '/usr/bin/node', '-e', node], check=True, stdout=log, stderr=log,
            timeout=90)
        (directory / 'rehearsal.complete.json').write_text(json.dumps({
            'run': identifier, 'container': container, 'network': network, 'port': PORT,
            'database_sha256': sha256(dump), 'tables': 168, 'views': 4, 'routines': 2, 'triggers': 1,
            'source_online': True, 'final_cutover_snapshot': False}, indent=2) + '\n')
    except Exception:
        if started:
            subprocess.run(['docker', 'stop', '--time', '15', container], check=False, stdout=log, stderr=log)
        raise
    finally:
        log.close()
    print('Dedicated SGI rehearsal database and application driver are available only on loopback; no cutover occurred.')


if __name__ == '__main__':
    main(sys.argv[1])
