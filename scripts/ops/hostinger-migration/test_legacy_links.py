import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('legacy_links', Path(__file__).with_name('legacy-links.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class LegacyAccessTests(unittest.TestCase):
    def test_http_challenges_are_locations_not_server_return_redirects(self):
        text = m.render()
        self.assertEqual(text.count('location ^~ /.well-known/acme-challenge/'), 7)
        self.assertEqual(text.count('location / {'), 7)
        self.assertEqual(text.count('return 302 https://mail.google.com/a/ultimamilla.com.ar/;'), 2)
        self.assertEqual(text.count('return 410 '), 5)
        self.assertNotIn('proxy_pass', text)
        self.assertNotIn('23.105.176.45', text)

    def test_tls_uses_independent_managed_certificate_for_every_access(self):
        text = m.render(True)
        self.assertEqual(text.count(':443 ssl;'), 7)
        self.assertEqual(text.count('/legacy-access.ultimamilla.com.ar/fullchain.pem;'), 7)
        self.assertNotIn('/etc/letsencrypt/live/', text)

    def test_failed_reload_restores_existing_vhost(self):
        with tempfile.TemporaryDirectory() as root:
            site = Path(root) / 'site.conf'
            site.write_text('original')
            with patch.object(m, 'SITE', site), patch.object(m, 'reload_ingress', side_effect=[RuntimeError('invalid config'), None]):
                with self.assertRaisesRegex(RuntimeError, 'invalid config'):
                    m.replace_site('candidate', Path(root))
            self.assertEqual(site.read_text(), 'original')
            self.assertEqual((Path(root) / 'legacy-access.before.conf').read_text(), 'original')

    def test_failed_health_probe_restores_existing_vhost(self):
        with tempfile.TemporaryDirectory() as root:
            site = Path(root) / 'site.conf'
            site.write_text('original')
            with patch.object(m, 'SITE', site), patch.object(m, 'reload_ingress') as reload, patch.object(m, 'probe', side_effect=RuntimeError('main health failed')):
                with self.assertRaisesRegex(RuntimeError, 'main health failed'):
                    m.replace_site('candidate', Path(root))
            self.assertEqual(site.read_text(), 'original')
            self.assertEqual(reload.call_count, 2)

    def test_failed_first_install_preserves_candidate_outside_ingress(self):
        with tempfile.TemporaryDirectory() as root:
            site = Path(root) / 'site.conf'
            with patch.object(m, 'SITE', site), patch.object(m, 'reload_ingress', side_effect=[RuntimeError('bad'), None]):
                with self.assertRaises(RuntimeError):
                    m.replace_site('candidate', Path(root))
            self.assertFalse(site.exists())
            self.assertEqual((Path(root) / 'legacy-access.failed.conf').read_text(), 'candidate')


if __name__ == '__main__':
    unittest.main()
