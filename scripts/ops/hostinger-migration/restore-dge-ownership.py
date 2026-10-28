#!/usr/bin/env python3
"""Recover only the original DGE object owners; preserve credentials and sessions."""
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
DUMP = STAGE / 'core-cutovers/40619071156-1/dge-FINAL.dump'
DUMP_SHA256 = 'a3291d35dfc95d89126ed3519eaa2e0e201324bacf9c8d73cba466405d1abd77'
BACKUP = ('20261028T094123Z-ae3eaadb', 51645153,
          '6325ae56621bdc9098eca6ec850d36f15d5876468e9e868b364dad01f69d0622')
RUNTIME = Path('/srv/umsa-clean-containers/dge-runtime.json')
ADMIN = 'umsa_restore_admin_20261027'
TABLES = ('auth_group', 'auth_group_permissions', 'auth_permission', 'auth_user',
          'auth_user_groups', 'auth_user_user_permissions', 'demo_accessevent',
          'demo_loginattempt', 'demo_operation', 'demo_workspace',
          'django_content_type', 'django_migrations', 'django_session')
SEQUENCES = ('auth_group_id_seq', 'auth_group_permissions_id_seq', 'auth_permission_id_seq',
             'auth_user_groups_id_seq', 'auth_user_id_seq', 'auth_user_user_permissions_id_seq',
             'demo_loginattempt_id_seq', 'demo_operation_id_seq',
             'django_content_type_id_seq', 'django_migrations_id_seq')
OBJECTS = [('TABLE', name) for name in TABLES] + [('SEQUENCE', name) for name in SEQUENCES]


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def verify_source_toc(text):
    actual = []
    for line in text.splitlines():
        match = re.fullmatch(r'[0-9]+; [0-9]+ [0-9]+ (TABLE|SEQUENCE) public ([a-z][a-z0-9_]*) ([a-z][a-z0-9_]*)', line)
        if match:
            if match[3] != 'dge_app':
                raise RuntimeError('DGE source owner differs from the reviewed source dump')
            actual.append((match[1], match[2]))
    if len(actual) != len(OBJECTS) or set(actual) != set(OBJECTS):
        raise RuntimeError('DGE source object inventory changed')


def ownership_sql():
    rows = ','.join("('" + ('r' if kind == 'TABLE' else 'S') + "','" + name + "')"
                    for kind, name in OBJECTS)
    changes = '\n'.join('ALTER ' + kind + ' public."' + name + '" OWNER TO dge_app;'
                        for kind, name in OBJECTS)
    return """BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='10s';
DO $guard$
BEGIN
 IF current_database()<>'dge_demo' OR NOT EXISTS (
   SELECT 1 FROM pg_roles WHERE rolname='dge_app' AND rolcanlogin AND NOT rolsuper
     AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication) THEN
   RAISE EXCEPTION 'Unexpected DGE database or application role';
 END IF;
 IF EXISTS (
   WITH expected(kind,name) AS (VALUES """ + rows + """), actual AS (
    SELECT c.relkind::text AS kind,c.relname AS name,pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
    WHERE n.nspname='public' AND c.relkind IN ('r','S'))
   SELECT 1 FROM expected FULL JOIN actual USING(kind,name)
   WHERE expected.name IS NULL OR actual.name IS NULL OR actual.owner NOT IN ('postgres','dge_app')) THEN
   RAISE EXCEPTION 'Unexpected DGE object inventory or owner';
 END IF;
END $guard$;
""" + changes + """
DO $verify$
BEGIN
 IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
   WHERE n.nspname='public' AND c.relkind IN ('r','S') AND pg_get_userbyid(c.relowner)<>'dge_app') THEN
   RAISE EXCEPTION 'DGE source ownership was not restored';
 END IF;
END $verify$;
SET LOCAL ROLE dge_app;
SELECT 1 FROM public.auth_user LIMIT 0;
SELECT 1 FROM public.demo_loginattempt LIMIT 0;
SELECT 1 FROM public.django_session LIMIT 0;
RESET ROLE;
COMMIT;
"""


def verified_backup():
    identifier, size, digest = BACKUP
    root = Path('/srv/umsa-operational-backups') / identifier
    receipt = root / 'backup.complete.json'
    archive = root / ('HOSTINGER-active-' + identifier + '.tar.gz.gpg')
    if any(p.is_symlink() for p in (root, receipt, archive)):
        raise RuntimeError('Unexpected independently verified backup type')
    data = json.loads(receipt.read_text())
    if (data.get('archive') != archive.name or data.get('bytes') != size
            or data.get('sha256') != digest or data.get('database_files') != 9
            or data.get('encrypted_offsite') is not True or archive.stat().st_size != size
            or sha256(archive) != digest):
        raise RuntimeError('Independently verified operational backup changed')
    return digest


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or os.geteuid() != 0
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier) or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file()):
        raise RuntimeError('Unexpected authoritative DGE target')
    os.umask(0o077)
    backup_digest = verified_backup()
    if DUMP.is_symlink() or sha256(DUMP) != DUMP_SHA256 or RUNTIME.is_symlink():
        raise RuntimeError('DGE source proof or runtime configuration changed')
    runtime_digest = sha256(RUNTIME)
    runtime = json.loads(RUNTIME.read_text())
    if runtime['database']['NAME'] != 'dge_demo' or runtime['database']['USER'] != 'dge_app':
        raise RuntimeError('Unexpected current DGE runtime identity')
    with DUMP.open('rb') as source:
        result = subprocess.run(['docker', 'exec', '-i', 'dge-demo-db', 'pg_restore', '--list'],
                                stdin=source, capture_output=True, timeout=30, check=True)
    verify_source_toc(result.stdout.decode())
    root = STAGE / 'dge-ownership-recoveries' / identifier
    root.mkdir(parents=True, mode=0o700, exist_ok=False)
    result = subprocess.run(['docker', 'exec', '-i', 'dge-demo-db', 'psql', '-X', '-w',
                             '-U', ADMIN, '-d', 'dge_demo', '--set', 'ON_ERROR_STOP=1'],
                            input=ownership_sql(), capture_output=True, text=True, timeout=60)
    if result.returncode:
        raise RuntimeError('DGE ownership transaction failed and was rolled back')
    if sha256(RUNTIME) != runtime_digest:
        raise RuntimeError('DGE runtime changed concurrently; inspect before further work')
    state = {'run': identifier, 'database': 'dge_demo', 'restored_owner': 'dge_app',
             'tables': len(TABLES), 'sequences': len(SEQUENCES), 'source_dump_sha256': DUMP_SHA256,
             'verified_backup_sha256': backup_digest, 'runtime_unchanged': True,
             'user_passwords_and_session_data_unchanged': True, 'login_or_email_requested': False}
    (root / 'operation.complete.json').write_text(json.dumps(state, indent=2) + '\n')
    print('Original DGE owners restored for 13 tables and 10 sequences; credentials and sessions unchanged.')


if __name__ == '__main__':
    main(sys.argv[1])
