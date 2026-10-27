#!/usr/bin/env python3
"""Move only the Vivero SMTP client to the verified Hostinger relay.

This runs on the client host via an explicitly dispatched CI job. It performs
an actual TLS/AUTH preflight but sends no messages. Each original file is saved
privately before the client is reconfigured; failures restore those files.
"""
import os
from pathlib import Path
import re
import shutil
import smtplib
import socket
import ssl
import subprocess
import sys

CLIENT = Path('/etc/postfix-vivero-client')
OLD = '[23.105.176.45]:587'
NEW = '[179.198.115.115]:587'
NAMES = ('tls_policy', 'sasl_passwd', 'sasl_passwd.db', 'internal-only.transport')


def replacements(policy, sasl, transport):
    policy_line = OLD + ' verify match=gestion.viveroloscocos.com.ar'
    lines = policy.splitlines()
    if lines.count(policy_line) != 1 or any(line.startswith(NEW) for line in lines):
        raise ValueError('Unexpected TLS policy')
    new_policy = re.sub('(?m)^' + re.escape(policy_line) + '$',
                        lambda _: NEW + ' verify match=www.ultimamilla.com.ar', policy, count=1)
    rows = [line for line in sasl.splitlines() if line and not line.lstrip().startswith('#')]
    if len(rows) != 1 or len(rows[0].split(None, 1)) != 2:
        raise ValueError('Unexpected SASL map')
    address, credential = rows[0].split(None, 1)
    if address != OLD or ':' not in credential or not all(credential.split(':', 1)):
        raise ValueError('Unexpected SASL identity')
    new_sasl = re.sub('(?m)^' + re.escape(OLD) + r'(?=[ \t])', lambda _: NEW, sasl, count=1)
    if transport.count('smtp:' + OLD) != 2 or NEW in transport:
        raise ValueError('Unexpected transport routes')
    new_transport = transport.replace('smtp:' + OLD, 'smtp:' + NEW)
    return new_policy, new_sasl, new_transport, credential.split(':', 1)


class TargetRelay(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return socket.create_connection(('179.198.115.115', port), timeout, self.source_address)


def main(identifier):
    os.umask(0o077)
    if not re.fullmatch('[0-9]+-[0-9]+', identifier) or socket.gethostname() != 'vps3709080.trouble-free.net':
        raise RuntimeError('Unexpected client host or CI identity')
    if CLIENT.is_symlink() or not (CLIENT / 'enable-approved').is_file():
        raise RuntimeError('Unexpected Vivero client')
    if subprocess.run(['systemctl', 'is-active', '--quiet', 'vivero-mail-client']).returncode:
        raise RuntimeError('Vivero mail client is not active')
    files = {name: CLIENT / name for name in NAMES}
    if any(path.is_symlink() or not path.is_file() for path in files.values()):
        raise RuntimeError('Unexpected client files')
    policy, sasl, transport = (files[name].read_text() for name in ('tls_policy', 'sasl_passwd', 'internal-only.transport'))
    new_policy, new_sasl, new_transport, credential = replacements(policy, sasl, transport)
    backup = Path('/root/umsa-vivero-mail-migration') / identifier
    if backup.exists():
        raise RuntimeError('An earlier attempt must be inspected')
    # TLS and AUTH must succeed before any client config is changed.
    with TargetRelay('www.ultimamilla.com.ar', 587, timeout=15) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        code, _ = smtp.login(*credential)
        if code != 235:
            raise RuntimeError('Hostinger relay authentication failed')
        smtp.rset()
    backup.mkdir(mode=0o700, parents=True)
    for name, path in files.items():
        shutil.copy2(path, backup / name)
    stage = CLIENT / ('.umsa-mail-' + identifier)
    stage.mkdir(mode=0o700)
    for name, text in (('tls_policy', new_policy), ('sasl_passwd', new_sasl), ('internal-only.transport', new_transport)):
        path = stage / name
        path.write_text(text)
        path.chmod(files[name].stat().st_mode & 0o777)
    with (backup / 'handoff.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        run(['postmap', 'hash:' + str(stage / 'sasl_passwd')])
        (stage / 'sasl_passwd.db').chmod(0o600)
        try:
            for name in NAMES:
                os.replace(stage / name, files[name])
            run(['postfix', '-c', str(CLIENT), 'check'])
            run(['systemctl', 'reload', 'vivero-mail-client'])
            run(['systemctl', 'is-active', '--quiet', 'vivero-mail-client'])
            lookup = subprocess.check_output(['postmap', '-q', NEW, 'hash:' + str(files['sasl_passwd'])], stderr=log, text=True).strip()
            if lookup != ':'.join(credential):
                raise RuntimeError('New SASL map lookup differs')
        except Exception:
            for name, path in files.items():
                shutil.copy2(backup / name, path)
            run(['postfix', '-c', str(CLIENT), 'check'])
            run(['systemctl', 'reload', 'vivero-mail-client'])
            raise
    (backup / 'handoff.complete').write_text('TLS and AUTH tested; client reloaded with Hostinger destination. No test mail was sent.\n')
    print('Vivero SMTP client now points to the verified Hostinger relay. Old client files are retained for rollback.')


if __name__ == '__main__':
    main(sys.argv[1])
