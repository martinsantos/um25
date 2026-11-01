#!/usr/bin/env python3
"""Recover eight missing service images through the existing Directus API.

Contract: github.com/directus/directus/blob/v11.13.4/api/src/controllers/files.ts
No web deployment, permissions, schema changes, restarts or backup deletions.
"""
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import re
import secrets
import socket
import struct
import subprocess
import sys
import tarfile
import urllib.error
import urllib.request

REVIEWED = [
    (101, '90813c10-237b-418f-9465-6f583a5c5468', 'infraestructura', 3057902, '574e7a05ae46fa53c5587078dbd049582539e9003fb6c6000325ffe77a612ab5'),
    (102, '6af30576-0301-4bae-80e7-37945241f72b', 'seguridad', 2252858, '0a77ff06e865a17da60ada68eb60886eae7443a63cce2f18a243075c2bc0271c'),
    (103, '9bb39733-39d4-4417-8502-7f65d6829e76', 'telecomunicaciones', 1246083, '3f5bd4a8a8987fac038f85d5f2cbad14540a3171b45d5ad2be99d71832356836'),
    (104, '755b2d22-a6e7-4997-b943-858d37abeee9', 'software', 1941491, '9e75e2d16db6be32ef95aa7c5206bea5bf78ae360b14d2f1cd01422d76893138'),
    (105, '3ec5cc77-4edf-41ae-a1fd-e3a887531046', 'soporte', 3163114, '890180a50157339a5acab10d4859a1de8baee0d0ffc28c98d51ba7578c8213b5'),
    (106, 'cfd4ea67-fec9-4a92-b40b-227a76434a09', 'consultoria', 2132960, 'd7164d263309b5db613d2313eacbebe27cbacb838f60feaaa05918180c5410b3'),
    (107, '1b8b7cbd-b390-4d91-a3f7-57d1d8e05d20', 'incendios', 2459576, '0654d335aee6a3aa485067739e2feda7fd59211bc24fe8e304381dc1b51563cf'),
    (108, 'bf6a9e03-4b9d-4052-b860-ffc85240396f', 'electricos', 2268609, '898e8f2cd7270c61f6a1f82bf87b4b9d59ce39033a59cc81e23b57b69ac74584'),
]
ASSETS = [dict(service=s, id=i, path=f'public/images/services/productos/{n}/{s-100}.png',
               bytes=b, sha256=h, width=2816, height=1536, filenameDisk=i+'.jpg',
               filenameDownload=f'servicio-{s}-{n}.jpg') for s, i, n, b, h in REVIEWED]
ROOT = Path('/srv/umsa-migration')
UPLOADS = Path('/srv/umsa-clean-containers/directus-uploads')
CMS = 'directus-admin-directus-app-1'
VERSION = '11.13.4'
PUBLIC = 'https://admin.ultimamilla.com.ar'
RESTORE_FIELDS = ('storage', 'filename_disk', 'filename_download', 'title', 'type', 'folder',
                  'charset', 'filesize', 'width', 'height', 'duration', 'embed', 'description',
                  'location', 'tags', 'metadata', 'focal_point_x', 'focal_point_y', 'uploaded_on')
PRESERVE_FIELDS = ('id', 'storage', 'title', 'folder', 'description', 'location', 'tags',
                   'focal_point_x', 'focal_point_y', 'uploaded_by', 'created_on')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def command(args):
    result = subprocess.run(args, capture_output=True, timeout=45)
    if result.returncode:
        raise RuntimeError('Required runtime inspection failed; output suppressed')
    return result.stdout.decode().strip()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Redirect refused; credentials must stay on the selected origin')


class API:
    def __init__(self, token, base='http://127.0.0.1:8055'):
        if not re.fullmatch(r'http://127\.0\.0\.1:\d+', base):
            raise RuntimeError('Mutations require the loopback Directus API')
        self.token, self.base = token, base

    def request(self, path, method='GET', data=None, content_type=None, public=False):
        if method not in ('GET', 'PATCH') or not path.startswith('/'):
            raise RuntimeError('Unsupported API operation')
        if method != 'GET' and (public or path not in {'/files/'+a['id'] for a in ASSETS}):
            raise RuntimeError('Write outside the eight reviewed file IDs refused')
        headers = {'User-Agent': 'Mozilla/5.0 UMSA-CI-Asset-Recovery/1.0'}
        if not public:
            headers['Authorization'] = 'Bearer '+self.token
        if content_type:
            headers['Content-Type'] = content_type
        req = urllib.request.Request((PUBLIC if public else self.base)+path, data=data,
                                     headers=headers, method=method)
        try:
            with urllib.request.build_opener(NoRedirect).open(req, timeout=60) as response:
                return response.status, dict(response.headers), response.read()
        except urllib.error.HTTPError as error:
            return error.code, {}, b''
        except Exception:
            raise RuntimeError('Directus request failed; details suppressed') from None

    def json(self, path, method='GET', value=None):
        status, _, body = self.request(path, method, canonical(value) if value is not None else None,
                                      'application/json' if value is not None else None)
        if status != 200:
            raise RuntimeError('Directus JSON request returned HTTP '+str(status))
        return json.loads(body)['data']


