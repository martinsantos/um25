import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('persist', Path(__file__).with_name('persist-rehearsal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PersistenceTests(unittest.TestCase):
    def test_public_or_previously_modified_units_are_rejected(self):
        text = '[Unit]\n[Service]\nRestart=no\n'
        with self.assertRaises(ValueError):
            module.persistent_unit(text, 'docker.service')
        with self.assertRaises(ValueError):
            module.persistent_unit(text + 'IPAddressDeny=any\n[Install]\n', 'docker.service')

    def test_network_restrictions_survive_persistence(self):
        text = '[Unit]\n[Service]\nIPAddressDeny=any\nIPAddressAllow=localhost\nRestart=no\n'
        result = module.persistent_unit(text, 'docker.service')
        self.assertIn('IPAddressDeny=any\nIPAddressAllow=localhost\n', result)
        self.assertIn('After=docker.service\n', result)
        self.assertIn('Restart=on-failure\n', result)
        self.assertIn('WantedBy=multi-user.target', result)

    def test_front_uses_only_clean_configuration_and_isolated_network(self):
        unit = module.front_unit('php-fpm.service')
        self.assertIn('/srv/umsa-clean-proxy/nginx/nginx.conf', unit)
        self.assertIn('IPAddressDeny=any', unit)
        self.assertNotIn('-c /etc/nginx/', unit)
        self.assertIn('ExecStartPre=', unit)
