import importlib.util
from pathlib import Path
import unittest


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


start = load('start_vivero', 'start-vivero-relay-standby.py')
probe = load('probe_vivero', 'probe-vivero-relay-standby.py')


class ViveroRelayStandbyTests(unittest.TestCase):
    def setUp(self):
        self.clients = '68.168.218.28/32 OK\n0.0.0.0/0 REJECT denied\n::/0 REJECT denied\n'
        self.master = '179.198.115.115:587 inet n - n - 3 smtpd\n  -o smtpd_tls_security_level=encrypt\n'

    def test_rejects_expanded_relay_access(self):
        start.validate_config(dict(start.SETTINGS), self.clients, self.master)
        with self.assertRaises(ValueError):
            start.validate_config(dict(start.SETTINGS), '0.0.0.0/0 OK\n', self.master)
        with self.assertRaises(ValueError):
            start.validate_config(dict(start.SETTINGS), self.clients, self.master + 'smtp inet n - n - - smtpd\n')
        changed = dict(start.SETTINGS, smtpd_tls_auth_only='no')
        with self.assertRaises(ValueError):
            start.validate_config(changed, self.clients, self.master)
        start.validate_recipient_denial('REJECT 5.7.1 unrelated recipient')
        with self.assertRaises(ValueError):
            start.validate_recipient_denial('OK')

    def test_client_must_still_use_old_relay(self):
        self.assertEqual(probe.credential('[23.105.176.45]:587 example:secret\n'), ['example', 'secret'])
        with self.assertRaises(ValueError):
            probe.credential('[179.198.115.115]:587 example:secret\n')
        with self.assertRaises(ValueError):
            probe.credential('[23.105.176.45]:587 example:secret\nother bad:line\n')


if __name__ == '__main__':
    unittest.main()
