import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('mail_certificates', Path(__file__).with_name('repair-mail-certificates.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MailCertificateTests(unittest.TestCase):
    def test_both_certificate_consumers_move_without_changing_mail_settings(self):
        for lineage in ('www.umbot.com.ar', 'ultimamilla.com.ar-0001'):
            source = ('smtpd_tls_cert_file = /etc/letsencrypt/live/' + lineage + '/fullchain.pem\n'
                      'smtpd_tls_key_file = /etc/letsencrypt/live/' + lineage + '/privkey.pem\n'
                      'relayhost = existing-relay\n')
            result = module.mail_config(source, lineage)
            self.assertEqual(result.count('/etc/letsencrypt-hostinger/live/'), 2)
            self.assertIn('relayhost = existing-relay\n', result)
            self.assertEqual(module.mail_config(result, lineage), result)
            with self.assertRaises(RuntimeError):
                module.mail_config(source + source, lineage)

    def test_relay_startup_and_renewal_reference_the_certificates_that_are_used(self):
        text = ''.join('ExecStartPre=/usr/bin/test -s /etc/letsencrypt/live/gestion.viveroloscocos.com.ar/' + file + '\n'
                       for file in ('fullchain.pem', 'privkey.pem'))
        result = module.relay_unit(text)
        self.assertNotIn('gestion.viveroloscocos', result)
        self.assertEqual(result.count('/etc/letsencrypt-hostinger/live/ultimamilla.com.ar-0001/'), 2)
        hook = '#!/bin/bash\nset -euo pipefail\nsystemctl reload umsa-clean-front umsa-sitrep-ingress\n'
        updated = module.renewal_hook(hook)
        self.assertIn('systemctl reload postfix vivero-relay-hostinger\n', updated)
        self.assertEqual(module.renewal_hook(updated), updated)

    def test_only_reviewed_sni_paths_change_and_unreviewed_entries_are_preserved(self):
        other = 'mail.other.example /private/other/key.pem /private/other/fullchain.pem\n'
        source = other + ''.join(name + ' /etc/letsencrypt/live/www.umbot.com.ar/privkey.pem '
                                 '/etc/letsencrypt/live/www.umbot.com.ar/fullchain.pem\n'
                                 for name in module.SNI_NAMES)
        result = module.sni_map(source)
        self.assertTrue(result.startswith(other))
        self.assertEqual(result.count('/etc/letsencrypt-hostinger/live/www.umbot.com.ar/'), 4)
        self.assertEqual(module.sni_map(result), result)
        for invalid in (other, source + source, source.replace('/privkey.pem', '/unreviewed.pem')):
            with self.assertRaises(RuntimeError):
                module.sni_map(invalid)

    def test_renewal_rebuilds_private_sni_hash_before_graceful_smtp_reload(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            log, database = root / 'commands.log', root / 'private.db'
            for name, body in [('systemctl', 'echo "systemctl $*" >> "$COMMAND_LOG"\n'),
                               ('postmap', 'echo "postmap $*" >> "$COMMAND_LOG"\n: > "$PRIVATE_DB"\n'),
                               ('chmod', 'echo "chmod $*" >> "$COMMAND_LOG"\n')]:
                path = root / name
                path.write_text('#!/bin/sh\n' + body)
                path.chmod(0o755)
            hook = '#!/bin/bash\nset -euo pipefail\nsystemctl reload umsa-clean-front umsa-sitrep-ingress\n'
            result = module.renewal_hook(hook)
            environment = dict(os.environ, PATH=str(root) + ':' + os.environ['PATH'],
                               COMMAND_LOG=str(log), PRIVATE_DB=str(database))
            subprocess.run(['bash'], input=result, text=True, env=environment, check=True)
            self.assertEqual(log.read_text().splitlines(), [
                'systemctl reload umsa-clean-front umsa-sitrep-ingress',
                'postmap -F hash:/etc/postfix/vmail_ssl.map',
                'chmod 0600 /etc/postfix/vmail_ssl.map.db',
                'systemctl reload postfix vivero-relay-hostinger'])
            self.assertEqual(database.stat().st_mode & 0o777, 0o600)
            self.assertNotIn('restart', result)

    def test_target_probes_only_trusted_local_smtp_and_never_the_exclusive_587(self):
        self.assertEqual(module.smtp_probes(), (('127.0.0.1:25', 'www.umbot.com.ar', 'www.umbot.com.ar'),))
        self.assertFalse(any(':587' in address for address, _, _ in module.smtp_probes()))

    def test_private_compiled_hash_is_replaced_and_rolled_back_without_printing_material(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'private.db'
            path.write_bytes(b'old-private-fixture')
            module.atomic_private_bytes(path, b'new-private-fixture')
            self.assertEqual(path.read_bytes(), b'new-private-fixture')
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            module.atomic_private_bytes(path, b'old-private-fixture')
            self.assertEqual(path.read_bytes(), b'old-private-fixture')
            self.assertFalse(path.with_name(path.name + '.pending').exists())
