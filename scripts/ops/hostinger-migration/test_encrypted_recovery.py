import hashlib
import importlib.util
import io
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('recovery', Path(__file__).with_name('rehearse-encrypted-recovery.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class EncryptedRecoveryTests(unittest.TestCase):
    def test_space_listing_must_be_unambiguous(self):
        self.assertEqual(module.available_gb('files\nlibre 14 GB\n'), 14)
        for value in ('libre unknown GB', 'libre 10 GB\nlibre 10 GB', ''):
            with self.assertRaises(RuntimeError):
                module.available_gb(value)

    def test_manifest_detects_mutation_and_unreviewed_link(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'one').write_bytes(b'abc')
            digest = hashlib.sha256(b'one\0' + hashlib.sha256(b'abc').digest()).hexdigest()
            expected = {'files': 1, 'bytes': 3, 'content_sha256': digest}
            module.verify_tree(root, 'sample', expected)
            (root / 'one').write_bytes(b'bad')
            with self.assertRaises(RuntimeError):
                module.verify_tree(root, 'sample', expected)
            (root / 'one').write_bytes(b'abc')
            (root / 'unexpected').symlink_to('/etc/passwd')
            with self.assertRaises(RuntimeError):
                module.verify_tree(root, 'sample', expected)

    def test_encrypted_archive_decrypts_without_following_links(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            cert, key, output = root / 'cert.pem', root / 'key.pem', root / 'archive.cms'
            subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', str(key),
                            '-out', str(cert), '-days', '1', '-subj', '/CN=isolated-test'],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            (root / 'data').mkdir()
            (root / 'data' / 'example').write_bytes(b'recovery-example')
            (root / 'data' / 'link').symlink_to('/etc/passwd')
            module.encrypted_archive(root, ['data'], cert, output)
            self.assertNotIn(b'recovery-example', output.read_bytes())
            result = subprocess.check_output(['openssl', 'cms', '-decrypt', '-binary', '-inform', 'DER',
                                              '-recip', str(cert), '-inkey', str(key), '-in', str(output)])
            with tarfile.open(fileobj=io.BytesIO(result), mode='r:gz') as archive:
                self.assertEqual(archive.extractfile('data/example').read(), b'recovery-example')
                self.assertTrue(archive.getmember('data/link').issym())


if __name__ == '__main__':
    unittest.main()
