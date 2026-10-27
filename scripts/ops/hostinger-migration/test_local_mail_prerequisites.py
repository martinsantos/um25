import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('mail', Path(__file__).with_name('prepare-local-mail-prerequisites.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AliasPreparation(unittest.TestCase):
    def test_reassembles_split_dns_public_key(self):
        self.assertEqual(module.dkim_dns_key('"v=DKIM1; p=aG" "VsbG8="\n'), b'hello')
        with self.assertRaises(ValueError):
            module.dkim_dns_key('"v=DKIM1; p=aGVsbG8="\n"v=DKIM1; p=aGVsbG8="\n')

    def test_preserves_target_and_adds_address(self):
        new, address = module.append_reviewed_alias('martin: name@example.com\n', 'postmaster: root\n')
        self.assertEqual(address, 'name@example.com')
        self.assertEqual(new, 'postmaster: root\nmartin: name@example.com\n')

    def test_rejects_executable_or_duplicate_aliases(self):
        for source, target in (('martin: |/bin/sh\n', ''), ('martin: x@y\nmartin: z@y\n', ''),
                               ('martin: x@y\n', 'martin: z@y\n')):
            with self.assertRaises(ValueError):
                module.append_reviewed_alias(source, target)


if __name__ == '__main__':
    unittest.main()
