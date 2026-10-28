#!/usr/bin/env python3
"""Recreate only ARCA with outbound networking; retain the old container for rollback."""
import copy
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import socket
import sys
import time
import urllib.request

STAGE = Path('/srv/umsa-migration')
IMAGE = 'sha256:eb295cc444df65f488a5abd859b9b57617833e6b72ae08d1105f2e1732582730'
ORIGINAL = '7595d9966e3a46d55b28d23bed09827ea394b50e063733a35e42904f542926e4'
INTERNAL = 'umsa-clean-shared'
ADDRESS = '172.20.0.3'
EGRESS = 'umsa-arca-egress'
CERTS = '/srv/umsa-clean-containers/arca-certs'
OUTPUT = '/srv/umsa-clean-containers/arca-output'
COMMAND = ['streamlit', 'run', 'src/web/streamlit_app.py', '--server.baseUrlPath', '/plantilla-arca']
HEALTH = 'http://127.0.0.1:8501/plantilla-arca/_stcore/health'
HOMOLOGATION_HOSTS = ['wsaahomo.afip.gov.ar', 'wswhomo.afip.gov.ar']
PRODUCTION_HOSTS = ['wsaa.afip.gov.ar', 'ws.afip.gov.ar']
BACKUP = ('20261028T094123Z-ae3eaadb', 51645153,
          '6325ae56621bdc9098eca6ec850d36f15d5876468e9e868b364dad01f69d0622')


class UnixConnection(http.client.HTTPConnection):
    def __init__(self, path):
        super().__init__('localhost', timeout=45)
        self.path = path

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.path)


class Docker:
    def __init__(self, path='/var/run/docker.sock'):
        self.path = path

    def call(self, method, path, data=None, missing=False):
        connection = UnixConnection(self.path)
        try:
            payload = None if data is None else json.dumps(data).encode()
            connection.request(method, '/v1.52' + path, body=payload,
                               headers={'Content-Type': 'application/json'})
            response = connection.getresponse()
            raw = response.read()
            if response.status == 404 and missing:
                return None
            if response.status not in (200, 201, 204):
                # Daemon error messages may contain configuration values.
                raise RuntimeError('Docker operation failed: ' + method + ' ' + path.split('?')[0]
                                   + ' HTTP ' + str(response.status))
            return json.loads(raw) if raw else None
        finally:
            connection.close()

    def inspect(self, container, missing=False):
        return self.call('GET', '/containers/' + container + '/json', missing=missing)


def contract(image=IMAGE, original=ORIGINAL, internal=INTERNAL, address=ADDRESS,
             egress=EGRESS, certs=CERTS, output=OUTPUT, command=None):
    return dict(image=image, original=original, internal=internal, address=address,
                egress=egress, certs=certs, output=output,
                command=COMMAND if command is None else command, user='arca')


def validate_original(info, network, expected):
    cfg, host = info['Config'], info['HostConfig']
    if (info['Id'] != expected['original'] or info['Image'] != expected['image']
            or not info['State']['Running'] or info['Name'] != '/arca_app'
            or cfg['Cmd'] != expected['command'] or cfg['Entrypoint'] is not None
            or cfg['WorkingDir'] != '/app' or cfg['User'] != expected['user']
            or network.get('Internal') is not True or network.get('Driver') != 'bridge'
            or host['NetworkMode'] != expected['internal']
            or set(info['NetworkSettings']['Networks']) != {expected['internal']}
            or info['NetworkSettings']['Networks'][expected['internal']]['IPAddress'] != expected['address']
            or any(info['NetworkSettings']['Ports'].values())
            or host.get('Privileged') or host.get('AutoRemove')
            or host.get('RestartPolicy', {}).get('Name') != 'unless-stopped'):
        raise RuntimeError('ARCA image, application or isolation contract changed')
    required = {(expected['certs'], '/app/certs', True),
                (expected['output'], '/app/output', False)}
    mounts = {(m['Source'], m['Destination'], not m['RW']) for m in info['Mounts']}
    if mounts != required or any(m['Type'] != 'bind' for m in info['Mounts']):
        raise RuntimeError('ARCA certificate/output mount contract changed')
    if host.get('PortBindings') != {'8501/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8501'}]}:
        raise RuntimeError('Unexpected original ARCA port configuration')
    if len(cfg.get('Env') or []) != len({item.split('=', 1)[0] for item in cfg['Env']}):
        raise RuntimeError('Duplicate ARCA environment keys')


