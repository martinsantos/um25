import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sgi_lock', Path(__file__).with_name('sgi-write-lock.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SgiWriteLockTests(unittest.TestCase):
    def test_lock_is_scoped_to_sgi_and_bounded(self):
        sql = module.lock_sql(['z_table', 'a_table'])
        self.assertIn('`sgi_production`.`a_table` READ', sql)
        self.assertIn('`sgi_production`.`z_table` READ', sql)
        self.assertIn('SLEEP(28800)', sql)
        self.assertNotIn('unrelated_database', sql)

    def test_rejects_invalid_or_repeated_table_names(self):
        for names in ([], ['same', 'same'], ['name;other'], ['../other']):
            with self.assertRaises(ValueError):
                module.lock_sql(names)


if __name__ == '__main__':
    unittest.main()
