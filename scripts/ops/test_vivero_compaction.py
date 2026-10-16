import hashlib
import importlib.util
import os
import sqlite3
import struct
import tempfile
import unittest
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location('snapshots', Path(__file__).with_name('compact-vivero-snapshots.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SnapshotCompactionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.expected = {}
        for day in (1, 2, 3):
            name = '202610%02d-063000' % day
            directory = self.root / name
            directory.mkdir()
            path = directory / 'prod.db'
            with sqlite3.connect(path) as db:
                db.execute('CREATE TABLE fixture (payload BLOB)')
                db.execute('INSERT INTO fixture VALUES (?)', (b'preserve every version' * 50000,))
                db.execute('PRAGMA user_version=' + str(day))
            self.expected[name] = module.sha(path)
            (directory / 'uploads.tar.gz').write_bytes(b'keep original archived upload ' + bytes([day]))
            (directory / 'metadata.txt').write_text('snapshot ' + name)
            (directory / 'MANIFEST.sha256').write_text(self.expected[name] + '  prod.db\n')

    def tearDown(self):
        self.temp.cleanup()

    def plan(self):
        return module.make_plan(self.root, self.expected)

    def kernel(self, source, operation, request, mutate):
        self.assertEqual(operation, module.FIDEDUPERANGE)
        offset, length, count, reserved1, reserved2 = struct.unpack_from('=QQHHI', request)
        target, target_offset = struct.unpack_from('=qQ', request, 24)
        self.assertEqual((count, reserved1, reserved2, mutate), (1, 0, 0, True))
        self.assertNotEqual(source, target)
        self.assertEqual(offset % 4096, 0)
        self.assertEqual(length % 4096, 0)
        self.assertLessEqual(length, module.MAX_RANGE)
        self.assertEqual(os.pread(source, length, offset), os.pread(target, length, target_offset))
        struct.pack_into('=Qi', request, 40, length, 0)

    def test_each_version_and_every_manifest_remain_identical(self):
        plan = self.plan()
        self.assertGreater(len(plan['ranges']), 0)
        before = module.inventory(self.root, self.expected)
        result = module.compact(plan, self.expected, ioctl=self.kernel)
        self.assertTrue(result['all_snapshot_files_and_hashes_preserved'])
        self.assertEqual(result['snapshot_count'], 3)
        self.assertEqual(module.inventory(self.root, self.expected), before)

    def test_an_unknown_new_snapshot_is_not_modified(self):
        plan = self.plan()
        future = self.root / '20261004-063000'
        future.mkdir()
        (future / 'prod.db').write_bytes(b'outside audited set')
        # The root signature changes, so an already reviewed plan must be rebuilt.
        with self.assertRaises(RuntimeError):
            module.compact(plan, self.expected, ioctl=mock.Mock())
        rebuilt = self.plan()
        module.compact(rebuilt, self.expected, ioctl=self.kernel)
        self.assertEqual((future / 'prod.db').read_bytes(), b'outside audited set')

    def test_changed_snapshot_or_manifest_aborts_before_kernel_call(self):
        plan = self.plan()
        path = self.root / sorted(self.expected)[0] / 'metadata.txt'
        path.write_text('changed metadata')
        kernel = mock.Mock()
        with self.assertRaises(RuntimeError):
            module.compact(plan, self.expected, ioctl=kernel)
        kernel.assert_not_called()

    def test_a_symlinked_snapshot_is_refused(self):
        name = sorted(self.expected)[0]
        original = self.root / name / 'prod.db'
        preserved = original.with_suffix('.preserved')
        original.rename(preserved)
        original.symlink_to(preserved)
        with self.assertRaises(RuntimeError):
            self.plan()

    def test_kernel_difference_does_not_replace_snapshot_bytes(self):
        plan = self.plan()
        before = module.inventory(self.root, self.expected)
        def different(source, operation, request, mutate):
            struct.pack_into('=Qi', request, 40, 0, 1)
        with self.assertRaises(RuntimeError):
            module.compact(plan, self.expected, ioctl=different)
        self.assertEqual(module.inventory(self.root, self.expected), before)

    def test_restore_manifest_must_match(self):
        path = self.root / sorted(self.expected)[0] / 'MANIFEST.sha256'
        path.write_text('0' * 64 + '  prod.db\n')
        with self.assertRaises(RuntimeError):
            self.plan()

if __name__ == '__main__':
    unittest.main()
