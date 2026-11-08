#!/usr/bin/env python3
"""Install only the isolated CreaTrámite demo from a CI-built immutable package."""
import fcntl
import hashlib
import http.client
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import secrets
import shutil
import socket
import subprocess
import sys
import tarfile
import time
from urllib.parse import urlencode

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/creatramite')
UNITS = Path('/etc/systemd/system')
WEB_UNIT = 'creatramite-web.service'
SIM_UNIT = 'creatramite-simulator.service'
SITE_STATE = STAGE/'web-publication-state.json'
SITE_VHOST = Path('/srv/umsa-public-vhosts/ultimamilla.com.ar.conf')
PREFIX = '/demo/creatramite'
USER = 'creatramite'


def validate_ids(revision, run_id, digest):
    if not re.fullmatch('[0-9a-f]{40}', revision):
        raise ValueError('Invalid application revision')
    if not re.fullmatch('[0-9]{1,20}-[0-9]{1,4}', run_id):
        raise ValueError('Invalid CI run identifier')
    if not re.fullmatch('[0-9a-f]{64}', digest):
        raise ValueError('Invalid package digest')


def validate_archive(archive):
    seen, total = set(), 0
    for item in archive.getmembers():
        name = PurePosixPath(item.name)
        if (name.is_absolute() or not name.parts or '..' in name.parts
                or name.parts[0] not in {'app','vendor'} or name in seen
                or not (item.isfile() or item.isdir())):
            raise ValueError('Unexpected or unsafe package entry')
        seen.add(name)
        total += item.size
        if item.size > 150 * 1024**2 or total > 512 * 1024**2 or len(seen) > 40000:
            raise ValueError('Package size exceeds installation limits')
    required = {'app/app.py','app/wsgi_production.py','app/simulator.py',
                'app/schema.sql','app/scripts/crear_base_demo_publica.py',
                'app/seed/semilla-sintetica-v2.sqlite3',
                'app/seed/semilla-sintetica-v2.sha256','vendor/gunicorn/__init__.py'}
    if not required.issubset({str(x) for x in seen}):
        raise ValueError('Incomplete application package')


def secure_release(release):
    """Do not trust the UID/GID stored in a CI-built archive."""
    if release.is_symlink() or not release.is_dir():
        raise RuntimeError('Unsafe release root')
    for path in release.rglob('*'):
        if path.is_symlink(): raise RuntimeError('Unexpected installed symlink')
        os.chown(path,0,0,follow_symlinks=False)
        if path.is_dir(): path.chmod(0o755)
        elif path.is_file(): path.chmod(0o755 if path.stat().st_mode & 0o111 else 0o644)
        else: raise RuntimeError('Unexpected installed file type')
    release.chmod(0o755)


def status(args, timeout=10):
    return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout.strip()


def guard_host():
    if os.geteuid() != 0 or socket.gethostname() != 'srv2101069.hstgr.cloud':
        raise RuntimeError('Wrong host or user')
    if STAGE.is_symlink() or (STAGE/'.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong migration target')
    if not (STAGE/'production.active').is_file():
        raise RuntimeError('Production cutover is not active')
    for service in ('umsa-sitrep-ingress','umsa-clean-front'):
        if status(['systemctl','is-active',service]) != 'active':
            raise RuntimeError('An existing proxy is not healthy')
    usage = shutil.disk_usage('/srv')
    if usage.free < 8*1024**3 or usage.used/(usage.used+usage.free) > .90:
        raise RuntimeError('Insufficient free space or disk exceeds 90 percent')
    if ROOT.exists() or ROOT.is_symlink():
        raise RuntimeError('An installation already exists; no files were changed')
    try:
        pwd.getpwnam(USER)
    except KeyError:
        pass
    else:
        raise RuntimeError('The dedicated account already exists')
    for name in (WEB_UNIT,SIM_UNIT):
        if (UNITS/name).exists() or (UNITS/name).is_symlink():
            raise RuntimeError('A demo unit already exists')
    for port in (18891,18894):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1',port))
    for binary in ('/usr/bin/python3','/usr/bin/tesseract','/usr/sbin/runuser',
                   '/usr/sbin/useradd','/usr/bin/systemd-analyze'):
        if not Path(binary).is_file():
            raise RuntimeError('Missing required runtime dependency')
    languages = status(['/usr/bin/tesseract','--list-langs'])
    if not {'spa','eng'}.issubset(set(languages.splitlines())):
        raise RuntimeError('Spanish and English OCR language data are required')


