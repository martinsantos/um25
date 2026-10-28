import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import ssl
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


m = load('directus_admin', 'repair-directus-admin.py')
publisher = load('directus_publisher', 'publish-web.py')
SOURCE = '''server {
    listen 127.0.0.1:443 ssl;
    server_name www.ultimamilla.com.ar;
    # ============ DIRECTUS HTTPS PROXY ============
    location /directus/ {
        proxy_pass http://127.0.0.1:8055/;
        proxy_set_header Authorization $http_authorization;
    }
    location /admin/ { return 200 "astro-admin"; }
    location / { return 200 "astro"; }
}
'''


class DirectusAdminTests(unittest.TestCase):
    def test_preparation_serves_only_local_challenge_until_tls_is_ready(self):
        text = m.render_admin()
        self.assertIn('location ^~ /.well-known/acme-challenge/', text)
        self.assertIn('try_files $uri =404;', text)
        self.assertIn('location / { return 503; }', text)
        self.assertNotIn(':443', text)
        self.assertNotIn('proxy_pass', text)

    def test_tls_preserves_original_origin_paths_and_client_credentials(self):
        text = m.render_admin(True)
        self.assertIn('/etc/letsencrypt-hostinger/live/admin.ultimamilla.com.ar/fullchain.pem', text)
        self.assertIn('location = / { return 302 /admin/$is_args$args; }', text)
        self.assertIn('proxy_pass http://127.0.0.1:8055;', text)
        self.assertIn('proxy_set_header Authorization $http_authorization;', text)
        self.assertIn('proxy_set_header Host $host;', text)
        self.assertNotIn('\\$', text)
        self.assertNotIn('Bearer', text)
        self.assertNotIn('/etc/letsencrypt/live/', text)

    def test_redirects_preserve_api_and_astro_locations_and_are_idempotent(self):
        text = m.add_redirects(SOURCE)
        self.assertEqual(text.replace(m.redirects(), ''), SOURCE)
        self.assertEqual(m.add_redirects(text), text)
        self.assertIn('location = /directus/admin {', text)
        self.assertIn('location ^~ /directus/admin/ {', text)
        for text in (SOURCE.replace(m.ANCHOR, ''),
                     SOURCE + 'location /directus/admin/ {}',
                     m.add_redirects(SOURCE).replace('return 400;', 'return 500;')):
            with self.assertRaises(RuntimeError):
                m.add_redirects(text)

    def test_future_publisher_keeps_the_repair_in_both_effective_sources(self):
        previous = {'config': '/old/nginx', 'assets': '/old/assets', 'port': 4321}
        for original in (m.render_admin(True, '127.0.0.1'), m.add_redirects(SOURCE)):
            copied = publisher.transform_config(original, previous, Path('/new/nginx'), Path('/new/assets'), 4322)
            public = publisher.public_listeners(copied)
            self.assertEqual(public, m.public_version(copied))
            self.assertNotIn('\\$', public)
            if m.BEGIN in original:
                self.assertIn(m.redirects(), public)
            else:
                self.assertIn('/etc/letsencrypt-hostinger/live/admin.ultimamilla.com.ar/', public)

    def test_backup_preserves_bytes_privately_and_symlinks_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            source = root / 'vhost'
            source.write_bytes(b'configuration')
            records = {'vhost': m.read_record(source)}
            backup = root / 'backup'
            backup.mkdir(mode=0o700)
            old = os.umask(0o077)
            try:
                m.backup(records, backup)
            finally:
                os.umask(old)
            self.assertEqual((backup / 'vhost.before').read_bytes(), b'configuration')
            self.assertEqual((backup / 'vhost.before').stat().st_mode & 0o777, 0o600)
            source.unlink()
            source.symlink_to(backup / 'vhost.before')
            with self.assertRaisesRegex(RuntimeError, 'Symlink'):
                m.read_record(source)

    def test_cas_stops_before_a_configuration_write(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            source = root / 'vhost'
            source.write_bytes(b'original')
            records = {'vhost': m.read_record(source)}
            source.write_bytes(b'concurrent')
            with patch.object(m, 'reload_ingresses') as reload:
                with self.assertRaisesRegex(RuntimeError, 'changed'):
                    m.transaction(records, [({'vhost': b'candidate'}, lambda: None)], root)
            self.assertEqual(source.read_bytes(), b'concurrent')
            reload.assert_not_called()

    def test_tls_gate_precedes_redirects_and_a_failure_restores_both_pairs(self):
        for failure in ('tls', 'redirects', 'reload'):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                root = Path(directory).resolve()
                records = {}
                for name in ('public_admin', 'private_admin', 'public_umsa', 'private_umsa'):
                    path = root / name
                    path.write_bytes(('original-' + name).encode())
                    path.chmod(0o640)
                    records[name] = m.read_record(path)
                def tls_check():
                    self.assertEqual(records['public_umsa']['path'].read_bytes(), records['public_umsa']['data'])
                    if failure == 'tls':
                        raise RuntimeError('tls failed')
                def redirect_check():
                    raise RuntimeError('redirects failed')
                with patch.object(m, 'reload_ingresses', side_effect=[RuntimeError('reload failed'), None]
                                  if failure == 'reload' else None):
                    with self.assertRaisesRegex(RuntimeError, 'failed'):
                        m.transaction(records, [
                            ({key: b'tls' for key in ('public_admin', 'private_admin')}, tls_check),
                            ({key: b'redirects' for key in ('public_umsa', 'private_umsa')}, redirect_check)], root)
                for record in records.values():
                    self.assertEqual(m.read_record(record['path']), record)

    def test_rollback_does_not_overwrite_a_concurrent_metadata_change(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path = root / 'vhost'
            path.write_bytes(b'original')
            path.chmod(0o600)
            records = {'vhost': m.read_record(path)}
            def collided():
                path.chmod(0o640)
                raise RuntimeError('health failed')
            with patch.object(m, 'reload_ingresses'):
                with self.assertRaisesRegex(RuntimeError, 'concurrent'):
                    m.transaction(records, [({'vhost': b'candidate'}, collided)], root)
            self.assertEqual(path.read_bytes(), b'candidate')
            self.assertEqual(path.stat().st_mode & 0o777, 0o640)

    def test_renewal_uses_only_certonly_webroot_and_the_existing_timer(self):
        with patch.object(m, 'run') as run, patch.object(m.ssl, 'SSLContext') as context, \
                patch.object(m, 'read_record', return_value={'data':
                    b'authenticator = webroot\nwebroot_path = /var/www/umsa-acme\n'}):
            m.certificate()
        command = run.call_args_list[0].args[0]
        self.assertEqual(command[:3], ['certbot', 'certonly', '--non-interactive'])
        self.assertIn('--keep-until-expiring', command)
        self.assertNotIn('--nginx', command)
        self.assertNotIn('--force-renewal', command)
        self.assertEqual(command[-2:], ['-d', m.HOST])
        self.assertEqual(run.call_args_list[-1].args[0],
                         ['systemctl', 'is-active', '--quiet', 'umsa-certificate-renew.timer'])
        context.return_value.load_cert_chain.assert_called_once()


class Backend(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        status, kind = 200, 'application/json'
        if self.path == '/admin/':
            body = '<base href="/admin/"><script src="./assets/app.js"></script><link href="./assets/app.css">'
            kind = 'text/html'
        elif self.path == '/admin/assets/app.js':
            body, kind = 'const app = true;', 'application/javascript'
        elif self.path == '/admin/assets/app.css':
            body, kind = 'body { color: green; }', 'text/css'
        elif self.path == '/users/me' and not self.headers.get('Authorization'):
            status, body = 401, '{"errors":[{"message":"Unauthorized"}]}'
        else:
            body = json.dumps({'path': self.path, 'authorization': self.headers.get('Authorization'),
                               'cookie': self.headers.get('Cookie')})
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.end_headers()
        self.wfile.write(body.encode())


@unittest.skipUnless(os.environ.get('DIRECTUS_ADMIN_NGINX_CI') == '1', 'requires disposable Nginx')
class DirectusRealNginxTests(unittest.TestCase):
    def test_actual_http_tls_proxy_assets_sessions_and_redirect_boundaries(self):
        def free_port():
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', 0))
                return probe.getsockname()[1]
        backend = ThreadingHTTPServer(('127.0.0.1', 0), Backend)
        thread = threading.Thread(target=backend.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory).resolve()
                port, tls_port = free_port(), free_port()
                subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                                '-days', '1', '-subj', '/CN=' + m.HOST,
                                '-keyout', str(root / 'privkey.pem'), '-out', str(root / 'fullchain.pem')],
                               check=True, capture_output=True)
                (root / '.well-known/acme-challenge').mkdir(parents=True)
                (root / '.well-known/acme-challenge/proof').write_text('local-challenge')
                def config(tls):
                    admin = m.render_admin(tls).replace(m.TARGET + ':80', '127.0.0.1:' + str(port))
                    admin = admin.replace(m.TARGET + ':443', '127.0.0.1:' + str(tls_port))
                    admin = admin.replace(str(m.ACME / 'live' / m.HOST), str(root)).replace(str(m.WEBROOT), str(root))
                    source = m.add_redirects(SOURCE) if tls else SOURCE
                    source = source.replace('127.0.0.1:443', '127.0.0.1:' + str(tls_port))
                    source = source.replace('    server_name www.', '    ssl_certificate ' + str(root / 'fullchain.pem') +
                        ';\n    ssl_certificate_key ' + str(root / 'privkey.pem') + ';\n    server_name www.')
                    text = ('error_log stderr; pid ' + str(root / 'nginx.pid') +
                            '; events {} http { access_log off; ' +
                            ''.join(name + '_temp_path ' + str(root / name) + '; ' for name in
                                    ('client_body', 'proxy', 'fastcgi', 'uwsgi', 'scgi')) + admin + source + '}')
                    return text.replace('127.0.0.1:8055', '127.0.0.1:' + str(backend.server_port))
                def fetch(host, path, tls=True, headers=None):
                    connection = (http.client.HTTPSConnection('127.0.0.1', tls_port,
                                  context=ssl._create_unverified_context()) if tls else
                                  http.client.HTTPConnection('127.0.0.1', port))
                    connection.request('GET', path, headers={'Host': host, **(headers or {})})
                    response = connection.getresponse()
                    result = response.status, dict(response.getheaders()), response.read().decode()
                    connection.close()
                    return result
                for secure in (False, True):
                    path = root / 'nginx.conf'
                    path.write_text(config(secure))
                    command = [shutil.which('nginx') or '/usr/sbin/nginx', '-p', str(root), '-c', str(path)]
                    subprocess.run(command + ['-t'], check=True, capture_output=True)
                    process = subprocess.Popen(command + ['-g', 'daemon off;'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    try:
                        for attempt in range(50):
                            try:
                                self.assertEqual(fetch(m.HOST, '/.well-known/acme-challenge/proof', False)[2], 'local-challenge')
                                break
                            except (OSError, AssertionError):
                                if process.poll() is not None:
                                    self.fail(process.communicate()[1].decode())
                                time.sleep(0.05)
                        else:
                            self.fail('Disposable Nginx did not start')
                        if not secure:
                            self.assertEqual(fetch(m.HOST, '/admin/', False)[0], 503)
                            continue
                        location = urlsplit(fetch(m.HOST, '/?next=%2Fcontent')[1]['Location'])
                        self.assertEqual(location.hostname, m.HOST)
                        self.assertEqual((location.path, location.query), ('/admin/', 'next=%2Fcontent'))
                        self.assertEqual(fetch(m.HOST, '/admin/')[0], 200)
                        self.assertEqual(fetch(m.HOST, '/admin/assets/app.js')[1]['Content-Type'], 'application/javascript')
                        self.assertEqual(fetch(m.HOST, '/admin/assets/app.css')[1]['Content-Type'], 'text/css')
                        for host, prefix in ((m.HOST, ''), ('www.ultimamilla.com.ar', '/directus')):
                            self.assertEqual(fetch(host, prefix + '/users/me')[0], 401)
                            response = fetch(host, prefix + '/users/me',
                                             headers={'Authorization': 'Bearer client-test', 'Cookie': 'session=kept'})
                            body = json.loads(response[2])
                            self.assertEqual(body['authorization'], 'Bearer client-test')
                            self.assertEqual(body['cookie'], 'session=kept')
                        for suffix in ('/admin?next=%2Fcontent', '/admin/content/a%20b?x=%2F&y=1',
                                       '/admin/?filter[a]=b%2Fc'):
                            result = fetch('www.ultimamilla.com.ar', '/directus' + suffix)
                            self.assertEqual(result[0], 302)
                            self.assertEqual(result[1]['Location'], 'https://' + m.HOST + suffix)
                        self.assertEqual(fetch('www.ultimamilla.com.ar', '/admin/')[2], 'astro-admin')
                        result = fetch('www.ultimamilla.com.ar', '/directus/administrator?x=1')
                        self.assertEqual(result[0], 200)
                        self.assertEqual(json.loads(result[2])['path'], '/administrator?x=1')
                    finally:
                        process.terminate()
                        process.communicate(timeout=10)
        finally:
            backend.shutdown()
            backend.server_close()


if __name__ == '__main__':
    unittest.main()
