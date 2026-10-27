import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('sitrep_fence', Path(__file__).with_name('sitrep-source-fence.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SitrepSourceFenceTests(unittest.TestCase):
    def test_identifier_is_fixed_and_safe(self):
        self.assertEqual(module.identifier_parts('42-1'), ('umsa_sitrep_fence_42_1', 'umsa-sitrep-fence-42-1'))
        with self.assertRaises(ValueError):
            module.identifier_parts('42;touch /tmp/x')

    def test_gate_install_never_overwrites_an_existing_file(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(module, 'GATE', Path(tmp) / 'gate.conf'):
            module.atomic_gate('maintenance', exclusive=True)
            self.assertEqual(module.GATE.read_text(), 'maintenance')
            with self.assertRaises(FileExistsError):
                module.atomic_gate('other', exclusive=True)
            self.assertEqual(module.GATE.read_text(), 'maintenance')
            module.atomic_gate('recovered', exclusive=False)
            self.assertEqual(module.GATE.read_text(), 'recovered')

    def test_lock_wait_requires_every_user_table_and_no_other_sessions(self):
        with patch.object(module, 'command', return_value=Mock(returncode=0)), \
             patch.object(module, 'lock_session_count', return_value=1), \
             patch.object(module, 'lock_count', side_effect=[2, 2, 3, 3]), \
             patch.object(module, 'query', side_effect=['3', '0', '3', '0']), \
             patch.object(module.time, 'sleep') as sleep:
            module.wait_for_lock('umsa_sitrep_fence_42_1', 'umsa-sitrep-fence-42-1')
            sleep.assert_called_once()

    def test_recovery_stops_the_helper_before_cancelling_a_remaining_database_session(self):
        events = []
        def command(args, **_):
            events.append(('stop', args[-1]))
            return Mock(returncode=0)
        def query(_database, _sql):
            events.append(('cancel', None))
            return 't'
        with patch.object(module, 'command', side_effect=command), \
             patch.object(module, 'lock_session_count', side_effect=[1, 0, 0]), \
             patch.object(module, 'query', side_effect=query), patch.object(module.time, 'sleep'):
            module.release_lock('umsa_sitrep_fence_42_1', 'umsa-sitrep-fence-42-1')
        self.assertEqual(events, [('stop', 'umsa-sitrep-fence-42-1'), ('cancel', None)])

    def test_recovery_never_restarts_the_old_writer_after_target_authorization(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            gate = directory / 'gate.conf'
            gate.write_text('maintenance')
            (directory / 'target-writes-authorized').write_text('committed')
            with patch.object(module, 'GATE', gate), patch.object(module, 'command') as command, \
                 patch.object(module, 'release_lock') as release:
                with self.assertRaises(RuntimeError):
                    module.recover('app', 'unit', 'maintenance', True, True, directory)
                command.assert_not_called()
                release.assert_not_called()

    def test_verification_refuses_an_unexpected_database_session(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            (directory / 'fence.complete.json').write_text(json.dumps({
                'run': '42-1', 'lock_application': 'umsa_sitrep_fence_42_1',
                'lock_unit': 'umsa-sitrep-fence-42-1', 'locked_relations': 3,
                'runtime_flags': module.EXPECTED_FLAGS}))
            gate = root / 'gate.conf'
            gate.write_text('maintenance')
            with patch.object(module, 'RUN_ROOT', root), patch.object(module, 'GATE', gate), \
                 patch.object(module.socket, 'gethostname', return_value=module.HOST), \
                 patch.object(module, 'load_gate', return_value='maintenance'), \
                 patch.object(module, 'checked_runtime_flags', return_value=module.EXPECTED_FLAGS), \
                 patch.object(module, 'pm2_states', return_value=['stopped', 'stopped']), \
                 patch.object(module, 'command', return_value=Mock(returncode=0)), \
                 patch.object(module, 'lock_session_count', return_value=1), \
                 patch.object(module, 'lock_count', return_value=3), \
                 patch.object(module, 'http_status', return_value='503'), \
                 patch.object(module, 'query', return_value='1'):
                with self.assertRaisesRegex(RuntimeError, 'Unexpected source database session'):
                    module.verify_fence('42-1')

    def test_commit_records_only_a_valid_backup_hash_and_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            with patch.object(module, 'RUN_ROOT', root), patch.object(module, 'verify_fence'):
                with self.assertRaises(ValueError):
                    module.commit_target_writes('42-1', 'invalid', 'b' * 64)
                module.commit_target_writes('42-1', 'a' * 64, 'b' * 64)
                self.assertEqual(json.loads((directory / 'target-writes-authorized').read_text())['offsite_sha256'], 'a' * 64)
                with self.assertRaises(RuntimeError):
                    module.commit_target_writes('42-1', 'b' * 64, 'b' * 64)

    def test_matching_commit_can_be_rechecked_after_source_proxy_activation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            (directory / 'target-writes-authorized').write_text(json.dumps({'run': '42-1', 'offsite_sha256': 'a' * 64,
                                                                            'offsite_files_sha256': 'b' * 64}))
            gate = root / 'gate.conf'
            gate.write_text('proxy')
            with patch.object(module, 'RUN_ROOT', root), patch.object(module, 'GATE', gate), \
                 patch.object(module, 'load_gate', return_value='proxy'), patch.object(module, 'verify_fence') as verify:
                module.commit_target_writes('42-1', 'a' * 64, 'b' * 64)
                verify.assert_called_once_with('42-1', allow_committed=True, gate_mode='proxy')

    def test_existing_healthy_proxy_can_be_rechecked_without_reloading_nginx(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            gate = root / 'gate.conf'
            gate.write_text('proxy')
            with patch.object(module, 'RUN_ROOT', root), patch.object(module, 'GATE', gate), \
                 patch.object(module, 'load_gate', return_value='proxy'), \
                 patch.object(module, 'verify_fence') as verify, \
                 patch.object(module, 'target_health', return_value=True), \
                 patch.object(module, 'reload_nginx') as reload_nginx:
                module.activate_source_proxy('42-1')
                verify.assert_called_once_with('42-1', allow_committed=True, gate_mode='proxy')
                reload_nginx.assert_not_called()
                self.assertTrue((directory / 'source-proxy.complete').is_file())

    def test_proxy_failure_restores_maintenance_without_starting_the_old_writer(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            gate = root / 'gate.conf'
            gate.write_text('maintenance')
            def render(_directory, mode='maintenance'):
                return mode
            with patch.object(module, 'RUN_ROOT', root), patch.object(module, 'GATE', gate), \
                 patch.object(module, 'verify_fence'), patch.object(module, 'load_gate', side_effect=render), \
                 patch.object(module, 'target_health', side_effect=[True, False]), \
                 patch.object(module, 'reload_nginx'), patch.object(module, 'wait_gate'), \
                 patch.object(module, 'command') as command:
                with self.assertRaises(RuntimeError):
                    module.activate_source_proxy('42-1')
                self.assertEqual(gate.read_text(), 'maintenance')
                command.assert_not_called()
                self.assertFalse((directory / 'source-proxy.complete').exists())

    def test_failure_stopping_source_attempts_recovery_with_the_gate_still_active(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / '42-1'
            directory.mkdir()
            (directory / 'sitrep-write-lock.py').write_text('test helper')
            (directory / 'sitrep-fence-watchdog.py').write_text('test watchdog')
            site = root / 'site.conf'
            site.write_text('listen 80;\nlisten 443 ssl http2;\nlisten 443 ssl http2;\n'
                            'server_name sitrep.ultimamilla.com.ar;\n'
                            'server_name www.sitrep.ultimamilla.com.ar;\n')
            gate = root / 'gate.conf'
            def command(args, **_):
                if args[:2] == ['pm2', 'stop']:
                    raise subprocess.CalledProcessError(1, args)
                return Mock(returncode=0)
            with patch.object(module, 'RUN_ROOT', root), patch.object(module, 'SOURCE_SITE', site), \
                 patch.object(module, 'GATE', gate), patch.object(module.socket, 'gethostname', return_value=module.HOST), \
                 patch.object(module, 'pm2_states', return_value=['online', 'online']), \
                 patch.object(module, 'checked_runtime_flags', return_value=module.EXPECTED_FLAGS), \
                 patch.object(module, 'load_gate', return_value='maintenance'), \
                 patch.object(module, 'command', side_effect=command), \
                 patch.object(module, 'reload_nginx'), patch.object(module, 'wait_gate'), \
                 patch.object(module, 'http_status', return_value='200'), \
                 patch.object(module.os, 'umask'), patch.object(module, 'recover') as recover:
                with self.assertRaises(subprocess.CalledProcessError):
                    module.main('42-1')
                recover.assert_called_once_with('umsa_sitrep_fence_42_1', 'umsa-sitrep-fence-42-1',
                                                'maintenance', True, False, directory)
                self.assertEqual(gate.read_text(), 'maintenance')


if __name__ == '__main__':
    unittest.main()
