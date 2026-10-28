import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import unittest

spec = importlib.util.spec_from_file_location('sgi_real', Path(__file__).with_name('rehearse-sgi-real-snapshot.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SgiSnapshotRehearsalTests(unittest.TestCase):
    def test_temporary_mariadb_start_is_not_final_readiness(self):
        temporary = b'Temporary server started; accepting connections'
        final = temporary + b'\nMariaDB init process done. Ready for start up.'
        self.assertNotIn(module.ENTRYPOINT_READY, temporary)
        self.assertIn(module.ENTRYPOINT_READY, final)

    def test_networkless_tmpfs_container_is_required(self):
        safe = {'HostConfig': {'NetworkMode': 'none', 'Privileged': False, 'PortBindings': None,
                               'Tmpfs': {'/var/lib/mysql': 'rw'}}, 'Mounts': []}
        module.assert_isolated(safe)
        for field, value in [('NetworkMode', 'bridge'), ('Privileged', True), ('PortBindings', {'3306': []}),
                             ('Tmpfs', {})]:
            host = dict(safe['HostConfig'])
            host[field] = value
            with self.assertRaises(RuntimeError):
                module.assert_isolated({'HostConfig': host, 'Mounts': []})
        with self.assertRaises(RuntimeError):
            module.assert_isolated({'HostConfig': safe['HostConfig'], 'Mounts': [{'Source': '/host'}]})

    def test_inventory_rejects_changed_or_unsafe_names(self):
        rows = [f'T|table_{index}|InnoDB' for index in range(168)]
        rows += [f'V|view_{index}|root@localhost|DEFINER' for index in range(4)]
        rows += [f'R|routine_{index}|root@localhost|DEFINER' for index in range(2)]
        rows += ['G|trigger_1|root@localhost|INSERT']
        self.assertEqual(len(module.parse_inventory('\n'.join(rows))), 175)
        with self.assertRaises(RuntimeError):
            module.parse_inventory('\n'.join(rows[:-1]))
        with self.assertRaises(ValueError):
            module.parse_inventory('\n'.join(rows + ['T|table`unsafe|InnoDB']))

    @unittest.skipUnless(os.environ.get('SGI_SNAPSHOT_CI') == '1', 'requires disposable CI container')
    def test_real_docker_metadata_matches_the_isolation_guard(self):
        details = json.loads(subprocess.check_output(['docker', 'inspect', 'umsa-sgi-snapshot-ci'], text=True))[0]
        module.assert_isolated(details)
        for _ in range(90):
            logs = subprocess.run(['docker', 'logs', 'umsa-sgi-snapshot-ci'], capture_output=True)
            if module.ENTRYPOINT_READY in logs.stdout + logs.stderr:
                query = subprocess.run(['docker', 'exec', 'umsa-sgi-snapshot-ci', 'mariadb', '--no-defaults',
                                        '-uroot', '-N', '-e', 'SELECT 1'], capture_output=True)
                if query.returncode == 0 and query.stdout.strip() == b'1':
                    break
            time.sleep(1)
        else:
            self.fail('The final disposable MariaDB did not become ready')


if __name__ == '__main__':
    unittest.main()