def runtime():
    if (os.geteuid() != 0 or socket.gethostname() != 'srv2101069.hstgr.cloud'
            or ROOT.is_symlink() or (ROOT/'.target').read_text().strip() != '179.198.115.115'
            or not (ROOT/'production.active').is_file()):
        raise RuntimeError('Wrong active production target')
    state_bytes = (ROOT/'web-publication-state.json').read_bytes()
    state = json.loads(state_bytes)
    if not re.fullmatch(r'umsa-web-[a-f0-9]{40}-[0-9]+-[0-9]+\.service', state['unit']):
        raise RuntimeError('Unexpected active web release')
    pid = command(['systemctl', 'show', state['unit'], '-p', 'MainPID', '--value'])
    if not pid.isdigit() or int(pid) < 2:
        raise RuntimeError('Active web process unavailable')
    env = dict(x.split('=', 1) for x in Path('/proc/'+pid+'/environ').read_text().split('\0') if '=' in x)
    if env.get('DIRECTUS_INTERNAL_URL') != 'http://127.0.0.1:8055':
        raise RuntimeError('Unexpected internal Directus URL')
    containers = json.loads(command(['docker', 'inspect', *command(['docker', 'ps', '-q']).split()]))
    identity = sorted([c['Name'], c['Id'], c['State']['StartedAt']] for c in containers)
    directus = next(c for c in containers if c['Name'] == '/'+CMS)
    mounts = {m['Destination']: m['Source'] for m in directus['Mounts']}
    if mounts.get('/directus/uploads') != str(UPLOADS) or UPLOADS.is_symlink():
        raise RuntimeError('Unexpected Directus storage')
    if command(['docker', 'exec', CMS, 'node', '-p', 'require("/directus/package.json").version']) != VERSION:
        raise RuntimeError('Directus version changed; review the upload contract')
    configs = {str(p): digest(p.read_bytes()) for p in sorted(Path('/srv/umsa-public-vhosts').glob('*.conf'))}
    protected = {'web_state': digest(state_bytes), 'web_pid': pid, 'containers': identity, 'vhosts': configs}
    return protected, API(env['DIRECTUS_ADMIN_TOKEN'])


def references(api):
    rows = api.json('/items/Servicios?fields=id,Imagen&limit=-1&sort=id')
    if {int(r['id']): r['Imagen'] for r in rows} != {a['service']: a['id'] for a in ASSETS}:
        raise RuntimeError('Service references differ from the eight reviewed UUIDs')
    return rows


