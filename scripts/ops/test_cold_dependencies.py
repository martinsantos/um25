import importlib.util
import os
import tempfile
import time
import unittest
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


if __name__ == '__main__':
    unittest.main()
