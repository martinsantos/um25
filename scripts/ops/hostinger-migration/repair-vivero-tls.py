#!/usr/bin/env python3
"""Make Vivero ACME local on its existing VPS; retain every publication guard."""
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import socket
import ssl
import subprocess
import sys
import time

BASE = Path('/srv/vivero-migration')
RELEASE = BASE / 'release-ready-20261013'
TLS = BASE / 'tls-private-20261012'
NGINX = RELEASE / 'config/nginx-public.conf'
NETWORK = RELEASE / 'config/operations/network-after-go.py'
BINDINGS = RELEASE / 'config/runtime-code-bindings.json'
GO = TLS / 'renewal-go.json'
MANAGER = TLS / 'renewal/manage.py'
CHECK_GO = RELEASE / 'config/operations/check-go.py'
CF = RELEASE / 'config/operations/cloudflare-cidrs.json'
CHALLENGES = Path('/var/www/vivero-acme-3709080/.well-known/acme-challenge')
OLD = '23.105.176.45'
TASK = '01a0fd01-22a1-7331-a37a-e64223db56ea'
UNIT = 'vlc-production-web.service'
RENEW = 'vlc-vivero-tls-renew.service'
HOSTS = ('viveroloscocos.com.ar', 'www.viveroloscocos.com.ar', 'gestion.viveroloscocos.com.ar')
BASELINES = {
    NGINX: '0fdf820fc4ba2e11c9be780b8bded9482fa41c1cf132f95d8237f1f12ab6478c',
    NETWORK: 'e5e1df2e4da88942f398811273bb92eaff17c3c9406b1e3e765e53263087cbed',
    BINDINGS: '9889a42d759c4d7b4db8160258b065d8a40c8d4a2f2d0a78bb5f32e1ab3f994f',
    GO: '09d889c651cc9070d28df40c957b2b4615e5184ff1b0cd8230feba3c121c2c22',
    MANAGER: 'c7a2132fae976eae0534b6a870e0fd28f406af602b018ef43e74ffc97b0c9d74',
    CHECK_GO: '3a15231af2aae3916bb96329906bbab845303f2a6efa2f926c94bdb52395cd34',
    CF: 'da3380d7dda214520944f4a79c78bb6851fe4b79aa478243696e280ba625b2f5',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def local_nginx(text):
    """Remove exactly the reviewed trust directive and two named ACME fallbacks."""
    text, count = re.subn(r'(?m)^set_real_ip_from 23\.105\.176\.45;\n', '', text)
    if count != 1:
        raise RuntimeError('Unexpected former proxy trust')
    for name in ('old_gestion_acme', 'origin_gestion_acme'):
        pattern = r'location @' + name + r' \{[^{}]*\}'
        matches = re.findall(pattern, text)
        if len(matches) != 1 or ('proxy_pass https://' + OLD + ';') not in matches[0]:
            raise RuntimeError('Unexpected former ACME fallback')
        text = re.sub(pattern, '', text, count=1)
        text, count = re.subn(r'try_files \$uri @' + name + ';', 'try_files $uri =404;', text)
        if count != 1:
            raise RuntimeError('Unexpected ACME fallback caller')
    if OLD in text or '@old_gestion_acme' in text or '@origin_gestion_acme' in text:
        raise RuntimeError('Former origin remains in reviewed Nginx')
    return text


def local_network(text):
    old = "v4+['23.105.176.45']"
    if text.count(old) != 1:
        raise RuntimeError('Unexpected network trust bootstrap')
    result = text.replace(old, 'v4')
    if OLD in result:
        raise RuntimeError('Former origin remains in network helper')
    return result


def binding_text(text, changes):
    data = json.loads(text)
    if data.get('task_id') != TASK or data.get('service_id') != 3709080:
        raise RuntimeError('Unexpected runtime approval identity')
    rows = data['files']
    for path, (before, after) in changes.items():
        matches = [row for row in rows if row['path'] == str(path)]
        if len(matches) != 1 or matches[0]['sha256'] != before or text.count(before) != 1:
            raise RuntimeError('Unexpected approved runtime binding')
        text = text.replace(before, after, 1)
    return text


def renewal_text(text, nginx_sha, bindings_sha, proof, proof_sha):
    data = json.loads(text)
    if (data.get('task_id') != TASK or data.get('service_id') != 3709080
            or data.get('nginx_config') != str(NGINX) or data.get('nginx_unit') != UNIT
            or any(data.get(key) is not True for key in
                   ('human_dns_go', 'final_release_verified', 'public_acme_verified'))):
        raise RuntimeError('Existing human GO and verified release are required')
    updates = {'nginx_config_sha256': nginx_sha, 'runtime_bindings_sha256': bindings_sha,
               'public_acme_proof_path': str(proof), 'public_acme_proof_sha256': proof_sha}
    for key, value in updates.items():
        old = json.dumps(data[key])
        pattern = r'("' + key + r'"\s*:\s*)' + re.escape(old)
        text, count = re.subn(pattern, lambda match: match[1] + json.dumps(value), text)
        if count != 1:
            raise RuntimeError('Unexpected renewal binding field')
    return text


def rollback_bindings(text, changes):
    """Undo our two hashes while preserving a concurrent application's rows."""
    rows = json.loads(text)['files']
    inverse = {}
    for path, (before, after) in changes.items():
        matches = [row for row in rows if row['path'] == str(path)]
        if len(matches) != 1 or matches[0]['sha256'] not in (before, after):
            raise RuntimeError('Concurrent change to a reviewed TLS resource; preserve current bindings')
        if matches[0]['sha256'] == after:
            inverse[path] = (after, before)
    return binding_text(text, inverse)


def trust_elements(data):
    sets = [item['set'] for item in data['nftables'] if 'set' in item]
    if (len(sets) != 1 or sets[0].get('family') != 'inet'
            or sets[0].get('table') != 'vlc_release_3709080' or sets[0].get('name') != 'trusted4'):
        raise RuntimeError('Unexpected Vivero trust set')
    result = []
    for item in sets[0]['elem']:
        value = (str(item['prefix']['addr']) + '/' + str(item['prefix']['len'])
                 if isinstance(item, dict) and set(item) == {'prefix'} else item)
        if not isinstance(value, str):
            raise RuntimeError('Unexpected trust element encoding')
        result.append(str(ipaddress.ip_network(value, strict=True)))
    if len(set(result)) != len(result):
        raise RuntimeError('Duplicate trust elements')
    return set(result)


def atomic(path, content, metadata, expected=None):
    """Retain original UID/group/mode; private keys never enter command arguments."""
    uid, gid, mode = metadata
    pending = path.with_name(path.name + '.pending')
    created = False
    try:
        if expected is not None and path.read_bytes() != expected:
            raise RuntimeError('Concurrent publication changed: ' + str(path))
        with pending.open('xb') as stream:
            created = True
            os.fchmod(stream.fileno(), 0o600)
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.chown(pending, uid, gid)
        pending.chmod(mode)
        if expected is not None and path.read_bytes() != expected:
            raise RuntimeError('Concurrent publication changed: ' + str(path))
        os.replace(pending, path)
    finally:
        if created:
            pending.unlink(missing_ok=True)


def local_certificate(host):
    model = 'gestion' if host.startswith('gestion.') else 'web'
    pem = (TLS / model / 'fullchain.pem').read_text()
    leaf = pem.split('-----END CERTIFICATE-----', 1)[0] + '-----END CERTIFICATE-----\n'
    return digest(ssl.PEM_cert_to_DER_cert(leaf))


def main(identifier):
    if (os.geteuid() != 0 or socket.gethostname() != 'vps3709080.trouble-free.net'
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier) or BASE.is_symlink()):
        raise RuntimeError('Unexpected existing Vivero host or operation identity')
    os.umask(0o077)
    owner = json.loads((BASE / 'OWNER.json').read_text())
    if owner.get('task_id') != TASK or owner.get('service_id') != 3709080:
        raise RuntimeError('Unexpected Vivero ownership')
    for path, expected in BASELINES.items():
        if path.is_symlink() or not path.is_file() or digest(path.read_bytes()) != expected:
            raise RuntimeError('Reviewed Vivero baseline changed: ' + str(path))
    go = json.loads(GO.read_text())
    renewal_text(GO.read_text(), go['nginx_config_sha256'], go['runtime_bindings_sha256'],
                 Path(go['public_acme_proof_path']), go['public_acme_proof_sha256'])
    for field in ('human_authorization', 'public_acme_proof'):
        path = Path(go[field + '_path'])
        if (not path.is_relative_to(RELEASE / 'evidence') or path.is_symlink()
                or digest(path.read_bytes()) != go[field + '_sha256']):
            raise RuntimeError('Original Vivero approval/proof changed')
    cf = json.loads(CF.read_text())
    if len(cf['ipv4']) != 15 or len(cf['ipv6']) != 7:
        raise RuntimeError('Unexpected preserved Cloudflare inventory')
    trusted = {str(ipaddress.ip_network(item, strict=True)) for item in cf['ipv4']}
    old_trusted = trusted | {OLD + '/32'}
    changed_paths = [NGINX, NETWORK, BINDINGS, GO]
    certificates = [TLS / model / name for model in ('web', 'gestion')
                    for name in ('fullchain.pem', 'privkey.pem')]
    paths = [*changed_paths, *certificates]
    if any(path.is_symlink() or not path.is_file() for path in paths):
        raise RuntimeError('Unexpected mutable Vivero configuration type')
    previous = {path: path.read_bytes() for path in paths}
    metadata = {path: (path.stat().st_uid, path.stat().st_gid, path.stat().st_mode & 0o777)
                for path in paths}
    nginx = local_nginx(previous[NGINX].decode()).encode()
    network = local_network(previous[NETWORK].decode()).encode()
    binding_changes = {NGINX: (BASELINES[NGINX], digest(nginx)),
                       NETWORK: (BASELINES[NETWORK], digest(network))}
    bindings = binding_text(previous[BINDINGS].decode(), binding_changes).encode()
    root = BASE / 'tls-origin-retirement' / identifier
    root.mkdir(parents=True, mode=0o700, exist_ok=False)
    backups = {}
    for i, path in enumerate(paths):
        backup = root / ('before-' + str(i))
        backup.write_bytes(previous[path])
        backup.chmod(0o600)
        backups[str(path)] = {'file': backup.name, 'sha256': digest(previous[path]),
                             'uid_gid_mode': metadata[path]}
    (root / 'backups.json').write_text(json.dumps(backups, indent=2) + '\n')
    marker = CHALLENGES / ('umsa-vivero-' + identifier)
    marker_created = False
    removed_trust = False
    with (root / 'operation.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, timeout=300, **kwargs)
        def capture(args):
            return subprocess.check_output(args, stderr=log, timeout=30)
        def current_trust():
            return trust_elements(json.loads(capture(
                ['nft', '-j', '-nn', 'list', 'set', 'inet', 'vlc_release_3709080', 'trusted4'])))
        def change_trust(action):
            command = action + ' element inet vlc_release_3709080 trusted4 { ' + OLD + ' }\n'
            run(['nft', '--check', '-f', '-'], input=command.encode())
            run(['nft', '-f', '-'], input=command.encode())
        def verify_tls():
            result = {}
            for host in HOSTS:
                with socket.create_connection(('127.0.0.1', 443), timeout=8) as tcp:
                    with ssl.create_default_context().wrap_socket(tcp, server_hostname=host) as tls:
                        actual = digest(tls.getpeercert(binary_form=True))
                if actual != local_certificate(host):
                    raise RuntimeError('Vivero served a different local certificate: ' + host)
                result[host] = actual
            return result
        run(['python3', str(MANAGER), 'check'])
        run(['python3', str(CHECK_GO), 'web'])
        if current_trust() != old_trusted:
            raise RuntimeError('Reviewed former-origin trust set changed')
        (root / 'trusted4.before.json').write_bytes(capture(
            ['nft', '-j', '-nn', 'list', 'set', 'inet', 'vlc_release_3709080', 'trusted4']))
        candidate = root / 'nginx.reviewed.conf'
        candidate.write_bytes(nginx)
        run(['nginx', '-t', '-c', str(candidate)])
        if (CHALLENGES.is_symlink() or not CHALLENGES.is_dir()
                or CHALLENGES.parent.is_symlink() or CHALLENGES.parent.parent.is_symlink()):
            raise RuntimeError('Unexpected local ACME webroot')
        for path in paths:
            if path.read_bytes() != previous[path]:
                raise RuntimeError('Concurrent publication before apply; no live file was changed')
        installed = {}
        try:
            for path, content in ((NGINX, nginx), (NETWORK, network), (BINDINGS, bindings)):
                atomic(path, content, metadata[path], expected=previous[path])
                installed[path] = content
            run(['nginx', '-t', '-c', str(NGINX)])
            run(['python3', str(CHECK_GO), 'web'])
            run(['python3', str(CHECK_GO), 'network'])
            run(['systemctl', 'reload', UNIT])
            # Delete only this retired address; every other set/rule stays intact.
            removed_trust = True
            change_trust('delete')
            if current_trust() != trusted:
                raise RuntimeError('Cloudflare trust changed unexpectedly')
            payload = ('Vivero-local-ACME-' + identifier + '-' + secrets.token_hex(16)).encode()
            with marker.open('xb') as stream:
                marker_created = True
                stream.write(payload)
            marker.chmod(0o644)
            route = '/.well-known/acme-challenge/' + marker.name
            for host in HOSTS:
                for attempt in range(3):
                    response = subprocess.run(['curl', '--noproxy', '*', '-fsS', '--max-time', '12',
                                               'http://' + host + route], capture_output=True, timeout=15)
                    if response.returncode == 0 and response.stdout == payload:
                        break
                    time.sleep(1)
                else:
                    raise RuntimeError('Public local ACME proof failed: ' + host)
                missing = capture(['curl', '--noproxy', '*', '-sS', '--max-time', '5', '--resolve',
                    host + ':80:127.0.0.1', '-o', '/dev/null', '-w', '%{http_code}',
                    'http://' + host + route + '-absent'])
                if missing != b'404':
                    raise RuntimeError('Missing ACME challenge must stay local: ' + host)
            before_tls = verify_tls()
            proof = root / 'public-acme-proof.json'
            proof.write_text(json.dumps({'run': identifier, 'hosts': list(HOSTS), 'local_http_acme': True,
                'absent_challenge_status': 404, 'nginx_sha256': digest(nginx)}, indent=2) + '\n')
            renewal = renewal_text(previous[GO].decode(), digest(nginx), digest(bindings),
                                   proof, digest(proof.read_bytes())).encode()
            if BINDINGS.read_bytes() != bindings:
                raise RuntimeError('Concurrent application publication; retain its rows during rollback')
            atomic(GO, renewal, metadata[GO], expected=previous[GO])
            installed[GO] = renewal
            # The existing manager still enforces its recorded GO and exact hashes.
            run(['python3', '-c', "import runpy; runpy.run_path('" + str(MANAGER)
                 + "',run_name='vivero_binding_check')['go_bindings']()"])
            run(['systemctl', 'start', RENEW])
            if capture(['systemctl', 'show', RENEW, '-p', 'Result', '--value']).strip() != b'success':
                raise RuntimeError('Ordinary guarded Vivero renewal did not succeed')
            run(['python3', str(MANAGER), 'check'])
            after_tls = verify_tls()
            run(['systemctl', 'is-active', '--quiet', UNIT])
            run(['systemctl', 'is-active', '--quiet', 'vlc-vivero-tls-renew.timer'])
            run(['systemctl', 'is-enabled', '--quiet', 'vlc-vivero-tls-renew.timer'])
            state = {'run': identifier, 'host': '68.168.218.28', 'local_acme_verified': list(HOSTS),
                'former_origin_removed_from_nginx_and_trusted4': True,
                'renewal_manager_unchanged': digest(MANAGER.read_bytes()) == BASELINES[MANAGER],
                'ordinary_guarded_renewal': 'success', 'forced_issuance': False,
                'tls_fingerprints_before': before_tls, 'tls_fingerprints_after': after_tls,
                'nginx_sha256': digest(nginx), 'runtime_bindings_sha256': digest(bindings),
                'applications_databases_and_smtp_changed': False}
            (root / 'operation.complete.json').write_text(json.dumps(state, indent=2) + '\n')
        except Exception:
            for path in (NGINX, NETWORK, GO):
                if path.read_bytes() not in (previous[path], installed.get(path, previous[path])):
                    raise RuntimeError('Concurrent change to TLS configuration; preserve current files for review')
            for path in (NGINX, NETWORK, GO):
                current = path.read_bytes()
                atomic(path, previous[path], metadata[path], expected=current)
            current = BINDINGS.read_bytes()
            restored = rollback_bindings(current.decode(), binding_changes).encode()
            atomic(BINDINGS, restored, metadata[BINDINGS], expected=current)
            for path in certificates:
                atomic(path, previous[path], metadata[path])
            if removed_trust:
                actual = current_trust()
                if actual == trusted:
                    change_trust('add')
                elif actual != old_trusted:
                    raise RuntimeError('Concurrent trust changes require review; files restored')
            run(['nginx', '-t', '-c', str(NGINX)])
            run(['systemctl', 'reload', UNIT])
            raise
        finally:
            if marker_created:
                marker.unlink()
    print('Vivero HTTPS renewal and ACME are local on 68; retired origin trust removed. Apps, DB and SMTP preserved.')


if __name__ == '__main__':
    main(sys.argv[1])
