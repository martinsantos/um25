import importlib.util
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('reviewed_prune', Path(__file__).with_name('prune-reviewed-migration.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReviewedArtifactPrune(unittest.TestCase):
    def batch(self, root):
        application = root / 'old-release/application'
        application.mkdir(parents=True)
        (application / 'dist').mkdir()
        (application / 'dist/page.html').write_text('regenerable HTML')
        (application / 'node_modules').mkdir()
        executable = application / 'node_modules/binary'
        executable.write_bytes(b'regenerable binary')
        os.link(executable, application / 'node_modules/hardlink')
        (application / 'node_modules/relative-link').symlink_to('binary')
        delivery = root / 'incoming/finished.tar.gz'
        delivery.parent.mkdir()
        delivery.write_bytes(b'completed transport')
        protected = root / 'keep'
        protected.mkdir()
        (protected / 'historical-backup.gpg').write_bytes(b'preserve exact backup bytes')
        (application.parent / 'publication.log').write_text('preserve review and rollback evidence')
        roots = (delivery, application)
        with patch.object(module.os, 'geteuid', return_value=0):
            rows = module.inventory(roots)
        return roots, rows, protected

    def test_only_the_eight_reviewed_paths_are_selectable(self):
        self.assertEqual(len(module.CANDIDATES), 8)
        self.assertEqual(sum(path.suffix == '.gz' for path in module.CANDIDATES), 5)
        self.assertEqual(sum(path.name == 'application' for path in module.CANDIDATES), 3)
        for root in module.CANDIDATES:
            self.assertFalse(any(module.overlaps(root, keep) for keep in module.PROTECTED))
        for live in module.LIVE_DATA:
            self.assertTrue(any(live == keep or keep in live.parents for keep in module.PROTECTED))
        self.assertFalse(any(module.CURRENT in str(root) and root.name == 'application'
                             for root in module.CANDIDATES))
        self.assertFalse(any(module.PREVIOUS in str(root) and root.name == 'application'
                             for root in module.CANDIDATES))

    def test_removes_only_finished_artifacts_and_preserves_backups_and_release_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            roots, rows, protected = self.batch(root)
            # An obsolete dependency alias must never be followed into kept data.
            outside_link = roots[1] / 'node_modules/outside-link'
            outside_link.symlink_to(protected, target_is_directory=True)
            rows = module.inventory(roots)
            original = (protected / 'historical-backup.gpg').read_bytes()
            module.remove_reviewed(roots, rows)
            self.assertTrue(all(not path.exists() for path in roots))
            self.assertEqual((protected / 'historical-backup.gpg').read_bytes(), original)
            self.assertTrue((root / 'old-release/publication.log').is_file())

    def test_directory_replaced_with_symlink_is_rejected_without_touching_its_target(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            roots, rows, protected = self.batch(root)
            old = roots[1] / 'dist'
            old.rename(root / 'moved-dist')
            old.symlink_to(protected, target_is_directory=True)
            with self.assertRaisesRegex(RuntimeError, 'identity changed'):
                module.remove_reviewed((roots[1],), rows)
            self.assertEqual((protected / 'historical-backup.gpg').read_bytes(), b'preserve exact backup bytes')

    def test_changed_file_identity_aborts_instead_of_unlinking_the_replacement(self):
        with tempfile.TemporaryDirectory() as directory:
            roots, rows, protected = self.batch(Path(directory))
            roots[0].rename(roots[0].with_suffix('.preserved'))
            roots[0].write_bytes(b'a different transport')
            with self.assertRaisesRegex(RuntimeError, 'identity changed'):
                module.remove_reviewed((roots[0],), rows)
            self.assertEqual(roots[0].read_bytes(), b'a different transport')
            self.assertTrue((protected / 'historical-backup.gpg').exists())

    def test_unexpected_child_aborts_before_removing_that_application(self):
        with tempfile.TemporaryDirectory() as directory:
            roots, rows, _ = self.batch(Path(directory))
            (roots[1] / 'new-data').write_text('new dependency')
            with self.assertRaisesRegex(RuntimeError, 'directory entries'):
                module.remove_reviewed((roots[1],), rows)
            self.assertTrue((roots[1] / 'new-data').exists())

    def test_external_hardlink_is_not_a_disposable_artifact(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            roots, _, protected = self.batch(root)
            os.link(roots[0], protected / 'required-transport')
            rows = module.inventory(roots)
            count = len({tuple(row['meta'][:2]) for row in rows.values()
                         if stat.S_ISREG(row['meta'][2])})
            with patch.object(module, 'EXPECTED_FILES', count), \
                    patch.object(module, 'unshared_bytes', return_value=0):
                with self.assertRaisesRegex(RuntimeError, 'hardlink outside'):
                    module.validate_batch(rows)
            self.assertTrue(roots[0].exists())

    def test_count_or_allocation_drift_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            roots, _, _ = self.batch(Path(directory))
            rows = module.inventory(roots)
            with self.assertRaisesRegex(RuntimeError, 'file count changed'):
                module.validate_batch(rows)
            count = len({tuple(row['meta'][:2]) for row in rows.values()
                         if stat.S_ISREG(row['meta'][2])})
            with patch.object(module, 'EXPECTED_FILES', count), \
                    patch.object(module, 'unshared_bytes', return_value=0):
                with self.assertRaisesRegex(RuntimeError, 'allocation changed'):
                    module.validate_batch(rows)

    def test_fiemap_shared_and_pending_extents_are_rejected_without_sync(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'artifact'
            path.write_bytes(b'data')
            for flag in (0x2000, 0x4, 0x2, 0x200, 0x400):
                def ioctl(fd, request, buffer, mutable):
                    self.assertEqual(request, 0xC020660B)
                    self.assertEqual(module.HDR.unpack_from(buffer)[2], 0)
                    module.HDR.pack_into(buffer, 0, 0, 0xffffffffffffffff, 0, 1, 128, 0)
                    module.EXT.pack_into(buffer, module.HDR.size, 0, 4096, 4096, 0, 0, flag | 1, 0, 0, 0)
                with self.subTest(flag=flag), patch.object(module.fcntl, 'ioctl', side_effect=ioctl):
                    with self.assertRaisesRegex(RuntimeError, 'unsupported artifact extent'):
                        module.unshared_bytes(path)

    def test_preservation_compares_all_existing_backup_files_and_allows_append_only_versions(self):
        with tempfile.TemporaryDirectory() as directory:
            keep = Path(directory)
            (keep / 'backup.gpg').write_bytes(b'original')
            before = module.inventory((keep,))
            (keep / 'new-backup.gpg').write_bytes(b'new version')
            with patch.object(module, 'PROTECTED', (keep,)):
                module.assert_preserved(before)
                (keep / 'backup.gpg').write_bytes(b'changed original')
                with self.assertRaisesRegex(RuntimeError, 'preserved file changed'):
                    module.assert_preserved(before)

    def test_live_database_can_write_without_weakening_backup_or_root_identity_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            live = root / 'sgi/data'
            live.mkdir(parents=True)
            log = live / 'ib_logfile0'
            log.write_bytes(b'ongoing database writes')
            backup = root / 'backup.gpg'
            backup.write_bytes(b'preserved historical backup')
            with patch.object(module, 'PROTECTED', (root,)), patch.object(module, 'LIVE_DATA', (live,)):
                before = module.inventory((root,))
                self.assertNotIn(str(log), before)
                self.assertEqual(len(before[str(live)]['meta']), 5)
                log.write_bytes(b'new normal database transaction')
                self.assertEqual(module.inventory((root,)), before)
                module.assert_preserved(before)
                backup.write_bytes(b'altered backup')
                with self.assertRaisesRegex(RuntimeError, 'preserved file changed'):
                    module.assert_preserved(before)

    def test_live_database_directory_replacement_or_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            protected = root / 'preserved'
            live = protected / 'data'
            live.mkdir(parents=True)
            with patch.object(module, 'PROTECTED', (protected,)), patch.object(module, 'LIVE_DATA', (live,)):
                before = module.inventory((protected,))
                live.rename(root / 'saved-original')
                live.mkdir()
                with self.assertRaisesRegex(RuntimeError, 'preserved directory changed'):
                    module.assert_preserved(before)
                # Replace the empty test directory with a link using a preserved
                # rename, so the test can prove the link is never traversed.
                live.rename(root / 'saved-replacement')
                live.symlink_to(root / 'saved-original', target_is_directory=True)
                with self.assertRaisesRegex(RuntimeError, 'database root was redirected'):
                    module.inventory((protected,))

    def test_apply_fails_closed_outside_ci_and_does_not_inspect_or_remove_anything(self):
        with patch.dict(module.os.environ, {}, clear=True), patch.object(module, 'snapshot') as inspect, \
                patch.object(module, 'remove_reviewed') as remove:
            with self.assertRaisesRegex(RuntimeError, 'requires CI'):
                module.main('apply', '123-1', 'a' * 64)
            inspect.assert_not_called()
            remove.assert_not_called()

    def test_changed_reviewed_snapshot_never_reaches_an_unlink(self):
        fake = {'data_bytes': 1, 'runtime': {}}
        with patch.dict(module.os.environ, {'GITHUB_ACTIONS': 'true'}), \
                patch.object(module.os, 'nice'), patch.object(module.subprocess, 'run'), \
                patch('builtins.open'), patch.object(module.fcntl, 'flock'), \
                patch.object(module, 'snapshot', return_value=fake), patch.object(module, 'health'), \
                patch.object(module, 'remove_reviewed') as remove:
            with self.assertRaisesRegex(RuntimeError, 'changed since inspection'):
                module.main('apply', '123-1', 'a' * 64)
            remove.assert_not_called()

    def test_busy_publisher_lock_never_reaches_inspection_or_an_unlink(self):
        with patch.dict(module.os.environ, {'GITHUB_ACTIONS': 'true'}), \
                patch.object(module.os, 'nice'), patch.object(module.subprocess, 'run'), \
                patch('builtins.open'), patch.object(module.fcntl, 'flock', side_effect=BlockingIOError), \
                patch.object(module, 'snapshot') as inspect, patch.object(module, 'remove_reviewed') as remove:
            with self.assertRaises(BlockingIOError):
                module.main('apply', '123-1', 'a' * 64)
            inspect.assert_not_called()
            remove.assert_not_called()

    def test_wrong_host_aborts_before_any_runtime_or_artifact_operation(self):
        with patch.object(module.socket, 'gethostname', return_value='different-host'), \
                patch.object(module, 'consumers') as consumers:
            with self.assertRaisesRegex(RuntimeError, 'Wrong production target'):
                module.snapshot()
            consumers.assert_not_called()

    def test_current_release_drift_aborts_before_any_artifact_operation(self):
        import hashlib
        import json
        with tempfile.TemporaryDirectory() as directory:
            stage = Path(directory)
            (stage / '.target').write_text('179.198.115.115')
            (stage / 'production.active').touch()
            state = stage / 'web-publication-state.json'
            state.write_text(json.dumps({'unit': 'a-new-deployment.service'}))
            with patch.object(module, 'STAGE', stage), patch.object(module, 'STATE', state), \
                    patch.object(module.socket, 'gethostname', return_value='srv2101069.hstgr.cloud'), \
                    patch.object(Path, 'read_bytes', return_value=b'machine'), \
                    patch.object(module, 'MACHINE_SHA', hashlib.sha256(b'machine').hexdigest()), \
                    patch.object(module, 'consumers') as consumers:
                with self.assertRaisesRegex(RuntimeError, 'Active release changed'):
                    module.snapshot()
                consumers.assert_not_called()

    def test_no_restart_reload_or_database_commands_are_present(self):
        text = Path(module.__file__).read_text()
        for command in ("'restart'", "'reload'", "'stop'", "'docker', 'rm'", "'psql'", "'mariadb'"):
            self.assertNotIn(command, text)


if __name__ == '__main__':
    unittest.main()
