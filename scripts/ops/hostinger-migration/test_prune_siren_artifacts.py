import os
from pathlib import Path
import unittest
from unittest.mock import patch
HERE = Path(__file__).resolve().parent
ns = {"__name__": "scope_test"}
exec(compile((HERE / "prune-reviewed-migration.py").read_text().split("if __name__ == ")[0], "primitives.py", "exec"), ns)
exec(compile((HERE / "prune-20261115-siren-artifacts.py").read_text(), "scope.py", "exec"), ns)
class SirenArtifactsCleanup(unittest.TestCase):
    def test_exact_package_and_application(self):
        expected = (
            Path('/srv/umsa-migration/incoming/c7498724e330d6e027658cf64b4dc88a7ba84cec-43705919199-1.tar.gz'),
            Path('/srv/umsa-web-releases/e9db448ce6b2da93262d6c976f07f3e6618805ea-43404599523-1/application'),
        )
        self.assertEqual(ns['reviewed_targets'](), expected)
        self.assertEqual(ns['FREE_EXPECTED'], 4664217600)
        self.assertFalse(set(ns['RETIRED']) & set(ns['RETAIN']))
        self.assertFalse(any(ns['overlaps'](p, q) for p in expected for q in ns['PROTECTED']))
        self.assertTrue(all(p.name != 'publication.complete' for p in expected))
    def test_partial_batch_refuses(self):
        with patch.dict(ns, {"verify_target": lambda: None}), patch("os.path.lexists", side_effect=[True,False]):
            with self.assertRaisesRegex(RuntimeError, 'Partially removed'):
                ns['snapshot_exact'](12720000000)
    def test_three_release_versions_retained(self):
        self.assertEqual(len(ns["RETAIN"]), 3)
        self.assertEqual(ns["RETAIN"][0], ns["ACTIVE"])
    def test_missing_target_is_idempotent(self):
        with patch.dict(ns, {"verify_target": lambda: None}), patch("os.path.lexists", return_value=False):
            self.assertEqual(ns["snapshot_exact"](12711110544)[0], {"status": "already_removed", "targets": []})
    def test_cannot_apply_outside_actions(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "GitHub Actions"):
                ns["execute"]("apply", "12711110544", "a" * 64)
    def test_cannot_apply_without_matching_inspection(self):
        with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            with self.assertRaisesRegex(RuntimeError, "matching inspection"):
                ns["execute"]("apply", "12711110544", "")
    def test_rejects_bad_invocations(self):
        for phase, required in [("delete", "12711110544"), ("inspect", "0"), ("inspect", "../x")]:
            with self.assertRaisesRegex(RuntimeError, "Unexpected invocation"):
                ns["execute"](phase, required)
if __name__ == "__main__":
    unittest.main()