def png_dimensions(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        raise RuntimeError('Expected PNG bytes')
    return struct.unpack('>II', data[16:24])


def validate_bytes(asset, data):
    if len(data) != asset['bytes'] or digest(data) != asset['sha256']:
        raise RuntimeError('Candidate bytes changed: '+asset['id'])
    if png_dimensions(data) != (asset['width'], asset['height']):
        raise RuntimeError('Candidate dimensions differ')


def inspect():
    protected, api = runtime()
    permissions = api.json('/permissions/me').get('directus_files', {})
    if any(permissions.get(action, {}).get('access') != 'full' for action in ('read', 'update')):
        raise RuntimeError('Existing credential cannot recover files; permissions unchanged')
    if api.json('/flows?filter[status][_eq]=active&fields=id'):
        raise RuntimeError('Active flows need review before file update events')
    refs = references(api)
    rows = []
    for asset in ASSETS:
        row = api.json('/files/'+asset['id'])
        expected = {'id': asset['id'], 'storage': 'local', 'type': 'image/jpeg',
                    'filename_disk': asset['filenameDisk'], 'filename_download': asset['filenameDownload'],
                    'width': asset['width'], 'height': asset['height']}
        if any(row.get(k) != v for k, v in expected.items()) or int(row['filesize']) != asset['bytes']:
            raise RuntimeError('Original metadata changed: '+asset['id'])
        original = UPLOADS/asset['filenameDisk']
        if original.exists() or original.is_symlink():
            raise RuntimeError('Original binary is now present; inspect before replacing')
        replacement = UPLOADS/(asset['id']+'.png')
        if replacement.is_symlink():
            raise RuntimeError('Unexpected candidate symlink')
        if replacement.exists():
            validate_bytes(asset, replacement.read_bytes())
        if api.request('/assets/'+asset['id'])[0] not in (403, 404):
            raise RuntimeError('Original asset no longer has the reviewed missing-file response')
        rows.append(row)
    return {'protected': protected, 'references': refs, 'files': rows}, api


def multipart(asset, data):
    validate_bytes(asset, data)
    boundary = 'umsa-'+secrets.token_hex(16)
    name = Path(asset['filenameDownload']).stem+'.png'
    # Never send filename_disk in an upload. Directus derives it from UUID and MIME.
    body = b''
    for key, value in [('storage', 'local'), ('filename_download', name)]:
        body += ('--'+boundary+'\r\nContent-Disposition: form-data; name="'+key+'"\r\n\r\n'+value+'\r\n').encode()
    body += ('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="'+name+'"\r\nContent-Type: image/png\r\n\r\n').encode()
    body += data+('\r\n--'+boundary+'--\r\n').encode()
    return body, 'multipart/form-data; boundary='+boundary


def verify_asset(api, asset, original, public=True):
    row = api.json('/files/'+asset['id'])
    for key in PRESERVE_FIELDS:
        if row.get(key) != original.get(key):
            raise RuntimeError('Unrelated file metadata changed: '+key)
    if (row['type'] != 'image/png' or row['filename_disk'] != asset['id']+'.png'
            or row['filename_download'] != Path(asset['filenameDownload']).stem+'.png'
            or int(row['filesize']) != asset['bytes']
            or (row['width'], row['height']) != (asset['width'], asset['height'])):
        raise RuntimeError('Recovered metadata is inconsistent')
    checks = []
    for external in ([False, True] if public else [False]):
        for suffix, size in [('', (asset['width'], asset['height'])), ('?width=160&height=90&fit=cover&format=png', (160, 90))]:
            status, headers, data = api.request('/assets/'+asset['id']+suffix, public=external)
            if status != 200 or not headers.get('Content-Type', headers.get('content-type', '')).startswith('image/png'):
                raise RuntimeError('Recovered original/thumbnail is not served as PNG')
            if png_dimensions(data) != size:
                raise RuntimeError('Invalid original/thumbnail dimensions')
            if not suffix:
                validate_bytes(asset, data)
            checks.append({'public': external, 'thumbnail': bool(suffix), 'status': status})
    return {'id': asset['id'], 'service': asset['service'], 'checks': checks, 'sha256': asset['sha256']}


def restore_metadata(api, asset, original):
    # Restore pre-existing content metadata, retaining new audit timestamps/actors
    # and the recovered PNG. API replacement itself regenerates derivatives.
    # This known basename is allowed only for JSON rollback, never a multipart upload.
    if original['filename_disk'] != asset['id']+'.jpg' or original['storage'] != 'local':
        raise RuntimeError('Unexpected rollback destination')
    api.json('/files/'+asset['id'], 'PATCH', {k: original.get(k) for k in RESTORE_FIELDS})
    row = api.json('/files/'+asset['id'])
    if any(row.get(k) != original.get(k) for k in RESTORE_FIELDS):
        raise RuntimeError('Metadata rollback did not verify')


def recover(api, snapshot, payload, report, public=True):
    attempted, results = [], []
    try:
        for asset, original in zip(ASSETS, snapshot['files']):
            if api.json('/files/'+asset['id']) != original:
                raise RuntimeError('File changed since inspection')
            attempted.append((asset, original))
            body, content_type = multipart(asset, payload[asset['path']])
            status, _, _ = api.request('/files/'+asset['id'], 'PATCH', body, content_type)
            if status != 200:
                raise RuntimeError('File replacement returned HTTP '+str(status))
            results.append(verify_asset(api, asset, original, public=public))
            report({'state': 'recovering', 'verified': results})
        if references(api) != snapshot['references']:
            raise RuntimeError('Service references changed during recovery')
        return results
    except Exception:
        failures = []
        for asset, original in reversed(attempted):
            try:
                restore_metadata(api, asset, original)
            except Exception:
                failures.append(asset['id'])
        report({'state': 'failed', 'metadata_rollback_failures': failures,
                'restored_metadata_for': len(attempted)-len(failures),
                'note': 'Content metadata restored; audit timestamps remain. API replacement may regenerate derivatives; backups retained.'})
        raise RuntimeError('Recovery stopped; private report records rollback. Failures: '+str(len(failures))) from None


def payload_from_tar(data):
    payload = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        members = archive.getmembers()
        if len(members) != 8 or {m.name for m in members} != {a['path'] for a in ASSETS}:
            raise RuntimeError('Payload must contain only the eight reviewed PNGs')
        for asset in ASSETS:
            member = archive.getmember(asset['path'])
            if not member.isfile() or member.size != asset['bytes']:
                raise RuntimeError('Payload contains a link or unexpected file')
            blob = archive.extractfile(member).read()
            validate_bytes(asset, blob)
            payload[asset['path']] = blob
    return payload


def pack(output):
    repo = Path(__file__).resolve().parents[3]
    if output.exists():
        raise RuntimeError('Refusing to overwrite a payload')
    with tarfile.open(output, 'x:gz') as archive:
        for asset in ASSETS:
            source = repo/asset['path']
            validate_bytes(asset, source.read_bytes())
            archive.add(source, arcname=asset['path'], recursive=False)
    payload_from_tar(output.read_bytes())
    print(digest(output.read_bytes()))


def apply(run_id, expected, payload_sha):
    if not re.fullmatch(r'[0-9]+-[0-9]+', run_id) or not all(re.fullmatch(r'[a-f0-9]{64}', h) for h in (expected, payload_sha)):
        raise RuntimeError('Invalid CI run or reviewed fingerprints')
    os.umask(0o077)
    with Path('/run/umsa-web-publish.lock').open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        snapshot, api = inspect()
        if digest(canonical(snapshot)) != expected:
            raise RuntimeError('Production changed since reviewed inspection')
        source = Path('/tmp/umsa-directus-recovery-'+run_id+'.tar.gz')
        if source.is_symlink() or not source.is_file():
            raise RuntimeError('Expected regular CI payload')
        data = source.read_bytes()
        if digest(data) != payload_sha:
            raise RuntimeError('Transferred payload hash differs')
        payload = payload_from_tar(data)
        folder = ROOT/'directus-service-images'/run_id
        if folder.parent.is_symlink() or folder.exists():
            raise RuntimeError('Unexpected or reused recovery directory')
        folder.mkdir(parents=True, mode=0o700)
        backup = folder/'before.json'
        with backup.open('xb') as stream:
            stream.write(canonical(snapshot))
            stream.flush()
            os.fsync(stream.fileno())
        if json.loads(backup.read_bytes()) != snapshot:
            raise RuntimeError('Metadata backup verification failed')
        (folder/'candidate-images.tar.gz').write_bytes(data)
        def report(value):
            (folder/'result.json').write_bytes(canonical(value))
        results = recover(api, snapshot, payload, report)
        try:
            after, _ = runtime()
        except Exception:
            report({'state': 'images-recovered-runtime-unverified', 'verified': results})
            raise RuntimeError('Images recovered; final runtime inspection unavailable') from None
        if after != snapshot['protected']:
            report({'state': 'images-recovered-runtime-changed', 'verified': results})
            raise RuntimeError('Images recovered but protected runtime changed; review before closing')
        report({'state': 'complete', 'verified': results, 'runtime_unchanged': True,
                'references_unchanged': True, 'metadata_backup': str(backup)})
        print(json.dumps({'state': 'complete', 'images': len(results), 'checks': sum(len(r['checks']) for r in results),
                          'runtime_unchanged': True, 'references_unchanged': True, 'backup': str(backup)}))


if __name__ == '__main__':
    try:
        if sys.argv[1:] == ['inspect']:
            before, _ = inspect()
            print(json.dumps({'snapshot_sha256': digest(canonical(before)), 'missing_images': len(before['files']),
                              'references_verified': len(before['references']), 'version': VERSION}))
        elif len(sys.argv) == 3 and sys.argv[1] == 'pack':
            pack(Path(sys.argv[2]))
        elif len(sys.argv) == 5 and sys.argv[1] == 'apply':
            apply(*sys.argv[2:])
        else:
            raise RuntimeError('Usage: inspect | pack output.tar.gz | apply CI_RUN SNAPSHOT_SHA PAYLOAD_SHA')
    except Exception as error:
        print('ERROR: '+str(error), file=sys.stderr)
        sys.exit(1)
