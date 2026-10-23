import hashlib
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location('offsite', Path(__file__).with_name('configure-offsite-backups.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

SCRIPTS = {
    'backup_directus.sh': '#!/bin/bash\nif rsync -avz \\\n  "${SYNC_FILES[@]}" \\\n  "root@$REMOTE_HOST:$REMOTE_DIR/"; then\n  echo ok\nfi\n',
    'backup_sitrep.sh': ('#!/bin/bash\nset -e\nrsync -avz \\\n  $F \\\n  root@$REMOTE_HOST:$REMOTE_DIR/ 2>&1 | tee -a $LOG_FILE\n\n'
                         'if [ $? -eq 0 ]; then\n  echo "✅ Remote sync successful"\nelse\n  echo "⚠️  Remote sync failed"\nfi\n'
                         'ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$REMOTE_HOST \\\n'
                         '  "find $REMOTE_DIR -name \\"sitrep-db-*.sql.gz\\" -mtime +30 -delete" 2>&1 | tee -a $LOG_FILE\n'),
    'verify_remote_backups.sh': '#!/bin/bash\nssh root@$REMOTE_HOST "ls"\n',
}


class OffsiteBackupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name, text in SCRIPTS.items():
            (self.root / name).write_text(text)
        expected = {n: hashlib.sha256(t.encode()).hexdigest() for n, t in SCRIPTS.items()}
        self.patch = mock.patch.object(module, 'EXPECTED', expected)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()
        self.temp.cleanup()

    def test_scripts_use_the_restricted_account_and_real_rsync_status(self):
        module.apply(module.make_plan(self.root), self.root)
        sitrep = (self.root / 'backup_sitrep.sh').read_text()
        self.assertIn('${PIPESTATUS[0]}', sitrep)
        self.assertIn('umbak@$REMOTE_HOST retener', sitrep)
        self.assertNotIn('root@', sitrep + (self.root / 'backup_directus.sh').read_text())
        self.assertIn('umbak@$REMOTE_HOST listar', (self.root / 'verify_remote_backups.sh').read_text())
        self.assertEqual((self.root / 'backup_sitrep.sh.antes-umbak-20261023').read_text(), SCRIPTS['backup_sitrep.sh'])

    def test_failed_rsync_is_reported_as_failure(self):
        module.apply(module.make_plan(self.root), self.root)
        script = self.root / 'backup_sitrep.sh'
        bin_dir = self.root / 'bin'
        bin_dir.mkdir()
        for tool, code in (('rsync', 255), ('ssh', 0)):
            (bin_dir / tool).write_text('#!/bin/sh\nexit %d\n' % code)
            os.chmod(bin_dir / tool, 0o755)
        env = dict(os.environ, PATH='%s:%s' % (bin_dir, os.environ['PATH']), LOG_FILE=str(self.root / 'log'))
        out = __import__('subprocess').run(['bash', str(script)], env=env, capture_output=True, text=True).stdout
        self.assertIn('Remote sync failed', out)
        self.assertNotIn('successful', out)

    def test_modified_script_is_refused(self):
        (self.root / 'backup_sitrep.sh').write_text(SCRIPTS['backup_sitrep.sh'] + '# edited\n')
        with self.assertRaises(RuntimeError):
            module.make_plan(self.root)


if __name__ == '__main__':
    unittest.main()
