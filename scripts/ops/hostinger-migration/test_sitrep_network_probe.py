import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sitrep_probe', Path(__file__).with_name('sitrep-network-probe.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepNetworkProbeTests(unittest.TestCase):
    def test_probe_token_is_fixed_and_rejects_untrusted_input(self):
        self.assertEqual(module.token('42-1'), 'UMSA-SITREP-NETWORK-42-1')
        for value in ('42;other', '1' * 21 + '-1', '42-1-extra'):
            with self.assertRaises(ValueError):
                module.token(value)


if __name__ == '__main__':
    unittest.main()
