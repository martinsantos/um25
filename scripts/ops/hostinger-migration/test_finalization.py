import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('production_finalize', Path(__file__).with_name('finalize-production.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FinalizationTests(unittest.TestCase):
    def test_only_reviewed_certificate_lineages_move(self):
        source = ('ssl_certificate /etc/letsencrypt/live/ultimamilla.com.ar-0001/fullchain.pem;\n'
                  'ssl_certificate_key /etc/letsencrypt/live/ultimamilla.com.ar-0001/privkey.pem;\n'
                  'ssl_certificate /etc/letsencrypt/live/admin-other/fullchain.pem;\n')
        result = module.update_certificate_paths(source)
        self.assertIn('/etc/letsencrypt-hostinger/live/ultimamilla.com.ar-0001/fullchain.pem', result)
        self.assertIn('/etc/letsencrypt-hostinger/live/ultimamilla.com.ar-0001/privkey.pem', result)
        self.assertIn('/etc/letsencrypt/live/admin-other/fullchain.pem', result)

    def test_rotated_cms_token_replaces_exactly_two_legacy_proxies(self):
        source = ('proxy_set_header Authorization "Bearer old-token";\n' * 2)
        result = module.update_cms_token(source, 'new_reviewed_token_12345')
        self.assertNotIn('old-token', result)
        self.assertEqual(result.count('new_reviewed_token_12345'), 2)
        with self.assertRaises(RuntimeError):
            module.update_cms_token(source + source, 'new_reviewed_token_12345')
        with self.assertRaises(ValueError):
            module.update_cms_token(source, 'unsafe;token')


if __name__ == '__main__':
    unittest.main()
