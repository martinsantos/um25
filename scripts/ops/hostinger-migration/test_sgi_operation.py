import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sgi_operation', Path(__file__).with_name('finish-sgi-operation.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SgiOperationTests(unittest.TestCase):
    def test_restore_source_flags_keeps_the_current_database_and_session(self):
        current = {'DB_SOCKET': '/private/current.sock', 'DB_PASS': 'rotated', 'SESSION_SECRET': 'current',
                   'PORT': '3000', 'SGI_OPERATIONAL_WATCHDOG': 'false', 'DISABLE_EMAILS': 'true',
                   'NODE_APP_INSTANCE': 'migration-rehearsal'}
        restored = module.production_environment(current, {'NODE_APP_INSTANCE': 0})
        self.assertEqual(restored['NODE_APP_INSTANCE'], '0')
        self.assertNotIn('SGI_OPERATIONAL_WATCHDOG', restored)
        self.assertNotIn('DISABLE_EMAILS', restored)
        for key in ('DB_SOCKET', 'DB_PASS', 'SESSION_SECRET'):
            self.assertEqual(restored[key], current[key])
        self.assertEqual(restored['HOST'], '127.0.0.1')

    def test_managed_environment_round_trip_does_not_execute_or_expand_text(self):
        values = {'KEY': 'a\\b"c $(literal) `literal` $value', 'PORT': '3001'}
        self.assertEqual(module.parse_environment(module.environment_text(values)), values)
        for invalid in ('KEY=unquoted', 'KEY="a"\nKEY="b"', 'LD_PRELOAD="a"\ninvalid'):
            with self.assertRaises(ValueError):
                module.parse_environment(invalid)

    def test_only_the_reviewed_sgi_upstream_is_switched(self):
        text = 'proxy_pass http://127.0.0.1:3000;\nproxy_pass http://127.0.0.1:4321;'
        result = module.new_upstream(text)
        self.assertIn(':3001;', result)
        self.assertIn(':4321;', result)
        with self.assertRaises(RuntimeError):
            module.new_upstream(text + text)
