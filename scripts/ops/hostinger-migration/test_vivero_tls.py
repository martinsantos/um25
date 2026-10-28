import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('vivero_tls', Path(__file__).with_name('repair-vivero-tls.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def nginx_fixture():
    return """set_real_ip_from 23.105.176.45;
set_real_ip_from 173.245.48.0/20;
location ^~ /.well-known/acme-challenge/ { try_files $uri @old_gestion_acme; }
location @old_gestion_acme {proxy_pass https://23.105.176.45;proxy_ssl_verify on;}
location ^~ /.well-known/acme-challenge/ { try_files $uri @origin_gestion_acme; }
location @origin_gestion_acme {
 proxy_pass https://23.105.176.45;
 proxy_ssl_verify on;
}
location /api/ { proxy_pass http://127.0.0.1:3103; }
ssl_protocols TLSv1.2 TLSv1.3;
"""


class ViveroTlsTests(unittest.TestCase):
    def test_only_old_trust_and_fallbacks_are_removed(self):
        source = nginx_fixture()
        result = helper.local_nginx(source)
        self.assertNotIn(helper.OLD, result)
        self.assertEqual(result.count('try_files $uri =404;'), 2)
        for unchanged in ('set_real_ip_from 173.245.48.0/20;', 'proxy_pass http://127.0.0.1:3103;',
                          'ssl_protocols TLSv1.2 TLSv1.3;'):
            self.assertIn(unchanged, result)
        for invalid in (source + source, source.replace('@old_gestion_acme', '@unreviewed'),
                        source + '\nproxy_pass https://23.105.176.45;'):
            with self.assertRaises(RuntimeError):
                helper.local_nginx(invalid)

    def test_persistent_network_edit_only_removes_the_retired_trust_element(self):
        source = "rules += ','.join(v4+['23.105.176.45'])\nkeep_uid_995_and_other_rules()\n"
        self.assertEqual(helper.local_network(source),
                         "rules += ','.join(v4)\nkeep_uid_995_and_other_rules()\n")
        with self.assertRaises(RuntimeError):
            helper.local_network(source + source)

    def test_binding_updates_preserve_all_other_approvals(self):
        original = {'task_id': helper.TASK, 'service_id': 3709080, 'files': [
            {'path': str(helper.NGINX), 'sha256': 'old-nginx'},
            {'path': str(helper.NETWORK), 'sha256': 'old-network'},
            {'path': '/application/untouched', 'sha256': 'untouched'}], 'human_note': 'retained'}
        result = json.loads(helper.binding_text(json.dumps(original), {
            helper.NGINX: ('old-nginx', 'new-nginx'), helper.NETWORK: ('old-network', 'new-network')}))
        self.assertEqual(result['files'][-1], original['files'][-1])
        self.assertEqual(result['human_note'], 'retained')
        with self.assertRaises(RuntimeError):
            helper.binding_text(json.dumps(original), {helper.NGINX: ('unreviewed', 'new')})

    def test_renewal_go_changes_only_reviewed_hashes_and_current_acme_proof(self):
        original = self.go_fixture(helper.NGINX, Path('/proof'), 'old-proof')
        original['retained_approval'] = 'original human decision'
        updated = json.loads(helper.renewal_text(json.dumps(original), 'new-nginx', 'new-bindings',
                                                Path('/fresh-proof'), 'fresh-proof'))
        changed = {key for key in original if original[key] != updated[key]}
        self.assertEqual(changed, {'nginx_config_sha256', 'runtime_bindings_sha256',
                                  'public_acme_proof_path', 'public_acme_proof_sha256'})
        original['human_dns_go'] = False
        with self.assertRaises(RuntimeError):
            helper.renewal_text(json.dumps(original), 'x', 'y', Path('/proof'), 'z')

    def test_rollback_preserves_rows_from_another_application_release(self):
        data = {'task_id': helper.TASK, 'service_id': 3709080, 'files': [
            {'path': str(helper.NGINX), 'sha256': 'our-new-nginx'},
            {'path': str(helper.NETWORK), 'sha256': 'our-new-network'},
            {'path': '/application/new-release', 'sha256': 'preserve-new-release'}]}
        result = json.loads(helper.rollback_bindings(json.dumps(data), {
            helper.NGINX: ('old-nginx', 'our-new-nginx'),
            helper.NETWORK: ('old-network', 'our-new-network')}))
        self.assertEqual(result['files'][-1], data['files'][-1])
        self.assertEqual([row['sha256'] for row in result['files'][:2]], ['old-nginx', 'old-network'])

    def test_atomic_compare_rejects_a_concurrent_publication_before_replacing_it(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'config'
            path.write_bytes(b'new-publication')
            with self.assertRaises(RuntimeError):
                helper.atomic(path, b'our-change', (os.getuid(), os.getgid(), 0o640), expected=b'old-snapshot')
            self.assertEqual(path.read_bytes(), b'new-publication')
            self.assertFalse(path.with_name('config.pending').exists())

    def test_trust_inventory_understands_prefixes_without_expanding_scope(self):
        data = {'nftables': [{'set': {'family': 'inet', 'table': 'vlc_release_3709080',
            'name': 'trusted4', 'elem': [helper.OLD, {'prefix': {'addr': '173.245.48.0', 'len': 20}}]}}]}
        self.assertEqual(helper.trust_elements(data), {helper.OLD + '/32', '173.245.48.0/20'})
        data['nftables'][0]['set']['elem'].append(helper.OLD)
        with self.assertRaises(RuntimeError):
            helper.trust_elements(data)

    def go_fixture(self, nginx, proof, proof_sha):
        return {'task_id': helper.TASK, 'service_id': 3709080, 'human_dns_go': True,
                'final_release_verified': True, 'public_acme_verified': True,
                'nginx_config': str(nginx), 'nginx_unit': helper.UNIT,
                'nginx_config_sha256': 'old-nginx', 'runtime_bindings_sha256': 'old-bindings',
                'public_acme_proof_path': str(proof), 'public_acme_proof_sha256': proof_sha}

    def test_failed_reload_restores_all_configuration_certificates_and_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory) / 'vivero'
            release, tls = base / 'release', base / 'tls'
            paths = {'BASE': base, 'RELEASE': release, 'TLS': tls,
                'NGINX': release / 'config/nginx.conf', 'NETWORK': release / 'config/network.py',
                'BINDINGS': release / 'config/bindings.json', 'GO': tls / 'renewal-go.json',
                'MANAGER': tls / 'manage.py', 'CHECK_GO': release / 'config/check-go.py',
                'CF': release / 'config/cf.json', 'CHALLENGES': base / 'webroot/.well-known/acme-challenge'}
            for path in paths.values():
                path.parent.mkdir(parents=True, exist_ok=True)
            paths['CHALLENGES'].mkdir(parents=True, exist_ok=True)
            proof = release / 'evidence/proof.json'
            proof.parent.mkdir()
            proof.write_text('retained human evidence')
            owner = {'task_id': helper.TASK, 'service_id': 3709080}
            (base / 'OWNER.json').write_text(json.dumps(owner))
            paths['NGINX'].write_text(nginx_fixture())
            paths['NETWORK'].write_text("v4+['23.105.176.45']")
            rows = [{'path': str(paths[name]), 'sha256': helper.digest(paths[name].read_bytes())}
                    for name in ('NGINX', 'NETWORK')]
            paths['BINDINGS'].write_text(json.dumps(dict(owner, files=rows)))
            go = self.go_fixture(paths['NGINX'], proof, helper.digest(proof.read_bytes()))
            go.update(human_authorization_path=str(proof), human_authorization_sha256=helper.digest(proof.read_bytes()))
            paths['GO'].write_text(json.dumps(go))
            paths['MANAGER'].write_text('preserved manager')
            paths['CHECK_GO'].write_text('preserved publication guard')
            cidrs = ['10.0.' + str(i) + '.0/24' for i in range(15)]
            paths['CF'].write_text(json.dumps({'ipv4': cidrs, 'ipv6': ['::/0'] * 7}))
            for model in ('web', 'gestion'):
                folder = tls / model
                folder.mkdir()
                for name in ('fullchain.pem', 'privkey.pem'):
                    (folder / name).write_bytes((model + name + '-private-fixture').encode())
            baseline = {paths[name]: helper.digest(paths[name].read_bytes()) for name in
                        ('NGINX', 'NETWORK', 'BINDINGS', 'GO', 'MANAGER', 'CHECK_GO', 'CF')}
            originals = {path: path.read_bytes() for path in base.rglob('*') if path.is_file()}
            commands, failed = [], False
            def run(args, **kwargs):
                nonlocal failed
                commands.append(args)
                if args == ['systemctl', 'reload', helper.UNIT] and not failed:
                    failed = True
                    raise subprocess.CalledProcessError(1, args)
                return SimpleNamespace(returncode=0)
            trust = {'nftables': [{'set': {'family': 'inet', 'name': 'trusted4',
                'table': 'vlc_release_3709080', 'elem': [*cidrs, helper.OLD]}}]}
            with patch.multiple(helper, **paths, BASELINES=baseline), \
                    patch.object(helper.socket, 'gethostname', return_value='vps3709080.trouble-free.net'), \
                    patch.object(helper.os, 'geteuid', return_value=0), patch.object(helper.os, 'umask'), \
                    patch.object(helper.subprocess, 'run', side_effect=run), \
                    patch.object(helper.subprocess, 'check_output', return_value=json.dumps(trust).encode()):
                with self.assertRaises(subprocess.CalledProcessError):
                    helper.main('123-1')
            for path, content in originals.items():
                self.assertEqual(path.read_bytes(), content, str(path))
            backup = base / 'tls-origin-retirement/123-1'
            self.assertTrue((backup / 'backups.json').is_file())
            for path in backup.glob('before-*'):
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(commands.count(['systemctl', 'reload', helper.UNIT]), 2)
            self.assertFalse(any(args[0] == 'nft' for args in commands))


if __name__ == '__main__':
    unittest.main()
