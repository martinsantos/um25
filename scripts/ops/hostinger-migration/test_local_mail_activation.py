import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('local_mail', Path(__file__).with_name('activate-local-mail.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LocalMailActivationTests(unittest.TestCase):
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
