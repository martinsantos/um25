#!/usr/bin/env python3
"""Test a renewable UMSA certificate on the isolated Vivero relay; send no mail."""
import os
from pathlib import Path
import re
import shutil
import smtplib
import socket
import ssl
import subprocess

STAGE = Path('/srv/umsa-migration')
RELAY = Path('/etc/postfix-vivero')
CERTDIR = '/etc/letsencrypt/live/ultimamilla.com.ar-0001'
OLD_CERTDIR = '/etc/letsencrypt/live/gestion.viveroloscocos.com.ar'


def replace_setting(text, key, old, new):
    pattern = r'(?m)^[ \t]*' + re.escape(key) + r'[ \t]*=[ \t]*([^\n]+)$'
    matches = list(re.finditer(pattern, text))
    if len(matches) != 1 or matches[0].group(1).strip() != old:
        raise ValueError('Unexpected relay setting: ' + key)
    return re.sub(pattern, key + ' = ' + new, text)


class LocalRelay(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return socket.create_connection(('127.0.0.1', port), timeout, self.source_address)


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or not (STAGE / 'mail-prepared.complete').is_file()
            or not (STAGE / 'acme-preparation.complete').is_file()):
        raise RuntimeError('Not the isolated, prepared target')
    if subprocess.run(['systemctl', 'is-active', '--quiet', 'vivero-relay-hostinger']).returncode == 0:
        raise RuntimeError('Relay must be stopped')
    files = [RELAY / 'main.cf', RELAY / 'master.cf', RELAY / 'allowed-clients.cidr']
    if any(path.is_symlink() or not path.is_file() for path in files):
        raise RuntimeError('Unexpected relay configuration files')
    main_text, master_text, clients_text = [path.read_text() for path in files]
    new_main = replace_setting(main_text, 'smtpd_tls_cert_file', OLD_CERTDIR + '/fullchain.pem', CERTDIR + '/fullchain.pem')
    new_main = replace_setting(new_main, 'smtpd_tls_key_file', OLD_CERTDIR + '/privkey.pem', CERTDIR + '/privkey.pem')
    private_main = replace_setting(new_main, 'inet_interfaces', '179.198.115.115', '127.0.0.1')
    if master_text.count('179.198.115.115:587') != 1:
        raise RuntimeError('Unexpected relay listener')
    private_master = master_text.replace('179.198.115.115:587', '127.0.0.1:587')
    backup = STAGE / 'relay-before-certificate-change'
    if backup.exists() or (STAGE / 'relay-certificate-prepared.complete').exists():
        raise RuntimeError('Prior attempt exists; inspect before retry')
    backup.mkdir(mode=0o700)
    for path in files:
        shutil.copy2(path, backup / path.name)
    with (STAGE / 'receipts/relay-certificate-preparation.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        try:
            run(['openssl', 'x509', '-in', CERTDIR + '/fullchain.pem', '-noout', '-checkhost', 'www.ultimamilla.com.ar', '-checkend', '86400'])
            files[0].write_text(private_main)
            files[1].write_text(private_master)
            files[2].write_text('127.0.0.1/32 OK\n' + clients_text)
            run(['postfix', '-c', str(RELAY), 'check'])
            run(['systemctl', 'start', 'vivero-relay-hostinger'])
            password = (RELAY / 'credential.private').read_text().strip()
            if len(password) < 20 or '\n' in password:
                raise RuntimeError('Unexpected SASL credential')
            with LocalRelay('www.ultimamilla.com.ar', 587, timeout=15) as smtp:
                smtp.ehlo()
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
                code, _ = smtp.login('vlc-interserver@vivero-relay', password)
                if code != 235:
                    raise RuntimeError('Relay authentication failed')
                smtp.rset()
            run(['systemctl', 'stop', 'vivero-relay-hostinger'])
            files[0].write_text(new_main)
            files[1].write_text(master_text)
            files[2].write_text(clients_text)
            run(['postfix', '-c', str(RELAY), 'check'])
        except Exception:
            try:
                if subprocess.run(['systemctl', 'is-active', '--quiet', 'vivero-relay-hostinger']).returncode == 0:
                    run(['systemctl', 'stop', 'vivero-relay-hostinger'])
            finally:
                for path in files:
                    shutil.copy2(backup / path.name, path)
            raise
    (STAGE / 'relay-certificate-prepared.complete').write_text('TLS and AUTH passed with www.ultimamilla.com.ar on loopback; relay stopped. Client policy and public activation pending. No mail sent.\n')
    print('Relay TLS and authentication passed privately with the UMSA certificate; client and public activation remain pending. No mail sent.')


if __name__ == '__main__':
    main()
