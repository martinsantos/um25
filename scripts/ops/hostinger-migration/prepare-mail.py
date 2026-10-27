#!/usr/bin/env python3
"""Prepare existing mail identities and verify relay TLS/AUTH without sending mail."""
import os
from pathlib import Path
import pwd
import re
import smtplib
import socket
import ssl
import subprocess

STAGE = Path('/srv/umsa-migration')


def setting(text, key, value):
    pattern = r'(?m)^\s*' + re.escape(key) + r'\s*=.*$'
    if len(re.findall(pattern, text)) != 1:
        raise ValueError('Expected one explicit setting: ' + key)
    return re.sub(pattern, key + ' = ' + value, text)


class LocalRelay(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return socket.create_connection(('127.0.0.1', port), timeout, self.source_address)


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong host')
    if not (STAGE / 'clean-proxy-rehearsal.ready').is_file() or not (STAGE / 'internal-rotation.complete').is_file():
        raise RuntimeError('Application rehearsal and network required first')
    marker = STAGE / 'mail-preparation.started'
    if marker.exists():
        raise RuntimeError('Mail preparation already attempted; inspect before retry')
    source = STAGE / 'source'
    marker.write_text('Preparing existing configurations only.\n')
    with (STAGE / 'receipts/mail-preparation.log').open('ab') as log:
        def run(args):
            subprocess.run(args, check=True, stdout=log, stderr=log)

        run(['dnf', '-y', 'install', 'cyrus-sasl', 'cyrus-sasl-plain'])
        backup = STAGE / 'mail-original-target'
        backup.mkdir(mode=0o700)
        for name in ('/etc/postfix', '/etc/postfix-vivero', '/etc/opendkim', '/etc/opendkim.conf', '/etc/sysconfig/opendkim'):
            path = Path(name)
            incoming = source / name.lstrip('/')
            if not incoming.exists():
                raise RuntimeError('Source mail configuration missing: ' + name)
            if path.exists():
                saved = backup / name.lstrip('/')
                saved.parent.mkdir(parents=True, exist_ok=True)
                run(['cp', '-a', '--reflink=always', str(path), str(saved)])
            path.parent.mkdir(parents=True, exist_ok=True)
            if incoming.is_dir():
                path.mkdir(exist_ok=True)
                run(['cp', '-a', '--reflink=always', str(incoming) + '/.', str(path) + '/'])
            else:
                run(['cp', '-a', '--reflink=always', str(incoming), str(path)])
        global_main = Path('/etc/postfix/main.cf')
        global_main.write_text(setting(global_main.read_text(), 'inet_interfaces', '127.0.0.1, 172.18.0.1'))
        relay = Path('/etc/postfix-vivero')
        postfix_user = pwd.getpwnam('postfix')
        for directory in ('/var/spool/postfix-vivero', '/var/lib/postfix-vivero'):
            path = Path(directory)
            if path.exists():
                raise RuntimeError('Relay queue already exists; inspect before initializing')
            path.mkdir(mode=0o700)
            os.chown(path, postfix_user.pw_uid, postfix_user.pw_gid)
        # The relay uses the preserved SASL database, not accounts from the OS.
        sasl = relay / 'sasl'
        for path in (sasl, sasl / 'sasldb2', sasl / 'vivero-relay.conf'):
            if path.is_symlink() or not path.exists():
                raise RuntimeError('Invalid existing relay authentication data')
            os.chown(path, 0, postfix_user.pw_gid)
            path.chmod(0o750 if path.is_dir() else 0o640)
        public_main = setting((relay / 'main.cf').read_text(), 'inet_interfaces', '179.198.115.115')
        public_master = (relay / 'master.cf').read_text()
        if public_master.count('23.105.176.45:587') != 1:
            raise RuntimeError('Unexpected relay listener configuration')
        public_master = public_master.replace('23.105.176.45:587', '179.198.115.115:587')
        public_clients = (relay / 'allowed-clients.cidr').read_text()
        # Test privately. The source relay and its client are unchanged.
        (relay / 'main.cf').write_text(setting(public_main, 'inet_interfaces', '127.0.0.1'))
        (relay / 'master.cf').write_text(public_master.replace('179.198.115.115:587', '127.0.0.1:587'))
        (relay / 'allowed-clients.cidr').write_text('127.0.0.1/32 OK\n' + public_clients)
        unit = (source / 'etc/systemd/system/vivero-relay-origin.service').read_text()
        Path('/etc/systemd/system/vivero-relay-hostinger.service').write_text(unit.replace('en el origen', 'en Hostinger'))
        run(['cp', '-a', str(source / 'etc/systemd/system/sitrep-opendkim.service'), '/etc/systemd/system/sitrep-opendkim.service'])
        run(['postfix', 'check'])
        run(['postfix', '-c', '/etc/postfix-vivero', 'check'])
        run(['systemctl', 'daemon-reload'])
        try:
            run(['systemctl', 'start', 'vivero-relay-hostinger'])
            password = (relay / 'credential.private').read_text().strip()
            if len(password) < 20 or '\n' in password:
                raise RuntimeError('Unexpected existing credential format')
            # No MAIL FROM, RCPT TO or DATA commands: this does not send a message.
            with LocalRelay('gestion.viveroloscocos.com.ar', 587, timeout=15) as smtp:
                smtp.ehlo()
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
                code, _ = smtp.login('vlc-interserver@vivero-relay', password)
                if code != 235:
                    raise RuntimeError('Relay authentication not confirmed')
                smtp.rset()
        finally:
            run(['systemctl', 'stop', 'vivero-relay-hostinger'])
            (relay / 'main.cf').write_text(public_main)
            (relay / 'master.cf').write_text(public_master)
            (relay / 'allowed-clients.cidr').write_text(public_clients)
    (STAGE / 'mail-prepared.complete').write_text('TLS certificate and existing SASL identity verified on loopback. No mail sent; public relay remains stopped.\n')
    print('Mail configuration prepared; TLS and SMTP authentication passed privately. No messages sent or client changes made.')


if __name__ == '__main__':
    main()
