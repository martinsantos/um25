import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('dedup', Path(__file__).with_name('deduplicate-directus-backups.py'))
dedup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dedup)

FINGERPRINT = '''digest = hashlib.sha256()
for path in sorted(item for item in root.rglob('*') if item.is_file()):
    relative = path.relative_to(root).as_posix().encode()
    digest.update(relative)
    digest.update(b'\\0')
    digest.update(str(path.stat().st_size).encode())
    digest.update(b'\\0')
    digest.update(path.read_bytes())
result = digest.hexdigest()
'''


class BackupDedupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()

    def tearDown(self):
        self.temp.cleanup()

    def fingerprint(self, root):
        namespace = {'root': root, 'hashlib': hashlib}
        exec(dedup.patch_script(FINGERPRINT), namespace)
        return namespace['result']

    def test_health_updates_do_not_hide_business_changes(self):
        root = self.root / 'uploads'
        root.mkdir()
        marker = root / 'directus-health-file'
        asset = root / 'document.pdf'
        marker.write_text('12345')
        asset.write_bytes(b'original business file')
        first = self.fingerprint(root)
        marker.write_text('56789')
        self.assertEqual(first, self.fingerprint(root))
        asset.write_bytes(b'changed business file!')
        self.assertNotEqual(first, self.fingerprint(root))

    def test_nested_and_extension_health_names_are_still_backed_up(self):
        for name in ('uploads', 'extensions'):
            root = self.root / name
            root.mkdir()
            child = root / 'folder'
            child.mkdir()
            marker = child / 'directus-health-file' if name == 'uploads' else root / 'directus-health-file'
            marker.write_text('a')
            first = self.fingerprint(root)
            marker.write_text('b')
            self.assertNotEqual(first, self.fingerprint(root))

    def test_referenced_backups_are_never_selected(self):
        checkpoint = self.root / 'directus-checkpoint-test.txt'
        checkpoint.write_text('uploads=old.tar.gz\n')
        with self.assertRaisesRegex(RuntimeError, 'still referenced'):
            dedup.verify_references(self.root, ['old.tar.gz'])

    def test_content_changes_and_symlinks_stop_cleanup(self):
        path = self.root / 'archive.gz'
        path.write_bytes(b'original')
        digest = dedup.sha(path)
        path.write_bytes(b'changed')
        with self.assertRaises(RuntimeError):
            dedup.verify_files(self.root, {'archive.gz': digest})
        link = self.root / 'alias.gz'
        link.symlink_to(path)
        with self.assertRaises(RuntimeError):
            dedup.verify_files(self.root, {'alias.gz': dedup.sha(path)})

    def test_unknown_script_is_not_patched(self):
        with self.assertRaises(RuntimeError):
            dedup.patch_script('unrecognized backup implementation')


if __name__ == '__main__':
    unittest.main()
