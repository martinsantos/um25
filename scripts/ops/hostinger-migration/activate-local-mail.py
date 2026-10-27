#!/usr/bin/env python3
"""Enable the reviewed local mail hop after SPF and relay standby checks."""
import os
from pathlib import Path
import re
import shlex
import shutil
import smtplib
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
MAIN = Path('/etc/postfix/main.cf')
NAME = 'srv2101069.hstgr.cloud'
IP = '179.198.115.115'
SPF = {
    'ultimamilla.com.ar': 'v=spf1 a mx ip4:23.105.176.45 ip4:179.198.115.115 include:_spf.google.com include:_spf.zedmail.io -all',
    'viveroloscocos.com.ar': 'v=spf1 ip4:23.105.176.45 ip4:179.198.115.115 ?all',
}


def check_spf(output, expected):
    records = []
    for line in output.splitlines():
        try:
            value = ''.join(shlex.split(line))
        except ValueError as exc:
            raise ValueError('Invalid DNS TXT answer') from exc
        if value.startswith('v=spf1 '):
            records.append(' '.join(value.split()))
    if records != [expected]:
        raise ValueError('SPF does not match the reviewed transition record')


def append_helo(text):
    if re.search(r'(?m)^\s*smtp_helo_name\s*=', text):
        raise ValueError('Existing SMTP HELO setting requires review')
    return text.rstrip() + '\n\nsmtp_helo_name = ' + NAME + '\n'


def queue_empty(root):
    for name in ('active', 'deferred', 'incoming', 'hold'):
        path = root / name
        if path.is_symlink() or not path.is_dir() or any(p.is_file() or p.is_symlink() for p in path.rglob('*')):
            return False
    return True


def check_dns():
    for domain, expected in SPF.items():
        check_spf(subprocess.check_output(['dig', '+short', 'TXT', domain], text=True), expected)
    if socket.gethostbyname(NAME) != IP or socket.gethostbyaddr(IP)[0].rstrip('.') != NAME:
        raise RuntimeError('Forward/reverse mail hostname does not match')


def verify_readiness():
    if (socket.gethostname() != NAME or STAGE.is_symlink() or MAIN.is_symlink()
            or (STAGE / '.target').read_text().strip() != IP
            or not (STAGE / 'vivero-relay-standby.complete').is_file()
            or not (STAGE / 'local-mail-activation.complete').is_file()):
        raise RuntimeError('Verified mail readiness markers are missing')
    for unit in ('vivero-relay-hostinger', 'postfix', 'sitrep-opendkim'):
        if subprocess.run(['systemctl', 'is-active', '--quiet', unit]).returncode:
            raise RuntimeError('A required mail service is not active')
    interfaces = subprocess.check_output(['postconf', '-h', 'inet_interfaces'], text=True).strip()
    helo = subprocess.check_output(['postconf', '-h', 'smtp_helo_name'], text=True).strip()
    if interfaces != '127.0.0.1, 172.18.0.1' or helo != NAME:
        raise RuntimeError('Local SMTP restrictions differ')
    check_dns()
    if not queue_empty(Path('/var/spool/postfix')):
        raise RuntimeError('Local mail queue needs inspection before handoff')
    print('Mail standby, local SMTP, DKIM and transition DNS are ready.')


