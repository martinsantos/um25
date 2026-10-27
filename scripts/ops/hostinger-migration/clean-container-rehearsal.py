#!/usr/bin/env python3
"""Run only verified container images with fresh secrets on internal networks."""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tarfile
from urllib.parse import urlsplit, urlunsplit

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-clean-containers')
DIRECTUS = 'sha256:3105ad1d6fcc077974bff62fffa2d12d37c3856a235a19c4a5cc162e907c372d'
DGE = 'sha256:4cbb0b1a8a564e1b7014066fb5691dd904c2029330b7d30043643d777f660391'
DGE_ARCHIVE = '8a0f9e0c69bec0273065161bda55b62b5d3be25c635362c7e33494e742a19923'
ARCA = 'sha256:eb295cc444df65f488a5abd859b9b57617833e6b72ae08d1105f2e1732582730'
ARCA_ARCHIVE = '0ce4e585bf74733ffc992f1cd08fd4acc720f508473c87e9f64a5db4f6acd20c'


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        while chunk := stream.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()


def environment(source, allowed):
    result = {key: str(value) for key, value in source.items() if key in allowed}
    if any('\n' in v or '\r' in v or '\x00' in v for v in result.values()):
        raise ValueError('Unsupported container environment value')
    return result


def trusted(name):
    path = Path((STAGE / ('trusted-' + name)).read_text().strip())
    if path.parent != STAGE / 'trusted' or path.is_symlink() or not path.is_dir():
        raise RuntimeError('Invalid trusted artifact')
    return path


