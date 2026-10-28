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

    def test_sgi_backup_is_not_taken_from_the_retired_shared_database(self):
        self.assertEqual(set(module.PG), {'directus', 'arca', 'sitrep', 'dge'})
        self.assertEqual(module.PG['dge'][0], 'dge-demo-db')
        self.assertEqual(module.DATA['sgi-uploads'], Path('/srv/umsa-clean-apps/sgi/uploads'))
        self.assertNotIn('node_modules', {p.name for p in module.DATA.values()})


if __name__ == '__main__':
    unittest.main()
