import base64
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('owner_reset', Path(__file__).with_name('reset-directus-owner.py'))
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)


class OwnerLoginTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.folder = tempfile.TemporaryDirectory()
        cls.key = Path(cls.folder.name) / 'key.pem'
        cls.public = cls.key.with_name('public.pem')
        subprocess.run(['openssl', 'genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:3072',
                        '-out', str(cls.key)], check=True, capture_output=True)
        subprocess.run(['openssl', 'pkey', '-in', str(cls.key), '-pubout', '-out', str(cls.public)],
                       check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.folder.cleanup()

    def envelope(self, **changes):
        value = dict(email='owner@example.com', password='FixturePassword123', expires=1100,
                     purpose='directus-owner-login')
        value.update(changes)
        ciphertext = subprocess.run(['openssl', 'pkeyutl', '-encrypt', '-pubin', '-inkey', str(self.public),
            '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256',
            '-pkeyopt', 'rsa_mgf1_md:sha256'], input=json.dumps(value).encode(),
            check=True, capture_output=True).stdout
        return base64.b64encode(ciphertext).decode()

    def before(self):
        return dict(id=owner.USER, email='previous@example.com', password='old-fixture-hash',
                    status='active', role=owner.ROLE, token='fixture-service-token',
                    provider='default', tfa_secret=None)

    def test_real_rsa_roundtrip(self):
        envelope = self.envelope()
        self.assertEqual(len(envelope), 512)
        self.assertNotIn('FixturePassword', envelope)
        self.assertEqual(owner.credentials(envelope, now=1000, key=self.key),
                         {'email': 'owner@example.com', 'password': 'FixturePassword123'})

    def test_expired_wrong_purpose_extra_fields_and_weak_password_fail(self):
        for changes in ({'expires': 999}, {'expires': 3000}, {'expires': True},
                        {'purpose': 'other-action'}, {'password': 'short'},
                        {'password': 'password\nline'}, {'email': 'bad@'}, {'extra': 1}):
            with self.subTest(changes=changes), self.assertRaises(RuntimeError):
                owner.credentials(self.envelope(**changes), now=1000, key=self.key)

    def test_unencrypted_or_corrupt_inputs_fail(self):
        for envelope in ('plain-password', 'A' * 511, 'A' * 512, ';' * 512):
            with self.subTest(envelope=envelope[:5]), self.assertRaises(Exception):
                owner.credentials(envelope, now=1000, key=self.key)

    def test_permissions_and_service_token_are_invariants(self):
        before = self.before()
        for name in set(owner.FIELDS) - {'email', 'password'}:
            after = dict(before, **{name: 'different'})
            self.assertFalse(owner.same_permissions(before, after), name)
        self.assertTrue(owner.same_permissions(before, dict(before, email='new@example.com', password='new-hash')))

    def test_success_only_patches_two_fields_and_logs_out_public_probe(self):
        self.exercise()

    def test_failed_public_login_restores_only_original_account(self):
        self.exercise(login_failure=True)

    def test_changed_service_identity_triggers_recovery(self):
        self.exercise(identity_failure=True)

    def test_lost_patch_response_reads_back_and_recovers(self):
        self.exercise(patch_failure=True)

    def test_failed_logout_is_inside_recovery_scope(self):
        self.exercise(logout_failure=True)

    def test_transient_post_patch_read_failure_retries(self):
        self.exercise(read_failure='transient')

    def test_unavailable_readback_records_recovery_required_without_guessing(self):
        self.exercise(read_failure='permanent')

    def exercise(self, login_failure=False, identity_failure=False, patch_failure=False,
                 logout_failure=False, read_failure=None):
        before = self.before()
        installed = copy.deepcopy(before)
        requested = {'email': 'owner@example.com', 'password': 'FixturePassword123'}
        calls = []
        restored = []
        reads = []

        def fake_api(path, token=None, data=None, method=None, public=False):
            calls.append((path, token, data, method, public))
            if method == 'PATCH':
                self.assertEqual(path, '/users/' + owner.USER + '?fields=id')
                self.assertEqual(set(data), {'email', 'password'})
                installed.update(email=data['email'], password='new-fixture-hash')
                if patch_failure:
                    raise RuntimeError('Fixture PATCH applied but response lost')
                return {'id': owner.USER}
            if path == '/auth/login':
                self.assertTrue(public)
                if login_failure:
                    raise RuntimeError('Fixture public login failed')
                return {'access_token': 'fixture-access', 'refresh_token': 'fixture-refresh'}
            if path.startswith('/users/me') and public:
                return {k: installed[k] for k in ('id', 'email', 'role', 'status')}
            if path == '/auth/logout':
                self.assertTrue(public)
                self.assertEqual(data, {'refresh_token': 'fixture-refresh'})
                if logout_failure:
                    raise RuntimeError('Fixture logout transport failure')
                return None
            return {'id': owner.USER}

        def fake_restore(old, expected):
            self.assertEqual(old, before)
            self.assertEqual(expected, installed)
            restored.append(True)

        def fake_account():
            reads.append(True)
            if read_failure and len(reads) == 2:
                raise RuntimeError('Fixture transient database read failure')
            if read_failure == 'permanent' and len(reads) > 1:
                raise RuntimeError('Fixture database read remains unavailable')
            return copy.deepcopy(installed)

        with patch.object(owner, 'api', side_effect=fake_api), \
             patch.object(owner, 'account', side_effect=fake_account), \
             patch.object(owner, 'runtime', return_value=(('changed' if identity_failure else 'same'), 'unused')), \
             patch.object(owner, 'restore', side_effect=fake_restore), \
             tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            if login_failure or identity_failure or patch_failure or logout_failure or read_failure == 'permanent':
                with self.assertRaises(RuntimeError):
                    owner.change(before, requested, 'same', 'fixture-service-token', folder)
                self.assertEqual(restored, [] if read_failure == 'permanent' else [True])
                self.assertEqual(json.loads((folder / 'status.json').read_text())['phase'],
                                 'recovery-required' if read_failure == 'permanent' else 'restored')
            else:
                owner.change(before, requested, 'same', 'fixture-service-token', folder)
                self.assertEqual(restored, [])
                self.assertEqual(calls[-1][0], '/auth/logout')
                self.assertEqual(json.loads((folder / 'status.json').read_text())['phase'], 'verified')

    def test_restore_is_compare_and_swap_and_updates_only_login_fields(self):
        before = self.before()
        after = dict(before, email='new@example.com', password='new-fixture-hash')
        with patch.object(owner, 'account', side_effect=[after, before]), \
             patch.object(owner, 'pg', return_value=owner.USER + '\nUPDATE 1') as pg:
            owner.restore(before, after)
            sql = pg.call_args.args[0]
            self.assertIn('SET email=', sql)
            self.assertIn(',password=', sql)
            self.assertNotIn('SET role', sql)
            self.assertNotIn('SET token', sql)
            self.assertIn('AND password=', sql)
            self.assertIn('AND to_jsonb(directus_users) @>', sql)
            self.assertIn('"token": "fixture-service-token"', sql)
        with patch.object(owner, 'account', return_value=dict(after, password='concurrent')), \
             patch.object(owner, 'pg') as pg:
            with self.assertRaises(RuntimeError):
                owner.restore(before, after)
            pg.assert_not_called()

    def test_sql_literals_and_fingerprint_guard(self):
        self.assertEqual(owner.literal("x'y"), "'x''y'")
        with self.assertRaises(RuntimeError):
            owner.literal('bad\0value')
        self.assertEqual(owner.fingerprint(self.before()), owner.fingerprint(self.before()))
        self.assertNotEqual(owner.fingerprint(self.before()), owner.fingerprint(dict(self.before(), password='other')))


if __name__ == '__main__':
    unittest.main()
