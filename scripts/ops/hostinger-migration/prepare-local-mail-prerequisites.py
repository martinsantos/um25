#!/usr/bin/env python3
"""Prepare aliases and test the SITREP signer on the isolated target only."""
import hashlib
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import time

STAGE = Path('/srv/umsa-migration')
SOURCE = STAGE / 'source/etc/aliases'
ALIASES = Path('/etc/aliases')
SOURCE_SHA = '0574734db3a9996a9d81050067238ecee11131e6372055e7093faf222030c7cd'
TARGET_SHA = 'a4c569569f893bc22fbe696c459f8fba0fe4565022637300b705b54a95c47bce'
KEY = '/etc/opendkim/sitrep20261012/private.pem'


def append_reviewed_alias(source, current):
    rows = [line for line in source.splitlines() if re.match(r'^martin[ \t]*:', line)]
    if len(rows) != 1 or re.search(r'(?m)^martin[ \t]*:', current):
        raise ValueError('Unexpected alias inventory')
    address = rows[0].split(':', 1)[1].strip()
    if not re.fullmatch(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+', address):
        raise ValueError('Unexpected alias target')
    return current.rstrip('\n') + '\n' + rows[0] + '\n', address


def main():
    os.umask(0o077)
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists() or not (STAGE / 'dge-mail-rehearsal.complete').is_file()):
        raise RuntimeError('Not the isolated, tested target')
    for unit in ('postfix', 'sitrep-opendkim'):
        if subprocess.run(['systemctl', 'is-active', '--quiet', unit]).returncode == 0:
            raise RuntimeError('Mail services must be stopped')
    for path, expected in ((SOURCE, SOURCE_SHA), (ALIASES, TARGET_SHA)):
        if path.is_symlink() or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise RuntimeError('Aliases differ from the reviewed files')
    db = Path('/etc/aliases.db')
    backup = STAGE / 'mail-alias-before-preparation'
    candidate = Path('/etc/.umsa-aliases-rehearsal')
    if db.exists() or db.is_symlink() or backup.exists() or candidate.exists() or candidate.is_symlink():
        raise RuntimeError('Unexpected prior alias state')
    new_text, address = append_reviewed_alias(SOURCE.read_text(), ALIASES.read_text())
    with (STAGE / 'receipts/local-mail-prerequisites.log').open('ab') as log:
        def run(args, **kwargs):
            return subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        # Exercise the existing key without sending any email. The dummy message
        # never leaves this host; verification queries the public DNS key.
        message = b'From: no-reply@ultimamilla.com.ar\r\nTo: test@example.invalid\r\nSubject: Local verification\r\n\r\nLocal test.\r\n'
        signed = subprocess.check_output(['runuser', '-u', 'opendkim', '--', 'opendkim-testmsg', '-C',
            '-d', 'ultimamilla.com.ar', '-s', 'sitrep20261012', '-k', KEY], input=message, stderr=log)
        if b'DKIM-Signature:' not in signed:
            raise RuntimeError('Signer did not produce a signature')
        run(['runuser', '-u', 'opendkim', '--', 'opendkim-testmsg'], input=signed)
        try:
            run(['systemctl', 'start', 'sitrep-opendkim'])
            for _ in range(20):
                try:
                    with socket.create_connection(('127.0.0.1', 8892), timeout=1):
                        break
                except OSError:
                    time.sleep(0.5)
            else:
                raise RuntimeError('Signer socket did not become ready')
        finally:
            run(['systemctl', 'stop', 'sitrep-opendkim'])
        shutil.copy2(ALIASES, backup)
        candidate.write_text(new_text)
        candidate.chmod(0o644)
        run(['postalias', 'hash:' + str(candidate)])
        lookup = subprocess.check_output(['postalias', '-q', 'martin', 'hash:' + str(candidate)], stderr=log, text=True).strip()
        if lookup != address:
            raise RuntimeError('Alias map did not match the reviewed address')
        try:
            os.replace(candidate, ALIASES)
            os.replace(str(candidate) + '.db', db)
            lookup = subprocess.check_output(['postalias', '-q', 'martin', 'hash:' + str(ALIASES)], stderr=log, text=True).strip()
            if lookup != address:
                raise RuntimeError('Installed alias map differs')
        except Exception:
            shutil.copy2(backup, ALIASES)
            run(['postalias', 'hash:' + str(ALIASES)])
            raise
    (STAGE / 'local-mail-prerequisites.complete').write_text('Alias map created and legacy SITREP signer verified locally. Both services stopped; no mail sent.\n')
    print('Alias map and existing SITREP signing key passed isolated checks. SMTP and signer remain stopped; no mail sent.')


if __name__ == '__main__':
    main()
