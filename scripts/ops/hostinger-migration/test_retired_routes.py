import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


m = load('retired_routes', 'repair-retired-routes.py')
publisher = load('routes_publisher', 'publish-web.py')
API = '''    location = /api/status.json {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
    }
    location /plantilla-arca/ {
        proxy_pass http://127.0.0.1:4321;
    }
    location /directus/ {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Authorization $http_authorization;
    }
'''
SGI = '''server {
    listen 127.0.0.1:443 ssl;
    listen [::1]:443 ssl;
    server_name sgi.ultimamilla.com.ar;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
'''


class RetiredRoutesTests(unittest.TestCase):
    def test_only_the_legacy_proxy_block_changes_and_analytics_stays_in_astro(self):
        source = 'before\n' + m.OLD_BLOCK + API + 'after\n'
        fixed = m.retire_demo_api(source)
        self.assertEqual(fixed.replace(m.NEW_BLOCK, m.OLD_BLOCK), source)
        self.assertEqual(m.retire_demo_api(fixed), fixed)
        self.assertNotIn('3010', fixed)
        self.assertNotIn('analytics|', fixed)
        self.assertIn('notificaciones)(/|$)', fixed)
        self.assertIn(API, fixed)

    def test_unknown_or_duplicate_legacy_configurations_are_rejected(self):
        for source in (m.OLD_BLOCK + m.OLD_BLOCK + API,
                       m.OLD_BLOCK.replace(':3010;', ':3011;') + API,
                       m.OLD_BLOCK + API.replace('location = /api/status.json', 'location = /other'),
                       m.NEW_BLOCK + m.NEW_BLOCK + API):
            with self.subTest(source=source), self.assertRaises(RuntimeError):
                m.retire_demo_api(source)

    def test_sgi_only_changes_the_dead_port_and_keeps_ipv6_and_headers(self):
        fixed = m.repair_sgi_source(SGI)
        self.assertEqual(fixed.replace(':3001;', ':3000;'), SGI)
        self.assertEqual(m.repair_sgi_source(fixed), fixed)
        public = m.public_version(fixed)
        self.assertIn('proxy_pass http://127.0.0.1:3001;', public)
        self.assertNotIn('[::1]', public)
        self.assertEqual(public, publisher.public_listeners(fixed))
        for text in (SGI + SGI, SGI.replace(':3000;', ':3002;')):
            with self.assertRaises(RuntimeError):
                m.repair_sgi_source(text)

    def test_next_web_publication_copies_the_fixed_api_and_private_sgi_sources(self):
        previous = {'config': '/old/nginx', 'assets': '/old/assets', 'port': 4321}
        for source in (m.retire_demo_api(m.OLD_BLOCK + API), m.repair_sgi_source(SGI)):
            copied = publisher.transform_config(source, previous, Path('/next/nginx'), Path('/next/assets'), 4322)
            self.assertNotIn(':3010;', copied)
            self.assertNotIn(':3000;', copied)
            if m.NEW_BLOCK in source:
                self.assertIn(m.NEW_BLOCK, copied)
                self.assertIn('proxy_pass http://127.0.0.1:4322;', copied)
            else:
                self.assertIn('proxy_pass http://127.0.0.1:3001;', copied)

    def test_changes_never_write_public_sgi_or_runtime_binding_records(self):
        def record(text):
            return {'data': text.encode()}
        source = {'public_umsa': record(m.OLD_BLOCK + API), 'private_umsa': record(m.OLD_BLOCK + API),
                  'private_sgi': record(SGI), 'public_sgi': record(m.public_version(m.repair_sgi_source(SGI))),
                  'sgi_environment': record('SESSION_SECRET=synthetic-test'), 'sgi_state': record('{}')}
        changed = m.changes(source)
        self.assertEqual(set(changed), {'public_umsa', 'private_umsa', 'private_sgi'})
        self.assertNotIn('synthetic-test', json.dumps(m.inventory({
            'sgi_environment': {'path': Path('/test/environment'), 'data': b'SESSION_SECRET=synthetic-test',
                                'mode': 0o600, 'uid': 0, 'gid': 0}})))

    def test_reload_or_health_failure_restores_configuration_and_metadata(self):
        for failure in ('reload', 'health'):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                root = Path(directory).resolve()
                records = {}
                for key in ('public_umsa', 'private_umsa', 'private_sgi'):
                    path = root / key
                    path.write_bytes(('old-' + key).encode())
                    path.chmod(0o640)
                    records[key] = m.read_record(path)
                def verify():
                    raise RuntimeError('health failed')
                with patch.object(m, 'reload_ingresses', side_effect=[RuntimeError('reload failed'), None]
                                  if failure == 'reload' else None):
                    with self.assertRaisesRegex(RuntimeError, 'failed'):
                        m.transaction(records, dict.fromkeys(records, b'candidate'), verify, root)
                for record in records.values():
                    self.assertEqual(m.read_record(record['path']), record)

    def test_private_runtime_backup_is_verified_and_forced_to_0600(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path = root / 'environment'
            path.write_bytes(b'PRIVATE=synthetic-test')
            records = {'sgi_environment': m.read_record(path)}
            saved = root / 'backup'
            saved.mkdir(mode=0o700)
            m.backup(records, saved)
            backup = saved / 'sgi_environment.before'
            self.assertEqual(backup.read_bytes(), path.read_bytes())
            self.assertEqual(backup.stat().st_mode & 0o777, 0o600)
            self.assertNotIn('synthetic-test', (saved / 'before.json').read_text())

    def test_cas_prevents_writes_and_metadata_collisions_prevent_rollback_clobber(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path = root / 'vhost'
            path.write_bytes(b'old')
            path.chmod(0o600)
            records = {'vhost': m.read_record(path)}
            path.write_bytes(b'external')
            with patch.object(m, 'reload_ingresses') as reload:
                with self.assertRaisesRegex(RuntimeError, 'changed'):
                    m.transaction(records, {'vhost': b'candidate'}, lambda: None, root)
                reload.assert_not_called()
            path.write_bytes(b'old')
            def collision():
                path.chmod(0o640)
                raise RuntimeError('failed')
            with patch.object(m, 'reload_ingresses'):
                with self.assertRaisesRegex(RuntimeError, 'concurrent'):
                    m.transaction(records, {'vhost': b'candidate'}, collision, root)
            self.assertEqual((path.read_bytes(), path.stat().st_mode & 0o777), (b'candidate', 0o640))

    def test_readiness_requires_three_consecutive_successes_and_never_accepts_timeout(self):
        for failures in ([False, True, False, True, True, True], [False] * 50):
            clock, observed = [0.0], []
            def advance(seconds):
                clock[0] += seconds
            def probe(budget):
                self.assertTrue(0 < budget <= 1)
                value = failures[len(observed)]
                observed.append(value)
                if not value:
                    raise RuntimeError('HTTP 502')
            with patch.object(m.time, 'monotonic', side_effect=lambda: clock[0]), \
                    patch.object(m.time, 'sleep', side_effect=advance):
                if len(failures) == 6:
                    m.wait_ready(probe)
                    self.assertEqual(observed, failures)
                else:
                    with self.assertRaisesRegex(RuntimeError, 'HTTP 502'):
                        m.wait_ready(probe)
                    self.assertEqual(clock[0], 10)


class Backend(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self):
        size = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(size).decode()
        data = json.dumps({'method': self.command, 'uri': self.path, 'body': body,
                           'authorization': self.headers.get('Authorization'), 'cookie': self.headers.get('Cookie')})
        self.send_response(404 if self.path.startswith('/api/analytics') else 200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data.encode())

    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_OPTIONS = do_HEAD = reply


@unittest.skipUnless(os.environ.get('RETIRED_ROUTES_NGINX_CI') == '1', 'requires disposable Nginx')
class ActualNginxRoutesTests(unittest.TestCase):
    def test_retirement_boundaries_and_current_proxy_method_query_body_auth_cookies(self):
        backend = ThreadingHTTPServer(('127.0.0.1', 0), Backend)
        thread = threading.Thread(target=backend.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory).resolve()
                with socket.socket() as probe:
                    probe.bind(('127.0.0.1', 0))
                    port = probe.getsockname()[1]
                source = 'server { listen 127.0.0.1:' + str(port) + '; server_name www.ultimamilla.com.ar;\n'
                source += m.retire_demo_api(m.OLD_BLOCK + API).replace('127.0.0.1:4321', '127.0.0.1:' + str(backend.server_port))
                source += '}\n'
                sgi = m.repair_sgi_source(SGI).replace('127.0.0.1:443 ssl', '127.0.0.1:' + str(port))
                sgi = sgi.replace('    listen [::1]:443 ssl;\n', '').replace('127.0.0.1:3001', '127.0.0.1:' + str(backend.server_port))
                config = ('error_log stderr; pid ' + str(root / 'nginx.pid') + '; events {} http { access_log off; ' +
                          ''.join(name + '_temp_path ' + str(root / name) + '; ' for name in
                                  ('client_body', 'proxy', 'fastcgi', 'uwsgi', 'scgi')) + source + sgi + '}')
                path = root / 'nginx.conf'
                path.write_text(config)
                command = [shutil.which('nginx') or '/usr/sbin/nginx', '-p', str(root), '-c', str(path)]
                subprocess.run(command + ['-t'], check=True, capture_output=True)
                process = subprocess.Popen(command + ['-g', 'daemon off;'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                def fetch(uri, method='GET', host='www.ultimamilla.com.ar', payload=None):
                    connection = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                    connection.request(method, uri, body=payload, headers={'Host': host,
                        'Authorization': 'Bearer synthetic-client', 'Cookie': 'session=preserved',
                        'Content-Type': 'application/json'})
                    response = connection.getresponse()
                    result = response.status, response.read().decode()
                    connection.close()
                    return result
                try:
                    for attempt in range(50):
                        try:
                            if fetch('/api/monitoring/health')[0] == 200:
                                break
                        except OSError:
                            if process.poll() is not None:
                                self.fail(process.communicate()[1].decode())
                            time.sleep(0.05)
                    else:
                        self.fail('Disposable Nginx did not start')
                    for family in m.FAMILIES:
                        for suffix in ('', '/profile?next=%2Fcontent'):
                            for method in ('GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'):
                                self.assertEqual(fetch('/api/' + family + suffix, method)[0], 410)
                    for method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'):
                        for uri in ('/api/analytics?next=%2Fcontent&x=a%20b', '/api/analytics/report',
                                    '/api/analytics2', '/api/authentication', '/api/notificaciones-extra',
                                    '/api/status.json?fresh=1', '/api/monitoring/health',
                                    '/plantilla-arca/api/auth/afip?scope=synthetic'):
                            status, text = fetch(uri, method, payload='{"synthetic":true}')
                            self.assertEqual(status, 404 if uri.startswith('/api/analytics') else 200)
                            data = json.loads(text)
                            self.assertEqual((data['method'], data['uri'], data['body']),
                                             (method, uri, '{"synthetic":true}'))
                            self.assertEqual(data['authorization'], 'Bearer synthetic-client')
                            self.assertEqual(data['cookie'], 'session=preserved')
                    for host, uri in (('www.ultimamilla.com.ar', '/directus/users/me'), ('sgi.ultimamilla.com.ar', '/auth/login')):
                        status, text = fetch(uri, 'POST', host, '{"synthetic":true}')
                        self.assertEqual(status, 200)
                        self.assertEqual(json.loads(text)['authorization'], 'Bearer synthetic-client')
                        self.assertEqual(json.loads(text)['cookie'], 'session=preserved')
                finally:
                    process.terminate()
                    process.communicate(timeout=10)
        finally:
            backend.shutdown()
            backend.server_close()


if __name__ == '__main__':
    unittest.main()
