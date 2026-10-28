#!/usr/bin/env python3
"""Fence only the former DGE writer and preserve its data without importing it."""
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys

SOURCE_ROOT = Path('/root/umsa-dge-single-writer')
TARGET_ROOT = Path('/srv/umsa-migration/dge-source-preservation')
WEBS = ('dge-demo-web', 'dge-demo-rollback-cf24407ee8ee')
DATABASE = 'dge_demo'
ROLE = 'dge_app'
DB_CONTAINER = 'dge-demo-db'
NAMES = ('auth_group auth_group_permissions auth_permission auth_user auth_user_groups '
         'auth_user_user_permissions demo_accessevent demo_loginattempt demo_operation '
         'demo_workspace django_content_type django_migrations django_session '
         'auth_group_id_seq auth_group_permissions_id_seq auth_permission_id_seq '
         'auth_user_groups_id_seq auth_user_id_seq auth_user_user_permissions_id_seq '
         'demo_loginattempt_id_seq demo_operation_id_seq django_content_type_id_seq '
         'django_migrations_id_seq').split()


def sha(path):
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):result.update(block)
    return result.hexdigest()


def write(path, data):
    with path.open('x') as stream:
        json.dump(data, stream, sort_keys=True); stream.write('\n')
        stream.flush(); os.fsync(stream.fileno())


def inspect(name):
    return json.loads(subprocess.check_output(['docker', 'inspect', name], text=True, timeout=15))[0]


def query(sql, source=True, mutate=False):
    args = ['docker', 'exec', '-i']
    if mutate:args += ['-e', 'PGOPTIONS=-c default_transaction_read_only=off']
    args += [DB_CONTAINER, 'psql', '-X', '-q', '-w', '-U',
             'postgres' if source else 'umsa_restore_admin_20261027',
             '-d', DATABASE, '-At', '--set', 'ON_ERROR_STOP=1']
    result = subprocess.run(args, input=sql, text=True, capture_output=True, timeout=45)
    if result.returncode:raise RuntimeError('Guarded DGE database operation failed; source must remain stopped')
    return result.stdout.strip()


def runtime(path):
    if path.is_symlink() or not path.is_file():raise RuntimeError('Unexpected DGE runtime path')
    db = json.loads(path.read_text())['database']
    if db['USER'] != ROLE or db['NAME'] != DATABASE:raise RuntimeError('Unexpected DGE runtime identity')
    return {'user': db['USER'], 'database': db['NAME']}


def role_state(source=True):
    return json.loads(query("""SELECT json_build_object(
      'database',current_database(),'role','dge_app',
      'can_login',(SELECT rolcanlogin FROM pg_roles WHERE rolname='dge_app'),
      'superuser',(SELECT rolsuper FROM pg_roles WHERE rolname='dge_app'),
      'database_read_only',EXISTS(SELECT 1 FROM pg_db_role_setting s
        JOIN pg_roles r ON r.oid=s.setrole JOIN pg_database d ON d.oid=s.setdatabase
        WHERE r.rolname='dge_app' AND d.datname='dge_demo'
          AND 'default_transaction_read_only=on'=ANY(s.setconfig)),
      'application_connections',(SELECT count(*) FROM pg_stat_activity
        WHERE datname='dge_demo' AND usename='dge_app'));
    """, source))


def target_ready():
    stage = Path('/srv/umsa-migration')
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or stage.is_symlink()
            or (stage / '.target').read_text().strip() != '179.198.115.115'
            or not (stage / 'production.active').is_file()):
        raise RuntimeError('Unexpected authoritative target')
    runtime(Path('/srv/umsa-clean-containers/dge-runtime.json'))
    proof = stage / 'dge-ownership-recoveries/40675801877-1/operation.complete.json'
    if proof.is_symlink():raise RuntimeError('Unexpected ownership receipt type')
    receipt = json.loads(proof.read_text())
    if (receipt.get('restored_owner') != ROLE or receipt.get('tables') != 13
            or receipt.get('sequences') != 10 or receipt.get('runtime_unchanged') is not True):
        raise RuntimeError('Verified target ownership recovery is required')
    actual = json.loads(query("SELECT COALESCE(json_agg(json_build_object('name',c.relname,'owner',pg_get_userbyid(c.relowner))), '[]'::json) "
        "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
        "WHERE n.nspname='public' AND c.relkind IN ('r','S');", False))
    if (len(actual) != 23 or {row['name'] for row in actual} != set(NAMES)
            or any(row['owner'] != ROLE for row in actual)):
        raise RuntimeError('Target DGE ownership or object inventory changed')
    state = role_state(False)
    if state['can_login'] is not True or state['superuser'] is not False or state['database_read_only']:
        raise RuntimeError('Target DGE writer is not ready')


def source_guard():
    if socket.gethostname() != 'FTS-23.105.176.45':raise RuntimeError('Unexpected source host')
    identity = runtime(Path('/root/dge-demo/runtime.credentials.json'))
    db = inspect(DB_CONTAINER)
    if db['Name'] != '/' + DB_CONTAINER or not db['State']['Running']:
        raise RuntimeError('Unexpected source PostgreSQL container')
    containers = []
    for name in WEBS:
        info = inspect(name)
        if (info['Name'] != '/' + name or info['State']['Status'] not in ('running','exited')
                or not any(m.get('Source') == '/root/dge-demo/runtime.credentials.json'
                    and m.get('Destination') == '/run/dge/runtime.credentials.json' for m in info['Mounts'])):
            raise RuntimeError('Unexpected former DGE web/runtime identity')
        containers.append({'name':name, 'id':info['Id'], 'running':info['State']['Running'],
                           'restart_policy':info['HostConfig']['RestartPolicy']})
    state = role_state()
    if state['database'] != DATABASE or state['superuser'] is not False or state['can_login'] is None:
        raise RuntimeError('Unexpected former DGE application role')
    return {'runtime':identity,'containers':containers,'role':state}


