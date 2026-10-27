"""Exercise SGI table locks and restore on disposable isolated MariaDBs."""
import importlib.util
import os
from pathlib import Path
import subprocess
import time
import unittest

spec = importlib.util.spec_from_file_location('sgi_lock', Path(__file__).with_name('sgi-write-lock.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SOURCE = 'umsa-sgi-lock-source-ci'
TARGET = 'umsa-sgi-lock-target-ci'
AUTH = ['-uroot', '-pci-only']


def sql(container, query, database=None, timeout=12):
    args = ['docker', 'exec', container, 'mariadb', '--no-defaults', *AUTH, '--batch', '--skip-column-names']
    if database:
        args.append(database)
    return subprocess.run(args + ['-e', query], text=True, capture_output=True, timeout=timeout)


@unittest.skipUnless(os.environ.get('SGI_LOCK_CI') == '1', 'requires disposable CI MariaDB instances')
class SgiLockIntegrationTests(unittest.TestCase):
    def test_only_sgi_writes_pause_and_a_full_dump_restores(self):
        for container in (SOURCE, TARGET):
            for _ in range(90):
                ready = subprocess.run(['docker', 'exec', container, 'mariadb-admin', '--no-defaults',
                                        *AUTH, 'ping', '--silent'], capture_output=True)
                if ready.returncode == 0:
                    break
                time.sleep(1)
            else:
                self.fail('Isolated test MariaDB did not start')
        setup = '''CREATE DATABASE sgi_production;
CREATE DATABASE unrelated_database;
CREATE TABLE sgi_production.innodb_table (id INT) ENGINE=InnoDB;
CREATE TABLE sgi_production.myisam_table (id INT) ENGINE=MyISAM;
CREATE TABLE unrelated_database.other_table (id INT) ENGINE=InnoDB;
INSERT INTO sgi_production.innodb_table VALUES (1);
INSERT INTO sgi_production.myisam_table VALUES (2);
CREATE VIEW sgi_production.sample_view AS SELECT id FROM sgi_production.innodb_table;
CREATE PROCEDURE sgi_production.sample_routine() SELECT COUNT(*) FROM sgi_production.myisam_table;'''
        created = sql(SOURCE, setup)
        self.assertEqual(created.returncode, 0, created.stderr)
        process = subprocess.Popen(['docker', 'exec', '-i', SOURCE, 'mariadb', '--no-defaults', *AUTH,
                                    '--batch', '--skip-column-names'], stdin=subprocess.PIPE,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True)
        try:
            process.stdin.write(module.lock_sql(['innodb_table', 'myisam_table']))
            process.stdin.close()
            for _ in range(60):
                sleeping = sql(SOURCE, "SELECT COUNT(*) FROM information_schema.PROCESSLIST "
                               "WHERE INFO LIKE 'SELECT SLEEP(28800)%';")
                if sleeping.returncode == 0 and sleeping.stdout.strip() == '1':
                    break
                if process.poll() is not None:
                    self.fail('SGI lock process exited before it was acquired')
                time.sleep(0.25)
            else:
                self.fail('SGI table lock was not acquired')
            self.assertEqual(sql(SOURCE, 'SELECT COUNT(*) FROM innodb_table;', 'sgi_production').stdout.strip(), '1')
            self.assertEqual(sql(SOURCE, 'INSERT INTO other_table VALUES (7);', 'unrelated_database').returncode, 0)
            for table in ('innodb_table', 'myisam_table'):
                attempt = sql(SOURCE, 'SET SESSION max_statement_time=1; INSERT INTO ' + table + ' VALUES (9);',
                              'sgi_production')
                self.assertNotEqual(attempt.returncode, 0)
            dump = subprocess.check_output(['docker', 'exec', SOURCE, 'mariadb-dump', '--no-defaults', *AUTH,
                                            '--single-transaction', '--skip-lock-tables', '--routines', '--events',
                                            '--triggers', '--hex-blob', '--databases', 'sgi_production'])
            restored = subprocess.run(['docker', 'exec', '-i', TARGET, 'mariadb', '--no-defaults', *AUTH],
                                      input=dump, capture_output=True, timeout=30)
            self.assertEqual(restored.returncode, 0, restored.stderr.decode(errors='replace'))
            self.assertEqual(sql(TARGET, 'SELECT id FROM sample_view;', 'sgi_production').stdout.strip(), '1')
            self.assertEqual(sql(TARGET, 'CALL sample_routine();', 'sgi_production').stdout.strip(), '1')
            self.assertEqual(sql(TARGET, 'SELECT id FROM myisam_table;', 'sgi_production').stdout.strip(), '2')
        finally:
            sessions = sql(SOURCE, "SELECT ID FROM information_schema.PROCESSLIST "
                           "WHERE INFO LIKE 'SELECT SLEEP(28800)%';")
            if sessions.returncode == 0:
                for session_id in sessions.stdout.splitlines():
                    if session_id.isdecimal():
                        sql(SOURCE, 'KILL ' + session_id + ';')
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    unittest.main()
