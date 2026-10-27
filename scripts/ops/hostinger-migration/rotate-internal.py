#!/usr/bin/env python3
"""Rotate target-only database/session secrets before any application activation."""
import json
import os
from pathlib import Path
import re
import secrets
import socket
import subprocess
from urllib.parse import quote, unquote, urlsplit, urlunsplit

STAGE = Path('/srv/umsa-migration')
PG_ROLES = {
    'directus-admin-database-1': {'directus', 'arca_user', 'sitrep_training_role', 'sitrep_qa_stabilization_20260905', 'umsa_restore_admin_20261027'},
    'dge-demo-db': {'dge_app', 'postgres', 'umsa_restore_admin_20261027'},
}
NODE_NAMES = {'sgi', 'sitrep-backend', 'astro-ultimamilla', 'umbot-aceite', 'cannaval-plan-admin'}
NODE_SESSIONS = {'sgi': ['SESSION_SECRET'], 'sitrep-backend': ['JWT_SECRET', 'JWT_REFRESH_SECRET'],
                 'cannaval-plan-admin': ['ADMIN_SESSION_SECRET']}


def database_url(value, passwords):
    parts = urlsplit(value)
    user = unquote(parts.username or '')
    if user not in passwords or parts.scheme not in ('postgres', 'postgresql'):
        raise ValueError('Unknown internal database URL')
    host = parts.hostname or 'localhost'
    if ':' in host:
        host = '[' + host + ']'
    netloc = quote(user, safe='') + ':' + quote(passwords[user], safe='') + '@' + host
    if parts.port:
        netloc += ':' + str(parts.port)
    return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))


def php_value(text, key, value, wordpress=False):
    if not re.fullmatch('[A-Za-z0-9_-]+', value):
        raise ValueError('Expected generated URL-safe secret')
    literal = r'''(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")'''
    if wordpress:
        pattern = r"(define\(\s*['\"]" + re.escape(key) + r"['\"]\s*,\s*)" + literal + r'(\s*\))'
    else:
        pattern = r'(\$' + re.escape(key) + r'\s*=\s*)' + literal + r'(\s*;)'
    updated, count = re.subn(pattern, lambda m: m[1] + "'" + value + "'" + m[2], text)
    if count != 1:
        raise ValueError('Expected exactly one literal PHP setting: ' + key)
    return updated


