import importlib.util
from pathlib import Path
import unittest


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


source = load('sgi_source_cutover', 'sgi-source-cutover.py')
public = load('public_vhost', 'public-vhost.py')


class SgiCutoverTests(unittest.TestCase):
    def test_restart_guard_preserves_other_processes_and_monitoring(self):
        original = '''for process in "${REQUIRED_PROCESSES[@]}"; do
    log_message "DEBUG" "Checking process: $process"
    check "$process"
done
pm2 save
'''
        changed = source.monitor_text(original)
        self.assertIn('"$process" = "sgi"', changed)
        self.assertIn('check "$process"', changed)
        self.assertTrue(changed.endswith('pm2 save\n'))
        self.assertEqual(changed.count('continue'), 1)
        with self.assertRaises(RuntimeError):
            source.monitor_text(changed)

    def test_vhosts_bind_only_the_hostinger_public_address(self):
        text = 'server {\n listen 127.0.0.1:443 ssl http2;\n listen [::1]:443 ssl http2;\n server_name sgi.ultimamilla.com.ar;\n}\n'
        result = public.public_listeners(text)
        self.assertIn('listen 179.198.115.115:443 ssl http2;', result)
        self.assertNotIn('[::1]', result)
        self.assertNotIn('127.0.0.1:443', result)
        with self.assertRaises(RuntimeError):
            public.public_listeners('server { listen 443 ssl; }')

    def test_sitrep_routes_remain_while_only_cloudflare_can_supply_client_ip(self):
        original = '''events {}\nhttp {
    set_real_ip_from 23.105.176.45;
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;
server { listen 179.198.115.115:443 ssl; server_name sitrep.ultimamilla.com.ar; }
}\n'''
        result = public.extend_front(original)
        self.assertIn('server_name sitrep.ultimamilla.com.ar', result)
        self.assertNotIn('set_real_ip_from 23.105.176.45;', result)
        self.assertEqual(result.count('00-ultimamilla-llm-analytics.conf'), 1)
        self.assertEqual(public.extend_front(result), result)

    def test_maintenance_is_scoped_to_sgi_and_advertises_retry(self):
        text = source.maintenance()
        self.assertIn('return 503', text)
        self.assertIn('Retry-After 120', text)
        self.assertNotIn('sitrep.', text)
        self.assertNotIn('server_name www.ultimamilla', text)


if __name__ == '__main__':
    unittest.main()
