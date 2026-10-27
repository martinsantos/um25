import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('mail', Path(__file__).with_name('prepare-mail.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MailConfiguration(unittest.TestCase):
    def test_changes_only_explicit_interface(self):
        text = '# inet_interfaces = all\ninet_interfaces = 23.105.176.45\nmyhostname = gestion.viveroloscocos.com.ar\n'
        result = module.setting(text, 'inet_interfaces', '127.0.0.1')
        self.assertIn('# inet_interfaces = all', result)
        self.assertIn('inet_interfaces = 127.0.0.1\n', result)
        self.assertIn('myhostname = gestion.viveroloscocos.com.ar', result)

    def test_ambiguous_settings_are_rejected(self):
        for text in ('# inet_interfaces = all\n', 'inet_interfaces = all\ninet_interfaces = loopback-only\n'):
            with self.assertRaises(ValueError):
                module.setting(text, 'inet_interfaces', '127.0.0.1')


if __name__ == '__main__':
    unittest.main()