def main(identifier):
    os.umask(0o077)
    if (not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or socket.gethostname() != NAME or STAGE.is_symlink() or MAIN.is_symlink()
            or (STAGE / '.target').read_text().strip() != IP or (STAGE / 'production.active').exists()
            or not (STAGE / 'local-mail-prerequisites.complete').is_file()
            or not (STAGE / 'vivero-relay-standby.complete').is_file()):
        raise RuntimeError('Not the reviewed pre-cutover mail target')
    if subprocess.run(['systemctl', 'is-active', '--quiet', 'vivero-relay-hostinger']).returncode:
        raise RuntimeError('Verified Vivero relay is not active')
    started = STAGE / 'local-mail-activation.started'
    complete = STAGE / 'local-mail-activation.complete'
    backup = STAGE / 'before-local-mail-activation'
    if started.exists() or complete.exists() or backup.exists():
        raise RuntimeError('An earlier activation requires inspection')
    for unit in ('postfix', 'sitrep-opendkim'):
        enabled = subprocess.run(['systemctl', 'is-enabled', unit], capture_output=True, text=True)
        if (subprocess.run(['systemctl', 'is-active', '--quiet', unit]).returncode == 0
                or enabled.stdout.strip() != 'disabled'):
            raise RuntimeError('Unexpected active or enabled local mail unit')
    if not queue_empty(Path('/var/spool/postfix')):
        raise RuntimeError('Local mail queue is not empty')
    settings = {key: subprocess.check_output(['postconf', '-h', key], text=True).strip()
                for key in ('inet_interfaces', 'myhostname', 'smtp_helo_name', 'smtp_bind_address')}
    if settings != {'inet_interfaces': '127.0.0.1, 172.18.0.1', 'myhostname': 'umbot.com.ar',
                    'smtp_helo_name': '$myhostname', 'smtp_bind_address': ''}:
        raise RuntimeError('Local mail settings changed since review')
    check_dns()
    original = MAIN.read_text()
    updated = append_helo(original)
    backup.mkdir(mode=0o700)
    shutil.copy2(MAIN, backup / 'main.cf')
    with started.open('x') as marker:
        marker.write(identifier + '\nLocal-only SMTP and existing DKIM; no test message.\n')
    log = (STAGE / 'receipts/local-mail-activation.log').open('ab')
    def run(args):
        return subprocess.run(args, check=True, stdout=log, stderr=log)
    try:
        temp = MAIN.with_name('.main.cf.umsa-mail-pending')
        with temp.open('x') as file:
            file.write(updated)
            file.flush()
            os.fsync(file.fileno())
        info = MAIN.stat()
        os.chmod(temp, info.st_mode & 0o777)
        os.chown(temp, info.st_uid, info.st_gid)
        os.replace(temp, MAIN)
        run(['postfix', 'check'])
        run(['systemctl', 'start', 'sitrep-opendkim'])
        for _ in range(20):
            try:
                with socket.create_connection(('127.0.0.1', 8892), timeout=1):
                    break
            except OSError:
                time.sleep(0.5)
        else:
            raise RuntimeError('DKIM signer is not listening')
        run(['systemctl', 'start', 'postfix'])
        run(['systemctl', 'enable', 'postfix', 'sitrep-opendkim'])
        with smtplib.SMTP('127.0.0.1', 25, timeout=10) as smtp:
            if smtp.ehlo()[0] != 250 or smtp.rset()[0] != 250:
                raise RuntimeError('Local SMTP readiness failed')
        probe = ("import smtplib; s=smtplib.SMTP('172.18.0.1',25,timeout=5); "
                 "assert s.ehlo()[0]==250; assert s.rset()[0]==250; s.quit()")
        run(['docker', 'exec', 'dge-demo-web', 'python', '-c', probe])
        with smtplib.SMTP('gmail-smtp-in.l.google.com', 25, timeout=15, local_hostname=NAME) as smtp:
            if smtp.ehlo()[0] != 250:
                raise RuntimeError('Outbound SMTP readiness failed')
        if not queue_empty(Path('/var/spool/postfix')):
            raise RuntimeError('Unexpected queued mail during readiness')
        complete.write_text('Local SMTP, DGE path and outbound EHLO passed; no test message sent.\n')
    except Exception:
        if not (STAGE / 'production.active').exists():
            subprocess.run(['systemctl', 'stop', 'postfix', 'sitrep-opendkim'], stdout=log, stderr=log)
            subprocess.run(['systemctl', 'disable', 'postfix', 'sitrep-opendkim'], stdout=log, stderr=log)
            shutil.copy2(backup / 'main.cf', MAIN)
        raise
    finally:
        log.close()
    print('Local SMTP and DKIM active; DGE and outbound SMTP greeted successfully. No message sent.')


if __name__ == '__main__':
    if sys.argv[1:] == ['--check-readiness']:
        verify_readiness()
    else:
        main(sys.argv[1])
