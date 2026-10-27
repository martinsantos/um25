import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, Mock

spec = importlib.util.spec_from_file_location('local_mail', Path(__file__).with_name('activate-local-mail.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LocalMailActivationTests(unittest.TestCase):
    def test_boot_readiness_fails_for_a_disabled_service(self):
        with patch.object(module.subprocess, 'run', return_value=Mock(returncode=1)) as run:
            self.assertFalse(module.unit_is_enabled('vivero-relay-hostinger'))
            run.assert_called_once_with(['systemctl', 'is-enabled', '--quiet', 'vivero-relay-hostinger'])
        with patch.object(module.subprocess, 'run', return_value=Mock(returncode=0)):
            self.assertTrue(module.unit_is_enabled('vivero-relay-hostinger'))

    def test_spf_must_be_the_reviewed_transition_record(self):
        expected = module.SPF['ultimamilla.com.ar']
        module.check_spf('"google-verification=x"\n"' + expected + '"\n', expected)
        with self.assertRaises(ValueError):
            module.check_spf('"' + expected.replace(' ip4:179.198.115.115', '') + '"\n', expected)
        with self.assertRaises(ValueError):
            module.check_spf('"' + expected + '"\n"' + expected + '"\n', expected)

    def test_helo_does_not_overwrite_a_prior_setting(self):
        self.assertIn('smtp_helo_name = srv2101069.hstgr.cloud', module.append_helo('myhostname = umbot.com.ar\n'))
        with self.assertRaises(ValueError):
            module.append_helo('smtp_helo_name = existing.example\n')

    def test_forward_and_reverse_are_checked_via_dns(self):
        answers = {
            ('dig', '+short', 'TXT', domain): '"' + value + '"\n'
            for domain, value in module.SPF.items()
        }
        answers[('dig', '+short', 'A', module.NAME)] = module.IP + '\n'
        answers[('dig', '+short', '-x', module.IP)] = module.NAME + '.\n'
        with patch.object(module.subprocess, 'check_output', side_effect=lambda args, **_: answers[tuple(args)]):
            module.check_dns()
            answers[('dig', '+short', 'A', module.NAME)] = '127.0.0.1\n'
            with self.assertRaises(RuntimeError):
                module.check_dns()

    def test_queue_must_be_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ('active', 'deferred', 'incoming', 'hold'):
                (root / name).mkdir()
            self.assertTrue(module.queue_empty(root))
            (root / 'deferred' / 'message').write_text('not empty')
            self.assertFalse(module.queue_empty(root))


if __name__ == '__main__':
    unittest.main()
