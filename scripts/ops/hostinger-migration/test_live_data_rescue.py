import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('live_rescue', Path(__file__).with_name('capture-live-data-rescue.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LiveDataRescueTests(unittest.TestCase):
    def test_mariadb_inventory_requires_sgi_and_safe_identifiers(self):
        self.assertEqual(module.maria_names('sgi_production\nvecinorabioso\n'), ['sgi_production', 'vecinorabioso'])
        for value in ('', 'mysql\nsgi_production\n', 'sgi_production\nsgi_production\n',
                      'sgi_production\nunsafe;sql\n', 'only_other_database\n'):
            with self.assertRaises(RuntimeError):
                module.maria_names(value)


if __name__ == '__main__':
    unittest.main()
