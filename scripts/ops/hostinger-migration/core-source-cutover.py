#!/usr/bin/env python3
"""Keep old CMS/DGE/ARCA databases readable while fencing their writers."""
import importlib.util
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

ROOT = Path('/root/umsa-core-cutovers')
DATABASES = {'directus': ('directus-admin-database-1', 'directus', 'directus'),
             'arca': ('directus-admin-database-1', 'directus', 'arca_facturas'),
             'dge': ('dge-demo-db', 'postgres', 'dge_demo')}


def query(kind, sql, database='postgres'):
    container, user, _ = DATABASES[kind]
    return subprocess.check_output(['docker', 'exec', container, 'psql', '-X', '-w', '-U', user,
        '-d', database, '-At', '--set', 'ON_ERROR_STOP=1', '-c', sql], text=True, timeout=30).strip()


def name(kind, identifier):
    return 'umsa_core_' + kind + '_' + identifier.replace('-', '_')


def lock(kind, identifier):
    spec = importlib.util.spec_from_file_location('pg_lock', Path(__file__).with_name('sitrep-write-lock.py'))
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    container, user, database = DATABASES[kind]
    sql = helper.LOCK_SQL.replace(';\n\\gexec', '\nHAVING COUNT(*) > 0;\n\\gexec')
    if sql == helper.LOCK_SQL:
        raise RuntimeError('Reviewed PostgreSQL lock template changed')
    subprocess.run(['docker', 'exec', '-i', '-e', 'PGAPPNAME=' + name(kind, identifier),
        '-e', 'PGOPTIONS=-c default_transaction_read_only=off', container,
        'psql', '-X', '-w', '-U', user, '-d', database, '--set', 'ON_ERROR_STOP=1', '--file', '-'],
        input=sql, text=True, check=True, timeout=28860)


def lock_ok(kind, identifier):
    _, user, database = DATABASES[kind]
    settings = query(kind, "SELECT COUNT(*) FROM pg_db_role_setting s JOIN pg_database d ON d.oid=s.setdatabase "
        "JOIN pg_roles r ON r.oid=s.setrole WHERE d.datname='" + database + "' AND r.rolname='" + user +
        "' AND 'default_transaction_read_only=on'=ANY(s.setconfig);")
    counts = query(kind, "SELECT COUNT(*) FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid "
        "WHERE a.datname='" + database + "' AND a.application_name='" + name(kind, identifier) +
        "' AND l.mode='ShareLock' AND l.locktype='relation' AND l.granted;")
    expected = query(kind, "SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
        "WHERE c.relkind IN ('r','p') AND n.nspname <> 'information_schema' "
        "AND n.nspname NOT LIKE 'pg\\_%' ESCAPE '\\';", database)
    sessions = query(kind, "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='" + database +
                     "' AND application_name='" + name(kind, identifier) + "';")
    return settings == '1' and sessions == '1' and int(counts) >= int(expected)


def verify(identifier):
    directory = ROOT / identifier
    if not (directory / 'fence.complete.json').is_file() or any(not lock_ok(k, identifier) for k in DATABASES):
        raise RuntimeError('Old core database write fence is incomplete')
    print('CMS, DGE and ARCA databases are readable; their old writers are fenced.')


def recover(identifier):
    directory = ROOT / identifier
    if (directory / 'target-writes-authorized').exists():
        raise RuntimeError('Hostinger may have writes; refusing to restore old core writers')
    changed = json.loads((directory / 'changed.json').read_text())
    for kind in changed:
        subprocess.run(['systemctl', 'stop', 'umsa-core-fence-' + kind + '-' + identifier], check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
        _, user, database = DATABASES[kind]
        query(kind, 'ALTER ROLE "' + user + '" IN DATABASE "' + database + '" RESET default_transaction_read_only;')
        query(kind, "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='" + database +
              "' AND backend_type='client backend';")
    (directory / 'recovered').write_text('Recovered before target writes.\n')


def fence(identifier):
    for kind, (_, user, database) in DATABASES.items():
        setting = query(kind, "SELECT COUNT(*) FROM pg_db_role_setting s JOIN pg_database d ON d.oid=s.setdatabase "
            "JOIN pg_roles r ON r.oid=s.setrole WHERE d.datname='" + database + "' AND r.rolname='" + user +
            "' AND EXISTS (SELECT 1 FROM unnest(s.setconfig) v WHERE v LIKE 'default_transaction_read_only=%');")
        if setting != '0':
            raise RuntimeError('Core source read-only defaults already changed; inspect before cutover')
    directory = ROOT / identifier
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    changed = []
    (directory / 'changed.json').write_text('[]\n')
    try:
        for kind, (_, user, database) in DATABASES.items():
            # Record recovery intent before the database setting is changed.
            changed.append(kind)
            (directory / 'changed.json').write_text(json.dumps(changed) + '\n')
            query(kind, 'ALTER ROLE "' + user + '" IN DATABASE "' + database +
                  '" SET default_transaction_read_only=on;')
            query(kind, "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='" + database +
                  "' AND backend_type='client backend';")
            subprocess.run(['systemd-run', '--quiet', '--unit=umsa-core-fence-' + kind + '-' + identifier,
                '/usr/bin/python3', str(Path(__file__).resolve()), 'lock-' + kind, identifier], check=True, timeout=30)
            for _ in range(45):
                if lock_ok(kind, identifier):
                    break
                time.sleep(1)
            else:
                raise RuntimeError('Core source table read lock did not become active')
        (directory / 'fence.complete.json').write_text(json.dumps({'run': identifier, 'databases': list(DATABASES)}) + '\n')
        verify(identifier)
        subprocess.run(['systemd-run', '--quiet', '--unit=umsa-core-watchdog-' + identifier,
                        '/usr/bin/python3', str(Path(__file__).resolve()), 'watchdog', identifier], check=True, timeout=30)
    except Exception:
        recover(identifier)
        raise


def main(mode, identifier):
    if socket.gethostname() != 'FTS-23.105.176.45' or not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise RuntimeError('Unexpected source or migration identity')
    os.umask(0o077)
    if mode.startswith('lock-') and mode[5:] in DATABASES:
        lock(mode[5:], identifier)
    elif mode == 'fence':
        fence(identifier)
    elif mode == 'verify':
        verify(identifier)
    elif mode == 'recover':
        recover(identifier)
    elif mode == 'commit':
        verify(identifier)
        with (ROOT / identifier / 'target-writes-authorized').open('x') as stream:
            stream.write('Keep source core databases read-only while Hostinger is the writer.\n')
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
        raise ValueError('Unsupported core cutover operation')


if __name__ == '__main__':
    main(*sys.argv[1:])