def readable_tree(path, uid, gid):
    for item in [path, *path.rglob('*')]:
        if item.is_symlink():
            raise RuntimeError('Unexpected data symlink')
        os.chown(item, uid, gid)
        item.chmod(0o750 if item.is_dir() else 0o640)


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'internal-rotation.complete').is_file() or Path('/etc/ld.so.preload').exists():
        raise RuntimeError('Clean destination and rotated secrets required')
    if ROOT.exists() or (STAGE / 'clean-container-rehearsal.started').exists():
        raise RuntimeError('Already attempted; inspect before retry')
    cms, dge, arca = trusted('cms'), trusted('dge'), trusted('arca')
    if digest(arca / 'image.tar.gz') != ARCA_ARCHIVE:
        raise RuntimeError('Fresh ARCA archive checksum mismatch')
    release = json.loads((dge / 'release.json').read_text())
    if release['app_image'] != DGE or release['app_archive_sha256'] != DGE_ARCHIVE:
        raise RuntimeError('DGE release does not match reviewed CI output')
    secret = STAGE / 'internal-credentials'
    env = json.loads((secret / 'container-environments.json').read_text())
    dge_runtime = json.loads((secret / 'dge-runtime.json').read_text())
    if dge_runtime['database']['HOST'] != 'dge-demo-db':
        raise RuntimeError('Unexpected DGE database host')
    active = set(subprocess.check_output(['docker', 'ps', '-a', '--format', '{{.Names}}'], text=True).split())
    if active != {'directus-admin-database-1', 'dge-demo-db'}:
        raise RuntimeError('Unexpected existing containers')
    directus_env = environment(env['directus'], {'DB_CLIENT','DB_DATABASE','DB_HOST','DB_PASSWORD','DB_PORT','DB_USER',
        'KEY','SECRET','NODE_ENV','PUBLIC_URL','ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION','ASSETS_TRANSFORM_MAX_MAP_SIZE'})
    directus_env.update(DB_HOST='directus-admin-database-1', TELEMETRY='false')
    arca_env = environment(env['arca'], {'ARCA_HOMOLOGACION','DATABASE_URL'})
    value = urlsplit(arca_env['DATABASE_URL'])
    arca_env['DATABASE_URL'] = urlunsplit((value.scheme, value.netloc.rsplit('@', 1)[0] + '@directus-admin-database-1:5432', value.path, value.query, value.fragment))
    with (STAGE / 'receipts/clean-container-rehearsal.log').open('ab') as log:
        def run(args):
            subprocess.run(args, check=True, stdout=log, stderr=log)
        if subprocess.check_output(['docker','image','inspect','--format','{{.Id}}',DIRECTUS], text=True).strip() != DIRECTUS:
            raise RuntimeError('Official Directus image missing')
        (STAGE / 'clean-container-rehearsal.started').write_text('Verified image IDs; internal networks only.\n')
        ROOT.mkdir(mode=0o755)
        # Extract only the named image payload; never execute source deployment scripts.
        with tarfile.open(dge / 'release.tar.gz') as archive:
            matches = [m for m in archive.getmembers() if m.name.lstrip('./') == 'app-image.tar.gz']
            if len(matches) != 1 or not matches[0].isfile():
                raise RuntimeError('DGE archive image payload ambiguous')
            with archive.extractfile(matches[0]) as source, (ROOT / 'dge-image.tar.gz').open('wb') as output:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
        if digest(ROOT / 'dge-image.tar.gz') != DGE_ARCHIVE:
            raise RuntimeError('Fresh DGE image checksum mismatch')
        for image, archive in [(DGE, ROOT / 'dge-image.tar.gz'), (ARCA, arca / 'image.tar.gz')]:
            run(['docker','load','--input',str(archive)])
            if subprocess.check_output(['docker','image','inspect','--format','{{.Id}}',image], text=True).strip() != image:
                raise RuntimeError('Loaded image ID differs')
        for name, subnet, database, address in [('umsa-clean-dge','172.18.0.0/16','dge-demo-db','172.18.0.2'),
                ('umsa-clean-shared','172.20.0.0/16','directus-admin-database-1','172.20.0.4')]:
            run(['docker','network','create','--internal','--subnet',subnet,name])
            run(['docker','network','connect','--ip',address,name,database])
            metadata = json.loads(subprocess.check_output(['docker','network','inspect',name]))[0]
            if not metadata['Internal']:
                raise RuntimeError('Application network is not isolated')
        for name, values in [('directus',directus_env),('arca',arca_env)]:
            (ROOT / (name + '.env')).write_text(''.join(k + '=' + v + '\n' for k,v in sorted(values.items())))
        for source, dest in [('/opt/directus-admin/uploads','directus-uploads'),
            (str(cms / 'application/directus-extensions'),'directus-extensions'),
            ('/opt/plantilla-arca-app/certs','arca-certs'),('/opt/plantilla-arca-app/output','arca-output')]:
            run(['cp','-a','--reflink=always',source,str(ROOT / dest)])
        readable_tree(ROOT / 'directus-uploads',1000,1000)
        readable_tree(ROOT / 'directus-extensions',1000,1000)
        arca_uid = int(subprocess.check_output(['docker','run','--rm','--network','none','--entrypoint','id',ARCA,'-u'], text=True))
        readable_tree(ROOT / 'arca-certs',arca_uid,arca_uid)
        readable_tree(ROOT / 'arca-output',arca_uid,arca_uid)
        runtime = ROOT / 'dge-runtime.json'
        runtime.write_text(json.dumps(dge_runtime) + '\n')
        os.chown(runtime,0,10001)
        runtime.chmod(0o640)
        def bind(path, target, readonly=False):
            return ['--mount','type=bind,source=' + str(ROOT / path) + ',target=' + target + (',readonly' if readonly else '')]
        for name, port in [('dge-demo-web',18191),('dge-demo-rollback-cf24407ee8ee',18192)]:
            run(['docker','create','--name',name,'--network','umsa-clean-dge','--restart','no','--read-only',
                '--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/tmp:rw,noexec,nosuid,size=32m',
                '--memory','201326592','--pids-limit','64','--cpus','0.5','--publish',f'127.0.0.1:{port}:8000',
                '--env','DGE_TRUSTED_PROXY_IP=172.18.0.1', '--env','DGE_BIND=0.0.0.0:8000',
                *bind('dge-runtime.json','/run/dge/runtime.credentials.json',True),DGE])
        run(['docker','create','--name','directus-admin-directus-app-1','--network','umsa-clean-shared',
            '--restart','no','--publish','127.0.0.1:8055:8055','--env-file',str(ROOT / 'directus.env'),
            *bind('directus-uploads','/directus/uploads'),*bind('directus-extensions','/directus/extensions'),DIRECTUS])
        run(['docker','create','--name','arca_app','--network','umsa-clean-shared','--restart','no',
            '--publish','127.0.0.1:8501:8501','--env-file',str(ROOT / 'arca.env'),
            *bind('arca-certs','/app/certs',True),*bind('arca-output','/app/output'),ARCA,
            'streamlit','run','src/web/streamlit_app.py','--server.baseUrlPath','/plantilla-arca'])
        for name in ('directus-admin-directus-app-1','dge-demo-web','dge-demo-rollback-cf24407ee8ee','arca_app'):
            run(['docker','start',name])
    (STAGE / 'clean-container-rehearsal.ready').write_text('Fresh images started; inspect HTTP and database behavior.\n')
    print('Verified container images started on internal networks and loopback ports. No public cutover.')


if __name__ == '__main__':
    main()
