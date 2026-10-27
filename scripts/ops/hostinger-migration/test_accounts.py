import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('accounts', Path(__file__).with_name('runtime-accounts.py'))
accounts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(accounts)


class ServiceIdentities(unittest.TestCase):
    def test_preserves_ids_without_enabling_human_logins(self):
        users = 'nginx:x:978:979:Nginx:/var/lib/nginx:/bin/bash\nmartin:x:1000:1000::/home/martin:/bin/bash\n'
        commands = accounts.plan(users, 'nginx:x:979:\nmartin:x:1000:\n', {}, {})
        self.assertEqual(len(commands), 2)
        self.assertIn('/sbin/nologin', commands[1])
        self.assertNotIn('martin', str(commands))

    def test_existing_id_collision_stops_before_any_command(self):
        with self.assertRaises(ValueError):
            accounts.plan('nginx:x:978:979::/var/lib/nginx:/sbin/nologin', 'nginx:x:979:', {}, {'other': 979})

    def test_existing_service_with_wrong_id_is_not_modified(self):
        with self.assertRaises(ValueError):
            accounts.plan('nginx:x:978:979::/var/lib/nginx:/sbin/nologin', 'nginx:x:979:', {'nginx': (995, 979)}, {'nginx': 979})

    def test_cannot_create_root_service(self):
        with self.assertRaises(ValueError):
            accounts.plan('nginx:x:0:0::/root:/bin/bash', 'root:x:0:', {}, {'root': 0})


if __name__ == '__main__':
    unittest.main()
