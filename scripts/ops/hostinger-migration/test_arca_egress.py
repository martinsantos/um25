import copy
import importlib.util
import os
from pathlib import Path
import socket
import socketserver
import threading
import time
import unittest

spec = importlib.util.spec_from_file_location('arca_egress', Path(__file__).with_name('restore-arca-egress.py'))
arca = importlib.util.module_from_spec(spec)
spec.loader.exec_module(arca)


class ArcaEgressGuards(unittest.TestCase):
    def test_only_configured_afip_environment_is_probed(self):
        self.assertEqual(arca.active_hosts(['ARCA_HOMOLOGACION=true']), arca.HOMOLOGATION_HOSTS)
        self.assertEqual(arca.active_hosts(['ARCA_HOMOLOGACION=false']), arca.PRODUCTION_HOSTS)
        self.assertEqual(arca.active_hosts([]), arca.HOMOLOGATION_HOSTS)

    def fixture(self):
        return {'Id': arca.ORIGINAL, 'Image': arca.IMAGE, 'Name': '/arca_app',
                'State': {'Running': True},
                'Config': {'Cmd': arca.COMMAND, 'Entrypoint': None, 'WorkingDir': '/app',
                           'User': 'arca', 'Env': ['ARCA_HOMOLOGACION=true', 'PRIVATE_FIXTURE=do-not-log']},
                'HostConfig': {'NetworkMode': arca.INTERNAL, 'Privileged': False, 'AutoRemove': False,
                               'RestartPolicy': {'Name': 'unless-stopped', 'MaximumRetryCount': 0},
                               'PortBindings': {'8501/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8501'}]},
                               'Mounts': [{'Type': 'bind', 'Source': arca.CERTS, 'Target': '/app/certs', 'ReadOnly': True},
                                          {'Type': 'bind', 'Source': arca.OUTPUT, 'Target': '/app/output'}]},
                'Mounts': [{'Type': 'bind', 'Source': arca.CERTS, 'Destination': '/app/certs', 'RW': False},
                           {'Type': 'bind', 'Source': arca.OUTPUT, 'Destination': '/app/output', 'RW': True}],
                'NetworkSettings': {'Ports': {'8501/tcp': None},
                                    'Networks': {arca.INTERNAL: {'IPAddress': arca.ADDRESS}}}}

    def test_replacement_preserves_environment_mounts_and_restart_policy_without_ports(self):
        original = self.fixture()
        expected = arca.contract()
        arca.validate_original(original, {'Internal': True, 'Driver': 'bridge'}, expected)
        replacement = arca.replacement(original, expected)
        self.assertEqual(replacement['Env'], original['Config']['Env'])
        self.assertEqual(replacement['HostConfig']['Mounts'], original['HostConfig']['Mounts'])
        self.assertEqual(replacement['HostConfig']['RestartPolicy'], original['HostConfig']['RestartPolicy'])
        self.assertEqual(replacement['HostConfig']['PortBindings'], {})
        self.assertFalse(replacement['HostConfig']['PublishAllPorts'])
        self.assertEqual(replacement['NetworkingConfig']['EndpointsConfig'][arca.INTERNAL]['IPAMConfig']['IPv4Address'], arca.ADDRESS)
        self.assertEqual(original['HostConfig']['PortBindings']['8501/tcp'][0]['HostPort'], '8501')

    def test_unreviewed_image_mount_network_or_user_aborts_before_mutation(self):
        modifications = [lambda x: x.update(Image='sha256:' + '0' * 64),
                         lambda x: x['Mounts'][0].update(RW=True),
                         lambda x: x['NetworkSettings']['Networks'][arca.INTERNAL].update(IPAddress='172.20.0.9'),
                         lambda x: x['Config'].update(User='root')]
        for modify in modifications:
            with self.subTest(modify=modify):
                info = copy.deepcopy(self.fixture())
                modify(info)
                with self.assertRaises(RuntimeError):
                    arca.validate_original(info, {'Internal': True, 'Driver': 'bridge'}, arca.contract())


class Bridge(socketserver.BaseRequestHandler):
    def handle(self):
        with socket.create_connection(('172.30.92.3', 8501), timeout=3) as upstream:
            upstream.sendall(self.request.recv(65536))
            while True:
                data = upstream.recv(65536)
                if not data:
                    break
                self.request.sendall(data)