def sql_string(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'database-restore.complete').is_file() or (STAGE / 'rehearsal.started').exists():
        raise RuntimeError('Restore must be complete and application rehearsal not started')
    if (STAGE / 'internal-rotation.started').exists():
        raise RuntimeError('Rotation already attempted; inspect private receipt before retry')
    names = subprocess.check_output(['docker', 'ps', '-a', '--format', '{{.Names}}'], text=True).split()
    if set(names) != set(PG_ROLES):
        raise RuntimeError('Unexpected application containers before rotation')
    snapshot = Path((STAGE / 'latest-snapshot').read_text().strip())
    metadata = json.loads((snapshot / 'pm2.json').read_text())
    containers = {x['Name'].lstrip('/'): x for x in json.loads((snapshot / 'docker-inspect.json').read_text())}
    vault = {'postgres': {}, 'mariadb': {}, 'sessions': {}, 'directus_api': secrets.token_urlsafe(48)}
    def pg_query(container, query, database='postgres'):
        return subprocess.check_output(['docker', 'exec', '-i', container, 'psql', '-X', '-w', '-U',
            'umsa_restore_admin_20261027', '-d', database, '-At', '--set', 'ON_ERROR_STOP=on'], input=query, text=True)
    for name, expected in PG_ROLES.items():
        roles = set(pg_query(name, "SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname NOT LIKE 'pg_%';").splitlines())
        if roles != expected:
            raise RuntimeError('Unexpected PostgreSQL login roles')
        vault['postgres'][name] = {user: secrets.token_urlsafe(48) for user in sorted(roles)}
    maria_rows = subprocess.check_output(['mariadb', '--no-defaults', '-uroot', '-N', '-e',
        "SELECT User,Host FROM mysql.user WHERE plugin='mysql_native_password' AND authentication_string NOT IN ('','invalid') AND User <> 'root' ORDER BY User,Host;"], text=True)
    accounts = [row.split('\t') for row in maria_rows.splitlines() if row]
    for user, host in accounts:
        if not re.fullmatch('[A-Za-z0-9_]+', user) or not re.fullmatch('[A-Za-z0-9._%:-]+', host):
            raise RuntimeError('Unexpected database account format')
        vault['mariadb'].setdefault(user, secrets.token_urlsafe(48))
    if not {'sgi_app', 'ultimami_um', 'vecinorabioso'}.issubset(vault['mariadb']):
        raise RuntimeError('Required application database accounts not found')
    nodes = {}
    shared = vault['postgres']['directus-admin-database-1']
    for row in metadata:
        name = row['name']
        if name not in NODE_NAMES or name in nodes or row['pm2_env'].get('status') != 'online':
            continue
        env = {str(k): str(v) for k, v in row['pm2_env'].get('env', {}).items() if isinstance(v, (str, int, float))}
        for key in list(env):
            if key.startswith(('SSH_', 'XDG_', 'LD_', 'DYLD_')) or key in ('NODE_OPTIONS', 'BASH_ENV', 'ENV', 'PYTHONPATH', 'DBUS_SESSION_BUS_ADDRESS', 'PM2_HOME'):
                env.pop(key)
        env.update(PATH='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin', HOME='/root', NODE_ENV='production')
        for key in ('DATABASE_URL', 'TRAINING_DATABASE_URL'):
            if key in env and urlsplit(env[key]).scheme in ('postgres', 'postgresql'):
                env[key] = database_url(env[key], shared)
        for key in NODE_SESSIONS.get(name, []):
            if not env.get(key):
                raise RuntimeError('Expected session setting missing: ' + name + '/' + key)
            vault['sessions'][name + '/' + key] = secrets.token_urlsafe(48)
            env[key] = vault['sessions'][name + '/' + key]
        if name == 'sgi':
            if env.get('DB_USER') != 'sgi_app':
                raise RuntimeError('Unexpected SGI database user')
            env['DB_PASS'] = vault['mariadb']['sgi_app']
        nodes[name] = env
    if set(nodes) != NODE_NAMES:
        raise RuntimeError('Missing application runtime')
    old_api = nodes['astro-ultimamilla'].get('DIRECTUS_ADMIN_TOKEN')
    if not old_api or not re.fullmatch('[A-Za-z0-9_.-]+', old_api):
        raise RuntimeError('Expected internal Directus token missing or unsupported')
    count = pg_query('directus-admin-database-1', 'SELECT COUNT(*) FROM directus_users WHERE token=' + sql_string(old_api) + ';', 'directus')
    if count.strip() != '1':
        raise RuntimeError('Internal API consumer must match exactly one Directus account')
    nodes['astro-ultimamilla']['DIRECTUS_ADMIN_TOKEN'] = vault['directus_api']
    directus = dict(v.split('=', 1) for v in containers['directus-admin-directus-app-1']['Config']['Env'] if '=' in v)
    directus['DB_PASSWORD'] = shared[directus['DB_USER']]
    for key in ('KEY', 'SECRET'):
        vault['sessions']['directus/' + key] = secrets.token_urlsafe(48)
        directus[key] = vault['sessions']['directus/' + key]
    for key in ('ADMIN_PASSWORD', 'ADMIN_EMAIL'):
        directus.pop(key, None)
    arca = dict(v.split('=', 1) for v in containers['arca_app']['Config']['Env'] if '=' in v)
    arca['DATABASE_URL'] = database_url(arca['DATABASE_URL'], shared)
    dge_path = Path('/root/dge-demo/runtime.credentials.json')
    dge = json.loads(dge_path.read_text())
    dge['database']['PASSWORD'] = vault['postgres']['dge-demo-db'][dge['database']['USER']]
    vault['sessions']['dge/secret_key'] = secrets.token_urlsafe(48)
    dge['secret_key'] = vault['sessions']['dge/secret_key']
    wiki = Path('/home/wiki.ultimamilla.com.ar/LocalSettings.php')
    wiki_text = php_value(wiki.read_text(), 'wgDBpassword', vault['mariadb']['ultimami_um'])
    vault['sessions']['wiki/wgSecretKey'] = secrets.token_urlsafe(48)
    wiki_text = php_value(wiki_text, 'wgSecretKey', vault['sessions']['wiki/wgSecretKey'])
    wp = Path('/home/vecinorabioso.com.ar/public_html/wp-config.php')
    wp_text = php_value(wp.read_text(), 'DB_PASSWORD', vault['mariadb']['vecinorabioso'], True)
    for key in ('AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY', 'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT'):
        vault['sessions']['wordpress/' + key] = secrets.token_urlsafe(48)
        wp_text = php_value(wp_text, key, vault['sessions']['wordpress/' + key], True)
    # All consumers and account mappings are validated before any secret changes.
    secure = STAGE / 'internal-credentials'
    secure.mkdir(mode=0o700)
    (secure / 'vault.json').write_text(json.dumps(vault, indent=2) + '\n')
    (secure / 'node-environments.json').write_text(json.dumps(nodes, indent=2) + '\n')
    (secure / 'container-environments.json').write_text(json.dumps({'directus': directus, 'arca': arca}, indent=2) + '\n')
    (secure / 'dge-runtime.json').write_text(json.dumps(dge, indent=2) + '\n')
    (secure / 'LocalSettings.php').write_text(wiki_text)
    (secure / 'wp-config.php').write_text(wp_text)
    (STAGE / 'internal-rotation.started').write_text(str(snapshot) + '\n')
    with (STAGE / 'receipts/internal-rotation.log').open('ab') as log:
        for container, roles in vault['postgres'].items():
            sql = '\n'.join('ALTER ROLE "' + user + '" PASSWORD ' + sql_string(password) + ';' for user, password in roles.items())
            subprocess.run(['docker', 'exec', '-i', container, 'psql', '-X', '-w', '-U', 'umsa_restore_admin_20261027',
                '-d', 'postgres', '--set', 'ON_ERROR_STOP=on'], input=sql.encode(), stdout=log, stderr=log, check=True)
        sql = '\n'.join('ALTER USER ' + sql_string(user) + '@' + sql_string(host) + ' IDENTIFIED BY ' + sql_string(vault['mariadb'][user]) + ';' for user, host in accounts)
        subprocess.run(['mariadb', '--no-defaults', '-uroot'], input=sql.encode(), stdout=log, stderr=log, check=True)
        sql = 'UPDATE directus_users SET token=' + sql_string(vault['directus_api']) + ' WHERE token=' + sql_string(old_api) + ';'
        subprocess.run(['docker', 'exec', '-i', 'directus-admin-database-1', 'psql', '-X', '-w', '-U', 'umsa_restore_admin_20261027',
            '-d', 'directus', '--set', 'ON_ERROR_STOP=on'], input=sql.encode(), stdout=log, stderr=log, check=True)
        for container, user, database in [('directus-admin-database-1', 'directus', 'directus'), ('dge-demo-db', 'dge_app', 'dge_demo')]:
            subprocess.run(['docker', 'exec', '-e', 'PGPASSWORD', container, 'psql', '-X', '-w', '-h', '127.0.0.1',
                '-U', user, '-d', database, '-c', 'SELECT 1;'],
                env={**os.environ, 'PGPASSWORD': vault['postgres'][container][user]}, stdout=log, stderr=log, check=True)
        for user in ('sgi_app', 'ultimami_um', 'vecinorabioso'):
            client = secure / (user + '.cnf')
            client.write_text('[client]\nuser=' + user + '\npassword=' + vault['mariadb'][user] + '\nhost=127.0.0.1\nprotocol=tcp\n')
            subprocess.run(['mariadb', '--defaults-file=' + str(client), '-e', 'SELECT 1;'], stdout=log, stderr=log, check=True)
    (STAGE / 'internal-rotation.complete').write_text(str(snapshot) + '\n')
    print('Target database and session secrets rotated. Private consumer configurations prepared; accounts, data and document-signing keys preserved.')


if __name__ == '__main__':
    main()
