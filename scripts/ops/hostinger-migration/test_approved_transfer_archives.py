import hashlib
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('approved_transports', Path(__file__).with_name('prune-approved-transfer-archives.py'))
prune = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prune)


class ApprovedTransportsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)
        for name, value in [('INCOMING', self.root), ('ROOT_UID', os.getuid())]:
            p = patch.object(prune, name, value)
            p.start()
            self.addCleanup(p.stop)
        p = patch.object(prune, 'secure_directory')
        p.start()
        self.addCleanup(p.stop)

    def file(self, name='archive.tar.gz'):
        path = self.root / name
        path.write_bytes(b'approved transfer archive')
        path.chmod(0o600)
        return path, (path.stat().st_size, hashlib.sha256(path.read_bytes()).hexdigest())

    def test_scope_is_exactly_the_two_approved_archives_and_excludes_rollback(self):
        self.assertEqual(len(prune.APPROVED), 2)
        self.assertEqual(sum(row[0] for row in prune.APPROVED.values()), 4198420488)
        self.assertFalse(set(prune.APPROVED) & set(prune.RETAINED))
        self.assertEqual(len(prune.RETAINED), 3)

    def test_validates_exact_bytes(self):
        path, expected = self.file()
        self.assertEqual(prune.validate_archive(path, expected)['sha256'], expected[1])
        with self.assertRaisesRegex(RuntimeError, 'contents changed'):
            prune.validate_archive(path, (expected[0], '0' * 64))

    def test_rejects_symlinks_hardlinks_and_writable_archives(self):
        path, expected = self.file()
        link = self.root / 'link'
        link.symlink_to(path)
        with self.assertRaises(OSError):
            prune.validate_archive(link, expected)
        os.link(path, self.root / 'hardlink')
        with self.assertRaisesRegex(RuntimeError, 'identity'):
            prune.validate_archive(path, expected)
        (self.root / 'hardlink').unlink()
        path.chmod(0o666)
        with self.assertRaisesRegex(RuntimeError, 'permissions'):
            prune.validate_archive(path, expected)

    def test_refuses_unapproved_paths_before_any_deletion(self):
        path, _ = self.file()
        with self.assertRaisesRegex(RuntimeError, 'Unapproved'):
            prune.remove_exact({'../archive': {'meta': prune.metadata(path.stat())}})
        self.assertTrue(path.is_file())

    def test_refuses_replacement_race(self):
        name = next(iter(prune.APPROVED))
        path, expected = self.file(name + '.tar.gz')
        row = prune.validate_archive(path, expected)
        path.write_bytes(b'replaced')
        with self.assertRaisesRegex(RuntimeError, 'replaced'):
            prune.remove_exact({name: row})
        self.assertTrue(path.exists())

    def test_removes_only_named_archives_and_preserves_every_other_file(self):
        unrelated, _ = self.file('keep.tar.gz')
        rows = {}
        for name in prune.APPROVED:
            path, expected = self.file(name + '.tar.gz')
            rows[name] = prune.validate_archive(path, expected)
        with patch.object(prune, 'no_open_consumers'):
            prune.remove_exact(rows)
        self.assertEqual(list(self.root.iterdir()), [unrelated])

    def test_apply_requires_actions_and_exact_inspection_snapshot(self):
        with patch.dict(os.environ, {'GITHUB_ACTIONS': 'false'}), patch('sys.argv', ['script', 'apply', 'x']):
            with self.assertRaisesRegex(RuntimeError, 'Only GitHub Actions'):
                prune.main()
        self.assertNotEqual(prune.digest({'artifacts': {}}), prune.digest({'artifacts': {'changed': True}}))


if __name__ == '__main__':
    unittest.main()
