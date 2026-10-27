import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('offsite', Path(__file__).with_name('rehearse-offsite-backups.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class OffsiteRehearsal(unittest.TestCase):
    def test_only_reviewed_databases_and_destinations(self):
        plan = module.make_plan('12345-1')
        self.assertEqual(set(plan), {'directus', 'trazabilidad_rrpp'})
        self.assertEqual({value[0] for value in plan.values()}, {'directus', 'sitrep'})
        self.assertTrue(all(value[1].startswith('REHEARSAL-hostinger-') for value in plan.values()))

    def test_rejects_shell_and_path_input(self):
        for value in ('../1', '1;id', '1-2/3', '', '1-2\n'):
            with self.assertRaises(ValueError):
                module.make_plan(value)


if __name__ == '__main__':
    unittest.main()
