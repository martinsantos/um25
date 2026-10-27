import base64
import importlib.util
from pathlib import Path
import struct
import unittest

spec=importlib.util.spec_from_file_location('receiver',Path(__file__).with_name('authorize-backup-receiver.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class ReceiverKeyTests(unittest.TestCase):
    def key(self):
        return 'ssh-ed25519 '+base64.b64encode(struct.pack('>I',11)+b'ssh-ed25519'+struct.pack('>I',32)+bytes(range(32))).decode()+' umsa-hostinger-backups-20261027'

    def test_key_is_always_forced_and_source_restricted(self):
        line=module.authorized_line(self.key())
        self.assertTrue(line.startswith('restrict,from="179.198.115.115",command="/usr/local/bin/umbak-recibe" '))
        self.assertEqual(line.count('\n'),1)

    def test_options_and_extra_lines_cannot_be_injected(self):
        for value in [self.key()+'\nssh-ed25519 other attacker','command="sh" '+self.key(),self.key().replace('ssh-ed25519','ssh-rsa',1)]:
            with self.assertRaises(ValueError):module.authorized_line(value)
