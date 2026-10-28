import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('active_backup', Path(__file__).with_name('active-backup.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ActiveBackupTests(unittest.TestCase):
    def test_receiver_rounding_is_not_treated_as_exact_free_capacity(self):
        self.assertTrue(module.receiver_has_reserve(9, 128 * 1024**2))
        self.assertFalse(module.receiver_has_reserve(8, 1))
        self.assertFalse(module.receiver_has_reserve(9, 2 * module.GIB))

    def test_exact_capacity_preserves_seven_gib_at_the_byte_boundary(self):
        incoming = 52 * 1024**2
        threshold = 7 * module.GIB + incoming
        self.assertTrue(module.receiver_has_reserve(8, incoming, threshold))
        self.assertFalse(module.receiver_has_reserve(8, incoming, threshold - 1))
        self.assertFalse(module.receiver_has_reserve(100, incoming, 0))

    def test_receiver_listing_resolves_false_rejection_without_lowering_reserve(self):
        helper = module.load('test_active_receiver', 'rehearse-encrypted-recovery.py')
        incoming = 52 * 1024**2
        legacy = 'libre 8 GB\n'
        exact = legacy + 'libre_bytes 8405700608\n'
        self.assertFalse(module.receiver_has_reserve(
            helper.available_gb(legacy), incoming, helper.available_bytes(legacy)))
        self.assertTrue(module.receiver_has_reserve(
            helper.available_gb(exact), incoming, helper.available_bytes(exact)))

    def test_sgi_backup_is_not_taken_from_the_retired_shared_database(self):
        self.assertEqual(set(module.PG), {'directus', 'arca', 'sitrep', 'dge'})
        self.assertEqual(module.PG['dge'][0], 'dge-demo-db')
        self.assertEqual(module.DATA['sgi-uploads'], Path('/srv/umsa-clean-apps/sgi/uploads'))
        self.assertNotIn('node_modules', {p.name for p in module.DATA.values()})


if __name__ == '__main__':
    unittest.main()
