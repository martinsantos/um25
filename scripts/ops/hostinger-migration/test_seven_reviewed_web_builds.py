import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    'reviewed_prune', Path(__file__).with_name('prune-reviewed-migration.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SevenReviewedWebBuilds(unittest.TestCase):
    def test_new_active_and_all_three_retained_builds_are_outside_the_fixed_batch(self):
        active = 'a' * 40 + '-99999999999-1'
        batch = module.reviewed_web_batch(active)
        self.assertEqual(batch.retained, (active, *module.WEB_RETAINED))
        self.assertEqual(len(batch.targets), 14)
        self.assertEqual(len(set(batch.targets)), 14)
        for release in module.WEB_ARCHIVE_SIZES:
            self.assertIn(module.RELEASES / release, batch.targets)
            self.assertIn(module.archive_path(release), batch.targets)
        for target in batch.targets:
            self.assertFalse(any(module.overlaps(target, keep) for keep in batch.protected))
        for release in batch.retained:
            self.assertIn(module.RELEASES / release, batch.protected)
            self.assertIn(module.archive_path(release), batch.protected)

    def test_obsolete_release_and_malformed_identity_cannot_be_selected_as_active(self):
        for value in (*module.WEB_ARCHIVE_SIZES, '../previous'):
            with self.subTest(value=value), self.assertRaisesRegex(RuntimeError, 'Expected the reviewed'):
                module.reviewed_web_batch(value)

    def test_a_different_live_release_stops_inspection_before_any_artifact_walk(self):
        batch = module.reviewed_web_batch('a' * 40 + '-99999999999-1')
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory) / 'state.json'
            state.write_text(json.dumps({'unit': 'different-release'}))
            with patch.object(module, 'STATE', state), patch.object(module, 'verify_target'), \
                    patch.object(module, 'web_release_receipt', side_effect=lambda release: {'unit': release}), \
                    patch.object(module, 'inventory') as inventory:
                with self.assertRaisesRegex(RuntimeError, 'not the active deployment'):
                    module.snapshot_web(batch)
                inventory.assert_not_called()
