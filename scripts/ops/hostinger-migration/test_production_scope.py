"""Exercise the actual production workflow's changed-path classification."""
import os
from pathlib import Path
import subprocess
import tempfile
import textwrap
import unittest

REPO = Path(__file__).resolve().parents[3]
WORKFLOW = REPO / '.github/workflows/production-deploy.yml'


def script():
    text = WORKFLOW.read_text()
    section = text.split('      - id: scope\n', 1)[1]
    return textwrap.dedent(section.split('        run: |\n', 1)[1].split('\n  #', 1)[0])


class ProductionScopeTests(unittest.TestCase):
    def classify(self, paths, event='push', before_valid=True, operation=''):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root, text=True).strip()
            git('init', '-q')
            git('config', 'user.email', 'scope-test@example.invalid')
            git('config', 'user.name', 'Scope Test')
            (root / 'baseline').write_text('baseline')
            git('add', 'baseline')
            git('commit', '-qm', 'baseline')
            before = git('rev-parse', 'HEAD') if before_valid else '0' * 40
            for path in paths:
                target = root / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text('test')
            git('add', '.')
            git('commit', '--allow-empty', '-qm', 'change')
            output = root / 'github-output'
            env = dict(os.environ, EVENT=event, BEFORE=before, OPERATION=operation, GITHUB_OUTPUT=str(output))
            subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', script()], cwd=root, env=env, check=True)
            return output.read_text().strip()

    def test_migration_tooling_alone_never_triggers_the_old_web_deploy(self):
        self.assertEqual(self.classify(['.github/workflows/hostinger-sitrep-network-probe.yml',
                                        'scripts/ops/hostinger-migration/example.py']), 'required=false')

    def test_real_runtime_change_is_not_hidden_by_operational_files(self):
        self.assertEqual(self.classify(['.github/workflows/hostinger-sitrep-network-probe.yml',
                                        'src/pages/index.astro']), 'required=true')

    def test_unknown_path_and_unknown_base_fail_safe(self):
        self.assertEqual(self.classify(['unreviewed-path.txt']), 'required=true')
        self.assertEqual(self.classify(['.github/workflows/hostinger-example.yml'], before_valid=False),
                         'required=true')

    def test_manual_deploy_remains_enabled(self):
        self.assertEqual(self.classify([], event='workflow_dispatch', operation='deploy'), 'required=true')

    def test_rollback_requires_a_swap_to_have_been_attempted(self):
        text = WORKFLOW.read_text()
        swap = text.split('      - name: Swap verified runtime with automatic origin rollback\n', 1)[1]
        self.assertTrue(swap.startswith('        id: runtime_swap\n'))
        recovery = text.split('      - name: Restore previous runtime after failed checks\n', 1)[1].split('\n      - ', 1)[0]
        self.assertIn("steps.runtime_swap.outcome == 'success'", recovery)
        self.assertIn("steps.runtime_swap.outcome == 'failure'", recovery)


if __name__ == '__main__':
    unittest.main()
