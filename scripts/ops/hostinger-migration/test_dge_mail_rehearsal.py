import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('mail', Path(__file__).with_name('rehearse-dge-mail.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class QueueGuard(unittest.TestCase):
    def test_requires_empty_real_queue_directories(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('active', 'deferred', 'incoming', 'hold'):
                (root / name).mkdir()
            self.assertTrue(module.queue_empty(root))
            (root / 'deferred/message').write_text('pending')
            self.assertFalse(module.queue_empty(root))


if __name__ == '__main__':
    unittest.main()
