import importlib.util
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('sgi_operation', Path(__file__).with_name('finish-sgi-operation.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SgiOperationTests(unittest.TestCase):
    def test_restore_source_flags_keeps_the_current_database_and_session(self):
        current = {'DB_SOCKET': '/private/current.sock', 'DB_PASS': 'rotated', 'SESSION_SECRET': 'current',
                   'PORT': '3000', 'SGI_OPERATIONAL_WATCHDOG': 'false', 'DISABLE_EMAILS': 'true',
                   'NODE_APP_INSTANCE': 'migration-rehearsal'}
        restored = module.production_environment(current, {'NODE_APP_INSTANCE': 0})
        self.assertEqual(restored['NODE_APP_INSTANCE'], '0')
        self.assertNotIn('SGI_OPERATIONAL_WATCHDOG', restored)
        self.assertNotIn('DISABLE_EMAILS', restored)
        for key in ('DB_SOCKET', 'DB_PASS', 'SESSION_SECRET'):
            self.assertEqual(restored[key], current[key])
        self.assertEqual(restored['HOST'], '127.0.0.1')

    def test_managed_environment_round_trip_does_not_execute_or_expand_text(self):
        values = {'KEY': 'a\\b"c $(literal) `literal` $value', 'PORT': '3001'}
        self.assertEqual(module.parse_environment(module.environment_text(values)), values)
        for invalid in ('KEY=unquoted', 'KEY="a"\nKEY="b"', 'LD_PRELOAD="a"\ninvalid'):
            with self.assertRaises(ValueError):
                module.parse_environment(invalid)
        for values in ({'KEY': 'a\nb'}, {'KEY': 'a\rb'}, {'KEY': 'a\0b'}, {'INVALID KEY': 'x'}):
            with self.assertRaises(ValueError):
                module.environment_text(values)

    def test_json_boolean_flags_use_node_environment_strings(self):
        restored = module.production_environment({}, {'DISABLE_EMAILS': False, 'BLOCKCHAIN_ENABLED': True})
        self.assertEqual(restored['DISABLE_EMAILS'], 'false')
        self.assertEqual(restored['BLOCKCHAIN_ENABLED'], 'true')

    def test_live_cutover_accepts_only_the_reviewed_literal_socket_path(self):
        path = '/srv/umsa-migration/sgi-dedicated-rehearsals/40616586516-1/socket/mysqld.sock'
        self.assertEqual(module.parse_environment('PORT="3000"\nDB_SOCKET=' + path)['DB_SOCKET'], path)
        for invalid in ('DB_SOCKET=$(command)', 'DB_SOCKET=' + path + ' extra',
                        'DB_SOCKET=/different/socket', 'DB_SOCKET=' + path + '\nDB_SOCKET=' + path):
            with self.assertRaises(ValueError):
                module.parse_environment(invalid)

    def test_only_the_reviewed_sgi_upstream_is_switched(self):
        text = 'proxy_pass http://127.0.0.1:3000;\nproxy_pass http://127.0.0.1:4321;'
        result = module.new_upstream(text)
        self.assertIn(':3001;', result)
        self.assertIn(':4321;', result)
        with self.assertRaises(RuntimeError):
            module.new_upstream(text + text)

    def test_verified_backup_rejects_changed_archive(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'verified'
            root.mkdir()
            archive = root / 'HOSTINGER-active-verified.tar.gz.gpg'
            archive.write_bytes(b'encrypted-test-archive')
            digest = hashlib.sha256(archive.read_bytes()).hexdigest()
            receipt = {'archive': archive.name, 'bytes': archive.stat().st_size, 'sha256': digest,
                       'database_files': 9, 'encrypted_offsite': True}
            (root / 'backup.complete.json').write_text(json.dumps(receipt))
            with patch.object(module, 'VERIFIED_BACKUP', ('verified', archive.stat().st_size, digest)), \
                    patch.object(module, 'Path', return_value=Path(directory)):
                self.assertEqual(module.verified_backup(), digest)
                archive.write_bytes(b'changed-test-archive!!')
                with self.assertRaises(RuntimeError):
                    module.verified_backup()

    def operation_fixture(self, directory):
        root = Path(directory)
        stage = root / 'stage'
        cutover = stage / 'sgi-cutovers/1-1'
        cutover.mkdir(parents=True)
        (stage / '.target').write_text('179.198.115.115')
        (stage / 'production.active').touch()
        (cutover / 'cutover.complete.json').write_text(json.dumps(
            {'source_fenced': True, 'public_target_ready': True, 'candidate': '2-1'}))
        current = {'DB_SOCKET': str(stage / 'sgi-dedicated-rehearsals/2-1/socket/mysqld.sock'),
                   'PORT': '3000', 'NODE_ENV': 'production', 'SESSION_SECRET': 'same-secret',
                   'DISABLE_EMAILS': 'true', 'SGI_OPERATIONAL_WATCHDOG': 'false'}
        environment = cutover / 'sgi-live.environment'
        environment.write_text(module.environment_text(current))
        credentials = stage / 'internal-credentials'
        credentials.mkdir()
        (credentials / 'node-environments.json').write_text('{"sgi": {}}')
        old, new, front = [root / name for name in ('old.service', 'new.service', 'front.service')]
        old.write_text('[Unit]\nDescription=Clean isolated UMSA rehearsal sgi\n[Service]\n'
                       'EnvironmentFile=' + str(environment) + '\nIPAddressDeny=any\n'
                       'IPAddressAllow=localhost\nRestart=on-failure\n'
                       '[Install]\nWantedBy=multi-user.target\n')
        front.write_text('[Unit]\nAfter=umsa-clean-sgi.service\nWants=umsa-clean-sgi.service\n')
        vhosts = [root / 'public.conf', root / 'private.conf']
        for path in vhosts:
            path.write_text('proxy_pass http://127.0.0.1:3000;\n')
        paths = {'/etc/systemd/system/umsa-clean-front.service': front,
                 '/srv/umsa-public-vhosts/sgi.ultimamilla.com.ar.conf': vhosts[0],
                 '/srv/umsa-clean-proxy/nginx/sites-enabled/sgi.ultimamilla.com.ar': vhosts[1]}
        def atomic(path, text, mode=0o600):
            path.write_text(text)
        public = SimpleNamespace(FRONT=root / 'ingress.conf', atomic=atomic, probe=Mock())
        spec = SimpleNamespace(loader=SimpleNamespace(exec_module=lambda _: None))
        commands = []
        def output(args, **kwargs):
            commands.append(args)
            if args[:2] == ['docker', 'inspect']:
                return json.dumps([{'State': {'Running': True}, 'HostConfig': {
                    'NetworkMode': 'none', 'PortBindings': {}, 'RestartPolicy': {'Name': 'unless-stopped'}}}])
            return 'SYSTEM\n' if args[-1] == 'SELECT @@global.time_zone;' else '-03:00\t-03:00\n'
        def run(args, **kwargs):
            commands.append(args)
            return SimpleNamespace(returncode=0)
        return SimpleNamespace(stage=stage, old=old, new=new, front=front, vhosts=vhosts,
                               paths=paths, public=public, spec=spec, commands=commands,
                               output=output, run=run)

    def exercise_operation(self, fixture, fail=False, identifier='3-1'):
        def run(args, **kwargs):
            if fail and args[:3] == ['systemctl', 'is-active', '--quiet']:
                fixture.commands.append(args)
                raise subprocess.CalledProcessError(1, args)
            return fixture.run(args, **kwargs)
        with patch.object(module, 'STAGE', fixture.stage), \
                patch.object(module, 'OLD_UNIT', fixture.old), \
                patch.object(module, 'NEW_UNIT', fixture.new), \
                patch.object(module.socket, 'gethostname', return_value='srv2101069.hstgr.cloud'), \
                patch.object(module.socket, 'socket'), patch.object(module.os, 'geteuid', return_value=0), \
                patch.object(module.os, 'umask'), patch.object(module, 'verified_backup', return_value='verified'), \
                patch.object(module, 'Path', side_effect=lambda value: fixture.paths.get(str(value), Path(value))), \
                patch.object(module.importlib.util, 'spec_from_file_location', return_value=fixture.spec), \
                patch.object(module.importlib.util, 'module_from_spec', return_value=fixture.public), \
                patch.object(module.subprocess, 'check_output', side_effect=fixture.output), \
                patch.object(module.subprocess, 'run', side_effect=run), patch.object(module.time, 'sleep') as sleep:
            if fail:
                with self.assertRaises(subprocess.CalledProcessError):
                    module.main(identifier)
            else:
                module.main(identifier)
                sleep.assert_called_once_with(30)

    def test_rolling_operation_enables_persistent_service_then_retires_old_port(self):
        with tempfile.TemporaryDirectory() as directory:
            fixture = self.operation_fixture(directory)
            self.exercise_operation(fixture)
            environment = module.parse_environment((fixture.stage / 'production-sgi.environment').read_text())
            self.assertEqual(environment['SESSION_SECRET'], 'same-secret')
            self.assertNotIn('DISABLE_EMAILS', environment)
            self.assertEqual(environment['PORT'], '3001')
            self.assertNotIn('IPAddressDeny', fixture.new.read_text())
            self.assertIn('After=docker.service network-online.target', fixture.new.read_text())
            self.assertIn('umsa-operational-sgi.service', fixture.front.read_text())
            enabled = ['systemctl', 'enable', '--now', 'umsa-operational-sgi']
            retired = ['systemctl', 'disable', '--now', 'umsa-clean-sgi']
            self.assertLess(fixture.commands.index(enabled), fixture.commands.index(retired))
            fixture.public.probe.assert_called_with('sgi.ultimamilla.com.ar', '/auth/login', {'200'})
            self.assertTrue((fixture.stage / 'sgi-production-state.json').is_file())

    def test_failure_after_reload_restores_old_route_clock_and_allows_retry(self):
        with tempfile.TemporaryDirectory() as directory:
            fixture = self.operation_fixture(directory)
            self.exercise_operation(fixture, fail=True)
            self.assertFalse(fixture.new.exists())
            self.assertFalse((fixture.stage / 'production-sgi.environment').exists())
            self.assertFalse((fixture.stage / 'sgi-production-state.json').exists())
            for path in fixture.vhosts:
                self.assertIn(':3000;', path.read_text())
            self.assertIn('Wants=umsa-clean-sgi.service', fixture.front.read_text())
            self.assertIn(['systemctl', 'enable', '--now', 'umsa-clean-sgi'], fixture.commands)
            self.assertIn("SET GLOBAL time_zone='SYSTEM';", fixture.commands[-1])
            self.exercise_operation(fixture, identifier='3-2')
            self.assertTrue((fixture.stage / 'sgi-production-state.json').is_file())