def render_unit(name, release):
    if name not in {'web','simulator'}:
        raise ValueError('Unknown unit')
    app = release/'app'
    vendor = release/'vendor'
    target, port, memory = ('wsgi_production:application',18891,'768M') if name == 'web' else ('simulator:app',18894,'384M')
    after = 'After=network.target creatramite-simulator.service\nRequires=creatramite-simulator.service\n' if name == 'web' else 'After=network.target\n'
    return ('[Unit]\nDescription=CreaTrámite isolated demo '+name+'\n'+after+
            '[Service]\nType=simple\nUser=creatramite\nGroup=creatramite\n'
            'WorkingDirectory='+str(app)+'\nEnvironmentFile='+str(ROOT/'runtime/runtime.env')+'\n'
            'Environment=PYTHONPATH='+str(app)+':'+str(vendor)+'\n'
            'ExecStart=/usr/bin/python3 -B -m gunicorn --bind 127.0.0.1:'+str(port)+
            ' --workers 1 --threads 4 --timeout 90 '+target+'\n'
            'Restart=on-failure\nRestartSec=5\nUMask=0077\nNoNewPrivileges=true\nPrivateTmp=true\n'
            'ProtectSystem=strict\nProtectHome=true\nReadWritePaths='+str(ROOT/'runtime')+'\n'
            'CapabilityBoundingSet=\nRestrictSUIDSGID=true\nMemoryMax='+memory+'\nCPUQuota=60%\nTasksMax=80\n'
            '[Install]\nWantedBy=multi-user.target\n')


def route_status(host, path):
    return status(['curl','--noproxy','*','--http1.1','-sS','--max-time','8',
                   '--resolve',host+':443:179.198.115.115','-o','/dev/null','-w','%{http_code}',
                   'https://'+host+path],timeout=10)


def production_snapshot():
    values = {'sitio':route_status('www.ultimamilla.com.ar','/'),
              'dge':route_status('www.ultimamilla.com.ar','/dge/'),
              'sitrep':route_status('sitrep.ultimamilla.com.ar','/api/health')}
    if values['sitio'] != '200' or values['dge'] not in {'200','302','303'} or values['sitrep'] != '200':
        raise RuntimeError('Existing services did not pass the baseline check')
    return values


def call_app(path, method='GET', body=None, cookie=None):
    headers = {'Host':'www.ultimamilla.com.ar','X-Forwarded-Host':'www.ultimamilla.com.ar',
               'X-Forwarded-Proto':'https'}
    if cookie: headers['Cookie'] = cookie
    if body is not None: headers['Content-Type'] = 'application/x-www-form-urlencoded'
    connection = http.client.HTTPConnection('127.0.0.1',18891,timeout=8)
    try:
        connection.request(method,PREFIX+path,body=body,headers=headers)
        response=connection.getresponse()
        content=response.read(2*1024*1024)
        return response.status, dict(response.getheaders()), content
    finally:
        connection.close()


def demo_inventory(database):
    import sqlite3
    with sqlite3.connect(database.as_uri()+'?mode=ro',uri=True,timeout=3) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Demo database integrity failed')
        if db.execute('PRAGMA foreign_key_check').fetchone():
            raise RuntimeError('Demo database references failed')
        rows = db.execute('SELECT id,digest,content FROM case_documents').fetchall()
        if any(hashlib.sha256(content).hexdigest() != digest for _,digest,content in rows):
            raise RuntimeError('A synthetic document did not match its digest')
        docs = {(identifier,digest) for identifier,digest,_ in rows}
        return {table:db.execute('SELECT COUNT(*) FROM '+table).fetchone()[0]
                for table in ('forms','publications','cases','case_documents')},docs


