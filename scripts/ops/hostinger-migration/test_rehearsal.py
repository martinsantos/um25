import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('rehearsal', Path(__file__).with_name('rehearsal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RehearsalGuards(unittest.TestCase):
    def test_ipv4_ipv6_and_inline_listeners_are_local(self):
        text = 'listen 443 ssl; listen [::]:443 ssl;\nlisten 80; listen [::]:80;'
        self.assertEqual(module.local_listeners(text),
                         'listen 127.0.0.1:443 ssl; listen [::1]:443 ssl;\nlisten 127.0.0.1:80; listen [::1]:80;')

    def test_unrecognized_listener_is_not_exposed(self):
        with self.assertRaises(ValueError):
            module.local_listeners('listen 0.0.0.0:8443 ssl;')

    def test_stopped_processes_and_duplicate_workers_are_not_started(self):
        rows = [dict(name=name, pm2_env=dict(status='online', env={'SSH_AUTH_SOCK': '/old/socket'},
                    exec_interpreter='node', pm_cwd='/application', pm_exec_path='/application/server.js'))
                for name in module.APP_NAMES]
        rows += [rows[0], dict(name='sitrep-demo-backend', pm2_env=dict(status='stopped'))]
        plan = module.node_plan(rows)
        self.assertEqual(set(plan), module.APP_NAMES)
        for item in plan.values():
            self.assertEqual(item['env']['NODE_APP_INSTANCE'], 'migration-rehearsal')
            self.assertEqual(item['env']['DISABLE_EMAILS'], 'true')
            self.assertEqual(item['env']['HOST'], '127.0.0.1')
            self.assertNotIn('SSH_AUTH_SOCK', item['env'])


if __name__ == '__main__':
    unittest.main()
