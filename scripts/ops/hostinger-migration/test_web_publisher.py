import importlib.util
import io
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('publish-web.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublisherGuards(unittest.TestCase):
    def archive(self, name, link=None):
        data = io.BytesIO()
        with tarfile.open(fileobj=data, mode='w') as archive:
            entry = tarfile.TarInfo(name)
            if link is not None:
                entry.type=tarfile.SYMTYPE; entry.linkname=link
            archive.addfile(entry)
        data.seek(0)
        return tarfile.open(fileobj=data)

    def test_release_rejects_escape_and_credentials(self):
        for name,link in [('../etc/passwd',None),('/etc/passwd',None),('.env',None),
                          ('node_modules/.bin/evil','../../../etc/passwd'),('dist/server','/etc')]:
            with self.subTest(name=name), self.archive(name,link) as archive:
                with self.assertRaises(ValueError): module.validate_archive(archive)

    def test_internal_dependency_links_are_permitted(self):
        with self.archive('node_modules/.bin/astro','../astro/astro.js') as archive:
            module.validate_archive(archive)

    def test_hardlinks_require_an_already_validated_regular_member(self):
        for target,valid in [('node_modules/@esbuild/linux-x64/bin/esbuild',True),('../etc/passwd',False),
                             ('/etc/passwd',False),('node_modules/missing',False)]:
            data=io.BytesIO()
            with tarfile.open(fileobj=data,mode='w') as archive:
                archive.addfile(tarfile.TarInfo('node_modules/@esbuild/linux-x64/bin/esbuild'))
                link=tarfile.TarInfo('node_modules/esbuild/bin/esbuild')
                link.type=tarfile.LNKTYPE;link.linkname=target
                archive.addfile(link)
            data.seek(0)
            with tarfile.open(fileobj=data) as archive:
                if valid:module.validate_archive(archive)
                else:
                    with self.assertRaises(ValueError):module.validate_archive(archive)

    def test_non_web_upstreams_remain_unchanged(self):
        old='proxy_pass http://127.0.0.1:4321;\nproxy_pass http://127.0.0.1:18191;\nproxy_pass http://127.0.0.1:3000;\n'
        new=module.transform_config(old,module.INITIAL,Path('/srv/new/nginx'),Path('/srv/new/assets'),4322)
        self.assertIn('http://127.0.0.1:4322;',new)
        self.assertIn('http://127.0.0.1:18191;',new)
        self.assertIn('http://127.0.0.1:3000;',new)

    def test_public_config_tracks_the_same_new_web_port_without_changing_dge(self):
        original = 'server {\n listen 127.0.0.1:443 ssl;\n listen [::1]:443 ssl;\n proxy_pass http://127.0.0.1:4321;\n proxy_pass http://127.0.0.1:18191;\n}\n'
        private = module.transform_config(original, module.INITIAL, Path('/srv/new/nginx'), Path('/srv/new/assets'), 4322)
        public = module.public_listeners(private)
        self.assertIn('listen 179.198.115.115:443 ssl;', public)
        self.assertNotIn('[::1]', public)
        self.assertIn('http://127.0.0.1:4322;', public)
        self.assertIn('http://127.0.0.1:18191;', public)
        with self.assertRaises(RuntimeError):
            module.public_listeners('server { listen 443 ssl; }')

    def test_state_cannot_redirect_publication_to_other_services(self):
        module.validate_previous(module.INITIAL)
        bad=dict(module.INITIAL, config='/etc/nginx')
        with self.assertRaises(ValueError):module.validate_previous(bad)

    def test_publishing_requires_real_cutover_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            stage=Path(directory)
            (stage / '.target').write_text('179.198.115.115\n')
            (stage / 'persist-rehearsal.complete').touch()
            with patch.object(module,'STAGE',stage), patch.object(module.socket,'gethostname',return_value='srv2101069.hstgr.cloud'):
                with self.assertRaisesRegex(RuntimeError,'completed migration cutover'):
                    module.main('publish','a'*40,'123','1','b'*64)
                (stage / 'production.active').touch()
                with self.assertRaisesRegex(RuntimeError,'pre-cutover only'):
                    module.main('rehearse','a'*40,'123','1','b'*64)


class PublisherReadiness(unittest.TestCase):
    URL = 'https://www.ultimamilla.com.ar/antecedentes'
    RESOLVE = 'www.ultimamilla.com.ar:443:127.0.0.1'

    def response(self, code=0, status='200'):
        return subprocess.CompletedProcess(['curl'], code, status)

    def test_http2_drain_92_is_retried_but_only_complete_http_success_is_accepted(self):
        log = io.BytesIO()
        with patch.object(module.subprocess, 'run', side_effect=[
                self.response(92), self.response()]) as run, patch.object(module.time, 'sleep') as sleep:
            module.probe_after_reload(self.URL, log, self.RESOLVE)
        self.assertEqual(run.call_count, 2)
        sleep.assert_called_once()
        for call in run.call_args_list:
            args = call.args[0]
            self.assertIn('--http1.1', args)
            self.assertIn('-fsS', args)
            self.assertIn(self.RESOLVE, args)
            self.assertNotIn('-k', args)
            self.assertNotIn('--insecure', args)
            self.assertLessEqual(call.kwargs['timeout'], 3)
        self.assertIn(b'curl 92', log.getvalue())

    def test_permanent_transport_failure_has_four_attempt_and_ten_second_bounds(self):
        clock, budgets = [0.0], []
        def transport(args, **kwargs):
            budget = float(args[args.index('--max-time') + 1])
            budgets.append(budget)
            clock[0] += budget
            return self.response(92, '000')
        def advance(seconds):
            clock[0] += seconds
        with patch.object(module.subprocess, 'run', side_effect=transport) as run, \
                patch.object(module.time, 'monotonic', side_effect=lambda: clock[0]), \
                patch.object(module.time, 'sleep', side_effect=advance):
            with self.assertRaisesRegex(RuntimeError, '10s/4 attempts: curl 92'):
                module.probe_after_reload(self.URL, io.BytesIO(), self.RESOLVE)
        self.assertEqual(run.call_count, 4)
        self.assertEqual(clock[0], 10)
        self.assertEqual(budgets, [3, 3, 3, 0.25])

    def test_http_errors_and_invalid_certificates_fail_immediately(self):
        for code, status in ((22, '404'), (22, '500'), (92, '503'), (0, '500'),
                             (60, '000'), (51, '000'), (6, '000'), (0, '000')):
            with self.subTest(code=code, status=status), \
                    patch.object(module.subprocess, 'run', return_value=self.response(code, status)) as run, \
                    patch.object(module.time, 'sleep') as sleep:
                with self.assertRaises((RuntimeError, subprocess.CalledProcessError)):
                    module.probe_after_reload(self.URL, io.BytesIO(), self.RESOLVE)
                self.assertEqual(run.call_count, 1)
                sleep.assert_not_called()

    def test_transport_timeout_retries_but_an_observed_http_error_never_does(self):
        with patch.object(module.subprocess, 'run', side_effect=[
                subprocess.TimeoutExpired(['curl'], 3), self.response()]) as run, \
                patch.object(module.time, 'sleep'):
            module.probe_after_reload(self.URL, io.BytesIO(), self.RESOLVE)
            self.assertEqual(run.call_count, 2)
        with patch.object(module.subprocess, 'run', side_effect=
                          subprocess.TimeoutExpired(['curl'], 3, output=b'503')) as run:
            with self.assertRaisesRegex(RuntimeError, 'HTTP 503'):
                module.probe_after_reload(self.URL, io.BytesIO(), self.RESOLVE)
            self.assertEqual(run.call_count, 1)

    def test_runtime_checks_the_real_candidate_pid_entrypoint_and_loopback_listener(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            application = root / 'application'
            proc = root / 'proc'
            (proc / '789').mkdir(parents=True)
            (proc / '789/cmdline').write_bytes(
                b'/usr/bin/node\0' + str(application / 'dist/server/entry.mjs').encode() + b'\0')
            row = 'LISTEN 0 511 127.0.0.1:4322 0.0.0.0:* users:(("node",pid=789,fd=17))\n'
            with patch.object(module, 'PROC', proc), \
                    patch.object(module.subprocess, 'check_output', side_effect=['789\n', row]) as output:
                self.assertEqual(module.verify_web_runtime('candidate.service', application, 4322), '789')
            self.assertEqual(output.call_args_list[-1].args[0], ['ss', '-H', '-ltnp', 'sport = :4322'])
            for bad_row in ('', row.replace('127.0.0.1:4322', '127.0.0.1:4321'),
                            row.replace('pid=789,', 'pid=987,'),
                            row.replace('127.0.0.1:4322', '0.0.0.0:4322'), row + row):
                with self.subTest(row=bad_row), patch.object(module, 'PROC', proc), \
                        patch.object(module.subprocess, 'check_output', side_effect=['789\n', bad_row]):
                    with self.assertRaisesRegex(RuntimeError, 'loopback web listener'):
                        module.verify_web_runtime('candidate.service', application, 4322)
            for bad_pid in ('0\n', '789\n'):
                with self.subTest(pid=bad_pid), patch.object(module, 'PROC', proc), \
                        patch.object(module.subprocess, 'check_output', return_value=bad_pid):
                    with self.assertRaisesRegex(RuntimeError, 'missing or changed'):
                        module.verify_web_runtime('candidate.service', application, 4322, expected_pid='987')
            (proc / '789/cmdline').write_bytes(b'/usr/bin/node\0/srv/old/entry.mjs\0')
            with patch.object(module, 'PROC', proc), \
                    patch.object(module.subprocess, 'check_output', return_value='789\n'):
                with self.assertRaisesRegex(RuntimeError, 'reviewed release entry point'):
                    module.verify_web_runtime('candidate.service', application, 4322)


class InactiveReleaseRetirement(unittest.TestCase):
    def setUp(self):
        import contextlib
        import json
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.root = Path(self.directory.name)
        self.releases = self.root / 'releases'
        self.proc = self.root / 'proc'
        self.state = self.root / 'state.json'
        self.previous = self.make_release('a' * 40 + '-22-1', 4322)
        self.retired = self.make_release('b' * 40 + '-11-1', 4321)
        self.state.write_text(json.dumps(self.previous))
        (self.proc / '789').mkdir(parents=True)
        self.group = self.proc / '789/cgroup'
        self.group.write_text('0::/system.slice/' + self.retired['unit'] + '\n')
        self.listener = 'LISTEN 0 511 127.0.0.1:4321 0.0.0.0:* users:(("node",pid=789,fd=17))\n'
        self.proxy = 'proxy_pass http://127.0.0.1:4322;\n'
        self.workers = 'nginx: worker process\n'
        self.connections = ''
        for name, value in [('RELEASES', self.releases), ('PROC', self.proc), ('STATE', self.state),
                            ('FRONT', self.root / 'private.conf'), ('PUBLIC_FRONT', self.root / 'public.conf')]:
            self.stack.enter_context(patch.object(module, name, value))
        self.output = self.stack.enter_context(patch.object(module.subprocess, 'check_output', side_effect=self.read_process))
        self.runtime = self.stack.enter_context(patch.object(module, 'verify_web_runtime', return_value='789'))
        self.run = self.stack.enter_context(patch.object(module.subprocess, 'run'))

    def make_release(self, identifier, port):
        import json
        root = self.releases / identifier
        (root / 'nginx').mkdir(parents=True)
        (root / 'application/dist/client').mkdir(parents=True)
        value = dict(port=port, unit='umsa-web-' + identifier + '.service',
                     config=str(root / 'nginx'), assets=str(root / 'application/dist/client'))
        (root / 'publication.complete').write_text(json.dumps(value))
        return value

    def read_process(self, args, **kwargs):
        if args[:3] == ['ss', '-H', '-ltnp']:
            return self.listener
        if args[:3] == ['ss', '-H', '-tn']:
            return self.connections
        if args[0] == '/usr/sbin/nginx':
            return self.proxy
        if args == ['ps', '-eo', 'args']:
            return self.workers
        raise AssertionError('Unexpected command: ' + repr(args))

    def assert_refused(self):
        with self.assertRaises((RuntimeError, ValueError, FileNotFoundError)):
            module.retire_drained_web_release(self.previous, 4321)
        self.run.assert_not_called()

    def test_retires_only_the_completed_inactive_runtime_and_preserves_files(self):
        from unittest.mock import call
        module.retire_drained_web_release(self.previous, 4321)
        self.assertEqual(self.run.call_args_list, [
            call(['systemctl', 'disable', self.retired['unit']], check=True),
            call(['systemctl', 'stop', self.retired['unit']], check=True)])
        self.assertTrue(Path(self.retired['assets']).is_dir())
        self.assertTrue((Path(self.retired['config']).parent / 'publication.complete').is_file())
        self.assertEqual(self.runtime.call_count, 3)
        self.assertEqual(self.runtime.call_args_list[-1].args[-1], '789')

    def test_never_retires_the_active_or_an_unreviewed_port(self):
        for port in (4322, 3000):
            with self.assertRaises(RuntimeError):
                module.retire_drained_web_release(self.previous, port)
        self.output.assert_not_called()
        self.run.assert_not_called()

    def test_rejects_unknown_or_multiple_port_owners(self):
        for listener in ('', self.listener + self.listener):
            self.listener = listener
            self.assert_refused()

    def test_rejects_other_services_and_the_current_unit(self):
        for unit in ('other.service', self.previous['unit']):
            self.group.write_text('0::/system.slice/' + unit + '\n')
            self.assert_refused()

    def test_requires_an_exact_completed_release_receipt(self):
        import json
        receipt = Path(self.retired['config']).parent / 'publication.complete'
        receipt.write_text(json.dumps(dict(self.retired, port=4322)))
        self.assert_refused()
        receipt.unlink()
        self.assert_refused()

    def test_refuses_symlinked_receipts(self):
        receipt = Path(self.retired['config']).parent / 'publication.complete'
        saved = receipt.with_suffix('.saved')
        receipt.rename(saved)
        receipt.symlink_to(saved)
        self.assert_refused()

    def test_refuses_any_live_proxy_reference_to_the_old_port(self):
        self.proxy += 'proxy_pass http://127.0.0.1:4321;\n'
        self.assert_refused()

    def test_refuses_a_proxy_that_does_not_confirm_the_current_port(self):
        self.proxy = 'proxy_pass http://127.0.0.1:3000;\n'
        self.assert_refused()

    def test_refuses_retirement_while_proxy_workers_are_draining(self):
        self.workers += '  nginx: worker process is shutting down\n'
        self.assert_refused()

    def test_refuses_retirement_with_established_connections(self):
        self.connections = 'ESTAB 0 0 127.0.0.1:4321 127.0.0.1:55555\n'
        self.assert_refused()

    def test_refuses_retirement_if_current_release_changes(self):
        import json
        self.state.write_text(json.dumps(self.retired))
        self.assert_refused()

    def test_rechecks_runtime_identity_before_any_stop(self):
        self.runtime.side_effect = ['789', '999', RuntimeError('PID changed')]
        self.assert_refused()
