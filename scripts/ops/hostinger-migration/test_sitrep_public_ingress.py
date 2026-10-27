import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sitrep_public', Path(__file__).with_name('sitrep-public-ingress.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepPublicIngressTests(unittest.TestCase):
    def setUp(self):
        self.site = '''upstream sitrep_backend { server localhost:3002; }
server { listen 127.0.0.1:80; server_name sitrep.ultimamilla.com.ar www.sitrep.ultimamilla.com.ar; }
server { listen 127.0.0.1:443 ssl http2; server_name www.sitrep.ultimamilla.com.ar; }
server { listen 127.0.0.1:443 ssl http2; server_name sitrep.ultimamilla.com.ar; }'''

    def test_source_only_probe_has_no_application_proxy(self):
        config = module.health_config(Path('/tmp/test'), '42-1')
        self.assertIn('location / { return 404; }', config)
        self.assertNotIn('proxy_pass', config)
        unit = module.source_only_unit(Path('/tmp/test/nginx.conf'))
        self.assertIn('IPAddressDeny=any', unit)
        self.assertIn('IPAddressAllow=23.105.176.45/32', unit)
        self.assertNotIn('IPAddressAllow=any', unit)

    def test_live_candidate_exposes_only_sitrep_and_rejects_unknown_hosts(self):
        config = module.live_config(self.site, Path('/tmp/test'))
        self.assertEqual(config.count('listen 179.198.115.115:443 ssl http2;'), 2)
        self.assertIn('listen 179.198.115.115:443 ssl http2 default_server;', config)
        self.assertIn('set_real_ip_from 23.105.176.45;', config)
        self.assertIn('return 444;', config)
        self.assertIn('gzip on;', config)
        self.assertNotIn('viveroloscocos.com.ar', config)
        unit = module.live_unit(Path('/tmp/test/nginx.conf'))
        self.assertIn('Wants=network-online.target umsa-clean-sitrep-backend.service', unit)
        self.assertNotIn('Requires=umsa-clean-sitrep-backend.service', unit)

    def test_identifier_is_not_interpreted_as_configuration(self):
        with self.assertRaises(ValueError):
            module.health_config(Path('/tmp/test'), '42; other')


if __name__ == '__main__':
    unittest.main()
