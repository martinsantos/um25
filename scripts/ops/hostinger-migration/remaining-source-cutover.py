#!/usr/bin/env python3
"""Fence only Wiki/WordPress writers and the two UMBot applications."""
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

ROOT = Path('/root/umsa-remaining-cutovers')
ACCOUNTS = {'ultimami_um': ['ultimami_wiki', 'ultimami_wiki_new'], 'vecinorabioso': ['vecinorabioso']}
DATABASES = sorted(database for names in ACCOUNTS.values() for database in names)
PROCESSES = ['umbot-aceite', 'cannaval-plan-admin']


def query(sql):
    return subprocess.check_output(['mariadb', '--no-defaults', '-uroot', '-N', '-e', sql], text=True, timeout=30)


def command(args, check=True):
    return subprocess.run(args, check=check, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)


def table_inventory():
    sql = ("SELECT TABLE_SCHEMA,TABLE_NAME FROM information_schema.TABLES WHERE TABLE_TYPE='BASE TABLE' "
           "AND TABLE_SCHEMA IN ('ultimami_wiki','ultimami_wiki_new','vecinorabioso') ORDER BY 1,2;")
    rows = [line.split('\t') for line in query(sql).splitlines()]
    if (not rows or any(len(row) != 2 or row[0] not in DATABASES or
                       not re.fullmatch(r'[A-Za-z0-9_]{1,64}', row[1]) for row in rows)):
        raise RuntimeError('Unexpected PHP database inventory')
    return rows


def lock_sql(rows):
    if (not rows or len(rows) != len({tuple(row) for row in rows}) or any(
            len(row) != 2 or row[0] not in DATABASES or not re.fullmatch(r'[A-Za-z0-9_]{1,64}', row[1])
            for row in rows)):
        raise ValueError('Unsafe remaining database table inventory')
    return ('SET SESSION lock_wait_timeout=15;\nLOCK TABLES ' + ','.join(
        '`' + database + '`.`' + table + '` READ' for database, table in rows) +
        ';\nSELECT SLEEP(28800);\nUNLOCK TABLES;\n')


def lock_ok(identifier):
    active = command(['systemctl', 'is-active', '--quiet', 'umsa-remaining-fence-' + identifier], False).returncode == 0
    count = query("SELECT COUNT(*) FROM information_schema.PROCESSLIST WHERE USER='root' "
                  "AND DB='vecinorabioso' AND INFO='SELECT SLEEP(28800)';").strip()
    return active and count == '1'


def states():
    rows = json.loads(subprocess.check_output(['pm2', 'jlist'], text=True))
    return {p['name']: p['pm2_env']['status'] for p in rows if p['name'] in PROCESSES}


def verify(identifier):
    if states() != {name: 'stopped' for name in PROCESSES} or not lock_ok(identifier):
        raise RuntimeError('Remaining source writers are not fenced')
    for user in ACCOUNTS:
        grants = query("SHOW GRANTS FOR '" + user + "'@'localhost';")
        if any(word in grants for word in ('ALL PRIVILEGES', 'INSERT', 'UPDATE', 'DELETE', 'EXECUTE', 'ALTER', 'DROP')):
            raise RuntimeError('Old PHP account retains write privileges')
    print('Old Wiki/WordPress tables locked, accounts read-only, UMBot/Plan writers stopped.')


def recover(identifier):
    directory = ROOT / identifier
    if (directory / 'target-writes-authorized').exists():
        raise RuntimeError('New services may have writes; refusing to restore old writers')
    command(['systemctl', 'stop', 'umsa-remaining-fence-' + identifier], False)
    for user in ACCOUNTS:
        sql = (directory / (user + '.grants.sql'))
        if sql.is_file():
            subprocess.run(['mariadb', '--no-defaults', '-uroot'], input=sql.read_text(), text=True,
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
    for name in PROCESSES:
        command(['pm2', 'restart', name])
    command(['pm2', 'save'])
    (directory / 'recovered').write_text('Recovered before target writes.\n')


def fence(identifier):
    if states() != {name: 'online' for name in PROCESSES}:
        raise RuntimeError('Remaining PM2 source baseline changed')
    directory = ROOT / identifier
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    for user, databases in ACCOUNTS.items():
        grants = query("SHOW GRANTS FOR '" + user + "'@'localhost';")
        if len(grants.splitlines()) != len(databases) + 1 or any(
                'GRANT ALL PRIVILEGES ON `' + database + '`.*' not in grants for database in databases):
            raise RuntimeError('PHP source grant baseline changed')
        (directory / (user + '.grants.sql')).write_text(';\n'.join(grants.splitlines()) + ';\n')
    try:
        for name in PROCESSES:
            command(['pm2', 'stop', name])
        command(['pm2', 'save'])
        for user, databases in ACCOUNTS.items():
            for database in databases:
                query("REVOKE ALL PRIVILEGES ON `" + database + "`.* FROM '" + user + "'@'localhost';")
                query("GRANT SELECT,CREATE TEMPORARY TABLES ON `" + database + "`.* TO '" + user + "'@'localhost';")
            for value in query("SELECT ID FROM information_schema.PROCESSLIST WHERE USER='" + user + "';").splitlines():
                if not value.isdigit():
                    raise RuntimeError('Unexpected old PHP connection')
                query('KILL CONNECTION ' + value + ';')
        table_inventory()
        command(['systemd-run', '--quiet', '--unit=umsa-remaining-fence-' + identifier,
                 '/usr/bin/python3', str(Path(__file__).resolve()), 'lock', identifier])
        for _ in range(45):
            if lock_ok(identifier):
                break
            time.sleep(1)
        else:
            raise RuntimeError('Old PHP table lock did not become active')
        verify(identifier)
        (directory / 'fence.complete.json').write_text(json.dumps({'run': identifier, 'databases': DATABASES}) + '\n')
        command(['systemd-run', '--quiet', '--unit=umsa-remaining-watchdog-' + identifier,
                 '/usr/bin/python3', str(Path(__file__).resolve()), 'watchdog', identifier])
    except Exception:
        recover(identifier)
        raise


def main(mode, identifier):
    if socket.gethostname() != 'FTS-23.105.176.45' or not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise RuntimeError('Unexpected source or cutover identity')
    os.umask(0o077)
    if mode == 'lock':
        subprocess.run(['mariadb', '--no-defaults', '-uroot', '--database=vecinorabioso', '--batch'],
                       input=lock_sql(table_inventory()), text=True, check=True, timeout=28860)
    elif mode == 'fence':
        fence(identifier)
    elif mode == 'verify':
        verify(identifier)
    elif mode == 'recover':
        recover(identifier)
    elif mode == 'commit':
        verify(identifier)
        with (ROOT / identifier / 'target-writes-authorized').open('x') as stream:
            stream.write('Keep the old writers disabled.\n')
            stream.flush()
            os.fsync(stream.fileno())
    elif mode == 'watchdog':
        deadline = time.monotonic() + 1200
        while time.monotonic() < deadline:
            if (ROOT / identifier / 'target-writes-authorized').exists() or (ROOT / identifier / 'recovered').exists():
                return
            time.sleep(5)
        recover(identifier)
    else:
        raise ValueError('Unsupported remaining source operation')


if __name__ == '__main__':
    main(*sys.argv[1:])
