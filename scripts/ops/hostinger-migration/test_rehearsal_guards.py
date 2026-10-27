import importlib.util
from pathlib import Path
import unittest


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FinalRehearsalGuards(unittest.TestCase):
    def test_retired_demo_cannot_fall_back_to_api_or_legacy_files(self):
        proxy = load('clean-proxy-rehearsal')
        routes = ('/demoambiente/assets/', '/demoambiente/api/', '/demoambiente/api-DISABLED/', '/demoambiente/', '= /demoambiente')
        text = '\n'.join('location ' + route + ' { proxy_pass http://old; }' for route in routes)
        output = proxy.retire_unused_routes(text, 'ultimamilla.com.ar')
        self.assertEqual(output.count('return 410;'), 5)
        self.assertNotIn('proxy_pass', output)
        with self.assertRaises(RuntimeError):
            proxy.retire_unused_routes('', 'ultimamilla.com.ar')

    def test_retired_game_preserves_active_aceite_route(self):
        proxy = load('clean-proxy-rehearsal')
        text = 'location /aceite/ { proxy_pass http://127.0.0.1:3022; }\nlocation / { try_files $uri $uri/ /index.html; }'
        output = proxy.retire_unused_routes(text, 'umbot.com.ar')
        self.assertIn('proxy_pass http://127.0.0.1:3022;', output)
        self.assertIn('location / { return 410; }', output)

    def test_database_config_rejects_public_bind_or_enabled_events(self):
        db = load('restrict-database')
        db.validate_config(db.EXPECTED)
        for text in (db.EXPECTED.replace('127.0.0.1', '0.0.0.0'), db.EXPECTED.replace('event_scheduler=OFF', 'event_scheduler=ON')):
            with self.assertRaises(RuntimeError):
                db.validate_config(text)


if __name__ == '__main__':
    unittest.main()