def verify_login(username, password, expected):
    code, headers, html = call_app('/login')
    cookie = headers.get('Set-Cookie','')
    token = re.search(rb'name="csrf_token" value="([^"]+)"',html)
    if (code != 200 or not token or not cookie.startswith('creatramite_demo=')
            or 'Secure' not in cookie or 'HttpOnly' not in cookie or 'Path='+PREFIX not in cookie):
        raise RuntimeError('Secure demo login form failed')
    body = urlencode({'username':username,'password':password,'csrf_token':token.group(1).decode()})
    code, headers, _ = call_app('/login','POST',body,cookie.split(';',1)[0])
    session = headers.get('Set-Cookie','').split(';',1)[0]
    if code != 302 or not session.startswith('creatramite_demo='):
        raise RuntimeError('Demo profile login failed')
    code, _, html = call_app('/',cookie=session)
    if code != 200 or expected.encode() not in html:
        raise RuntimeError('Demo profile did not show its own organization')


def test_runtime(runtime):
    for _ in range(30):
        try:
            code, _, data = call_app('/salud/listo')
            if code == 200 and json.loads(data).get('base') == 'disponible':
                break
        except (OSError,ValueError):
            pass
        time.sleep(1)
    else:
        raise RuntimeError('Demo web did not become ready')
    conn=http.client.HTTPConnection('127.0.0.1',18894,timeout=5)
    try:
        conn.request('GET','/health')
        res=conn.getresponse()
        if res.status != 200 or json.loads(res.read()).get('simulado') is not True:
            raise RuntimeError('Demo simulator is not ready')
    finally:
        conn.close()
    before=demo_inventory(runtime/'demo.sqlite3')
    if before[0] != {'forms':8,'publications':8,'cases':25,'case_documents':25}:
        raise RuntimeError('Unexpected synthetic seed inventory')
    password=(runtime/'login.key').read_text().strip()
    for user,organization in [('admin.demo','Salud'),('salud.demo','Salud'),
                              ('cultura.demo','Cultura'),('operador.demo','Salud')]:
        verify_login(user,password,organization)
    if demo_inventory(runtime/'demo.sqlite3') != before:
        raise RuntimeError('The synthetic forms or documents changed during login checks')


