import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('image', Path(__file__).with_name('restore-case-image.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CaseImage(unittest.TestCase):
    def test_rejects_unreviewed_contents_and_symlinks(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / 'image.jpg'
            target.write_bytes(b'unexpected')
            with self.assertRaises(RuntimeError):
                module.checked_hash(target, module.SOURCE_SHA)
            link = Path(folder) / 'link.jpg'
            link.symlink_to(target)
            with self.assertRaises(RuntimeError):
                module.checked_hash(link, module.SOURCE_SHA)


if __name__ == '__main__':
    unittest.main()
