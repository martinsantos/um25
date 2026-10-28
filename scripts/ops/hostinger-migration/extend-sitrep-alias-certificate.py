#!/usr/bin/env python3
"""Extend only the existing managed SITREP certificate; never edit ingress or apps."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import socket
import ssl
import stat
import subprocess
import sys
import time
from urllib.parse import quote

HOST = 'sitrep.ultimamilla.com.ar'
ALIAS = 'www.' + HOST
TARGET = '179.198.115.115'
STAGE = Path('/srv/umsa-migration')
ACME = Path('/etc/letsencrypt-hostinger')
LIVE = ACME / 'live' / HOST
ARCHIVE = ACME / 'archive' / HOST
RENEWAL = ACME / 'renewal' / (HOST + '.conf')
WEBROOT = Path('/var/www/umsa-acme')
FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
HOOK = Path('/usr/local/sbin/umsa-certificate-reload')
SERVICE = Path('/etc/systemd/system/umsa-certificate-renew.service')
TIMER = Path('/etc/systemd/system/umsa-certificate-renew.timer')
LOCK = Path('/run/umsa-web-publish.lock')
OWNER = (0, 0)
NAMES = ('cert.pem', 'chain.pem', 'fullchain.pem', 'privkey.pem')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def run(args):
    return subprocess.run(args, check=True, capture_output=True, timeout=180)


def regular(path):
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise RuntimeError('Unexpected symlink outside the managed live certificate links')
    info = path.lstat()
    if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or
            (info.st_uid, info.st_gid) != OWNER):
        raise RuntimeError('Unexpected configuration ownership or file type')
    return {'path': str(path), 'data': path.read_bytes(), 'mode': stat.S_IMODE(info.st_mode),
            'uid': info.st_uid, 'gid': info.st_gid}


def inventory(records):
    return {name: {key: value for key, value in item.items() if key != 'data'} |
            {'sha256': digest(item['data'])} for name, item in records.items()}


def fingerprint(value):
    return digest(json.dumps(value, sort_keys=True, separators=(',', ':')).encode())



def archive_key(path):
    links = {}
    if path.is_symlink():
        info = path.lstat()
        target = os.readlink(path)
        if ((info.st_uid, info.st_gid) != OWNER or
                not re.fullmatch(r'privkey[1-9][0-9]*\.pem', target) or target == path.name):
            raise RuntimeError('Reused archive key link escapes its original lineage')
        links[str(path)] = {'target': target, 'uid': info.st_uid, 'gid': info.st_gid}
        path = ARCHIVE / target
        if path.is_symlink():
            raise RuntimeError('Unexpected nested reused archive key link')
    record = regular(path)
    if record['mode'] != 0o600:
        raise RuntimeError('Existing or candidate private key must remain root-only mode0600')
    return record, links


def lineage():
    links, files, key_links = {}, {}, {}
    for name in NAMES:
        path = LIVE / name
        info = path.lstat()
        if not stat.S_ISLNK(info.st_mode) or (info.st_uid, info.st_gid) != OWNER:
            raise RuntimeError('Managed certificate live entry is not its owned symlink')
        target = os.readlink(path)
        stem = name.removesuffix('.pem')
        if not re.fullmatch(r'\.\./\.\./archive/' + re.escape(HOST) + '/' + stem + r'[1-9][0-9]*\.pem', target):
            raise RuntimeError('Managed certificate link escapes its existing lineage')
        links[name] = target
        if name == 'privkey.pem':
            files[name], key_links = archive_key(ARCHIVE / Path(target).name)
        else:
            files[name] = regular(ARCHIVE / Path(target).name)
    files['renewal'] = regular(RENEWAL)
    return {'links': links, 'files': files, 'archive_key_links': key_links}


def lineage_view(value):
    return {'links': value['links'], 'archive_key_links': value['archive_key_links'], 'files': inventory(value['files'])}


def domains(path):
    output = run(['openssl', 'x509', '-in', str(path), '-noout', '-ext', 'subjectAltName']).stdout.decode()
    return set(re.findall(r'DNS:([A-Za-z0-9.-]+)', output))


def context():
    if (os.geteuid() != 0 or socket.gethostname() != 'srv2101069.hstgr.cloud'
            or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != TARGET
            or not (STAGE / 'production.active').is_file()):
        raise RuntimeError('Wrong reviewed production target')
    state_path = STAGE / 'web-publication-state.json'
    state = json.loads(regular(state_path)['data'])
    config = Path(state['config'])
    if (config.parent.parent != Path('/srv/umsa-web-releases') or config.name != 'nginx'
            or not re.fullmatch(r'[a-f0-9]{40}-[0-9]+-[0-9]+', config.parent.name)):
        raise RuntimeError('Unexpected current private publisher source')
    paths = {'front': FRONT, 'private_front': Path('/srv/umsa-clean-proxy/nginx/nginx.conf'),
             'state': state_path, 'private_sitrep': config / 'conf.d/sitrep.conf',
             'hook': HOOK, 'renew_service': SERVICE, 'renew_timer': TIMER,
             'machine': Path('/etc/machine-id'), 'target': STAGE / '.target'}
    records = {key: regular(path) for key, path in paths.items()}
    front = records['front']['data'].decode()
    if (front.count('server_name ' + HOST + ' ' + ALIAS + ';') != 1
            or front.count('server_name ' + ALIAS + ';') != 1
            or front.count('return 301 https://' + HOST + '$request_uri;') != 2
            or front.count(str(LIVE / 'fullchain.pem')) < 3
            or front.count(str(LIVE / 'privkey.pem')) < 3
            or front.count('root ' + str(WEBROOT) + ';') < 3):
        raise RuntimeError('Existing alias/challenge/managed TLS contract changed')
    if records['private_front']['data'].decode() != 'include ' + str(config / 'nginx.conf') + ';\n':
        raise RuntimeError('Private ingress differs from current publisher state')
    service = records['renew_service']['data'].decode()
    hook = records['hook']['data'].decode()
    if ('certbot renew --quiet --config-dir ' + str(ACME) not in service
            or '--deploy-hook ' + str(HOOK) not in service
            or 'systemctl reload umsa-clean-front umsa-sitrep-ingress' not in hook
            or 'restart' in hook):
        raise RuntimeError('Existing managed renewal/reload chain changed')
    run(['systemctl', 'is-active', '--quiet', 'umsa-certificate-renew.timer'])
    return records


def snapshot():
    records = context()
    cert = lineage()
    renewal = cert['files']['renewal']['data'].decode()
    if (not re.search(r'(?m)^authenticator\s*=\s*webroot\s*$', renewal)
            or str(WEBROOT) not in renewal
            or 'key_type = rsa' not in renewal or 'rsa_key_size = 3072' not in renewal):
        raise RuntimeError('Preserve the existing managed RSA3072 webroot lineage')
    sans = domains(LIVE / 'cert.pem')
    if sans not in ({HOST}, {HOST, ALIAS}):
        raise RuntimeError('Preserve unexpected existing certificate names')
    view = {'context': inventory(records), 'lineage': lineage_view(cert)}
    return {'records': records, 'lineage': cert, 'sans': sans, 'view': view,
            'sha256': fingerprint(view)}


def same_context(before):
    if inventory(context()) != inventory(before['records']):
        raise RuntimeError('Concurrent ingress/publisher/renewal configuration change')


def curl(url, resolve=True, follow=False, host_header=None, timeout=20):
    args = ['curl', '--noproxy', '*', '--globoff', '--path-as-is', '-fsS', '--max-time', str(timeout)]
    if resolve:
        args += ['--resolve', ALIAS + ':80:' + TARGET, '--resolve', ALIAS + ':443:' + TARGET,
                 '--resolve', HOST + ':443:' + TARGET]
    if follow:
        args += ['--location', '--max-redirs', '3']
    if host_header:
        args += ['-H', 'Host: ' + host_header]
    return run(args + ['--write-out', '\n__META__%{http_code}\n%{redirect_url}', url]).stdout


def split_response(response):
    body, meta = response.rsplit(b'\n__META__', 1)
    code, location = meta.decode().split('\n', 1)
    return body, code, location


def challenge_probe(public=False):
    parent = WEBROOT / '.well-known/acme-challenge'
    if any(p.is_symlink() for p in (parent, *parent.parents)) or not parent.is_dir():
        raise RuntimeError('Unsafe or missing existing challenge webroot')
    token = 'umsa-sitrep-alias-' + secrets.token_hex(16)
    path = parent / token
    try:
        with path.open('xb') as output:
            output.write(token.encode())
        path.chmod(0o644)
        url = 'http://' + ALIAS + '/.well-known/acme-challenge/' + quote(token)
        body, status, unused = split_response(curl(url, resolve=not public, follow=True))
        if status != '200' or body != token.encode():
            raise RuntimeError('Alias HTTP challenge did not reach the existing local webroot')
    finally:
        if path.is_file() and not path.is_symlink() and path.read_bytes() == token.encode():
            path.unlink()


def redirect_probe(secure_alias=False, timeout=20):
    suffix = '/app/a%20b?x=%2F&filter[a]=b%2Fc'
    body, status, destination = split_response(curl('https://' + (ALIAS if secure_alias else HOST) + suffix,
                                                   host_header=None if secure_alias else ALIAS, timeout=timeout))
    if status != '301' or destination != 'https://' + HOST + suffix:
        raise RuntimeError('Existing alias redirect did not preserve escaped path and query')



def wait_alias_ready(evidence=None):
    # HUP may briefly alternate old/new workers: require a stable sequence.
    deadline = time.monotonic() + 10
    last_failure = None
    consecutive = 0
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError('Timed out waiting for three consecutive alias TLS probes') from last_failure
        entry = {'success': False, 'consecutive': 0}
        try:
            redirect_probe(True, timeout=min(1, remaining))
            consecutive += 1
            entry = {'success': True, 'consecutive': consecutive}
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, RuntimeError) as failure:
            last_failure = failure
            consecutive = 0
            detail = getattr(failure, 'stderr', b'') or b''
            if isinstance(detail, bytes):
                detail = detail.decode(errors='replace')
            entry.update(curl_exit=getattr(failure, 'returncode', None), stderr=detail[:2048])
        if evidence is not None:
            evidence.append(entry)
        if consecutive == 3:
            return
        time.sleep(min(0.25, max(0, deadline - time.monotonic())))


def verify_certificate(original_key_sha):
    if domains(LIVE / 'cert.pem') != {HOST, ALIAS}:
        raise RuntimeError('Expanded certificate SAN must contain exactly canonical and alias names')
    if digest((LIVE / 'privkey.pem').read_bytes()) != original_key_sha:
        raise RuntimeError('Existing SITREP private key changed')
    for host in (HOST, ALIAS):
        run(['openssl', 'x509', '-in', str(LIVE / 'cert.pem'), '-noout', '-checkhost', host])
    run(['openssl', 'x509', '-in', str(LIVE / 'cert.pem'), '-noout', '-checkend', '604800'])
    ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER).load_cert_chain(str(LIVE / 'fullchain.pem'), str(LIVE / 'privkey.pem'))



def renewal_values(data):
    values, section = {}, ''
    for line in data.decode().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('['):
            section = line
        elif '=' in line:
            key, value = line.split('=', 1)
            values[(section, key.strip())] = value.strip()
    return values


def verify_renewal(before, after):
    previous = renewal_values(before)
    current = renewal_values(after)
    alias_key = ('[[webroot_map]]', ALIAS)
    reuse_key = ('[renewalparams]', 'reuse_key')
    if current.get(alias_key) != str(WEBROOT) or current.get(reuse_key) != 'True':
        raise RuntimeError('Alias webroot or deliberate existing-key reuse was not persisted for renewal')
    for key in previous.keys() | current.keys():
        if key not in (alias_key, reuse_key) and previous.get(key) != current.get(key):
            raise RuntimeError('Unexpected unrelated certificate renewal setting changed: ' + key[0] + ' ' + key[1])


def other_lineages():
    # Hash only, and never write to another certificate lineage.
    result = {}
    for path in sorted((ACME / 'renewal').glob('*.conf')):
        if path == RENEWAL:
            continue
        result[str(path)] = inventory({'renewal': regular(path)})
        directory = ACME / 'live' / path.stem
        for name in NAMES:
            link = directory / name
            result[str(link)] = {'link': os.readlink(link),
                                 'target_sha256': digest(link.read_bytes())}
    return result


def atomic_file(record, data):
    path = Path(record['path'])
    pending = path.with_name('.sitrep-alias-' + secrets.token_hex(12))
    try:
        with pending.open('xb') as output:
            output.write(data)
            os.fchown(output.fileno(), record['uid'], record['gid'])
            os.fchmod(output.fileno(), record['mode'])
            output.flush()
            os.fsync(output.fileno())
        os.replace(pending, path)
    finally:
        if pending.exists():
            pending.unlink()


def backup(before, folder):
    if any(p.is_symlink() for p in (folder, *folder.parents)):
        raise RuntimeError('Unsafe private backup path')
    folder.parent.mkdir(mode=0o700, exist_ok=True)
    parent_info = folder.parent.stat()
    if stat.S_IMODE(parent_info.st_mode) != 0o700 or (parent_info.st_uid, parent_info.st_gid) != OWNER:
        raise RuntimeError('Unexpected private certificate backup parent')
    folder.mkdir(mode=0o700, exist_ok=False)
    for name, record in before['lineage']['files'].items():
        path = folder / (name + '.before')
        with path.open('xb') as output:
            output.write(record['data'])
        path.chmod(0o600)
        if path.read_bytes() != record['data']:
            raise RuntimeError('Private certificate backup failed verification')
    (folder / 'before.json').write_text(json.dumps(before['view'], sort_keys=True, indent=2) + '\n')


def restore(before, expected, reload=True):
    if lineage_view(lineage()) != lineage_view(expected):
        raise RuntimeError('Rollback refused to overwrite a concurrent lineage change')
    for name, record in before['lineage']['files'].items():
        if name != 'renewal' and regular(Path(record['path'])) != record:
            raise RuntimeError('Original archive replica changed; preserve private backup for review')
    for path, entry in before['lineage']['archive_key_links'].items():
        record, links = archive_key(Path(path))
        if links != {path: entry} or record != before['lineage']['files']['privkey.pem']:
            raise RuntimeError('Original reused archive key link changed; preserve private backup')
    for name, target in before['lineage']['links'].items():
        pending = LIVE / ('.sitrep-alias-' + secrets.token_hex(12))
        try:
            pending.symlink_to(target)
            os.replace(pending, LIVE / name)
        finally:
            if pending.is_symlink():
                pending.unlink()
    atomic_file(before['lineage']['files']['renewal'], before['lineage']['files']['renewal']['data'])
    if lineage_view(lineage()) != lineage_view(before['lineage']):
        raise RuntimeError('Original certificate lineage restoration failed')
    # Reuse the normal managed hook. Never restart an application or remove archive generations.
    if reload:
        run([str(HOOK)])


def capture_candidate(before, candidate, folder):
    # Preserve the vendor-written renewal file before any guard can roll it back.
    backup({'lineage': candidate, 'view': {'context': inventory(before['records']),
            'lineage': lineage_view(candidate)}}, folder / 'post-issuance')


def extend(before, folder, candidate=None):
    same_context(before)
    if lineage_view(lineage()) != lineage_view(before['lineage']):
        raise RuntimeError('Certificate compare-and-swap guard failed before issuance')
    key_sha = digest(before['lineage']['files']['privkey.pem']['data'])
    installed = None
    others = other_lineages()
    try:
        if candidate is not None:
            restore({'lineage': candidate}, before['lineage'], reload=False)
        elif before['sans'] != {HOST, ALIAS}:
            run(['certbot', 'certonly', '--non-interactive', '--webroot', '-w', str(WEBROOT),
                 '--config-dir', str(ACME), '--work-dir', '/var/lib/letsencrypt-hostinger',
                 '--logs-dir', '/var/log/letsencrypt-hostinger', '--cert-name', HOST,
                 '--expand', '--reuse-key', '--key-type', 'rsa', '--rsa-key-size', '3072',
                 '--webroot-map', json.dumps({HOST: str(WEBROOT), ALIAS: str(WEBROOT)}, sort_keys=True),
                 '-d', HOST, '-d', ALIAS])
        installed = lineage()
        capture_candidate(before, installed, folder)
        verify_certificate(key_sha)
        if before['sans'] != {HOST, ALIAS}:
            verify_renewal(before['lineage']['files']['renewal']['data'], installed['files']['renewal']['data'])
        same_context(before)
        run([str(HOOK)])
        probes = []
        try:
            wait_alias_ready(probes)
        finally:
            evidence = folder / 'tls-readiness.json'
            with evidence.open('x') as output:
                os.fchmod(output.fileno(), 0o600)
                json.dump(probes, output, sort_keys=True)
                output.write('\n')
        for path in ('/', '/app/', '/precrimen/', '/api/health'):
            if split_response(curl('https://' + HOST + path))[1] != '200':
                raise RuntimeError('Existing canonical SITREP route failed after certificate reload')
        same_context(before)
        if other_lineages() != others:
            raise RuntimeError('Another certificate lineage changed; preserve it and roll back only SITREP')
        if lineage_view(lineage()) != lineage_view(installed):
            raise RuntimeError('Certificate changed during postchecks')
        return installed
    except BaseException:
        if installed is not None:
            restore(before, installed)
        else:
            current = lineage()
            if lineage_view(current) != lineage_view(before['lineage']):
                # A failed certbot must not roll back another renewal. Only claim the
                # new canonical+alias certificate this operation requested.
                if domains(LIVE / 'cert.pem') == {HOST, ALIAS}:
                    restore(before, current)
                else:
                    raise RuntimeError('Unexpected partial/foreign issuance; preserve private backup without overwriting it')
        raise


# This one-off recovery accepts only the vendor-written candidate already reviewed.
REVIEWED_CANDIDATE_RUN = '40725738512-1'
REVIEWED_CANDIDATE_MANIFEST_SHA = '713095d863fbd77b0dbc0dbab50e3d61d07060d1b6a85ce298d09f086ec0321a'
REVIEWED_CANDIDATE_RENEWAL_SHA = '91e4d694ec49d5f4cb9860f1ba37ff50ccfb992216a4fa9b1aaa76083a3a486e'
REVIEWED_CANDIDATE_BASELINE_SHA = '357b12626468c29b2722eaf93b2b52f29431558e65c0c918058fdc71b19b736d'
REVIEWED_CANDIDATE_GENERATION = 3


def load_reviewed_candidate(before):
    """Read and validate the saved vendor candidate; perform no writes or issuance."""
    if (before['sha256'] != REVIEWED_CANDIDATE_BASELINE_SHA or
            before['sans'] != {HOST}):
        raise RuntimeError('Recovery requires the exact reviewed original SITREP state')
    same_context(before)
    if lineage_view(lineage()) != lineage_view(before['lineage']):
        raise RuntimeError('Current certificate changed before candidate recovery')
    folder = STAGE / 'sitrep-alias-certificates' / REVIEWED_CANDIDATE_RUN / 'post-issuance'
    if any(p.is_symlink() for p in (folder, *folder.parents)):
        raise RuntimeError('Candidate recovery directory is symlinked')
    for directory in (folder.parent.parent, folder.parent, folder):
        info = directory.lstat()
        if (not stat.S_ISDIR(info.st_mode) or
                (info.st_uid, info.st_gid) != OWNER or
                stat.S_IMODE(info.st_mode) != 0o700):
            raise RuntimeError('Candidate recovery directory must remain private and owned')
    manifest_record = regular(folder / 'before.json')
    if (manifest_record['mode'] != 0o600 or
            digest(manifest_record['data']) != REVIEWED_CANDIDATE_MANIFEST_SHA):
        raise RuntimeError('Saved candidate manifest differs from the reviewed fingerprint')
    manifest = json.loads(manifest_record['data'])
    if (set(manifest) != {'context', 'lineage'} or
            manifest['context'] != inventory(before['records'])):
        raise RuntimeError('Saved candidate belongs to a different production context')
    view = manifest['lineage']
    if (set(view) != {'links', 'files', 'archive_key_links'} or
            set(view['links']) != set(NAMES) or
            set(view['files']) != {*NAMES, 'renewal'}):
        raise RuntimeError('Saved candidate inventory is incomplete or unexpected')
    generation = str(REVIEWED_CANDIDATE_GENERATION)
    files, key_links = {}, {}
    for name in NAMES:
        stem = name.removesuffix('.pem')
        archive_path = ARCHIVE / (stem + generation + '.pem')
        if view['links'][name] != '../../archive/' + HOST + '/' + archive_path.name:
            raise RuntimeError('Recovery is limited to the reviewed archive generation')
        saved = regular(folder / (name + '.before'))
        if saved['mode'] != 0o600:
            raise RuntimeError('Saved candidate certificate/key must remain private')
        if name == 'privkey.pem':
            record, key_links = archive_key(archive_path)
        else:
            record = regular(archive_path)
        if (saved['data'] != record['data'] or
                inventory({name: record})[name] != view['files'][name]):
            raise RuntimeError('Reviewed candidate archive or private backup changed: ' + name)
        files[name] = record
    if key_links != view['archive_key_links']:
        raise RuntimeError('Reviewed candidate key link changed')
    if (digest(files['privkey.pem']['data']) !=
            digest(before['lineage']['files']['privkey.pem']['data'])):
        raise RuntimeError('Recovery cannot replace the existing SITREP key')
    renewal = regular(folder / 'renewal.before')
    current_renewal = before['lineage']['files']['renewal']
    expected_renewal = view['files']['renewal']
    if (renewal['mode'] != 0o600 or
            digest(renewal['data']) != REVIEWED_CANDIDATE_RENEWAL_SHA or
            expected_renewal['path'] != str(RENEWAL) or
            (expected_renewal['uid'], expected_renewal['gid']) != OWNER or
            expected_renewal['mode'] != current_renewal['mode']):
        raise RuntimeError('Saved candidate renewal or its permissions differ')
    files['renewal'] = {**current_renewal, 'data': renewal['data']}
    if inventory({'renewal': files['renewal']})['renewal'] != expected_renewal:
        raise RuntimeError('Saved renewal metadata differs from the reviewed manifest')
    verify_renewal(current_renewal['data'], renewal['data'])
    cert = ARCHIVE / ('cert' + generation + '.pem')
    chain = ARCHIVE / ('chain' + generation + '.pem')
    fullchain = ARCHIVE / ('fullchain' + generation + '.pem')
    key = ARCHIVE / ('privkey' + generation + '.pem')
    if domains(cert) != {HOST, ALIAS}:
        raise RuntimeError('Reviewed candidate SAN does not contain exactly both SITREP names')
    run(['openssl', 'x509', '-in', str(cert), '-noout', '-checkend', '604800'])
    for hostname in (HOST, ALIAS):
        run(['openssl', 'verify', '-purpose', 'sslserver', '-verify_hostname', hostname,
             '-untrusted', str(chain), str(cert)])
    ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER).load_cert_chain(str(fullchain), str(key))
    candidate = {'links': view['links'], 'files': files, 'archive_key_links': key_links}
    if lineage_view(candidate) != view:
        raise RuntimeError('Reviewed candidate reconstruction differs from its sealed manifest')
    # Recheck all source files after the crypto checks; no mutable source was accepted.
    same_context(before)
    if lineage_view(lineage()) != lineage_view(before['lineage']):
        raise RuntimeError('Current certificate changed while validating the candidate')
    if regular(folder / 'before.json') != manifest_record:
        raise RuntimeError('Saved candidate manifest changed while being validated')
    return candidate


def main(phase, identifier=None, expected=None):
    if phase == 'inspect' and identifier is None and expected is None:
        before = snapshot()
        print(json.dumps({'snapshot_sha256': before['sha256'], 'sans': sorted(before['sans']),
                          'files': before['view'], 'read_only': True}, sort_keys=True))
        return
    if (phase not in ('prepare', 'extend', 'recover') or not re.fullmatch('[0-9]+-[0-9]+', identifier or '')
            or not re.fullmatch('[a-f0-9]{64}', expected or '')):
        raise RuntimeError('Unexpected reviewed phase, CI run or snapshot hash')
    os.umask(0o077)
    with LOCK.open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        before = snapshot()
        if before['sha256'] != expected:
            raise RuntimeError('Reviewed identity/configuration/certificate snapshot changed')
        candidate = load_reviewed_candidate(before) if phase == 'recover' else None
        folder = STAGE / 'sitrep-alias-certificates' / identifier
        backup(before, folder)
        challenge_probe(public=phase != 'prepare')
        redirect_probe()
        same_context(before)
        installed = extend(before, folder, candidate) if phase != 'prepare' else before['lineage']
        receipt = {'phase': phase, 'before_snapshot_sha256': expected,
                   'lineage': lineage_view(installed), 'ingress_unchanged': True,
                   'key_preserved': True, 'services_restarted': False}
        (folder / 'complete.json').write_text(json.dumps(receipt, sort_keys=True, indent=2) + '\n')
        print(json.dumps(receipt, sort_keys=True))


if __name__ == '__main__':
    main(*sys.argv[1:])
