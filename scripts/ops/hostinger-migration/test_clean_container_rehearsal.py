import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('clean_containers', Path(__file__).with_name('clean-container-rehearsal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CleanContainerGuards(unittest.TestCase):
    def test_environment_uses_allowlist_instead_of_old_image_path_or_injection(self):
        self.assertEqual(module.environment({'DB_USER':'app','PATH':'/old','LD_PRELOAD':'/old.so'}, {'DB_USER'}), {'DB_USER':'app'})
        with self.assertRaises(ValueError):
            module.environment({'DB_USER':'app\nLD_PRELOAD=old'}, {'DB_USER'})

    def test_streamed_archive_digest(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'archive'
            p.write_bytes(b'abc')
            self.assertEqual(module.digest(p), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')


if __name__ == '__main__':
    unittest.main()
