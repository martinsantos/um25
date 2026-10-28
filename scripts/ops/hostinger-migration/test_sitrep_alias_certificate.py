import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sitrep_alias', Path(__file__).with_name('extend-sitrep-alias-certificate.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class AliasCertificateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.material = tempfile.TemporaryDirectory()
        root = Path(cls.material.name)
        cls.key = root / 'key.pem'
        cls.certificates = {}
        for label, names in [('old', m.HOST), ('new', m.HOST + ', DNS:' + m.ALIAS)]:
            config = root / (label + '.cnf')
            config.write_text('[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=ext\n'
                              '[dn]\nCN=' + m.HOST + '\n[ext]\nsubjectAltName=DNS:' + names + '\n')
            cert = root / (label + '.pem')
            args = ['openssl', 'req', '-x509', '-days', '14', '-config', str(config), '-out', str(cert)]
            args += ['-newkey', 'rsa:2048', '-nodes', '-keyout', str(cls.key)] if label == 'old' else ['-key', str(cls.key)]
            subprocess.run(args, check=True, capture_output=True)
            cls.certificates[label] = cert.read_bytes()
        cls.key_bytes = cls.key.read_bytes()

    @classmethod
    def tearDownClass(cls):
        cls.material.cleanup()

    def fixture(self, root):
        acme = root / 'acme'
        archive = acme / 'archive' / m.HOST
        live = acme / 'live' / m.HOST
        renewal = acme / 'renewal' / (m.HOST + '.conf')
        for path in [archive, live, renewal.parent]:
            path.mkdir(parents=True)
        for name in m.NAMES:
            data = self.key_bytes if name == 'privkey.pem' else self.certificates['old']
            target = archive / (name.removesuffix('.pem') + '1.pem')
            target.write_bytes(data); target.chmod(0o600)
            (live / name).symlink_to('../../archive/' + m.HOST + '/' + target.name)
        renewal.write_text('version = 3.1.0\n[renewalparams]\naccount = synthetic-account\n'
                           'server = https://acme-v02.api.letsencrypt.org/directory\n'
                           'authenticator = webroot\nkey_type = rsa\nrsa_key_size = 3072\n'
                           'webroot_path = /var/www/umsa-acme,\n[[webroot_map]]\n' + m.HOST + ' = /var/www/umsa-acme\n')
        renewal.chmod(0o600)
        return {'ACME': acme, 'ARCHIVE': archive, 'LIVE': live, 'RENEWAL': renewal,
                'OWNER': (os.getuid(), os.getgid())}

    def state(self):
        cert = m.lineage()
        view = {'context': {}, 'lineage': m.lineage_view(cert)}
        return {'records': {}, 'lineage': cert, 'sans': {m.HOST}, 'view': view, 'sha256': m.fingerprint(view)}

    def issue(self):
        for name in m.NAMES:
            data = self.key_bytes if name == 'privkey.pem' else self.certificates['new']
            path = m.ARCHIVE / (name.removesuffix('.pem') + '2.pem')
            path.write_bytes(data); path.chmod(0o600)
            link = m.LIVE / name
            link.unlink()
            link.symlink_to('../../archive/' + m.HOST + '/' + path.name)
        data = m.RENEWAL.read_text().replace('[renewalparams]\n', '[renewalparams]\nreuse_key = True\n')
        m.RENEWAL.write_text(data + m.ALIAS + ' = /var/www/umsa-acme\n')

    def response(self, url, **kwargs):
        if url.startswith('https://' + m.ALIAS):
            return b'\n__META__301\nhttps://' + m.HOST.encode() + b'/app/a%20b?x=%2F&filter[a]=b%2Fc'
        return b'{"status":"ok"}\n__META__200\n'

    def test_real_certificate_expands_names_without_changing_key_and_keeps_private_backup(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            before = self.state()
            folder = Path(directory).resolve() / 'backups' / '123-1'
            m.backup(before, folder)
            real_run = m.run
            commands = []
            def execute(args):
                commands.append(args)
                if args[0] == 'certbot':
                    self.issue()
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                if args == [str(m.HOOK)]:
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                return real_run(args)
            with patch.object(m, 'same_context'), patch.object(m, 'curl', side_effect=self.response), patch.object(m, 'run', side_effect=execute):
                result = m.extend(before, folder)
            self.assertEqual(m.domains(m.LIVE / 'cert.pem'), {m.HOST, m.ALIAS})
            self.assertEqual((m.LIVE / 'privkey.pem').read_bytes(), self.key_bytes)
            self.assertEqual((folder / 'privkey.pem.before').read_bytes(), self.key_bytes)
            self.assertEqual(folder.stat().st_mode & 0o777, 0o700)
            self.assertEqual((folder / 'privkey.pem.before').stat().st_mode & 0o777, 0o600)
            command = next(c for c in commands if c[0] == 'certbot')
            for flag in ['--expand', '--reuse-key', '--cert-name', '--webroot']:
                self.assertIn(flag, command)
            self.assertNotIn('--nginx', command)
            self.assertNotIn('--force-renewal', command)
            self.assertEqual(command[-4:], ['-d', m.HOST, '-d', m.ALIAS])
            self.assertEqual(m.lineage_view(result), m.lineage_view(m.lineage()))
            self.assertTrue((m.ARCHIVE / 'cert1.pem').is_file())

    def test_hook_failure_restores_exact_original_links_renewal_and_keeps_new_archive(self):
        for stage in ['hook', 'postcheck', 'key', 'issuance']:
            with self.subTest(stage=stage), tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
                before = self.state()
                original = m.lineage_view(before['lineage'])
                real_run = m.run
                hook_calls = []
                def execute(args):
                    if args[0] == 'certbot':
                        self.issue()
                        if stage == 'issuance':
                            raise subprocess.CalledProcessError(1, args)
                        if stage == 'key':
                            (m.LIVE / 'privkey.pem').write_bytes(b'synthetic unexpected replacement key')
                        return subprocess.CompletedProcess(args, 0, b'', b'')
                    if args == [str(m.HOOK)]:
                        hook_calls.append(args)
                        if stage == 'hook' and len(hook_calls) == 1:
                            raise RuntimeError('synthetic hook failure')
                        return subprocess.CompletedProcess(args, 0, b'', b'')
                    return real_run(args)
                def http(url, **kwargs):
                    if stage == 'postcheck' and url.endswith('/api/health'):
                        return b'\n__META__500\n'
                    return self.response(url, **kwargs)
                with patch.object(m, 'same_context'), patch.object(m, 'curl', side_effect=http), patch.object(m, 'run', side_effect=execute):
                    with self.assertRaises((RuntimeError, subprocess.CalledProcessError)):
                        m.extend(before, Path(directory))
                self.assertEqual(m.lineage_view(m.lineage()), original)
                self.assertTrue((m.ARCHIVE / 'cert2.pem').exists())
                self.assertEqual((m.LIVE / 'privkey.pem').read_bytes(), self.key_bytes)
                self.assertGreaterEqual(len(hook_calls), 1)

    def test_rollback_refuses_concurrent_renewal_change(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            before = self.state()
            self.issue()
            expected = m.lineage()
            m.RENEWAL.write_text('concurrent external configuration\n')
            with self.assertRaisesRegex(RuntimeError, 'concurrent'):
                m.restore(before, expected)
            self.assertEqual(m.RENEWAL.read_text(), 'concurrent external configuration\n')

    def test_cas_stops_before_certbot_and_unrelated_lineage_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            before = self.state()
            m.RENEWAL.write_text(m.RENEWAL.read_text() + '# concurrent\n')
            with patch.object(m, 'same_context'), patch.object(m, 'run') as execute:
                with self.assertRaisesRegex(RuntimeError, 'compare-and-swap'):
                    m.extend(before, Path(directory))
            execute.assert_not_called()

    def test_renewal_settings_allow_only_alias_map_and_existing_key_reuse(self):
        old = b'[renewalparams]\naccount = unchanged\nserver = unchanged\n[[webroot_map]]\nsitrep.ultimamilla.com.ar = /var/www/umsa-acme\n'
        new = old.replace(b'[renewalparams]\n', b'[renewalparams]\nreuse_key = True\n') + m.ALIAS.encode() + b' = /var/www/umsa-acme\n'
        m.verify_renewal(old, new)
        for changed in [new.replace(b'account = unchanged', b'account = other'),
                        new.replace(b'server = unchanged', b'server = other'),
                        new.replace(b'reuse_key = True', b'reuse_key = False')]:
            with self.assertRaises(RuntimeError):
                m.verify_renewal(old, changed)

    def test_live_symlink_must_stay_inside_original_owned_lineage(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            path = m.LIVE / 'cert.pem'
            path.unlink(); path.symlink_to('/etc/passwd')
            with self.assertRaisesRegex(RuntimeError, 'escapes'):
                m.lineage()

    def test_prepare_checks_existing_redirect_and_cleans_only_its_own_challenge(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            challenge = root / '.well-known/acme-challenge'
            challenge.mkdir(parents=True)
            retained = challenge / 'existing-proof'
            retained.write_text('existing')
            def fetch(url, **kwargs):
                name = url.rsplit('/', 1)[1]
                return (challenge / name).read_bytes() + b'\n__META__200\n'
            with patch.object(m, 'WEBROOT', root), patch.object(m, 'curl', side_effect=fetch):
                m.challenge_probe()
            self.assertEqual(list(challenge.iterdir()), [retained])
        with patch.object(m, 'curl', return_value=b'\n__META__301\nhttps://' + m.HOST.encode() + b'/app/a%20b?x=%2F&filter[a]=b%2Fc') as fetch:
            m.redirect_probe()
            self.assertEqual(fetch.call_args.kwargs['host_header'], m.ALIAS)

    def test_inspect_is_read_only_and_invalid_phases_do_not_create_lock_or_backups(self):
        before = {'sha256': 'a' * 64, 'sans': {m.HOST}, 'view': {}}
        with patch.object(m, 'snapshot', return_value=before), patch.object(m, 'backup') as backup, contextlib.redirect_stdout(io.StringIO()):
            m.main('inspect')
        backup.assert_not_called()
        for phase, identifier, expected in [('other', '123-1', 'a' * 64), ('extend', '../escape', 'a' * 64)]:
            with self.assertRaises(RuntimeError):
                m.main(phase, identifier, expected)

    def test_other_lineage_change_is_preserved_while_only_sitrep_rolls_back(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            other_name = 'unrelated.example'
            other_renewal = m.ACME / 'renewal' / (other_name + '.conf')
            other_renewal.write_text('unrelated existing renewal\n')
            other_live = m.ACME / 'live' / other_name
            other_live.mkdir()
            for name in m.NAMES:
                (other_live / name).symlink_to((m.LIVE / name).resolve())
            before = self.state()
            old_view = m.lineage_view(before['lineage'])
            real_run = m.run
            def execute(args):
                if args[0] == 'certbot':
                    self.issue()
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                if args == [str(m.HOOK)]:
                    other_renewal.write_text('concurrent unrelated renewal preserved\n')
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                return real_run(args)
            with patch.object(m, 'same_context'), patch.object(m, 'curl', side_effect=self.response), patch.object(m, 'run', side_effect=execute):
                with self.assertRaisesRegex(RuntimeError, 'Another certificate lineage'):
                    m.extend(before, Path(directory))
            self.assertEqual(m.lineage_view(m.lineage()), old_view)
            self.assertEqual(other_renewal.read_text(), 'concurrent unrelated renewal preserved\n')

    def test_workflow_has_only_manual_production_extension_and_existing_identity(self):
        root = Path(__file__).parents[3]
        workflow = (root / '.github/workflows/hostinger-sitrep-alias-certificate.yml').read_text()
        self.assertIn("github.ref == 'refs/heads/master'", workflow)
        self.assertIn('HOSTINGER_MIGRATION_KEY', workflow)
        self.assertIn('StrictHostKeyChecking=yes', workflow)
        self.assertNotIn('ssh-keyscan', workflow)
        self.assertNotIn('upload-artifact', workflow)


if __name__ == '__main__':
    unittest.main()
