import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('rotation', Path(__file__).with_name('rotate-internal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CredentialRotationGuards(unittest.TestCase):
    def test_database_rewrite_preserves_database_options_and_ipv6(self):
        result = module.database_url('postgresql://app:old@[::1]:5432/service?schema=public', {'app': 'new_secret'})
        self.assertEqual(result, 'postgresql://app:new_secret@[::1]:5432/service?schema=public')
        with self.assertRaises(ValueError):
            module.database_url('postgresql://unknown:old@localhost/service', {'app': 'new'})

    def test_php_rewrite_keeps_unrelated_configuration(self):
        text = "$wgDBpassword = 'old\\\'password';\n$wgDBname = 'customer';"
        self.assertEqual(module.php_value(text, 'wgDBpassword', 'new_secret'),
                         "$wgDBpassword = 'new_secret';\n$wgDBname = 'customer';")
        self.assertEqual(module.php_value("define( 'DB_PASSWORD', \"old\" );", 'DB_PASSWORD', 'new', True),
                         "define( 'DB_PASSWORD', 'new' );")

    def test_missing_dynamic_or_duplicate_php_settings_fail_closed(self):
        for text in ('', '$wgSecretKey = getenv("SECRET");', "$wgSecretKey='one'; $wgSecretKey='two';"):
            with self.assertRaises(ValueError):
                module.php_value(text, 'wgSecretKey', 'new_secret')


if __name__ == '__main__':
    unittest.main()
