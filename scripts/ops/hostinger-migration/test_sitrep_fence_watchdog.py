import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('sitrep_watchdog', Path(__file__).with_name('sitrep-fence-watchdog.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepFenceWatchdogTests(unittest.TestCase):
    def test_never_restarts_old_writer_after_target_is_authorized(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            (directory / 'target-writes-authorized').write_text('committed')
            fake = Mock()
            fake.identifier_parts.return_value = ('app', 'unit')
            with patch.object(module, 'ROOT', root), \
                 patch.object(module.socket, 'gethostname', return_value='FTS-23.105.176.45'), \
                 patch.object(module, 'load_source', return_value=fake):
                module.main('42-1')
            fake.recover.assert_not_called()
            fake.command.assert_not_called()

    def test_unfinished_maintenance_recovers_even_if_lock_is_still_starting(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            (directory / 'fence.started.json').write_text('{}')
            gate = root / 'gate.conf'
            gate.write_text('maintenance')
            fake = Mock()
            fake.identifier_parts.return_value = ('app', 'unit')
            fake.load_gate.return_value = 'maintenance'
            fake.pm2_states.return_value = ['stopped', 'stopped']
            fake.EXPECTED_PROCESSES = 2
            fake.GATE = gate
            with patch.object(module, 'ROOT', root), \
                 patch.object(module.socket, 'gethostname', return_value='FTS-23.105.176.45'), \
                 patch.object(module, 'load_source', return_value=fake):
                module.main('42-1')
            fake.recover.assert_called_once_with('app', 'unit', 'maintenance', True, True, directory)
            self.assertTrue((directory / 'fence.recovered').exists())


if __name__ == '__main__':
    unittest.main()