def dump(path):
    with path.open('xb') as output:
        result = subprocess.run(['docker','exec',DB_CONTAINER,'pg_dump','-w','-U','postgres',
                                 '-d',DATABASE,'-Fc'],stdout=output,stderr=subprocess.DEVNULL,timeout=120)
        output.flush();os.fsync(output.fileno())
    if result.returncode or path.stat().st_size == 0:raise RuntimeError('Preserve incomplete source dump for review')
    return {'sha256':sha(path),'bytes':path.stat().st_size}


def readonly_sql():
    return 'ALTER ROLE dge_app IN DATABASE dge_demo SET default_transaction_read_only=on;\n'


def fence_sql():
    return """BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='10s';
DO $guard$ BEGIN
 IF current_database()<>'dge_demo' OR current_user<>'postgres' OR NOT EXISTS
 (SELECT 1 FROM pg_roles WHERE rolname='dge_app' AND NOT rolsuper
  AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication) THEN
 RAISE EXCEPTION 'Unexpected source DGE database or role'; END IF;
END $guard$;
""" + readonly_sql() + """ALTER ROLE dge_app NOLOGIN;
COMMIT;
SELECT count(*) FILTER (WHERE pg_terminate_backend(pid)) FROM pg_stat_activity
 WHERE datname='dge_demo' AND usename='dge_app' AND pid<>pg_backend_pid();
"""


def assert_fenced(state):
    if (any(c['running'] for c in state['containers']) or state['role']['can_login'] is not False
            or state['role']['database_read_only'] is not True or state['role']['application_connections'] != 0):
        raise RuntimeError('Former DGE writer is not fully fenced; never reactivate it automatically')


def prepare(identifier):
    before = source_guard()
    root = SOURCE_ROOT / identifier
    root.mkdir(mode=0o700,parents=True,exist_ok=False)
    write(root/'before-state.json',before)
    for item in before['containers']:
        if item['running']:
            subprocess.run(['docker','stop','--time','20',item['name']],check=True,
                           stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=40)
    stopped = source_guard()
    if any(c['running'] for c in stopped['containers']):raise RuntimeError('Former DGE webs did not stop')
    proof = {'run':identifier,'database':DATABASE,'role':ROLE,'webs_stopped':True,
             'dump':dump(root/'before-fence.dump')}
    write(root/'prepared.json',proof)
    print(json.dumps(proof,sort_keys=True))


def seal(identifier, preserved_sha):
    if any(c['running'] for c in source_guard()['containers']):
        raise RuntimeError('Former DGE web restarted after the preserved backup; stop and review')
    root = SOURCE_ROOT / identifier
    prepared = json.loads((root/'prepared.json').read_text())
    if (not re.fullmatch('[a-f0-9]{64}',preserved_sha)
            or prepared.get('run') != identifier or prepared['dump']['sha256'] != preserved_sha
            or sha(root/'before-fence.dump') != preserved_sha):
        raise RuntimeError('The source backup must first be verified on the authoritative target')
    query(fence_sql(),mutate=True)
    after = source_guard();assert_fenced(after)
    write(root/'after-state.json',after)
    proof = {'run':identifier,'database':DATABASE,'role':ROLE,'source_fenced':True,
             'before_dump':prepared['dump'],'final_dump':dump(root/'fenced-final.dump'),
             'automatic_reactivation':False,'import_into_target':False}
    write(root/'sealed.json',proof)
    print(json.dumps(proof,sort_keys=True))


def accept(identifier, final=False):
    target_ready()
    root = TARGET_ROOT / identifier
    if root.is_symlink():raise RuntimeError('Unexpected preservation directory')
    manifest = root / ('sealed.json' if final else 'prepared.json')
    if manifest.is_symlink():raise RuntimeError('Unexpected preservation metadata type')
    data = json.loads(manifest.read_text())
    if data.get('run') != identifier or data.get('database') != DATABASE or data.get('role') != ROLE:
        raise RuntimeError('Unexpected source preservation identity')
    info = data['final_dump'] if final else data['dump']
    path = root / ('fenced-final.dump' if final else 'before-fence.dump')
    if (path.is_symlink() or path.stat().st_size != info['bytes'] or sha(path) != info['sha256']):
        raise RuntimeError('Source reconciliation dump changed in transport')
    if final and (data.get('source_fenced') is not True or data.get('import_into_target') is not False):
        raise RuntimeError('Unexpected source fence receipt')
    receipt = {'run':identifier,'sha256':info['sha256'],'bytes':info['bytes'],
               'preserved_only':True,'import_into_active_database':False,'phase':'final' if final else 'before'}
    write(root/('final.preserved.json' if final else 'before.preserved.json'),receipt)
    print(json.dumps(receipt,sort_keys=True))


def main(mode,identifier,*args):
    if os.geteuid()!=0 or not re.fullmatch(r'[0-9]+-[0-9]+',identifier):raise RuntimeError('Unexpected operation identity')
    os.umask(0o077)
    if mode=='target-ready':target_ready();print('Authoritative DGE target ownership and writer verified.')
    elif mode=='prepare':prepare(identifier)
    elif mode=='seal':seal(identifier,*args)
    elif mode=='accept-before':accept(identifier)
    elif mode=='accept-final':accept(identifier,True)
    elif mode=='verify':assert_fenced(source_guard());print('Only former DGE writer is stopped and fenced; data preserved.')
    else:raise ValueError('Unsupported operation')


if __name__=='__main__':main(*sys.argv[1:])
