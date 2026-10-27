import importlib.util
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('sitrep_refresh', Path(__file__).with_name('sitrep-final-refresh.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepFinalRefreshTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.root = self.base / 'app'
        self.snapshot = self.base / 'snapshot'
        self.root.mkdir()
        self.snapshot.mkdir()
        for name in ('data', 'uploads'):
            (self.root / name).mkdir()
            (self.root / name / 'value').write_text('old-' + name)
            (self.snapshot / ('incoming-' + name)).mkdir()
            (self.snapshot / ('incoming-' + name) / 'value').write_text('new-' + name)

    def tearDown(self):
        self.temp.cleanup()

    def test_tree_swap_and_recovery_preserve_both_versions(self):
        changed = module.install_trees(self.snapshot, self.root)
        self.assertEqual((self.root / 'data/value').read_text(), 'new-data')
        self.assertEqual((self.snapshot / 'previous-data/value').read_text(), 'old-data')
        module.restore_trees(self.snapshot, self.root, changed)
        self.assertEqual((self.root / 'data/value').read_text(), 'old-data')
        self.assertEqual((self.snapshot / 'rejected-data/value').read_text(), 'new-data')

    def test_second_tree_failure_restores_the_first_tree(self):
        (self.snapshot / 'incoming-uploads').rename(self.snapshot / 'not-incoming')
        with self.assertRaises(RuntimeError):
            module.install_trees(self.snapshot, self.root)
        self.assertEqual((self.root / 'data/value').read_text(), 'old-data')
        self.assertEqual((self.root / 'uploads/value').read_text(), 'old-uploads')
        self.assertEqual((self.snapshot / 'rejected-data/value').read_text(), 'new-data')

    def test_rejects_symbolic_link_instead_of_swapping_it(self):
        (self.root / 'data').rename(self.root / 'stored-data')
        (self.root / 'data').symlink_to(self.root / 'stored-data')
        with self.assertRaises(RuntimeError):
            module.install_trees(self.snapshot, self.root)
        self.assertTrue((self.root / 'data').is_symlink())

    def test_health_requires_both_application_and_database(self):
        response = Mock(status=200)
        response.read.return_value = json.dumps({'status': 'ok', 'db': 'connected'}).encode()
        connection = Mock()
        connection.getresponse.return_value = response
        with patch.object(module.http.client, 'HTTPConnection', return_value=connection):
            self.assertTrue(module.health_ready())
            response.read.return_value = json.dumps({'status': 'ok', 'db': 'disconnected'}).encode()
            self.assertFalse(module.health_ready())

    def test_run_identifier_rejects_unexpected_input(self):
        self.assertEqual(module.safe_id('123-1'), '123-1')
        with self.assertRaises(ValueError):
            module.safe_id('1;other')

    def test_offsite_listing_requires_one_file_with_the_exact_size(self):
        line = '-rw------- 1 umbak umbak 123 Oct 27 20:00 CUTOVER-sitrep-42-1.dump'
        self.assertTrue(module.backup_listing_matches(line, 'CUTOVER-sitrep-42-1.dump', 123))
        self.assertFalse(module.backup_listing_matches(line, 'CUTOVER-sitrep-42-1.dump', 124))
        self.assertFalse(module.backup_listing_matches(line + '\n' + line, 'CUTOVER-sitrep-42-1.dump', 123))

    def test_tree_manifest_rejects_symlinks_and_tracks_content(self):
        root = self.snapshot / 'incoming-data'
        first = module.tree_manifest(root)
        (root / 'value').write_text('different')
        second = module.tree_manifest(root)
        self.assertNotEqual(first['sha256'], second['sha256'])
        (root / 'link').symlink_to(root / 'value')
        with self.assertRaises(RuntimeError):
            module.tree_manifest(root)

    def test_files_backup_preserves_both_reviewed_trees(self):
        manifest = {name: module.tree_manifest(self.snapshot / ('incoming-' + name)) for name in ('data', 'uploads')}
        archive, digest = module.archive_trees(self.snapshot, '42-1', manifest)
        self.assertEqual(digest, module.file_sha256(archive))
        with tarfile.open(archive, mode='r:gz') as saved:
            self.assertEqual(saved.extractfile('data/value').read(), b'new-data')
            self.assertEqual(saved.extractfile('uploads/value').read(), b'new-uploads')


if __name__ == '__main__':
    unittest.main()
