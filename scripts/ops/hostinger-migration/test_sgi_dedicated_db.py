import importlib.util
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import unittest

spec = importlib.util.spec_from_file_location('sgi_candidate', Path(__file__).with_name('rehearse-sgi-dedicated-db.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SgiDedicatedDatabaseTests(unittest.TestCase):
    def test_environment_changes_only_the_destination_host_and_port(self):
        original = 'DB_HOST="localhost"\nDB_PORT="3306"\nDB_USER="sgi_app"\nDB_PASS="example"\n'
        self.assertEqual(module.override_environment(original),
                         'DB_HOST=127.0.0.1\nDB_PORT=13306\nDB_USER="sgi_app"\nDB_PASS="example"\n')
        for value in (original + 'DB_PORT=3307\n', 'DB_HOST=localhost\n'):
            with self.assertRaises(RuntimeError):
                module.override_environment(value)

    def test_only_reviewed_app_credentials_are_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'app.cnf'
            file.write_text('[client]\nuser=sgi_app\npassword="valid_password_12345"\n')
            self.assertEqual(module.app_password(file), 'valid_password_12345')
            file.write_text('[client]\nuser=root\npassword="valid_password_12345"\n')
            with self.assertRaises(RuntimeError):
                module.app_password(file)

    @unittest.skipUnless(os.environ.get('SGI_DEDICATED_CI') == '1', 'requires isolated CI network')
    def test_internal_docker_network_can_publish_only_to_host_loopback(self):
        name = 'umsa-sgi-dedicated-ci'
        network = json.loads(subprocess.check_output(['docker', 'network', 'inspect', name], text=True))[0]
        container = json.loads(subprocess.check_output(['docker', 'inspect', name], text=True))[0]
        self.assertTrue(network['Internal'])
        bindings = container['HostConfig']['PortBindings']['3306/tcp']
        self.assertEqual(bindings, [{'HostIp': '127.0.0.1', 'HostPort': '13306'}])
        for _ in range(90):
            logs = subprocess.run(['docker', 'logs', name], capture_output=True)
            if b'MariaDB init process done. Ready for start up.' in logs.stdout + logs.stderr:
                try:
                    with socket.create_connection(('127.0.0.1', 13306), timeout=1) as connection:
                        if connection.recv(100):
                            break
                except OSError:
                    pass
            time.sleep(1)
        else:
            self.fail('Dedicated database did not respond on loopback')


if __name__ == '__main__':
    unittest.main()
