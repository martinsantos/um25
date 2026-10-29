import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('ssh_keys', Path(__file__).with_name('ssh-key-only.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class KeyOnlyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.conf = self.root / 'sshd_config'
        self.conf.write_text('PermitRootLogin yes\n')
        self.directory = self.root / 'sshd_config.d'
        self.directory.mkdir(mode=0o700)
        self.dropin = self.directory / '00-umsa-key-only.conf'
        self.keys = self.root / 'authorized_keys'
        self.keys.write_text('fixture-existing-public-key\n')
        self.keys.chmod(0o600)
        self.base = self.root / 'receipts'
        self.base.mkdir(mode=0o700)
        self.before = {'configs': {'original': 'sha'}, 'authorized_keys': 'unchanged'}
        self.calls = []
        self.patches = [
            patch.object(m, 'BASE', self.base),
            patch.object(m, 'DROPIN', self.dropin),
            patch.object(m, 'MAIN', self.conf),
            patch.object(m, 'KEYS', self.keys),
            patch.object(m, 'LOCK', self.root / 'lock'),
            patch.object(m, 'OWNER', (os.getuid(), os.getgid())),
            patch.object(m, 'guard'),
            patch.object(m, 'snapshot', return_value=(self.before, 'a' * 64)),
            patch.object(m, 'daemon', return_value='MainPID=1234'),
            patch.object(m, 'run', side_effect=self.command),
            patch.object(m, 'verify_policy', return_value=m.WANTED.copy()),
            patch.dict(os.environ, {'GITHUB_ACTIONS': 'true'})]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in reversed(self.patches):
            p.stop()
        self.temp.cleanup()

    def command(self, args):
        self.calls.append(args)
        if 'umsa-active-backup.service' in args:
            return 'success'
        return ''

    def test_apply_arms_rollback_before_reload_and_preserves_keys(self):
        keys = self.keys.read_bytes()
        r = m.execute('apply', '100-1', 'a' * 64)
        self.assertEqual(r['phase'], 'applied')
        self.assertEqual(self.keys.read_bytes(), keys)
        self.assertEqual(self.conf.read_text(), 'PermitRootLogin yes\n')
        self.assertEqual(self.dropin.read_bytes(), m.CONTENT)
        arm = next(i for i, a in enumerate(self.calls) if a[0] == 'systemd-run')
        reload = self.calls.index(['systemctl', 'reload', 'sshd'])
        self.assertLess(arm, reload)
        self.assertFalse(any('restart' in a for a in self.calls))

    def test_wrong_plan_never_writes_ssh_or_arms_timer(self):
        with self.assertRaisesRegex(RuntimeError, 'Inspection drift'):
            m.execute('apply', '100-1', 'b' * 64)
        self.assertFalse(self.dropin.exists())
        self.assertFalse(self.calls)

    def test_backup_must_succeed_before_hardening(self):
        with patch.object(m, 'run', return_value='exit-code'):
            with self.assertRaisesRegex(RuntimeError, 'external backup'):
                m.execute('apply', '100-1', 'a' * 64)
        self.assertFalse(self.dropin.exists())

    def test_reload_failure_restores_previous_policy(self):
        reloads = 0
        def command(args):
            nonlocal reloads
            if args == ['systemctl', 'reload', 'sshd']:
                reloads += 1
                if reloads == 1:
                    raise RuntimeError('fixture reload failure')
            return self.command(args)
        with patch.object(m, 'run', side_effect=command):
            with self.assertRaisesRegex(RuntimeError, 'fixture'):
                m.execute('apply', '100-1', 'a' * 64)
        self.assertFalse(self.dropin.exists())
        self.assertTrue((self.base / '100-1/rolled-back.json').exists())
        self.assertEqual(self.keys.read_text(), 'fixture-existing-public-key\n')

    def test_confirmation_requires_admin_receipt_and_cancels_only_rollback_timer(self):
        m.execute('apply', '100-1', 'a' * 64)
        with self.assertRaisesRegex(RuntimeError, 'verification receipt'):
            m.execute('confirm', '100-1', 'missing')
        r = m.execute('confirm', '100-1', 'c' * 64)
        self.assertEqual(r['phase'], 'confirmed')
        self.assertIn(['systemctl', 'stop', 'umsa-ssh-key-rollback-100-1.timer'], self.calls)
        self.assertEqual(m.execute('rollback', '100-1')['rollback'], 'not-required-after-confirmation')
        self.assertTrue(self.dropin.exists())

    def test_expired_confirmation_preserves_rollback(self):
        m.execute('apply', '100-1', 'a' * 64)
        with patch.object(m.time, 'time', return_value=time.time() + 1000):
            with self.assertRaisesRegex(RuntimeError, 'expired'):
                m.execute('confirm', '100-1', 'c' * 64)
        self.assertFalse((self.base / '100-1/confirmed.json').exists())

    def test_changed_authorized_keys_prevent_confirmation(self):
        m.execute('apply', '100-1', 'a' * 64)
        with patch.object(m, 'snapshot', return_value=({'different': 'keys'}, 'b' * 64)):
            with self.assertRaisesRegex(RuntimeError, 'changed'):
                m.execute('confirm', '100-1', 'c' * 64)
        self.assertFalse((self.base / '100-1/confirmed.json').exists())

    def test_rollback_never_removes_an_unknown_dropin(self):
        m.execute('apply', '100-1', 'a' * 64)
        self.dropin.write_text('Unexpected different configuration\n')
        with self.assertRaisesRegex(RuntimeError, 'unexpected external'):
            m.execute('rollback', '100-1')
        self.assertTrue(self.dropin.exists())

    def test_symlink_and_writable_policy_rejected(self):
        self.dropin.symlink_to(self.conf)
        with self.assertRaises(RuntimeError):
            m.safe(self.dropin)
        self.dropin.unlink()
        self.dropin.write_bytes(m.CONTENT)
        self.dropin.chmod(0o666)
        with self.assertRaises(RuntimeError):
            m.safe(self.dropin)

    def test_ci_context_and_operation_id_are_required(self):
        with patch.dict(os.environ, {'GITHUB_ACTIONS': ''}):
            with self.assertRaisesRegex(RuntimeError, 'CI context'):
                m.execute('apply', '100-1', 'a' * 64)
        with self.assertRaises(RuntimeError):
            m.execute('apply', '../100-1', 'a' * 64)


@unittest.skipUnless(sys.platform == 'linux' and shutil.which('sshd'), 'real isolated Linux sshd')
class OpenSshTests(unittest.TestCase):
    def test_actual_include_precedence_and_root_publickey_access(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            key = root / 'host-key'
            subprocess.run(['ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-f', str(key)], check=True)
            include = root / '50-cloud-init.conf'
            include.write_text('PasswordAuthentication yes\n')
            main = root / 'main.conf'
            main.write_text('HostKey ' + str(key) + '\nInclude ' + str(include) + '\nPermitRootLogin yes\n')
            policy = root / '00-keys.conf'
            policy.write_bytes(m.CONTENT)
            candidate = root / 'candidate.conf'
            candidate.write_text('Include ' + str(policy) + '\n' + main.read_text())
            with patch.object(m, 'MAIN', main):
                m.run(['sshd', '-t', '-f', str(candidate)])
                values = m.verify_policy(candidate)
            self.assertEqual(values['authenticationmethods'], 'publickey')
            self.assertEqual(values['passwordauthentication'], 'no')
            self.assertEqual(values['pubkeyauthentication'], 'yes')
            self.assertIn(values['permitrootlogin'], ('prohibit-password', 'without-password'))


if __name__ == '__main__':
    unittest.main()
