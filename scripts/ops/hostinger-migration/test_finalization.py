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

    def test_public_proxies_never_lend_the_server_credentials(self):
        source = ('proxy_set_header Authorization "Bearer administrator-secret";\n' * 2)
        result = module.preserve_cms_client_authorization(source)
        self.assertNotIn('administrator-secret', result)
        self.assertNotIn('Bearer', result)
        self.assertEqual(result.count('Authorization $http_authorization;'), 2)
        self.assertEqual(module.preserve_cms_client_authorization(result), result)
        with self.assertRaises(RuntimeError):
            module.preserve_cms_client_authorization(source + source)


if __name__ == '__main__':
    unittest.main()
