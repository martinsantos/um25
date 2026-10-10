import importlib.util
import gzip
import hashlib
import struct
import shutil
import tempfile
import unittest
from unittest import mock
from pathlib import Path

spec = importlib.util.spec_from_file_location('compaction', Path(__file__).with_name('compact-runtime-backups.py'))
compaction = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compaction)


class RuntimeCompactionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / 'current'
        self.backups = self.root / 'backups'
        self.backup = self.backups / 'umsa-campaign-123-1/previous-dist/client'
        self.source.mkdir()
        self.backup.mkdir(parents=True)
        self.data = b'verified asset' * 10000
        (self.source / 'asset.bin').write_bytes(self.data)
        (self.backup / 'asset.bin').write_bytes(self.data)

    def tearDown(self):
        self.temp.cleanup()

    def test_only_identical_regular_assets_are_selected(self):
        (self.source / 'changed.bin').write_bytes(b'a' * 100000)
        (self.backup / 'changed.bin').write_bytes(b'b' * 100000)
        (self.backup / 'secret.env').write_text('keep')
        (self.backup / 'link.bin').symlink_to(self.source / 'asset.bin')
        selected = compaction.select(self.source, self.backups)
        self.assertEqual([Path(t['path']).name for t in selected], ['asset.bin'])

    def test_identical_failed_runtime_assets_are_compacted(self):
        failed = self.backup.parents[1] / 'failed-dist/client'
        failed.mkdir(parents=True)
        path = failed / 'asset.bin'
        path.write_bytes(self.data)
        path.chmod(0o640)
        before = path.stat()
        unique = failed / 'unique.bin'
        unique.write_bytes(b'keep failed runtime content' * 5000)
        selected = compaction.select(self.source, self.backups)
        self.assertEqual({Path(t['path']) for t in selected},
                         {self.backup / 'asset.bin', path})
        target = next(t for t in selected if Path(t['path']) == path)
        compaction.compact(target, copier=shutil.copyfile)
        self.assertEqual(path.read_bytes(), self.data)
        self.assertEqual(path.stat().st_mode, before.st_mode)
        self.assertEqual(path.stat().st_mtime_ns, before.st_mtime_ns)
        self.assertEqual((self.source / 'asset.bin').read_bytes(), self.data)
        self.assertEqual(unique.read_bytes(), b'keep failed runtime content' * 5000)

    def test_staging_runtime_is_never_selected(self):
        incoming = self.backup.parents[1] / 'incoming-dist/client'
        incoming.mkdir(parents=True)
        (incoming / 'asset.bin').write_bytes(self.data)
        selected = compaction.select(self.source, self.backups)
        self.assertEqual([Path(t['path']) for t in selected],
                         [self.backup / 'asset.bin'])

    def test_symlinked_failed_runtime_is_never_selected(self):
        outside = self.root / 'outside'
        (outside / 'client').mkdir(parents=True)
        (outside / 'client/asset.bin').write_bytes(self.data)
        (self.backup.parents[1] / 'failed-dist').symlink_to(outside)
        selected = compaction.select(self.source, self.backups)
        self.assertEqual([Path(t['path']) for t in selected],
                         [self.backup / 'asset.bin'])

    def test_atomic_replacement_preserves_content_and_permissions(self):
        path = self.backup / 'asset.bin'
        path.chmod(0o640)
        before = path.stat()
        target = compaction.select(self.source, self.backups)[0]
        compaction.compact(target, copier=shutil.copyfile)
        self.assertEqual(path.read_bytes(), self.data)
        self.assertEqual(path.stat().st_mode, before.st_mode)
        self.assertEqual(path.stat().st_mtime_ns, before.st_mtime_ns)
        self.assertEqual((self.source / 'asset.bin').read_bytes(), self.data)

    def test_changed_backup_aborts_without_replacement(self):
        target = compaction.select(self.source, self.backups)[0]
        path = self.backup / 'asset.bin'
        path.write_bytes(b'user changed data')
        with self.assertRaises(RuntimeError):
            compaction.compact(target, copier=shutil.copyfile)
        self.assertEqual(path.read_bytes(), b'user changed data')

    def test_failed_or_wrong_clone_preserves_original(self):
        target = compaction.select(self.source, self.backups)[0]
        with self.assertRaises(RuntimeError):
            compaction.compact(target, copier=lambda source, destination: destination.write_bytes(b'wrong'))
        self.assertEqual(Path(target['path']).read_bytes(), self.data)
        self.assertEqual(list(self.backup.glob('.um-reflink-*')), [])



class ArchiveRangeCompactionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.expected = {}
        for day in (13, 14, 23):
            name = 'directus-uploads-202607%02d-020001.tar.gz' % day
            data = gzip.compress(b'a' * (3 * compaction.ARCHIVE_CHUNK), compresslevel=0, mtime=day)
            path = self.root / name
            path.write_bytes(data)
            path.chmod(0o640)
            self.expected[name] = hashlib.sha256(data).hexdigest()

    def tearDown(self):
        self.temp.cleanup()

    def plan(self):
        return compaction.select_archive_ranges(self.root, self.expected)

    def test_only_identical_aligned_ranges_are_selected(self):
        plan = self.plan()
        self.assertEqual(len(plan['targets']), 2)
        for target in plan['targets']:
            self.assertEqual(target['ranges'][0][0], compaction.ARCHIVE_CHUNK)
            for offset, length in target['ranges']:
                self.assertEqual(offset % 4096, 0)
                self.assertEqual(length % 4096, 0)
                with (self.root / plan['source']).open('rb') as source, (self.root / target['name']).open('rb') as previous:
                    source.seek(offset)
                    previous.seek(offset)
                    self.assertEqual(source.read(length), previous.read(length))

    def test_success_keeps_every_archive_byte_and_metadata(self):
        plan = self.plan()
        before = {name: (path.read_bytes(), compaction.signature(path))
                  for name in self.expected for path in [self.root / name]}
        calls = []
        def kernel(source_fd, operation, request, mutate):
            self.assertEqual(operation, compaction.FIDEDUPERANGE)
            self.assertEqual(len(request), 56)
            offset, length, count, reserved1, reserved2 = struct.unpack_from('=QQHHI', request)
            destination_fd, destination_offset = struct.unpack_from('=qQ', request, 24)
            self.assertEqual((count, reserved1, reserved2), (1, 0, 0))
            self.assertEqual(destination_offset, offset)
            self.assertTrue(mutate)
            self.assertNotEqual(source_fd, destination_fd)
            self.assertLessEqual(length, compaction.ARCHIVE_CHUNK)
            calls.append((offset, length))
            struct.pack_into('=Qi', request, 40, length, 0)
        receipt = compaction.dedupe_archive_ranges(plan, ioctl=kernel)
        self.assertTrue(receipt['all_archive_bytes_verified'])
        self.assertEqual(receipt['kernel_verified_ranges'], len(calls))
        self.assertGreater(len(calls), 0)
        self.assertEqual(before, {name: ((self.root / name).read_bytes(), compaction.signature(self.root / name)) for name in self.expected})

    def test_changed_archive_aborts_before_kernel_write(self):
        plan = self.plan()
        path = self.root / plan['targets'][0]['name']
        with path.open('r+b') as file:
            file.seek(0)
            file.write(b'changed')
        kernel = mock.Mock()
        with self.assertRaises(RuntimeError):
            compaction.dedupe_archive_ranges(plan, ioctl=kernel)
        kernel.assert_not_called()

    def test_replaced_opened_inode_aborts_before_kernel_write(self):
        plan = self.plan()
        target = self.root / plan['targets'][0]['name']
        other = self.root / 'untargeted.gz'
        other.write_bytes(target.read_bytes())
        original_open = compaction.os.open
        def changed_open(path, flags):
            return original_open(other if Path(path) == target else path, flags)
        kernel = mock.Mock()
        with mock.patch.object(compaction.os, 'open', side_effect=changed_open):
            with self.assertRaises(RuntimeError):
                compaction.dedupe_archive_ranges(plan, ioctl=kernel)
        kernel.assert_not_called()

    def test_kernel_difference_stops_and_preserves_archives(self):
        plan = self.plan()
        before = {name: (self.root / name).read_bytes() for name in self.expected}
        def kernel(source_fd, operation, request, mutate):
            struct.pack_into('=Qi', request, 40, 0, 1)
        with self.assertRaises(RuntimeError):
            compaction.dedupe_archive_ranges(plan, ioctl=kernel)
        self.assertEqual(before, {name: (self.root / name).read_bytes() for name in self.expected})

    def test_symlink_archive_is_never_selected(self):
        path = self.root / sorted(self.expected)[0]
        preserved = self.root / 'preserved.gz'
        path.rename(preserved)
        path.symlink_to(preserved)
        with self.assertRaises(RuntimeError):
            self.plan()


if __name__ == '__main__':
    unittest.main()
