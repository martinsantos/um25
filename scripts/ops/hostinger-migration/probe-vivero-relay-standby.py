#!/usr/bin/env python3
"""Test Vivero-to-Hostinger TLS/AUTH without modifying the client or sending mail."""
from pathlib import Path
import smtplib
import socket
import ssl
import subprocess

CLIENT = Path('/etc/postfix-vivero-client')
OLD = '[23.105.176.45]:587'


class TargetRelay(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return socket.create_connection(('179.198.115.115', port), timeout, self.source_address)


def credential(text):
    rows = [line for line in text.splitlines() if line and not line.lstrip().startswith('#')]
    if len(rows) != 1 or len(rows[0].split(None, 1)) != 2:
        raise ValueError('Unexpected SASL map')
    address, value = rows[0].split(None, 1)
    if address != OLD or ':' not in value or not all(value.split(':', 1)):
        raise ValueError('Client no longer uses the reviewed source relay')
    return value.split(':', 1)


def main():
    if socket.gethostname() != 'vps3709080.trouble-free.net' or CLIENT.is_symlink():
        raise RuntimeError('Unexpected Vivero client host')
    if subprocess.run(['systemctl', 'is-active', '--quiet', 'vivero-mail-client']).returncode:
        raise RuntimeError('Vivero mail client is not active')
    path = CLIENT / 'sasl_passwd'
    if path.is_symlink() or not path.is_file():
        raise RuntimeError('Unexpected client authentication map')
    user, password = credential(path.read_text())
    with TargetRelay('www.ultimamilla.com.ar', 587, timeout=15) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        code, _ = smtp.login(user, password)
        if code != 235:
            raise RuntimeError('Hostinger SMTP authentication failed')
        smtp.rset()
    print('TLS and SMTP authentication passed from Vivero; no mail or client change.')


if __name__ == '__main__':
    main()
