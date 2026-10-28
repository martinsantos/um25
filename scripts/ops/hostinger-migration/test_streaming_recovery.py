import importlib.util
import io
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('streaming_recovery', Path(__file__).with_name('rehearse-streaming-recovery.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StreamingRecoveryTests(unittest.TestCase):
    def test_encrypts_and_recovers_the_archive_with_a_separate_keyring(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            secret, public_ring = root / 'secret', root / 'public'
            secret.mkdir(mode=0o700)
            gpg = ['gpg', '--homedir', str(secret), '--batch', '--pinentry-mode', 'loopback', '--passphrase', '']
            subprocess.run(gpg + ['--quick-generate-key', 'Isolated Recovery Test', 'rsa2048', 'encr', '1d'],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            listing = subprocess.check_output(gpg + ['--with-colons', '--list-keys'], text=True, stderr=subprocess.DEVNULL)
            fingerprint = next(row.split(':')[9] for row in listing.splitlines() if row.startswith('fpr:'))
            public_key = root / 'key.asc'
            public_key.write_bytes(subprocess.check_output(gpg + ['--armor', '--export', fingerprint]))
            module.import_recipient(public_ring, public_key, fingerprint)
            (root / 'data').mkdir()
            (root / 'data' / 'one').write_bytes(b'recovery-stream-example')
            encrypted = root / 'archive.gpg'
            module.encrypted_archive(root, ['data'], public_ring, fingerprint, encrypted)
            self.assertNotIn(b'recovery-stream-example', encrypted.read_bytes())
            restored = subprocess.check_output(gpg + ['--decrypt', str(encrypted)], stderr=subprocess.DEVNULL)
            with tarfile.open(fileobj=io.BytesIO(restored), mode='r:gz') as archive:
                self.assertEqual(archive.extractfile('data/one').read(), b'recovery-stream-example')

    def test_recipient_fingerprint_is_checked(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            public_key = Path(__file__).with_name('offsite-recovery-public.asc')
            with self.assertRaises(RuntimeError):
                module.import_recipient(root / 'public', public_key, '0' * 40)


if __name__ == '__main__':
    unittest.main()
