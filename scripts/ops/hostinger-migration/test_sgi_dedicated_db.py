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
    def test_environment_adds_only_the_private_database_socket(self):
        original = 'DB_HOST="localhost"\nDB_PORT="3306"\nDB_USER="sgi_app"\nDB_PASS="example"\n'
        socket_path = '/srv/umsa-migration/sgi-dedicated-rehearsals/42-1/socket/mysqld.sock'
        self.assertEqual(module.override_environment(original, socket_path), original + 'DB_SOCKET=' + socket_path + '\n')
        with self.assertRaises(RuntimeError):
            module.override_environment(original + 'DB_SOCKET=/a\nDB_SOCKET=/b\n', socket_path)
        with self.assertRaises(ValueError):
            module.override_environment(original, '/tmp/untrusted.sock')

    def test_only_reviewed_app_credentials_are_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'app.cnf'
            file.write_text('[client]\nuser=sgi_app\npassword="valid_password_12345"\n')
            self.assertEqual(module.app_password(file), 'valid_password_12345')
            file.write_text('[client]\nuser=root\npassword="valid_password_12345"\n')
            with self.assertRaises(RuntimeError):
                module.app_password(file)

    @unittest.skipUnless(os.environ.get('SGI_DEDICATED_CI') == '1', 'requires a disposable CI container')
    def test_networkless_container_has_a_host_accessible_unix_socket(self):
        name = 'umsa-sgi-dedicated-ci'
        container = json.loads(subprocess.check_output(['docker', 'inspect', name], text=True))[0]
        self.assertEqual(container['HostConfig']['NetworkMode'], 'none')
        self.assertFalse(container['HostConfig']['PortBindings'])
        socket_path = os.environ['SGI_DEDICATED_SOCKET'] + '/mysqld.sock'
        for _ in range(90):
            logs = subprocess.run(['docker', 'logs', name], capture_output=True)
            if b'MariaDB init process done. Ready for start up.' in logs.stdout + logs.stderr:
                try:
                    with socket.socket(socket.AF_UNIX) as connection:
                        connection.settimeout(1)
                        connection.connect(socket_path)
                        if connection.recv(100):
                            break
                except OSError:
                    pass
            time.sleep(1)
        else:
            self.fail('Dedicated database did not respond on loopback')


if __name__ == '__main__':
    unittest.main()
