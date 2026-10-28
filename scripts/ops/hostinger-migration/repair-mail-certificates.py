#!/usr/bin/env python3
"""Align both live Postfix instances with the clean ACME renewal lineage."""
import importlib.util
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
ACME = Path('/etc/letsencrypt-hostinger/live')


def mail_config(text, lineage):
    result = text
    for setting, file in (('smtpd_tls_cert_file', 'fullchain.pem'), ('smtpd_tls_key_file', 'privkey.pem')):
        pattern = r'(?m)^' + setting + r'\s*=\s*/etc/letsencrypt(?:-hostinger)?/live/' + re.escape(lineage) + '/' + re.escape(file) + r'\s*$'
        result, count = re.subn(pattern, setting + ' = ' + str(ACME / lineage / file), result)
        if count != 1:
            raise RuntimeError('Unexpected Postfix certificate directive: ' + setting)
    return result


def relay_unit(text):
    old = '/etc/letsencrypt/live/gestion.viveroloscocos.com.ar/'
    new = str(ACME / 'ultimamilla.com.ar-0001') + '/'
    if old not in text and text.count(new) == 2:
        return text
    if text.count(old) != 2:
        raise RuntimeError('Unexpected relay certificate preflight')
    return text.replace(old, new)


def renewal_hook(text):
    command = 'systemctl reload postfix vivero-relay-hostinger\n'
    if command in text:
        return text
    if not text.endswith('systemctl reload umsa-clean-front umsa-sitrep-ingress\n'):
        raise RuntimeError('Unexpected reviewed certificate reload hook')
    return text + command


def main(identifier):
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or not (STAGE / 'production.active').is_file()):
        raise RuntimeError('Unexpected active Hostinger state')
    os.umask(0o077)
    spec = importlib.util.spec_from_file_location('mail_public', Path(__file__).with_name('public-vhost.py'))
    public = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(public)
    root = STAGE / 'mail-certificate-finalizations' / identifier
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    configs = {Path('/etc/postfix/main.cf'): 'www.umbot.com.ar',
               Path('/etc/postfix-vivero/main.cf'): 'ultimamilla.com.ar-0001'}
    unit = Path('/etc/systemd/system/vivero-relay-hostinger.service')
    hook = Path('/usr/local/sbin/umsa-certificate-reload')
    files = [*configs, unit, hook]
    if any(p.is_symlink() or not p.is_file() for p in files):
        raise RuntimeError('Unexpected Postfix configuration type')
    previous = {p: p.read_text() for p in files}
    modes = {p: p.stat().st_mode & 0o777 for p in files}
    replacements = {p: mail_config(previous[p], lineage) for p, lineage in configs.items()}
    replacements[unit], replacements[hook] = relay_unit(previous[unit]), renewal_hook(previous[hook])
    for index, (p, text) in enumerate(previous.items()):
        (root / ('before-' + str(index))).write_text(text)
    with (root / 'operation.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, timeout=30, **kwargs)
        for lineage in configs.values():
            directory = ACME / lineage
            run(['openssl', 'x509', '-in', str(directory / 'fullchain.pem'), '-noout', '-checkend', '3600'])
            cert = subprocess.check_output(['openssl', 'x509', '-in', str(directory / 'fullchain.pem'), '-noout', '-pubkey'])
            key = subprocess.check_output(['openssl', 'pkey', '-in', str(directory / 'privkey.pem'), '-pubout'], stderr=log)
            if cert != key:
                raise RuntimeError('Certificate and private key do not match')
        try:
            for p, text in replacements.items():
                public.atomic(p, text, modes[p])
            for directory in ('/etc/postfix', '/etc/postfix-vivero'):
                run(['/usr/sbin/postfix', '-c', directory, 'check'])
            run(['systemd-analyze', 'verify', str(unit)])
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'postfix', 'vivero-relay-hostinger'])
            for address, hostname, lineage in (('127.0.0.1:25', 'www.umbot.com.ar', 'www.umbot.com.ar'),
                    ('179.198.115.115:587', 'www.ultimamilla.com.ar', 'ultimamilla.com.ar-0001')):
                expected = subprocess.check_output(['openssl', 'x509', '-in', str(ACME / lineage / 'fullchain.pem'),
                    '-noout', '-fingerprint', '-sha256'])
                for attempt in range(10):
                    response = subprocess.run(['openssl', 's_client', '-starttls', 'smtp', '-connect', address,
                        '-servername', hostname, '-verify_hostname', hostname, '-verify_return_error', '-showcerts'],
                        input=b'QUIT\r\n', capture_output=True, timeout=20)
                    match = re.search(rb'-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----', response.stdout, re.S)
                    if response.returncode == 0 and match:
                        actual = subprocess.check_output(['openssl', 'x509', '-noout', '-fingerprint', '-sha256'], input=match[0])
                        if actual == expected:
                            break
                    time.sleep(0.5)
                else:
                    raise RuntimeError('SMTP did not load its managed certificate')
        except Exception:
            for p, text in previous.items():
                public.atomic(p, text, modes[p])
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'postfix', 'vivero-relay-hostinger'])
            raise
        (root / 'operation.complete.json').write_text(json.dumps({'run': identifier,
            'postfix_certificates_managed': True, 'graceful_reload': True,
            'both_smtp_certificates_verified': True, 'mail_sent': False}) + '\n')
    print('Both SMTP certificates and their renewal hook are aligned; no message was sent.')


if __name__ == '__main__':
    main(sys.argv[1])
