import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('mutable', Path(__file__).with_name('stage-mutable-files.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MutableStaging(unittest.TestCase):
    def test_rejects_arbitrary_run_paths(self):
        for value in ('../1', '1-2/3', '1;id', '1-2\n', ''):
            with self.assertRaises(ValueError):
                module.validate_identifier(value)

    def test_paths_are_explicit_and_unique(self):
        self.assertEqual(len(module.PATHS), len(set(module.PATHS.values())))
        self.assertTrue(all(p.startswith(('/opt/', '/home/', '/var/')) for p in module.PATHS.values()))
        self.assertIn('/opt/directus-admin/uploads', module.PATHS.values())


if __name__ == '__main__':
    unittest.main()
