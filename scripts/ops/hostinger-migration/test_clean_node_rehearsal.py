import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('clean_node', Path(__file__).with_name('clean-node-rehearsal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CleanNodeGuards(unittest.TestCase):
    def test_sitrep_listener_is_explicitly_local_and_unknown_code_is_rejected(self):
        self.assertEqual(module.local_sitrep_listener('app.listen(PORT, () => {'), "app.listen(PORT, '127.0.0.1', () => {")
        with self.assertRaises(RuntimeError):
            module.local_sitrep_listener('app.listen(3002);')

    def test_old_runtime_injection_removed_and_listener_forced_local(self):
        env = module.safe_environment({'NODE_PATH': '/old/modules', 'NODE_OPTIONS': '--require=/old/a.js',
            'LD_PRELOAD': '/old/a.so', 'PYTHONPATH': '/old/python', 'PORT': 80, 'HOST': '0.0.0.0',
            'SESSION_SECRET': 'new-secret', 'DB_PASS': 'new-password'}, 'sgi', Path('/clean/sgi'))
        self.assertEqual(env['HOST'], '127.0.0.1')
        self.assertEqual(env['PORT'], '3000')
        self.assertEqual(env['DB_PASS'], 'new-password')
        for key in ('NODE_PATH', 'NODE_OPTIONS', 'LD_PRELOAD', 'PYTHONPATH'):
            self.assertNotIn(key, env)

    def test_cms_and_sqlite_never_point_at_old_host_or_live_copied_database(self):
        env = module.safe_environment({'DIRECTUS_URL': 'https://admin.ultimamilla.com.ar'}, 'astro-ultimamilla', Path('/clean/web'))
        self.assertEqual(env['DIRECTUS_URL'], 'http://127.0.0.1:8055')
        env = module.safe_environment({}, 'umbot-aceite', Path('/clean/aceite'))
        self.assertEqual(env['DATABASE_URL'], 'file:/clean/aceite/db/custom.db')

    def test_env_values_cannot_inject_additional_environment_lines(self):
        with self.assertRaises(ValueError):
            module.safe_environment({'SAFE': 'value\nNODE_OPTIONS=bad'}, 'sgi', Path('/clean/sgi'))
        self.assertEqual(module.environment_text({'VALUE': 'a"b\\c$literal'}), 'VALUE="a\\"b\\\\c$literal"\n')

    def test_pointer_outside_trusted_staging_is_rejected(self):
        with self.assertRaises(RuntimeError):
            module.trusted_application('/root/copied-app', '', 'server.js')


if __name__ == '__main__':
    unittest.main()
