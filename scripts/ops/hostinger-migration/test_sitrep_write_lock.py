import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sitrep_lock', Path(__file__).with_name('sitrep-write-lock.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepWriteLockTests(unittest.TestCase):
    def test_lock_is_bounded_and_read_compatible(self):
        self.assertIn('IN SHARE MODE', module.LOCK_SQL)
        self.assertIn('pg_sleep(28800)', module.LOCK_SQL)
        self.assertIn('ROLLBACK;', module.LOCK_SQL)

    def test_fixed_database_and_noninteractive_input(self):
        command = module.lock_command('isolated-test-container', '42-1')
        self.assertIn('trazabilidad_rrpp', command)
        self.assertEqual(command[-2:], ['--file', '-'])
        self.assertIn('PGAPPNAME=umsa_sitrep_fence_42_1', command)
        with self.assertRaises(ValueError):
            module.application_name('42;other')


if __name__ == '__main__':
    unittest.main()
