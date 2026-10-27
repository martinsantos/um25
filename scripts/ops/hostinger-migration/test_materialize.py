import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('materialize', Path(__file__).with_name('materialize-files.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DestinationGuards(unittest.TestCase):
    def test_package_directories_only_when_empty(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'html').mkdir()
            (root / 'cgi-bin').mkdir()
            with patch.object(module, 'Path', return_value=root):
                self.assertTrue(module.empty_destination(root))
                (root / 'html/index.html').write_text('Existing site')
                self.assertFalse(module.empty_destination(root))

    def test_unexpected_directory_and_symlink_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'unexpected').mkdir()
            with patch.object(module, 'Path', return_value=root):
                self.assertFalse(module.empty_destination(root))
            link = root / 'html'
            link.symlink_to(root / 'unexpected', target_is_directory=True)
            self.assertFalse(module.empty_destination(link))


if __name__ == '__main__':
    unittest.main()
