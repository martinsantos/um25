import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location('acme', Path(__file__).with_name('prepare-acme.py'))
acme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acme)


class ChallengePreparation(unittest.TestCase):
    def test_waits_for_new_worker_configuration(self):
        with patch.object(acme.subprocess, 'run', side_effect=[SimpleNamespace(returncode=22, stdout=''), SimpleNamespace(returncode=0, stdout='token')]) as run, patch.object(acme.time, 'sleep'):
            acme.wait_for_challenge(['curl'], 'token', None)
            self.assertEqual(run.call_count, 2)

    def test_fails_closed_when_new_route_never_works(self):
        with patch.object(acme.subprocess, 'run', return_value=SimpleNamespace(returncode=0, stdout='wrong-body')), patch.object(acme.time, 'sleep'):
            with self.assertRaises(RuntimeError):
                acme.wait_for_challenge(['curl'], 'token', None)

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