def install(revision, run_id, digest):
    validate_ids(revision,run_id,digest)
    guard_host()
    package=STAGE/'incoming'/('creatramite-'+revision+'-'+run_id+'.tar.gz')
    if (package.is_symlink() or not package.is_file() or package.stat().st_size > 200*1024**2
            or hashlib.sha256(package.read_bytes()).hexdigest()!=digest):
        raise RuntimeError('The immutable CI package is missing or has a different digest')
    with tarfile.open(package,'r:gz') as archive:
        validate_archive(archive)
    lockfile=Path('/run/umsa-web-publish.lock')
    if lockfile.is_symlink(): raise RuntimeError('Unsafe publication lock')
    with lockfile.open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        guard_host()
        before=production_snapshot()
        state=SITE_STATE.read_bytes()
        vhost=SITE_VHOST.read_bytes()
        proof=STAGE/'creatramite-proofs'/run_id
        proof.mkdir(parents=True,mode=0o700)
        (proof/'web-publication-state.before.json').write_bytes(state)
        (proof/'ultimamilla-vhost.before.conf').write_bytes(vhost)
        ROOT.mkdir(mode=0o755)
        release=ROOT/'releases'/revision
        # Keep the incomplete tree inaccessible while normalizing archive owners.
        release.mkdir(parents=True,mode=0o700)
        with tarfile.open(package,'r:gz') as archive:
            validate_archive(archive)
            archive.extractall(release)
        secure_release(release)
        subprocess.run(['/usr/sbin/useradd','--system','--user-group','--home-dir','/nonexistent',
                        '--shell','/sbin/nologin',USER],check=True,timeout=20)
        account=pwd.getpwnam(USER)
        runtime=ROOT/'runtime'
        runtime.mkdir(mode=0o700)
        os.chown(runtime,account.pw_uid,account.pw_gid)
        key=runtime/'login.key'
        fd=os.open(key,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as stream: stream.write(secrets.token_urlsafe(18)+'\n')
        os.chown(key,account.pw_uid,account.pw_gid)
        values={'DIC_DEMO_RUNTIME':str(runtime),'DIC_DEMO_DATABASE':str(runtime/'demo.sqlite3'),
                'DIC_DEMO_PASSWORD_FILE':str(key),'DIC_DEMO_PREFIX':PREFIX,'DIC_DEMO_PORT':'18891',
                'DIC_SIMULATOR_PORT':'18894','DIC_SIMULATOR_URL':'http://127.0.0.1:18894',
                'PYTHONDONTWRITEBYTECODE':'1'}
        envfile=runtime/'runtime.env'
        envfile.write_text(''.join(k+'='+v+'\n' for k,v in values.items()))
        envfile.chmod(0o600)
        os.chown(envfile,account.pw_uid,account.pw_gid)
        app=release/'app'; vendor=release/'vendor'
        subprocess.run(['/usr/sbin/runuser','-u',USER,'--','/usr/bin/env',
                        'PYTHONPATH='+str(app)+':'+str(vendor),'/usr/bin/python3','-B',
                        str(app/'scripts/crear_base_demo_publica.py'),str(app/'seed/semilla-sintetica-v2.sqlite3'),
                        str(runtime),str(key)],check=True,capture_output=True,timeout=60)
        for name,unit in [('simulator',SIM_UNIT),('web',WEB_UNIT)]:
            path=UNITS/unit
            with path.open('x') as out: out.write(render_unit(name,release))
            path.chmod(0o644)
        subprocess.run(['/usr/bin/systemd-analyze','verify',str(UNITS/SIM_UNIT),str(UNITS/WEB_UNIT)],
                       check=True,capture_output=True,timeout=30)
        started=[]
        try:
            subprocess.run(['systemctl','daemon-reload'],check=True,timeout=30)
            for unit in (SIM_UNIT,WEB_UNIT):
                subprocess.run(['systemctl','start',unit],check=True,timeout=30)
                started.append(unit)
            test_runtime(runtime)
            after=production_snapshot()
            if after != before or SITE_STATE.read_bytes()!=state or SITE_VHOST.read_bytes()!=vhost:
                raise RuntimeError('Existing production routing or health changed during install')
            for unit in (SIM_UNIT,WEB_UNIT):
                subprocess.run(['systemctl','enable',unit],check=True,timeout=30)
            receipt={'revision':revision,'run_id':run_id,'package_sha256':digest,
                     'before':before,'after':after,'site_state_sha256':hashlib.sha256(state).hexdigest(),
                     'vhost_sha256':hashlib.sha256(vhost).hexdigest(),'profiles_tested':4,
                     'documents_preserved':25,'result':'isolated_backend_ready'}
            (proof/'installation.complete.json').write_text(json.dumps(receipt,sort_keys=True)+'\n')
        except Exception:
            for unit in reversed(started):
                subprocess.run(['systemctl','stop',unit],check=False,timeout=30)
                subprocess.run(['systemctl','disable',unit],check=False,timeout=30)
            raise
    print('Isolated demo backend ready; existing production routes and services verified unchanged.')


if __name__=='__main__':
    if len(sys.argv)==2 and sys.argv[1]=='preflight':
        guard_host()
        print('Preflight passed: capacity, host, isolated account, ports and OCR.')
    elif len(sys.argv)==5 and sys.argv[1]=='install':
        install(*sys.argv[2:])
    else:
        raise SystemExit('Usage: preflight | install REVISION RUN-ID SHA256')
