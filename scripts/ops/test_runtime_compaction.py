import importlib.util
import shutil
import tempfile
import unittest
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


if __name__ == '__main__':
    unittest.main()
