import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('repair_tls', Path(__file__).with_name('sitrep-repair-proxy-tls.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepProxyRepairTests(unittest.TestCase):
    def test_renderer_is_replaced_only_after_preserving_the_reviewed_original(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            existing, revised, backup = root / 'gate.py', root / 'new.py', root / 'old.py'
            existing.write_text('reviewed old')
            revised.write_text('reviewed new')
            with patch.object(module, 'OLD_RENDERER_SHA256', module.digest(existing.read_bytes())):
                module.install_renderer(existing, revised, backup)
            self.assertEqual(existing.read_text(), 'reviewed new')
            self.assertEqual(backup.read_text(), 'reviewed old')
            module.install_renderer(existing, revised, backup)

    def test_unexpected_renderer_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            existing, revised, backup = root / 'gate.py', root / 'new.py', root / 'old.py'
            existing.write_text('unexpected')
            revised.write_text('reviewed new')
            with self.assertRaises(RuntimeError):
                module.install_renderer(existing, revised, backup)
            self.assertEqual(existing.read_text(), 'unexpected')
            self.assertFalse(backup.exists())


if __name__ == '__main__':
    unittest.main()
