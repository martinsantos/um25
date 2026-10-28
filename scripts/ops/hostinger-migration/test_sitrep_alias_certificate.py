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
        generation = max(int(path.stem.removeprefix('cert')) for path in m.ARCHIVE.glob('cert[0-9]*.pem')) + 1
        prior_key = (m.LIVE / 'privkey.pem').resolve().name
        for name in m.NAMES:
            data = self.key_bytes if name == 'privkey.pem' else self.certificates['new']
            path = m.ARCHIVE / (name.removesuffix('.pem') + str(generation) + '.pem')
            if name == 'privkey.pem':
                path.symlink_to(prior_key)
            else:
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
            self.assertTrue((m.ARCHIVE / 'privkey2.pem').is_symlink())
            self.assertEqual(os.readlink(m.ARCHIVE / 'privkey2.pem'), 'privkey1.pem')
            self.assertEqual((folder / 'privkey.pem.before').read_bytes(), self.key_bytes)
            self.assertEqual(folder.stat().st_mode & 0o777, 0o700)
            self.assertEqual((folder / 'privkey.pem.before').stat().st_mode & 0o777, 0o600)
            command = next(c for c in commands if c[0] == 'certbot')
            for flag in ['--expand', '--reuse-key', '--cert-name', '--webroot']:
                self.assertIn(flag, command)
            self.assertNotIn('--nginx', command)
            self.assertNotIn('--force-renewal', command)
            self.assertEqual(command[-4:], ['-d', m.HOST, '-d', m.ALIAS])
            self.assertEqual(json.loads(command[command.index('--webroot-map') + 1]),
                             {m.HOST: str(m.WEBROOT), m.ALIAS: str(m.WEBROOT)})
            self.assertEqual(m.lineage_view(result), m.lineage_view(m.lineage()))
            self.assertTrue((m.ARCHIVE / 'cert1.pem').is_file())
            probes = json.loads((folder / 'tls-readiness.json').read_text())
            self.assertEqual([entry['consecutive'] for entry in probes[-3:]], [1, 2, 3])
            self.assertEqual((folder / 'tls-readiness.json').stat().st_mode & 0o777, 0o600)

    def test_hook_failure_restores_exact_original_links_renewal_and_keeps_new_archive(self):
        for stage in ['hook', 'postcheck', 'key', 'issuance', 'readiness']:
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
                            key = m.ARCHIVE / 'privkey2.pem'
                            key.unlink()
                            key.write_bytes(b'synthetic unexpected replacement key')
                            key.chmod(0o600)
                        return subprocess.CompletedProcess(args, 0, b'', b'')
                    if args == [str(m.HOOK)]:
                        hook_calls.append(args)
                        if stage == 'hook' and len(hook_calls) == 1:
                            raise RuntimeError('synthetic hook failure')
                        return subprocess.CompletedProcess(args, 0, b'', b'')
                    return real_run(args)
                def http(url, **kwargs):
                    if stage == 'readiness' and url.startswith('https://' + m.ALIAS):
                        raise subprocess.CalledProcessError(60, ['curl'])
                    if stage == 'postcheck' and url.endswith('/api/health'):
                        return b'\n__META__500\n'
                    return self.response(url, **kwargs)
                clock = [0.0]
                def sleep(seconds):
                    clock[0] += seconds
                with patch.object(m.time, 'monotonic', side_effect=lambda: clock[0]), patch.object(m.time, 'sleep', side_effect=sleep), patch.object(m, 'same_context'), patch.object(m, 'curl', side_effect=http), patch.object(m, 'run', side_effect=execute):
                    with self.assertRaises((RuntimeError, subprocess.CalledProcessError)):
                        m.extend(before, Path(directory).resolve())
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
                    m.extend(before, Path(directory).resolve())
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
                    m.extend(before, Path(directory).resolve())
            self.assertEqual(m.lineage_view(m.lineage()), old_view)
            self.assertEqual(other_renewal.read_text(), 'concurrent unrelated renewal preserved\n')

    def test_readiness_wait_retries_old_tls_once_before_accepting_new_certificate(self):
        failure = subprocess.CalledProcessError(60, ['curl'])
        with patch.object(m, 'redirect_probe', side_effect=[None, failure, None, None, None]) as probe, patch.object(m.time, 'sleep') as sleep:
            m.wait_alias_ready()
        self.assertEqual(probe.call_count, 5)
        self.assertTrue(all(call.kwargs['timeout'] <= 1 for call in probe.call_args_list))
        self.assertLessEqual(sleep.call_args.args[0], 0.25)

    def test_vendor_map_regression_is_saved_before_strict_guard_rolls_it_back(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            before = self.state()
            original = m.lineage_view(before['lineage'])
            real_run = m.run
            def execute(args):
                if args[0] == 'certbot':
                    self.issue()
                    m.RENEWAL.write_text(m.RENEWAL.read_text().replace('\n' + m.HOST + ' = /var/www/umsa-acme\n', '\n'))
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                if args == [str(m.HOOK)]:
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                return real_run(args)
            with patch.object(m, 'same_context'), patch.object(m, 'run', side_effect=execute):
                with self.assertRaisesRegex(RuntimeError, r'\[\[webroot_map\]\] ' + m.HOST):
                    m.extend(before, Path(directory).resolve())
            candidate = Path(directory) / 'post-issuance/renewal.before'
            self.assertNotIn('\n' + m.HOST + ' = ', candidate.read_text())
            self.assertIn(m.ALIAS + ' = ', candidate.read_text())
            self.assertEqual(candidate.stat().st_mode & 0o777, 0o600)
            self.assertEqual(m.lineage_view(m.lineage()), original)

    def test_retry_keeps_issued_generation_two_and_creates_flat_reused_key_three(self):
        with tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
            before = self.state()
            self.issue()
            issued_two = (m.ARCHIVE / 'cert2.pem').read_bytes()
            with patch.object(m, 'run'):
                m.restore(before, m.lineage())
            real_run = m.run
            def execute(args):
                if args[0] == 'certbot':
                    self.issue()
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                if args == [str(m.HOOK)]:
                    return subprocess.CompletedProcess(args, 0, b'', b'')
                return real_run(args)
            with patch.object(m, 'same_context'), patch.object(m, 'curl', side_effect=self.response), patch.object(m, 'run', side_effect=execute):
                m.extend(before, Path(directory).resolve())
            self.assertEqual((m.ARCHIVE / 'cert2.pem').read_bytes(), issued_two)
            self.assertEqual(os.readlink(m.ARCHIVE / 'privkey3.pem'), 'privkey1.pem')
            self.assertEqual(os.readlink(m.LIVE / 'privkey.pem'), '../../archive/' + m.HOST + '/privkey3.pem')
            self.assertEqual((m.LIVE / 'privkey.pem').read_bytes(), self.key_bytes)

    def test_recover_reuses_saved_generation_without_acme_and_rolls_back_tls_failure(self):
        for fails in (False, True):
            with self.subTest(fails=fails), tempfile.TemporaryDirectory() as directory, patch.multiple(m, **self.fixture(Path(directory).resolve())):
                before = self.state()
                self.issue()
                with patch.object(m, 'run'):
                    m.restore(before, m.lineage())
                self.issue()
                candidate = m.lineage()
                retained = (m.ARCHIVE / 'cert3.pem').read_bytes()
                with patch.object(m, 'run'):
                    m.restore(before, candidate)
                commands, clock = [], [0.0]
                real_run = m.run
                def execute(args):
                    commands.append(args)
                    if args == [str(m.HOOK)]:
                        return subprocess.CompletedProcess(args, 0, b'', b'')
                    return real_run(args)
                def response(url, **kwargs):
                    if fails and url.startswith('https://' + m.ALIAS):
                        raise subprocess.CalledProcessError(60, ['curl'], stderr=b'certificate hostname mismatch')
                    return self.response(url, **kwargs)
                def sleep(seconds):
                    clock[0] += seconds
                with patch.object(m, 'same_context'), patch.object(m, 'run', side_effect=execute), \
                        patch.object(m, 'curl', side_effect=response), \
                        patch.object(m.time, 'monotonic', side_effect=lambda: clock[0]), \
                        patch.object(m.time, 'sleep', side_effect=sleep):
                    if fails:
                        with self.assertRaisesRegex(RuntimeError, 'three consecutive'):
                            m.extend(before, Path(directory).resolve(), candidate)
                    else:
                        m.extend(before, Path(directory).resolve(), candidate)
                self.assertFalse(any(args[0] == 'certbot' for args in commands))
                self.assertEqual((m.ARCHIVE / 'cert3.pem').read_bytes(), retained)
                self.assertFalse((m.ARCHIVE / 'cert4.pem').exists())
                expected = before['lineage'] if fails else candidate
                self.assertEqual(m.lineage_view(m.lineage()), m.lineage_view(expected))
                probes = json.loads((Path(directory) / 'tls-readiness.json').read_text())
                if fails:
                    self.assertTrue(probes)
                    self.assertTrue(all(row['curl_exit'] == 60 for row in probes))
                    self.assertIn('hostname mismatch', probes[0]['stderr'])
                else:
                    self.assertEqual([row['consecutive'] for row in probes], [1, 2, 3])

    def test_workflow_has_only_manual_production_extension_and_existing_identity(self):
        root = Path(__file__).parents[3]
        path = root / '.github/workflows/hostinger-sitrep-alias-certificate.yml'
        if not path.is_file():
            self.skipTest('Workflow outside the legacy scripts-only sparse checkout; mandatory in its own CI')
        workflow = path.read_text()
        self.assertIn("github.ref == 'refs/heads/master'", workflow)
        self.assertIn('HOSTINGER_MIGRATION_KEY', workflow)
        self.assertIn('StrictHostKeyChecking=yes', workflow)
        self.assertNotIn('ssh-keyscan', workflow)
        self.assertNotIn('upload-artifact', workflow)



@unittest.skipUnless(os.environ.get('SITREP_ALIAS_NGINX_CI') == '1', 'requires two disposable Nginx TLS actors')
class StableNginxReadinessTests(unittest.TestCase):
    setUpClass = classmethod(AliasCertificateTests.setUpClass.__func__)
    tearDownClass = classmethod(AliasCertificateTests.tearDownClass.__func__)
    # Reuse only synthetic certificate material; run just the test below.
    def test_real_old_and_new_nginx_actors_reset_the_gate_and_never_accept_first_success(self):
        import shutil
        import socket
        import time
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            ca_key, ca_cert = root / 'ca.key', root / 'ca.pem'
            run = lambda args: subprocess.run(args, check=True, capture_output=True)
            run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
                 '-subj', '/CN=Isolated SITREP test CA', '-keyout', str(ca_key), '-out', str(ca_cert)])
            key = root / 'leaf.key'
            key.write_bytes(self.key_bytes)
            key.chmod(0o600)
            for version, names in [('old', m.HOST), ('new', m.HOST + ',DNS:' + m.ALIAS)]:
                config = root / (version + '.cnf')
                config.write_text('[req]\nprompt=no\ndistinguished_name=dn\n'
                                  '[dn]\nCN=' + m.HOST + '\n[ext]\nsubjectAltName=DNS:' + names + '\n')
                request, cert = root / (version + '.csr'), root / (version + '.pem')
                run(['openssl', 'req', '-new', '-key', str(key), '-config', str(config), '-out', str(request)])
                run(['openssl', 'x509', '-req', '-in', str(request), '-CA', str(ca_cert), '-CAkey', str(ca_key),
                     '-set_serial', '101' if version == 'old' else '102', '-days', '2',
                     '-extfile', str(config), '-extensions', 'ext', '-out', str(cert)])
            ports, processes = {}, []
            try:
                for version in ('old', 'new'):
                    with socket.socket() as probe:
                        probe.bind(('127.0.0.1', 0))
                        ports[version] = probe.getsockname()[1]
                    actor = root / version
                    actor.mkdir()
                    config = actor / 'nginx.conf'
                    config.write_text('pid ' + str(actor / 'nginx.pid') + '; error_log stderr;\n'
                        'events {} http { access_log off; ' +
                        ''.join(name + '_temp_path ' + str(actor / name) + '; ' for name in
                                ('client_body', 'proxy', 'fastcgi', 'uwsgi', 'scgi')) +
                        'server { listen 127.0.0.1:' + str(ports[version]) + ' ssl; server_name ' + m.ALIAS + '; '
                        'ssl_certificate ' + str(root / (version + '.pem')) + '; '
                        'ssl_certificate_key ' + str(key) + '; '
                        'location / { return 301 https://' + m.HOST + '$request_uri; } } }')
                    command = [shutil.which('nginx') or '/usr/sbin/nginx', '-p', str(actor), '-c', str(config)]
                    run(command + ['-t'])
                    process = subprocess.Popen(command + ['-g', 'daemon off;'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    processes.append(process)
                    for attempt in range(50):
                        try:
                            with socket.create_connection(('127.0.0.1', ports[version]), timeout=0.1):
                                break
                        except OSError:
                            if process.poll() is not None:
                                self.fail(process.communicate()[1].decode())
                            time.sleep(0.02)
                    else:
                        self.fail('Disposable TLS actor did not start')
                real_run, routed = m.run, []
                sequence = iter(['new', 'old', 'new', 'new', 'new'])
                def request(args):
                    actor = next(sequence)
                    routed.append(actor)
                    return real_run(args + ['--connect-to', m.ALIAS + ':443:127.0.0.1:' + str(ports[actor]),
                                            '--cacert', str(ca_cert)])
                evidence = []
                started = time.monotonic()
                with patch.object(m, 'run', side_effect=request):
                    m.wait_alias_ready(evidence)
                elapsed = time.monotonic() - started
                self.assertEqual(routed, ['new', 'old', 'new', 'new', 'new'])
                self.assertEqual([row['consecutive'] for row in evidence], [1, 0, 1, 2, 3])
                self.assertEqual(evidence[1]['curl_exit'], 60)
                self.assertTrue(evidence[1]['stderr'])
                self.assertGreaterEqual(elapsed, 0.9)
                self.assertLess(elapsed, 10)
            finally:
                for process in processes:
                    process.terminate()
                    process.communicate(timeout=10)


if __name__ == '__main__':
    unittest.main()
