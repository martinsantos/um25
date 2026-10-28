import importlib.util
import os
from pathlib import Path
import subprocess
import unittest

spec = importlib.util.spec_from_file_location('dge_ownership', Path(__file__).with_name('restore-dge-ownership.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DgeOwnershipTests(unittest.TestCase):
    def toc(self):
        return '\n'.join(str(i) + '; 1259 123 ' + kind + ' public ' + name + ' dge_app'
                         for i, (kind, name) in enumerate(module.OBJECTS))

    def test_source_proof_requires_exact_inventory_and_original_owners(self):
        module.verify_source_toc(self.toc())
        for text in (self.toc().replace('dge_app', 'other'), self.toc().split('\n', 1)[1],
                     self.toc() + '\n999; 1259 999 TABLE public unreviewed dge_app'):
            with self.assertRaises(RuntimeError):
                module.verify_source_toc(text)

    def test_recovery_has_no_user_reset_global_grants_or_record_changes(self):
        sql = module.ownership_sql()
        self.assertEqual(sql.count(' OWNER TO dge_app;'), 23)
        for forbidden in ('GRANT ', 'ALTER ROLE', 'ALTER DATABASE', 'DELETE ', 'INSERT ', 'UPDATE ', 'TRUNCATE '):
            self.assertNotIn(forbidden, sql)
        self.assertIn('BEGIN;', sql)
        self.assertIn('COMMIT;', sql)
        self.assertIn('SET LOCAL ROLE dge_app;', sql)

    @unittest.skipUnless(os.environ.get('DGE_OWNERSHIP_DOCKER_REHEARSAL') == '1', 'Disposable PostgreSQL CI rehearsal')
    def test_real_transaction_recovers_permissions_without_changing_rows_or_role(self):
        container = os.environ['DGE_OWNERSHIP_CI_CONTAINER']
        def pg(sql, database='dge_demo', check=True):
            return subprocess.run(['docker', 'exec', '-i', container, 'psql', '-X', '-U', 'postgres',
                                   '-d', database, '-At', '--set', 'ON_ERROR_STOP=1'],
                                  input=sql, text=True, capture_output=True, check=check)
        pg('CREATE ROLE dge_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;', 'postgres')
        pg('CREATE DATABASE dge_demo;', 'postgres')
        pg('\n'.join('CREATE TABLE public.' + name + '(retained integer); INSERT INTO public.' + name + ' VALUES(7);'
                     for name in module.TABLES) + '\n' +
           '\n'.join('CREATE SEQUENCE public.' + name + ' START 17;' for name in module.SEQUENCES))
        before = pg("SELECT rolpassword FROM pg_authid WHERE rolname='dge_app';").stdout
        self.assertIn('permission denied', pg('SET ROLE dge_app; SELECT * FROM auth_user;', check=False).stderr)
        pg(module.ownership_sql())
        self.assertEqual(pg("SELECT rolpassword FROM pg_authid WHERE rolname='dge_app';").stdout, before)
        self.assertEqual(pg('SET ROLE dge_app; SELECT retained FROM auth_user;').stdout.splitlines()[-1], '7')
        self.assertEqual(pg('SET ROLE dge_app; SELECT last_value FROM auth_user_id_seq;').stdout.splitlines()[-1], '17')
        self.assertEqual(pg("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','S') AND pg_get_userbyid(c.relowner)='dge_app';").stdout.strip(), '23')
        pg('CREATE TABLE public.unreviewed(retained integer);')
        self.assertNotEqual(pg(module.ownership_sql(), check=False).returncode, 0)


if __name__ == '__main__':
    unittest.main()
