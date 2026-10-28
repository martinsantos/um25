import importlib.util
import os
from pathlib import Path
import subprocess
import time
import unittest

spec=importlib.util.spec_from_file_location('dge_source_fence',Path(__file__).with_name('seal-dge-source.py'))
helper=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class SourceFenceTests(unittest.TestCase):
    def test_fence_is_only_the_original_dge_role_and_has_no_writer_reactivation(self):
        sql=helper.fence_sql()
        self.assertIn('ALTER ROLE dge_app NOLOGIN;',sql)
        self.assertIn('ALTER ROLE dge_app IN DATABASE dge_demo SET default_transaction_read_only=on;',sql)
        self.assertIn("datname='dge_demo' AND usename='dge_app'",sql)
        self.assertNotIn('ALTER ROLE postgres',sql)
        self.assertNotIn('DROP ',sql)
        self.assertNotIn('UPDATE ',sql)
        source=Path(helper.__file__).read_text()
        self.assertNotIn("['docker','start'",source)
        self.assertNotIn('pg_restore',source)
        self.assertEqual(helper.WEBS,('dge-demo-web','dge-demo-rollback-cf24407ee8ee'))

    @unittest.skipUnless(os.environ.get('DGE_SOURCE_FENCE_CI_CONTAINER'),'Disposable PostgreSQL rehearsal')
    def test_old_session_is_closed_new_login_blocked_and_database_profile_keeps_rows(self):
        container=os.environ['DGE_SOURCE_FENCE_CI_CONTAINER']
        def pg(sql,user='postgres',database='dge_demo',check=True):
            return subprocess.run(['docker','exec','-i',container,'psql','-X','-q','-U',user,'-d',database,'-At','--set','ON_ERROR_STOP=1'],input=sql,text=True,capture_output=True,check=check)
        pg('CREATE ROLE dge_app LOGIN; CREATE ROLE unrelated LOGIN;',database='postgres')
        pg('CREATE DATABASE dge_demo; CREATE DATABASE unrelated;',database='postgres')
        pg('CREATE TABLE retained(value integer); INSERT INTO retained VALUES(42); GRANT SELECT,INSERT ON retained TO dge_app;')
        before=pg("SELECT rolpassword FROM pg_authid WHERE rolname='dge_app';").stdout
        old=subprocess.Popen(['docker','exec',container,'psql','-X','-q','-U','dge_app','-d','dge_demo','-c','SELECT pg_sleep(60);'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        for attempt in range(40):
            if pg("SELECT count(*) FROM pg_stat_activity WHERE datname='dge_demo' AND usename='dge_app';").stdout.strip()=='1':break
            time.sleep(0.1)
        else:self.fail('Fixture application session did not start')
        # Exercise the exact database-scoped profile before closing login, so its
        # effect is checked on a fresh ordinary application session.
        pg(helper.readonly_sql())
        self.assertEqual(pg('SHOW transaction_read_only;',user='dge_app').stdout.strip(),'on')
        self.assertNotEqual(pg('INSERT INTO retained VALUES(99);',user='dge_app',check=False).returncode,0)
        pg(helper.fence_sql())
        self.assertEqual(pg("SELECT rolcanlogin FROM pg_roles WHERE rolname='dge_app';").stdout.strip(),'f')
        self.assertNotEqual(pg('SELECT 1;',user='dge_app',check=False).returncode,0)
        old.communicate(timeout=10)
        self.assertNotEqual(old.returncode,0)
        self.assertEqual(pg('TABLE retained;').stdout.strip(),'42')
        self.assertEqual(pg("SELECT rolpassword FROM pg_authid WHERE rolname='dge_app';").stdout,before)
        self.assertEqual(pg("SELECT rolcanlogin FROM pg_roles WHERE rolname='unrelated';").stdout.strip(),'t')
        self.assertEqual(pg('SHOW transaction_read_only;',user='unrelated',database='unrelated').stdout.strip(),'off')


if __name__=='__main__':unittest.main()
