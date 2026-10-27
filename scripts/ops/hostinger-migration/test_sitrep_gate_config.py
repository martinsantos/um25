import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sitrep_gate', Path(__file__).with_name('sitrep-gate-config.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepGateTests(unittest.TestCase):
    def test_maintenance_only_targets_sitrep_and_cannot_reach_apps(self):
        config = module.render_gate('maintenance')
        self.assertIn('return 503', config)
        self.assertNotIn('proxy_pass', config)
        self.assertIn('server_name sitrep.ultimamilla.com.ar www.sitrep.ultimamilla.com.ar;', config)
        self.assertNotIn('viveroloscocos', config)

    def test_proxy_verifies_tls_and_replaces_untrusted_forwarded_addresses(self):
        config = module.render_gate('proxy')
        self.assertIn('proxy_pass https://179.198.115.115;', config)
        self.assertIn('proxy_ssl_verify on;', config)
        self.assertIn('proxy_ssl_name sitrep.ultimamilla.com.ar;', config)
        self.assertIn('proxy_set_header CF-Connecting-IP $remote_addr;', config)
        self.assertIn('proxy_set_header X-Forwarded-For $remote_addr;', config)
        self.assertNotIn('$http_cf_connecting_ip', config)
        self.assertIn('proxy_set_header Upgrade $http_upgrade;', config)

    def test_rejects_unreviewed_mode(self):
        with self.assertRaises(ValueError):
            module.render_gate('anything')


if __name__ == '__main__':
    unittest.main()
