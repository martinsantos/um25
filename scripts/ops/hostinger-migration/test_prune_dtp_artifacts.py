import os
from pathlib import Path
import unittest
from unittest.mock import patch
HERE = Path(__file__).resolve().parent
ns = {"__name__": "scope_test"}
exec(compile((HERE / "prune-reviewed-migration.py").read_text().split("if __name__ == ")[0], "primitives.py", "exec"), ns)
exec(compile((HERE / "prune-20261115-dtp-artifacts.py").read_text(), "scope.py", "exec"), ns)
class DtpArtifactsCleanup(unittest.TestCase):
    def test_exact_package_and_application(self):
        expected = (
            Path('/srv/umsa-migration/incoming/9577d566e464c47da19c50aa187dd5f79d71e2b1-43709697407-1.tar.gz'),
            Path('/srv/umsa-web-releases/6e47d2941dc5c472f8137aa639360c832de3a241-43417070085-1/application'),
        )
        self.assertEqual(ns['reviewed_targets'](), expected)
        self.assertEqual(ns['FREE_EXPECTED'], 4665913344)
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