@unittest.skipUnless(os.environ.get('ARCA_DOCKER_REHEARSAL') == '1', 'Disposable Docker 29.1.3 CI rehearsal')
class ArcaDockerRehearsal(unittest.TestCase):
    def setUp(self):
        self.api = arca.Docker('/engine/docker.sock')
        self.assertEqual(self.api.call('GET', '/version')['Version'], '29.1.3')
        self.image = self.api.call('GET', '/images/python:3.10-alpine/json')['Id']
        self.api.call('POST', '/networks/create', {'Name': 'arca-internal-ci', 'Driver': 'bridge', 'Internal': True,
                      'IPAM': {'Config': [{'Subnet': '172.30.92.0/24'}]}})
        fixture = Path('/fixture')
        (fixture / 'certs').mkdir(exist_ok=True)
        (fixture / 'output').mkdir(exist_ok=True)
        (fixture / 'output/retained.txt').write_text('preserved output\n')
        (fixture / 'certs/retained.txt').write_text('preserved certificate fixture\n')
        script = ('from http.server import BaseHTTPRequestHandler,HTTPServer\n'
                  'class Handler(BaseHTTPRequestHandler):\n'
                  ' def do_GET(self):\n'
                  '  self.send_response(200);self.end_headers();self.wfile.write(b"ok")\n'
                  'HTTPServer(("0.0.0.0",8501),Handler).serve_forever()\n')
        self.command = ['python', '-u', '-c', script]
        body = {'Image': self.image, 'WorkingDir': '/app', 'User': '1000', 'Cmd': self.command,
                'Env': ['ARCA_HOMOLOGACION=true', 'PRIVATE_FIXTURE=retained'],
                'ExposedPorts': {'8501/tcp': {}},
                'HostConfig': {'NetworkMode': 'arca-internal-ci',
                               'RestartPolicy': {'Name': 'unless-stopped'},
                               'PortBindings': {'8501/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8501'}]},
                               'Mounts': [{'Type': 'bind', 'Source': '/fixture/certs', 'Target': '/app/certs', 'ReadOnly': True},
                                          {'Type': 'bind', 'Source': '/fixture/output', 'Target': '/app/output'}]},
                'NetworkingConfig': {'EndpointsConfig': {'arca-internal-ci': {'IPAMConfig': {'IPv4Address': '172.30.92.3'}}}}}
        self.original = self.api.call('POST', '/containers/create?name=arca_app', body)['Id']
        self.api.call('POST', '/containers/' + self.original + '/start')
        # Occupy exactly the port used by the production socat bridge in the daemon namespace.
        class Server(socketserver.ThreadingTCPServer):
            allow_reuse_address = True
            daemon_threads = True
        self.bridge = Server(('127.0.0.1', 8501), Bridge)
        self.thread = threading.Thread(target=self.bridge.serve_forever, daemon=True)
        self.thread.start()
        self.sentinel = self.api.call('POST', '/containers/create?name=protected_other_app',
                                     {'Image': self.image, 'Cmd': ['sleep', '600'], 'HostConfig': {'NetworkMode': 'none'}})['Id']
        self.api.call('POST', '/containers/' + self.sentinel + '/start')
        self.before = arca.protected(self.api, {self.original})
        self.expected = arca.contract(image=self.image, original=self.original, internal='arca-internal-ci',
                                      address='172.30.92.3', egress='arca-egress-ci',
                                      certs='/fixture/certs', output='/fixture/output', command=self.command)
        self.expected['user'] = '1000'
        arca.wait_health()

    def tearDown(self):
        if hasattr(self, 'bridge'):
            self.bridge.shutdown()
            self.bridge.server_close()
        if hasattr(self, 'api'):
            for container in self.api.call('GET', '/containers/json?all=1'):
                self.api.call('DELETE', '/containers/' + container['Id'] + '?force=true&v=false')
            for name in ['arca-internal-ci', 'arca-egress-ci']:
                if self.api.call('GET', '/networks/' + name, missing=True):
                    self.api.call('DELETE', '/networks/' + name)

    def test_recreate_with_occupied_bridge_same_ip_data_and_real_dns_tls(self):
        result = arca.restore(self.api, self.expected, '1-1',
                              network_probe=lambda api, container: arca.verify_network(api, container, ['pypi.org']))
        self.assertTrue(result['dns_tls_verified'])
        self.assertFalse(self.api.inspect(self.original)['State']['Running'])
        self.assertEqual(arca.protected(self.api, {self.original, result['active_container']}), self.before)
        active = self.api.inspect('arca_app')
        self.assertFalse(active['HostConfig']['PortBindings'])
        self.assertEqual(active['NetworkSettings']['Networks']['arca-internal-ci']['IPAddress'], '172.30.92.3')
        self.assertEqual(Path('/fixture/output/retained.txt').read_text(), 'preserved output\n')
        self.assertEqual(Path('/fixture/certs/retained.txt').read_text(), 'preserved certificate fixture\n')
        arca.wait_health()

    def test_failed_tls_rolls_back_exact_container_ip_bridge_and_data(self):
        def fail_tls(api, container):
            raise RuntimeError('Injected outbound TLS failure')
        with self.assertRaisesRegex(RuntimeError, 'original container restored'):
            arca.restore(self.api, self.expected, '2-1', network_probe=fail_tls)
        original = self.api.inspect('arca_app')
        self.assertEqual(original['Id'], self.original)
        self.assertTrue(original['State']['Running'])
        self.assertEqual(original['NetworkSettings']['Networks']['arca-internal-ci']['IPAddress'], '172.30.92.3')
        self.assertEqual(arca.protected(self.api, {self.original}), self.before)
        self.assertIsNone(self.api.call('GET', '/networks/arca-egress-ci', missing=True))
        self.assertEqual(Path('/fixture/output/retained.txt').read_text(), 'preserved output\n')
        arca.wait_health()


if __name__ == '__main__':
    unittest.main()
