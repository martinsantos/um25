import importlib.util
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('caches', Path(__file__).with_name('prune-package-caches.py'))
caches = importlib.util.module_from_spec(spec)
spec.loader.exec_module(caches)


class PackageCachesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name).resolve()
        self.cache = self.base / 'downloads'
        self.cache.mkdir()
        (self.cache / 'payload').write_bytes(b'reproducible download')
        os.utime(self.cache, (time.time() - 86400,) * 2)
        self.mount = patch.object(caches, 'has_mount', return_value=False)
        self.mount.start()

    def tearDown(self):
        self.mount.stop()
        self.temp.cleanup()

    def selected(self, protected=(), busy=False):
        return caches.select([self.cache], set(protected), busy)

    def test_protects_active_parent_child_and_installer(self):
        self.assertEqual(self.selected([self.cache / 'payload']), [])
        self.assertEqual(self.selected([self.base]), [])
        self.assertEqual(self.selected(busy=True), [])
        self.assertEqual(len(self.selected()), 1)

    def test_preserves_recent_symlink_mount_and_special_content(self):
        os.utime(self.cache, None)
        self.assertEqual(self.selected(), [])
        os.utime(self.cache, (time.time() - 86400,) * 2)
        with patch.object(caches, 'has_mount', return_value=True):
            self.assertEqual(self.selected(), [])
        (self.cache / 'link').symlink_to(self.base)
        os.utime(self.cache, (time.time() - 86400,) * 2)
        with self.assertRaisesRegex(RuntimeError, 'indirect'):
            self.selected()

    def test_changed_inventory_invalidates_plan_before_deletion(self):
        target = self.selected()[0]
        (self.cache / 'payload').write_bytes(b'changed download')
        with self.assertRaisesRegex(RuntimeError, 'changed since audit'):
            caches.clear(target)
        self.assertTrue((self.cache / 'payload').exists())

    def test_clears_only_selected_cache_and_preserves_directory_attributes(self):
        source = self.base / 'application-source'
        source.write_bytes(b'preserve application')
        target = self.selected()[0]
        original_mode = self.cache.stat().st_mode
        caches.clear(target)
        self.assertEqual(list(self.cache.iterdir()), [])
        self.assertEqual(self.cache.stat().st_mode, original_mode)
        self.assertEqual(source.read_bytes(), b'preserve application')

    def test_unmatched_apply_fingerprint_never_deletes(self):
        with patch.object(caches, 'CACHES', [str(self.cache)]), \
             patch.object(caches, 'inspect_protection', return_value=(set(), False)), \
             patch('sys.argv', ['cleanup', '--apply', '--expected-plan-sha', '0' * 64]), \
             patch('builtins.print'):
            with self.assertRaisesRegex(RuntimeError, 'Plan changed'):
                caches.main()
        self.assertTrue((self.cache / 'payload').exists())


if __name__ == '__main__':
    unittest.main()
