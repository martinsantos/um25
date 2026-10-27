import importlib.util
from pathlib import Path
import unittest
from unittest.mock import call, patch

spec = importlib.util.spec_from_file_location('sitrep_swap', Path(__file__).with_name('sitrep-database-swap.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepDatabaseSwapTests(unittest.TestCase):
    def test_names_are_bounded_and_reject_injection(self):
        self.assertEqual(module.names('42-1'), ('umsa_sr_next_42_1', 'umsa_sr_before_42_1'))
        for value in ('42;other', '1' * 30 + '-1', '42-1-x'):
            with self.assertRaises(ValueError):
                module.names(value)
        with self.assertRaises(ValueError):
            module.rename_statement('trazabilidad_rrpp', 'a;other')

    def test_failed_second_rename_restores_the_previous_name(self):
        with patch.object(module, 'rename', side_effect=[None, RuntimeError('failure'), None]) as rename:
            with self.assertRaises(RuntimeError):
                module.swap('db-container', 'admin', '42-1')
        self.assertEqual(rename.call_args_list, [
            call('db-container', 'admin', 'trazabilidad_rrpp', 'umsa_sr_before_42_1'),
            call('db-container', 'admin', 'umsa_sr_next_42_1', 'trazabilidad_rrpp'),
            call('db-container', 'admin', 'umsa_sr_before_42_1', 'trazabilidad_rrpp'),
        ])


if __name__ == '__main__':
    unittest.main()
