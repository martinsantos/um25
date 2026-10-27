import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sitrep_ingress', Path(__file__).with_name('rehearse-sitrep-ingress.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepIngressRehearsalTests(unittest.TestCase):
    def setUp(self):
        self.vhost = '''server { listen 127.0.0.1:80; server_name sitrep.ultimamilla.com.ar www.sitrep.ultimamilla.com.ar; }
server { listen 127.0.0.1:443 ssl http2; server_name www.sitrep.ultimamilla.com.ar; }
server { listen 127.0.0.1:443 ssl http2; server_name sitrep.ultimamilla.com.ar; }'''

    def test_rehearsal_is_loopback_and_trusts_only_the_reviewed_source(self):
        conf = module.render_config(self.vhost, Path('/tmp/sitrep-rehearsal'))
        self.assertEqual(conf.count('listen 127.0.0.1:18080;'), 1)
        self.assertEqual(conf.count('listen 127.0.0.1:18443 ssl http2;'), 2)
        self.assertIn('set_real_ip_from 23.105.176.45;', conf)
        self.assertNotIn('listen 0.0.0.0:', conf)
        self.assertNotIn('listen 179.198.115.115:', conf)

    def test_rejects_unexpected_listener_inventory(self):
        with self.assertRaises(ValueError):
            module.render_config(self.vhost.replace('127.0.0.1:80', '0.0.0.0:80'), Path('/tmp/x'))
        with self.assertRaises(ValueError):
            module.render_config(self.vhost + '\nlisten 127.0.0.1:443 ssl http2;', Path('/tmp/x'))


if __name__ == '__main__':
    unittest.main()
