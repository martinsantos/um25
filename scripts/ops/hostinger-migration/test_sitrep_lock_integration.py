"""Exercise the lock against a disposable PostgreSQL instance on CI only."""
import importlib.util
import os
from pathlib import Path
import subprocess
import time
import unittest

spec = importlib.util.spec_from_file_location('sitrep_lock', Path(__file__).with_name('sitrep-write-lock.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
swap_spec = importlib.util.spec_from_file_location('sitrep_swap', Path(__file__).with_name('sitrep-database-swap.py'))
swap_module = importlib.util.module_from_spec(swap_spec)
swap_spec.loader.exec_module(swap_module)
CONTAINER = 'umsa-sitrep-lock-ci'


def sql(query):
    return subprocess.run(['docker', 'exec', CONTAINER, 'psql', '-X', '-w', '-U', 'directus',
                           '-d', module.DATABASE_NAME, '-At', '--set', 'ON_ERROR_STOP=1', '-c', query],
                          text=True, capture_output=True, timeout=10)


@unittest.skipUnless(os.environ.get('SITREP_LOCK_CI') == '1', 'requires disposable CI PostgreSQL')
class SitrepLockIntegrationTests(unittest.TestCase):
    def test_blocks_writes_but_allows_reads_and_releases_on_cancel(self):
        for _ in range(60):
            ready = subprocess.run(['docker', 'exec', CONTAINER, 'pg_isready', '-U', 'directus'],
                                   capture_output=True)
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            self.fail('Isolated test PostgreSQL did not start')
        self.assertEqual(sql('CREATE TABLE migration_probe (id integer);').returncode, 0)
        process = subprocess.Popen(module.lock_command(CONTAINER, '42-1'), stdin=subprocess.PIPE,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True)
        try:
            process.stdin.write(module.LOCK_SQL)
            process.stdin.close()
            for _ in range(40):
                held = sql("SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid "
                           "WHERE a.application_name='umsa_sitrep_fence_42_1' "
                           "AND l.mode='ShareLock' AND l.locktype='relation' AND l.granted;")
                if held.returncode == 0 and int(held.stdout.strip() or '0') > 0:
                    break
                if process.poll() is not None:
                    self.fail('Lock process exited before acquiring the lock')
                time.sleep(0.25)
            else:
                self.fail('Lock was not acquired')
            self.assertEqual(sql('SELECT count(*) FROM migration_probe;').stdout.strip(), '0')
            blocked = sql("SET lock_timeout='1s'; INSERT INTO migration_probe VALUES (1);")
            self.assertNotEqual(blocked.returncode, 0)
            cancelled = sql("SELECT pg_cancel_backend(pid) FROM pg_stat_activity "
                            "WHERE application_name='umsa_sitrep_fence_42_1';")
            self.assertEqual(cancelled.stdout.strip(), 't')
            process.wait(timeout=10)
            self.assertEqual(sql('INSERT INTO migration_probe VALUES (1);').returncode, 0)
        finally:
            if process.poll() is None:
                sql("SELECT pg_cancel_backend(pid) FROM pg_stat_activity "
                    "WHERE application_name='umsa_sitrep_fence_42_1';")
                process.terminate()
                process.wait(timeout=10)

    def test_database_swap_preserves_and_restores_the_previous_database(self):
        self.assertEqual(sql('CREATE TABLE swap_probe (id integer); INSERT INTO swap_probe VALUES (1);').returncode, 0)
        archive = subprocess.check_output(['docker', 'exec', CONTAINER, 'pg_dump', '-U', 'directus',
                                           '-Fc', module.DATABASE_NAME])
        self.assertEqual(sql('UPDATE swap_probe SET id=2;').returncode, 0)
        staged, previous = swap_module.names('42-1')
        subprocess.run(['docker', 'exec', CONTAINER, 'createdb', '-U', 'directus', '-T', 'template0', staged],
                       check=True, capture_output=True)
        restored = subprocess.run(['docker', 'exec', '-i', CONTAINER, 'pg_restore', '-U', 'directus',
                                   '--exit-on-error', '-d', staged], input=archive, capture_output=True)
        self.assertEqual(restored.returncode, 0, restored.stderr.decode(errors='replace'))
        swap_module.swap(CONTAINER, 'directus', '42-1')
        self.assertEqual(sql('SELECT id FROM swap_probe;').stdout.strip(), '1')
        previous_data = subprocess.check_output(['docker', 'exec', CONTAINER, 'psql', '-U', 'directus',
                                                 '-d', previous, '-At', '-c', 'SELECT id FROM swap_probe;'], text=True)
        self.assertEqual(previous_data.strip(), '2')
        swap_module.undo_private_swap(CONTAINER, 'directus', '42-1')
        self.assertEqual(sql('SELECT id FROM swap_probe;').stdout.strip(), '2')


if __name__ == '__main__':
    unittest.main()
