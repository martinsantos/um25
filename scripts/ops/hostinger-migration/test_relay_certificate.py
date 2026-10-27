import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('relay', Path(__file__).with_name('prepare-relay-certificate.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RelayCertificate(unittest.TestCase):
    def test_changes_only_expected_value(self):
        before = 'a = keep\nsmtpd_tls_cert_file = /old\nb = keep\n'
        self.assertEqual(module.replace_setting(before, 'smtpd_tls_cert_file', '/old', '/new'),
                         'a = keep\nsmtpd_tls_cert_file = /new\nb = keep\n')

    def test_rejects_unexpected_or_duplicate_setting(self):
        for text in ('a = other\n', 'a = old\na = old\n', 'a = changed\n'):
            with self.assertRaises(ValueError):
                module.replace_setting(text, 'a', 'old', 'new')


if __name__ == '__main__':
    unittest.main()
