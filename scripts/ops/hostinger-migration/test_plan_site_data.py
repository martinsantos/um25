import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('plan_site_data', Path(__file__).with_name('rehearse-plan-site-data.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PlanSiteDataTests(unittest.TestCase):
    def test_only_reviewed_json_object_is_accepted(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'overview.json'
            data = b'{"frentes": []}'
            path.write_bytes(data)
            digest = hashlib.sha256(data).hexdigest()
            self.assertEqual(module.read_reviewed(path, digest), data)
            with self.assertRaises(ValueError):
                module.read_reviewed(path, '0' * 64)
            path.write_bytes(b'[]')
            with self.assertRaises(ValueError):
                module.read_reviewed(path, hashlib.sha256(b'[]').hexdigest())

    def test_existing_data_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            parent = Path(tmp)
            self.assertEqual(module.validate_destination(parent), parent / 'site-data')
            (parent / 'site-data').mkdir()
            with self.assertRaises(ValueError):
                module.validate_destination(parent)


if __name__ == '__main__':
    unittest.main()
