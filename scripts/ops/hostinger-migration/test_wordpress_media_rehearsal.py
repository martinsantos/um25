import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('media', Path(__file__).with_name('rehearse-wordpress-media.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class WordPressMedia(unittest.TestCase):
    def test_refuses_changed_existing_image(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'source'
            target = root / 'target'
            source.mkdir()
            target.mkdir()
            (source / 'image.jpg').write_bytes(b'source')
            (target / 'image.jpg').write_bytes(b'different')
            with self.assertRaises(ValueError):
                module.missing_images(source, target)

    def test_refuses_non_image(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'source'
            target = root / 'target'
            (source / '2026/10').mkdir(parents=True)
            target.mkdir()
            (source / '2026/10/invalid.jpeg').write_text('not an image')
            with self.assertRaises(ValueError):
                module.missing_images(source, target)


if __name__ == '__main__':
    unittest.main()