def replacement(info, expected):
    result = copy.deepcopy(info['Config'])
    result['Image'] = expected['image']
    host = copy.deepcopy(info['HostConfig'])
    # The socat bridge owns loopback:8501. Never replay the dormant old binding.
    host['PortBindings'] = {}
    host['PublishAllPorts'] = False
    host['NetworkMode'] = expected['internal']
    result['HostConfig'] = host
    result['NetworkingConfig'] = {'EndpointsConfig': {
        expected['internal']: {'IPAMConfig': {'IPv4Address': expected['address']}}}}
    return result


def wait_health(url=HEALTH):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for attempt in range(30):
        try:
            with opener.open(url, timeout=2) as response:
                if response.status == 200 and response.read(128).strip() == b'ok':
                    return
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.5)
    raise RuntimeError('ARCA did not become healthy through the unchanged bridge')


def active_hosts(environment):
    mode = next((entry.split('=', 1)[1] for entry in environment
                 if entry.startswith('ARCA_HOMOLOGACION=')), 'true')
    return HOMOLOGATION_HOSTS if mode.lower() == 'true' else PRODUCTION_HOSTS


def verify_network(api, container, hosts=None):
    if hosts is None:
        hosts = active_hosts(api.inspect(container)['Config']['Env'])
    # DNS, TCP and certificate-verified TLS only: no HTTP request, WSAA login or invoice.
    code = ('import socket,ssl\n'
            'context=ssl.create_default_context()\n'
            'for host in ' + repr(hosts) + ':\n'
            ' socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)\n'
            ' with socket.create_connection((host,443),timeout=8) as tcp:\n'
            '  with context.wrap_socket(tcp,server_hostname=host) as tls:\n'
            '   assert tls.version()\n')
    execution = api.call('POST', '/containers/' + container + '/exec',
                         {'Cmd': ['python', '-c', code], 'AttachStdout': False, 'AttachStderr': False})['Id']
    api.call('POST', '/exec/' + execution + '/start', {'Detach': True, 'Tty': False})
    for attempt in range(100):
        state = api.call('GET', '/exec/' + execution + '/json')
        if not state['Running']:
            if state['ExitCode'] != 0:
                raise RuntimeError('ARCA outbound DNS/TLS verification failed')
            return
        time.sleep(0.5)
    raise RuntimeError('ARCA outbound DNS/TLS verification timed out')


def protected(api, excluded):
    result = {}
    for item in api.call('GET', '/containers/json'):
        if item['Id'] not in excluded:
            info = api.inspect(item['Id'])
            result[item['Id']] = (info['State']['StartedAt'], info['RestartCount'])
    return result


