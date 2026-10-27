import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('acme', Path(__file__).with_name('prepare-acme.py'))
acme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acme)


class ChallengePreparation(unittest.TestCase):
    def test_preserves_redirect_and_application_rules(self):
        original = 'server {\n server_name example.com; # canonical\n return 301 https://www.example.com$request_uri;\n}\nserver {\n server_name www.example.com;\n location / { proxy_pass http://127.0.0.1:4321; }\n}\n'
        result = acme.prepare_text(original, ['example.com', 'www.example.com'])
        self.assertEqual(result.count(acme.LOCATION), 2)
        self.assertEqual(result.replace(acme.LOCATION, ''), original)

    def test_rejects_unexpected_config(self):
        for original in ('server_name other.com;', 'server_name example.com;\nlocation /.well-known/acme-challenge/ {}'):
            with self.assertRaises(ValueError):
                acme.prepare_text(original, ['example.com'])


if __name__ == '__main__':
    unittest.main()
