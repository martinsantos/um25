import importlib.util
from pathlib import Path
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
