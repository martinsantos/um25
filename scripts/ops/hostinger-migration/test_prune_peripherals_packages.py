import os
from pathlib import Path
import unittest
from unittest.mock import patch
HERE = Path(__file__).resolve().parent
ns = {"__name__": "scope_test"}
exec(compile((HERE / "prune-reviewed-migration.py").read_text().split("if __name__ == ")[0], "primitives.py", "exec"), ns)
exec(compile((HERE / "prune-20261115-peripherals-packages.py").read_text(), "scope.py", "exec"), ns)
class PeripheralsPackageCleanup(unittest.TestCase):
    def test_exact_three_packages(self):
        expected = tuple(Path('/srv/umsa-migration/incoming') / (name + '.tar.gz') for name in ('fb03ea5a9286ba2189dffc2b1e41e0abba9dbbe6-43448537241-1', '499ae9b0d8c5b3d7994e9d792f83b4c50e564827-43480855408-1', '0f73c46a066deec7ed5c4e345be5e3cf3d93d60d-43496723705-1'))
        self.assertEqual(ns['reviewed_targets'](), expected)
        self.assertEqual(ns['FREE_EXPECTED'], 6333550592)
        self.assertFalse(set(ns['RETIRED']) & set(ns['RETAIN']))
        self.assertTrue(all(p.suffixes == ['.tar', '.gz'] for p in expected))
        self.assertFalse(any(ns['overlaps'](p, q) for p in expected for q in ns['PROTECTED']))
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
