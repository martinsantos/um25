import importlib.util
import os
import tempfile
import time
import unittest
import io
import tarfile
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).with_name('prune-cold-dependencies.py'))
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)


class ColdDependenciesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.mounts = patch.object(cleanup, 'has_mount', return_value=False)
        self.mounts.start()
        self.releases = []
        for number in range(1, 7):
            release = self.root / f'2026010{number}'
            deps = release / 'node_modules'
            deps.mkdir(parents=True)
            for path in (release / 'package-lock.json', release / 'package.json', deps / '.package-lock.json'):
                path.write_text('{}')
            (release / '.env').write_text('test fixture')
            (release / 'data.db').write_bytes(b'preserve')
            os.utime(release, (time.time() - 30 * 86400,) * 2)
            self.releases.append(release)

    def tearDown(self):
        self.mounts.stop()
        self.temp.cleanup()

    def targets(self, protected=()):
        return cleanup.select_targets([self.root], set(protected))

    def test_preserves_active_and_two_latest_releases(self):
        selected = self.targets([self.releases[0] / 'dist/server.js'])
        self.assertEqual([t['release'] for t in selected], list(map(str, self.releases[1:4])))

    def test_preserves_recent_missing_lock_symlink_and_mount(self):
        os.utime(self.releases[0], None)
        (self.releases[1] / 'package-lock.json').unlink()
        deps = self.releases[2] / 'node_modules'
        deps.rename(self.root / 'shared-deps')
        deps.symlink_to(self.root / 'shared-deps', target_is_directory=True)
        with patch.object(cleanup, 'has_mount', side_effect=lambda p: p.parent == self.releases[3]):
            self.assertEqual(self.targets(), [])

    def test_plan_invalidated_by_lock_or_inode_change(self):
        original = cleanup.plan_sha(self.targets())
        (self.releases[0] / 'package-lock.json').write_text('{"changed":true}')
        self.assertNotEqual(original, cleanup.plan_sha(self.targets()))
        selected = self.targets()
        original = cleanup.plan_sha(selected)
        selected[0]['inode'] += 1
        self.assertNotEqual(original, cleanup.plan_sha(selected))

    def test_deletion_preserves_source_environment_database_and_symlinks(self):
        release = self.releases[0]
        (release / 'shared').symlink_to(self.releases[5], target_is_directory=True)
        before = cleanup.retained_snapshot({release})
        cleanup.shutil.rmtree(release / 'node_modules')
        self.assertEqual(before, cleanup.retained_snapshot({release}))
        self.assertIn(str(release / '.env'), before)
        self.assertIn(str(release / 'data.db'), before)
        self.assertIn(str(release / 'shared'), before)

    def test_unmatched_apply_plan_never_deletes(self):
        with patch.object(cleanup, 'ROOTS', [self.root]), patch.object(cleanup, 'protected_paths', return_value=set()), \
             patch('sys.argv', ['cleanup', '--apply', '--expected-plan-sha', '0' * 64]), patch('builtins.print'):
            with self.assertRaisesRegex(RuntimeError, 'Plan changed'):
                cleanup.main()
        self.assertTrue(all((r / 'node_modules').exists() for r in self.releases))


class AuditedLotTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()

    def tearDown(self):
        self.temp.cleanup()

    def archive(self, name='dist/app.js', payload=b'verified'):
        root = self.root / 'release'
        frontend = root / 'frontend'
        frontend.mkdir(parents=True, exist_ok=True)
        with tarfile.open(root / 'frontend.tar.gz', 'w:gz') as stream:
            member = tarfile.TarInfo(name)
            member.size = len(payload)
            stream.addfile(member, io.BytesIO(payload))
        if '..' not in Path(name).parts:
            item = frontend / name
            item.parent.mkdir(parents=True, exist_ok=True)
            item.write_bytes(payload)
        return frontend

    def test_allowlist_excludes_live_website_and_backups(self):
        self.assertEqual(len(cleanup.AUDITED_LOT), 7)
        for name, kind in cleanup.AUDITED_LOT:
            for excluded in ['/root/fumbling-field', '/var/www/ultimamilla', '/backups', '/var/lib/docker']:
                self.assertNotIn(excluded, name)

    def test_symlink_target_is_refused(self):
        original = self.root / 'source'
        original.mkdir()
        link = self.root / 'link'
        link.symlink_to(original, target_is_directory=True)
        with self.assertRaisesRegex(RuntimeError, 'identity'):
            cleanup.assert_lot_path(link, 'binary-cache', set())

    def test_active_source_preserves_dependency_target(self):
        target = self.root / 'node_modules'
        target.mkdir()
        with patch.object(cleanup, 'has_mount', return_value=False):
            with self.assertRaisesRegex(RuntimeError, 'active'):
                cleanup.assert_lot_path(target, 'dependencies', {self.root / 'app.js'})

    def test_container_mount_ancestor_is_refused(self):
        target = self.root / 'node_modules'
        target.mkdir()
        def docker(args, **kwargs):
            return 'container-id' if args[:3] == ['docker', 'ps', '-aq'] else '[{"Mounts":[{"Source":"%s"}]}]' % self.root
        with patch.object(cleanup, 'has_mount', return_value=False), patch.object(cleanup.subprocess, 'check_output', side_effect=docker):
            with self.assertRaisesRegex(RuntimeError, 'container mount'):
                cleanup.assert_lot_path(target, 'dependencies', set())

    def test_duplicate_requires_archive_and_no_extra_files(self):
        frontend = self.archive()
        self.assertEqual(cleanup.duplicate_frontend(frontend)['files'], 1)
        (frontend / 'unique.txt').write_text('preserve')
        with self.assertRaisesRegex(RuntimeError, 'unarchived'):
            cleanup.duplicate_frontend(frontend)

    def test_modified_frontend_is_preserved(self):
        frontend = self.archive()
        (frontend / 'dist/app.js').write_text('unique change')
        with self.assertRaisesRegex(RuntimeError, 'unique content'):
            cleanup.duplicate_frontend(frontend)

    def test_archive_path_traversal_is_refused(self):
        frontend = self.archive('../outside')
        with self.assertRaisesRegex(RuntimeError, 'unsafe member'):
            cleanup.duplicate_frontend(frontend)

    def test_active_certificate_is_preserved(self):
        with patch.object(cleanup.subprocess, 'run') as run:
            run.return_value.stdout = 'server_name ' + cleanup.STALE_DOMAIN
            with self.assertRaisesRegex(RuntimeError, 'active Nginx'):
                cleanup.stale_renewal_plan()

    def test_unapproved_plan_has_no_write_or_delete(self):
        with patch.object(cleanup.shutil, 'rmtree') as remove, patch.object(cleanup, 'audited_lot_plan') as plan:
            with self.assertRaisesRegex(RuntimeError, 'fingerprint'):
                cleanup.audited_lot_apply({'targets': []}, '0' * 64)
            remove.assert_not_called()
            plan.assert_not_called()

    def test_changed_plan_has_no_delete(self):
        plan = {'targets': [], 'renewal': None}
        digest = cleanup.hashlib.sha256(cleanup.json.dumps(plan, sort_keys=True).encode()).hexdigest()
        with patch.object(cleanup.shutil, 'rmtree') as remove, patch.object(cleanup, 'audited_lot_plan', return_value={'changed': True}):
            with self.assertRaisesRegex(RuntimeError, 'lot changed'):
                cleanup.audited_lot_apply(plan, digest)
            remove.assert_not_called()


if __name__ == '__main__':
    unittest.main()
