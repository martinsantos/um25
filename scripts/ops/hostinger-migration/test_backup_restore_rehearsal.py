import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('rehearse-backup-restore.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RestoreRehearsal(unittest.TestCase):
    def test_rejects_wrong_inventory(self):
        with self.assertRaises(ValueError):
            module.verified_paths({}, Path('/tmp'))

    def test_rejects_mismatched_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            manifest = {}
            for name, digest in module.CHECKSUMS.items():
                filename = f'REHEARSAL-hostinger-{name}-40584949950-1.dump'
                (root / filename).write_bytes(b'wrong')
                manifest[name] = {'file': filename, 'sha256': digest, 'bytes': 5}
            with self.assertRaises(ValueError):
                module.verified_paths(manifest, root)


if __name__ == '__main__':
    unittest.main()
