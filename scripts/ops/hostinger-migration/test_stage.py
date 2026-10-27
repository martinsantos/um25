"""Safety boundaries for a staging workflow that can access two live hosts."""
from pathlib import Path
import subprocess
import tempfile
import unittest
import os

SCRIPT = Path(__file__).with_name('stage.sh')


class StageGuards(unittest.TestCase):
    def test_invalid_phase_never_connects(self):
        result = subprocess.run(['bash', str(SCRIPT), 'delete'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn('Unknown phase', result.stderr)

    def test_wrong_target_prevents_bootstrap_and_copy(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ssh = root / 'ssh'
            ssh.write_text('#!/bin/sh\nprintf "wrong-server\\n"\n')
            ssh.chmod(0o700)
            for phase in ['bootstrap', 'copy-data', 'copy-runtime', 'install-runtime', 'snapshot-data', 'restore-databases', 'recover-empty-storage', 'materialize-files', 'rehearsal', 'prepare-mail', 'build-clean-web', 'finish-file-validation', 'finish-mariadb']:
                result = subprocess.run(['bash', str(SCRIPT), phase], env={**os.environ, 'PATH': directory + ':' + os.environ['PATH']}, capture_output=True, text=True)
                self.assertEqual(result.returncode, 3)
                self.assertIn('Unexpected target hostname', result.stderr)

    def test_copy_is_preserving_and_isolated(self):
        source = SCRIPT.read_text()
        self.assertNotIn('--delete', source)
        self.assertNotIn('systemctl restart', source)
        self.assertNotIn('pm2 restart', source)
        self.assertIn('rsync -aHAX --numeric-ids --relative', source)
        self.assertIn('realpath "$stage/source"', source)
        self.assertIn('StrictHostKeyChecking=yes', source)


if __name__ == '__main__':
    unittest.main()