def restore(api, expected, identifier, health=wait_health, network_probe=verify_network):
    info = api.inspect('arca_app')
    internal = api.call('GET', '/networks/' + expected['internal'])
    validate_original(info, internal, expected)
    old = info['Id']
    before = protected(api, {old})
    old_name = 'arca_app_rollback_' + identifier
    if api.inspect(old_name, missing=True) is not None:
        raise RuntimeError('ARCA rollback name already exists')
    if api.call('GET', '/networks/' + expected['egress'], missing=True) is not None:
        raise RuntimeError('Unexpected pre-existing ARCA egress network')
    health()
    payload = replacement(info, expected)
    # The sole new resource is created before the short application interruption.
    api.call('POST', '/networks/create', {'Name': expected['egress'], 'Driver': 'bridge',
             'Internal': False, 'Labels': {'com.ultimamilla.project': 'arca-egress', 'com.ultimamilla.run': identifier}})
    stopped = disconnected = renamed = False
    candidate = None
    try:
        api.call('POST', '/containers/' + old + '/stop?t=15')
        stopped = True
        api.call('POST', '/networks/' + expected['internal'] + '/disconnect', {'Container': old})
        disconnected = True
        api.call('POST', '/containers/' + old + '/rename?name=' + old_name)
        renamed = True
        candidate = api.call('POST', '/containers/create?name=arca_app', payload)['Id']
        api.call('POST', '/networks/' + expected['egress'] + '/connect',
                 {'Container': candidate, 'EndpointConfig': {'GwPriority': 1}})
        api.call('POST', '/containers/' + candidate + '/start')
        actual = api.inspect(candidate)
        if (actual['Image'] != expected['image'] or actual['Config']['Env'] != info['Config']['Env']
                or actual['Mounts'] != info['Mounts'] or actual['HostConfig'].get('PortBindings')
                or any(actual['NetworkSettings']['Ports'].values())
                or set(actual['NetworkSettings']['Networks']) != {expected['internal'], expected['egress']}
                or actual['NetworkSettings']['Networks'][expected['internal']]['IPAddress'] != expected['address']):
            raise RuntimeError('Replacement changed the reviewed image, mounts, environment or bridge')
        health()
        network_probe(api, candidate)
        if protected(api, {old, candidate}) != before:
            raise RuntimeError('Another running container changed during the ARCA operation')
        return {'old_container': old, 'rollback_name': old_name, 'active_container': candidate,
                'image': expected['image'], 'internal_ip': expected['address'],
                'egress_network': expected['egress'], 'published_ports': [],
                'environment_preserved': True, 'mounts_preserved': True,
                'dns_tls_verified': True, 'afip_authentication_or_transaction': False}
    except Exception as failure:
        try:
            if candidate:
                api.call('DELETE', '/containers/' + candidate + '?force=true&v=false')
            if renamed:
                api.call('POST', '/containers/' + old + '/rename?name=arca_app')
            if disconnected:
                api.call('POST', '/networks/' + expected['internal'] + '/connect',
                         {'Container': old, 'EndpointConfig': {'IPAMConfig': {'IPv4Address': expected['address']}}})
            if stopped:
                api.call('POST', '/containers/' + old + '/start')
                health()
            api.call('DELETE', '/networks/' + expected['egress'])
            if protected(api, {old}) != before:
                raise RuntimeError('Protected container state changed during rollback')
        except Exception as rollback_failure:
            raise RuntimeError('ARCA rollback needs review; original container and data are retained') from rollback_failure
        raise RuntimeError('ARCA egress verification failed; original container restored') from failure


def verified_backup():
    identifier, size, digest = BACKUP
    root = Path('/srv/umsa-operational-backups') / identifier
    receipt = root / 'backup.complete.json'
    archive = root / ('HOSTINGER-active-' + identifier + '.tar.gz.gpg')
    if root.is_symlink() or receipt.is_symlink() or archive.is_symlink():
        raise RuntimeError('Unexpected operational backup type')
    data = json.loads(receipt.read_text())
    checksum = hashlib.sha256()
    with archive.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            checksum.update(block)
    actual = checksum.hexdigest()
    if (archive.stat().st_size != size or actual != digest or data.get('sha256') != digest
            or data.get('archive') != archive.name or data.get('bytes') != size
            or data.get('database_files') != 9 or data.get('encrypted_offsite') is not True):
        raise RuntimeError('Independently verified operational backup changed')
    return digest


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or os.geteuid() != 0
            or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file()):
        raise RuntimeError('Unexpected authoritative ARCA target')
    os.umask(0o077)
    digest = verified_backup()
    api = Docker()
    version = api.call('GET', '/version')
    if version['Version'] != '29.1.3':
        raise RuntimeError('Docker engine differs from the tested production version')
    bridge = subprocess_output(['systemctl', 'show', 'umsa-rehearsal-bridge-arca', '-p', 'ExecStart', '--value'])
    if ('TCP4-LISTEN:8501,bind=127.0.0.1,reuseaddr,fork' not in bridge
            or 'TCP4:172.20.0.3:8501' not in bridge):
        raise RuntimeError('ARCA loopback bridge changed')
    bridge_pid = subprocess_output(['systemctl', 'show', 'umsa-rehearsal-bridge-arca', '-p', 'MainPID', '--value'])
    root = STAGE / 'arca-egress-restorations' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    result = restore(api, contract(), identifier)
    if subprocess_output(['systemctl', 'show', 'umsa-rehearsal-bridge-arca', '-p', 'MainPID', '--value']) != bridge_pid:
        raise RuntimeError('ARCA bridge process changed; inspect the preserved rollback container')
    result.update(run=identifier, verified_backup_sha256=digest)
    (root / 'operation.complete.json').write_text(json.dumps(result, indent=2) + '\n')
    print('ARCA outbound DNS/TLS restored with the same image, data and bridge; no AFIP login or transaction.')


def subprocess_output(args):
    import subprocess
    return subprocess.check_output(args, text=True, timeout=15).strip()


if __name__ == '__main__':
    main(sys.argv[1])
