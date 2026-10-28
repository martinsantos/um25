import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest

spec = importlib.util.spec_from_file_location('core_target', Path(__file__).with_name('core-target-cutover.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CoreCutoverTests(unittest.TestCase):
    def test_only_three_named_databases_can_be_staged(self):
        self.assertEqual(module.database_names('dge', '42-1'), ('umsa_core_next_dge_42_1', 'umsa_core_before_dge_42_1'))
        for kind, identity in [('sitrep', '42-1'), ('directus', '../bad'), ('mariadb', '42-1')]:
            with self.assertRaises(ValueError):
                module.database_names(kind, identity)

    def test_mutable_manifest_rejects_links_and_hashes_file_contents(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'image.bin').write_bytes(b'test')
            self.assertEqual(module.tree_manifest(root)['image.bin'], module.sha256(root / 'image.bin'))
            (root / 'escape').symlink_to('/etc/passwd')
            with self.assertRaises(RuntimeError):
                module.tree_manifest(root)

    @unittest.skipUnless(os.environ.get('CORE_PG_CI') == '1', 'requires disposable PostgreSQL')
    def test_readonly_default_blocks_old_writes_but_not_other_database(self):
        prefix = ['docker', 'exec', 'umsa-core-pg-ci', 'psql', '-X', '-w', '-U', 'postgres', '--set', 'ON_ERROR_STOP=1']
        for _ in range(60):
            if subprocess.run(prefix + ['-d', 'postgres', '-c', 'SELECT 1;'], capture_output=True).returncode == 0:
                break
            time.sleep(1)
        else:
            self.fail('Disposable PostgreSQL did not start')
        def sql(database, text, check=True):
            return subprocess.run(prefix + ['-d', database, '-c', text], capture_output=True, check=check)
        sql('postgres', 'CREATE DATABASE core_readonly;')
        sql('core_readonly', 'CREATE TABLE t(n int); INSERT INTO t VALUES(1);')
        sql('postgres', 'CREATE TABLE unaffected(n int);')
        sql('postgres', 'ALTER ROLE postgres IN DATABASE core_readonly SET default_transaction_read_only=on;')
        failed = sql('core_readonly', 'INSERT INTO t VALUES(2);', check=False)
        self.assertNotEqual(failed.returncode, 0)
        self.assertIn(b'read-only', failed.stderr)
        sql('postgres', 'INSERT INTO unaffected VALUES(1);')
        sql('core_readonly', 'SELECT * FROM t;')
        subprocess.run(['docker', 'exec', 'umsa-core-pg-ci', 'pg_dump', '-U', 'postgres', '-Fc', 'core_readonly'],
                       stdout=subprocess.DEVNULL, check=True)
        sql('postgres', 'ALTER ROLE postgres IN DATABASE core_readonly RESET default_transaction_read_only;')
        sql('core_readonly', 'INSERT INTO t VALUES(2);')


if __name__ == '__main__':
    unittest.main()
