import base64
import importlib.util
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location('wiki_loader', HERE / 'restore-wiki-loader.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class WikiLoaderTests(unittest.TestCase):
    def test_official_archive_and_core_cannot_be_substituted(self):
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / 'wrong.tar.gz'
            archive.write_bytes(b'wrong archive')
            with self.assertRaisesRegex(RuntimeError, 'fingerprint'):
                helper.official(archive)
        for manifest in [{}, {'load.php': helper.VENDOR_SHA}, {'../other.php': '0' * 64}]:
            with self.assertRaisesRegex(RuntimeError, 'inventory'):
                helper.core(manifest)

    def test_preflight_creates_no_backups_and_never_probes_or_writes(self):
        with patch.object(helper, 'preflight', return_value=({'load.php': b'vendor'}, {'load.php': b'stub'}, {}, {}, 13465)), \
                patch.object(helper, 'atomic') as atomic, patch.object(helper, 'public_checks') as public:
            result = helper.execute({'mode': 'preflight'})
        self.assertTrue(result['read_only'])
        atomic.assert_not_called()
        public.assert_not_called()

    def test_preflight_rejects_unreviewed_context_before_reading_files(self):
        for payload in [{}, {'mode': 'apply', 'run': '../escape'}, {'mode': 'other'}]:
            with self.assertRaisesRegex(RuntimeError, 'context'):
                helper.preflight(payload)

    def fixture(self, root):
        wiki = root / 'wiki'; wiki.mkdir()
        stage = root / 'stage'; stage.mkdir()
        previous, files, infos = {}, {}, {}
        for name in helper.ORDER:
            p = wiki / name; p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(b'stub ' + name.encode()); p.chmod(0o644)
            previous[name], files[name], infos[name] = p.read_bytes(), b'vendor ' + name.encode(), p.stat()
        loader = wiki / 'load.php'
        settings = wiki / 'LocalSettings.php'; settings.write_bytes(b'preserve fixture settings')
        provenance = stage / 'provenance.json'; provenance.write_bytes(b'original manifest')
        lock = root / 'lock'; lock.touch()
        protected = {'settings_sha': helper.sha(settings.read_bytes()), 'provenance_sha': helper.sha(provenance.read_bytes())}
        before = (files, previous, infos, protected, 13465)
        overrides = dict(WIKI=wiki, STAGE=stage, PROVENANCE=provenance, LOCK=lock)
        return loader, settings, provenance, before, overrides

    @unittest.skipUnless(os.geteuid() == 0, 'Real ownership and rollback run as root in isolated CI')
    def test_apply_only_replaces_loader_preserves_configuration_and_adds_private_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            loader, settings, provenance, before, overrides = self.fixture(Path(directory))
            with patch.multiple(helper, **overrides), patch.object(helper, 'preflight', return_value=before), \
                    patch.object(helper, 'core', return_value=13465), patch.object(helper, 'eventual_checks', return_value=[{'kind': 'scripts'}]):
                result = helper.execute({'mode': 'apply', 'run': '123-1', 'commit': 'a' * 40, 'manifest': {}})
            for name in helper.ORDER:
                self.assertEqual((loader.parent / name).read_bytes(), before[0][name])
            self.assertEqual(settings.read_bytes(), b'preserve fixture settings')
            self.assertEqual(provenance.read_bytes(), b'original manifest')
            self.assertEqual(stat.S_IMODE(loader.stat().st_mode), 0o644)
            backup = Path(result['backup'])
            for number, name in enumerate(helper.ORDER):
                self.assertEqual((backup / (str(number) + '.before')).read_bytes(), before[1][name])
            self.assertEqual(stat.S_IMODE(backup.stat().st_mode), 0o700)
            self.assertEqual(stat.S_IMODE((backup / '0.before').stat().st_mode), 0o600)
            self.assertTrue(json.loads((backup / 'provenance.addendum.json').read_text())['original_provenance_unchanged'])

    @unittest.skipUnless(os.geteuid() == 0, 'Real ownership and rollback run as root in isolated CI')
    def test_failed_checks_restore_only_loader_without_overwriting_concurrent_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            loader, settings, provenance, before, overrides = self.fixture(Path(directory))
            def failure():
                settings.write_bytes(b'concurrent settings')
                raise RuntimeError('synthetic failure')
            with patch.multiple(helper, **overrides), patch.object(helper, 'preflight', return_value=before), \
                    patch.object(helper, 'core', return_value=13465), patch.object(helper, 'eventual_checks', side_effect=failure):
                with self.assertRaisesRegex(RuntimeError, 'preserved/restored'):
                    helper.execute({'mode': 'apply', 'run': '123-1', 'commit': 'a' * 40, 'manifest': {}})
            for name in helper.ORDER:
                self.assertEqual((loader.parent / name).read_bytes(), before[1][name])
            self.assertEqual(settings.read_bytes(), b'concurrent settings')
            self.assertEqual(provenance.read_bytes(), b'original manifest')

    @unittest.skipUnless(os.geteuid() == 0, 'Real ownership and rollback run as root in isolated CI')
    def test_concurrent_loader_change_is_not_overwritten_by_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            loader, settings, provenance, before, overrides = self.fixture(Path(directory))
            def failure():
                loader.write_bytes(b'concurrent loader')
                raise RuntimeError('synthetic failure')
            with patch.multiple(helper, **overrides), patch.object(helper, 'preflight', return_value=before), \
                    patch.object(helper, 'core', return_value=13465), patch.object(helper, 'eventual_checks', side_effect=failure):
                with self.assertRaisesRegex(RuntimeError, 'Concurrent managed core change'):
                    helper.execute({'mode': 'apply', 'run': '123-1', 'commit': 'a' * 40, 'manifest': {}})
            self.assertEqual(loader.read_bytes(), b'concurrent loader')
            for name in helper.BACKPORTS:
                self.assertEqual((loader.parent / name).read_bytes(), before[1][name])

    @unittest.skipUnless(os.geteuid() == 0, 'Real ownership and rollback run as root in isolated CI')
    def test_loader_cas_after_preflight_prevents_backup_and_activation(self):
        with tempfile.TemporaryDirectory() as directory:
            loader, settings, provenance, before, overrides = self.fixture(Path(directory))
            loader.write_bytes(b'concurrent loader')
            with patch.multiple(helper, **overrides), patch.object(helper, 'preflight', return_value=before), \
                    patch.object(helper, 'core', return_value=13465), patch.object(helper, 'atomic') as atomic:
                with self.assertRaisesRegex(RuntimeError, 'before activation'):
                    helper.execute({'mode': 'apply', 'run': '123-1', 'manifest': {}})
                atomic.assert_not_called()

    def test_workflow_is_manual_master_only_and_rehearses_without_network(self):
        workflow = (HERE.parents[2] / '.github/workflows/hostinger-wiki-loader.yml').read_text()
        self.assertIn("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/master'", workflow)
        self.assertIn('--network none', workflow)
        self.assertIn('HOSTINGER_MIGRATION_KEY', workflow)
        self.assertNotIn('SSH_PRIVATE_KEY', workflow)
        self.assertIn('StrictHostKeyChecking=yes', workflow)
        self.assertNotIn('systemctl', workflow)

    @unittest.skipUnless(os.geteuid() == 0, 'Real ownership and rollback run as root in isolated CI')
    def test_partial_second_write_failure_rolls_back_all_files_and_keeps_backup(self):
        with tempfile.TemporaryDirectory() as directory:
            loader, settings, provenance, before, overrides = self.fixture(Path(directory))
            real_atomic = helper.atomic
            def failing_atomic(path, data, *args):
                if path == loader.parent / helper.ORDER[1] and data == before[0][helper.ORDER[1]]:
                    raise RuntimeError('Synthetic second-file failure')
                return real_atomic(path, data, *args)
            with patch.multiple(helper, **overrides), patch.object(helper, 'preflight', return_value=before), \
                    patch.object(helper, 'core', return_value=13465), patch.object(helper, 'atomic', side_effect=failing_atomic), \
                    patch.object(helper, 'eventual_checks') as checks:
                with self.assertRaisesRegex(RuntimeError, 'all three previous core files preserved/restored'):
                    helper.execute({'mode': 'apply', 'run': '123-1', 'commit': 'a' * 40, 'manifest': {}})
                checks.assert_not_called()
            for name in helper.ORDER:
                self.assertEqual((loader.parent / name).read_bytes(), before[1][name])
            self.assertTrue((overrides['STAGE'] / 'wiki-loader-recoveries/123-1/provenance.addendum.json').is_file())

    def test_future_builder_uses_official_candidate_without_runtime_wiki_stub(self):
        builder = (HERE / 'clean-cms.py').read_text()
        self.assertIn('wiki_loader.official(root / \'wiki.tar.gz\')', builder)
        self.assertNotIn('wiki-load.php', builder)
        self.assertNotIn('WIKI_LOAD', builder)


if __name__ == '__main__':
    unittest.main()
