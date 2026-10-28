import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('sitrep_activate', Path(__file__).with_name('sitrep-public-activate.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepPublicActivationTests(unittest.TestCase):
    def test_flags_are_checked_without_reading_unrelated_values(self):
        rows = ['BLOCKCHAIN_ENABLED="true"', 'DISABLE_EMAILS="true"',
                'SMTP_HOST="127.0.0.1"', 'SMTP_PORT="25"', 'SECRET="private"']
        self.assertEqual(module.extract_flags(rows, quoted=True), module.EXPECTED_FLAGS)
        with self.assertRaises(RuntimeError):
            module.extract_flags(rows + ['SMTP_PORT="25"'], quoted=True)

    def test_live_backend_only_changes_the_sitrep_unit(self):
        dropin = module.backend_dropin(Path('/srv/umsa-migration/sitrep-live.environment'))
        self.assertIn('IPAddressDeny=\n', dropin)
        self.assertIn('EnvironmentFile=/srv/umsa-migration/sitrep-live.environment', dropin)
        self.assertNotIn('vivero', dropin.lower())

    def test_hash_must_be_a_complete_sha256(self):
        self.assertEqual(module.validate_hash('a' * 64), 'a' * 64)
        for value in ('a' * 63, 'g' * 64, 'A' * 64):
            with self.assertRaises(ValueError):
                module.validate_hash(value)

    def test_atomic_replacement_saves_exact_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'unit'
            path.write_text('previous')
            module.atomic_replace(path, 'candidate', 0o600)
            self.assertEqual(path.read_text(), 'candidate')
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_retry_accepts_only_the_exact_existing_activation_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'environment'
            module.ensure_exact_file(path, 'same\n', 0o600)
            module.ensure_exact_file(path, 'same\n', 0o600)
            with self.assertRaises(RuntimeError):
                module.ensure_exact_file(path, 'different\n', 0o600)


if __name__ == '__main__':
    unittest.main()
