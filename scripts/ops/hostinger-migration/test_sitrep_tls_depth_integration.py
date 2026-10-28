"""Verify the Nginx proxy against a three-level test certificate chain."""
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest


@unittest.skipUnless(os.environ.get('SITREP_TLS_CI') == '1', 'requires a disposable CI Nginx container')
class SitrepTlsDepthIntegrationTests(unittest.TestCase):
    def test_tls_chain_needs_sufficient_depth_without_disabling_verification(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def openssl(*args):
                subprocess.run(['openssl', *map(str, args)], cwd=root, check=True,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            openssl('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=Test Root',
                    '-keyout', 'root.key', '-out', 'root.crt', '-addext', 'basicConstraints=critical,CA:TRUE',
                    '-addext', 'keyUsage=critical,keyCertSign,cRLSign')
            (root / 'ca.ext').write_text('basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n')
            (root / 'leaf.ext').write_text('basicConstraints=critical,CA:FALSE\n'
                                           'keyUsage=critical,digitalSignature,keyEncipherment\n'
                                           'extendedKeyUsage=serverAuth\nsubjectAltName=DNS:localhost\n')
            for name, parent, ext in [('intermediate1', 'root', 'ca.ext'),
                                      ('intermediate2', 'intermediate1', 'ca.ext'),
                                      ('leaf', 'intermediate2', 'leaf.ext')]:
                openssl('req', '-new', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=' + name,
                        '-keyout', name + '.key', '-out', name + '.csr')
                openssl('x509', '-req', '-in', name + '.csr', '-CA', parent + '.crt', '-CAkey',
                        parent + '.key', '-CAcreateserial', '-days', '1', '-sha256', '-extfile', ext,
                        '-out', name + '.crt')
            (root / 'chain.crt').write_bytes(b''.join((root / (name + '.crt')).read_bytes()
                                                     for name in ('leaf', 'intermediate2', 'intermediate1')))
            (root / 'nginx.conf').write_text('''pid /tmp/nginx.pid;
error_log /dev/stderr info;
events { worker_connections 64; }
http {
  server { listen 18443 ssl; ssl_certificate /probe/chain.crt;
           ssl_certificate_key /probe/leaf.key; return 200 "chain-ok"; }
  server { listen 18081; location / { proxy_pass https://127.0.0.1:18443;
           proxy_ssl_server_name on; proxy_ssl_name localhost; proxy_ssl_verify on;
           proxy_ssl_verify_depth 1; proxy_ssl_trusted_certificate /probe/root.crt; } }
  server { listen 18084; location / { proxy_pass https://127.0.0.1:18443;
           proxy_ssl_server_name on; proxy_ssl_name localhost; proxy_ssl_verify on;
           proxy_ssl_verify_depth 4; proxy_ssl_trusted_certificate /probe/root.crt; } }
}
''')
            name = 'umsa-sitrep-tls-depth-ci'
            subprocess.run(['docker', 'run', '-d', '--rm', '--name', name, '--network', 'none',
                            '-v', str(root) + ':/probe:ro', 'nginx:1.20.1-alpine',
                            'nginx', '-c', '/probe/nginx.conf', '-g', 'daemon off;'], check=True,
                           stdout=subprocess.DEVNULL)
            try:
                def request(port):
                    return subprocess.run(['docker', 'exec', name, 'wget', '-qO-',
                                           'http://127.0.0.1:' + str(port)], capture_output=True, timeout=15)
                for _ in range(30):
                    high = request(18084)
                    if high.returncode == 0:
                        break
                    time.sleep(0.5)
                self.assertEqual(high.returncode, 0, high.stderr.decode(errors='replace'))
                self.assertEqual(high.stdout, b'chain-ok')
                self.assertNotEqual(request(18081).returncode, 0)
            finally:
                subprocess.run(['docker', 'stop', '--time', '5', name], check=True, stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    unittest.main()
