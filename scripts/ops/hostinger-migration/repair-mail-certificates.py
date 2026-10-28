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
SNI_MAP = Path('/etc/postfix/vmail_ssl.map')
SNI_DB = Path('/etc/postfix/vmail_ssl.map.db')
SNI_NAMES = ('www.umbot.com.ar', 'umbot.com.ar')


def sni_map(text):
    seen = set()
    lines = []
    for line in text.splitlines(keepends=True):
        parts = line.split()
        if parts and parts[0] in SNI_NAMES:
            name = parts[0]
            old = '/etc/letsencrypt/live/www.umbot.com.ar/'
            new = str(ACME / 'www.umbot.com.ar') + '/'
            if (name in seen or parts not in ([name, old + 'privkey.pem', old + 'fullchain.pem'],
                                               [name, new + 'privkey.pem', new + 'fullchain.pem'])):
                raise RuntimeError('Unexpected reviewed SNI entry')
            seen.add(name)
            line = line.replace(old, new)
        lines.append(line)
    if seen != set(SNI_NAMES):
        raise RuntimeError('Reviewed SNI entries missing')
    return ''.join(lines)


def atomic_private_bytes(path, content):
    pending = path.with_name(path.name + '.pending')
    created = False
    try:
        with pending.open('xb') as output:
            created = True
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        pending.chmod(0o600)
        os.replace(pending, path)
    finally:
        if created:
            pending.unlink(missing_ok=True)


def smtp_probes():
    # The 587 allowlist accepts only its existing client at 68.168.218.28.
    # This target must not probe 587 from a rejected source or relax that policy.
    return (('127.0.0.1:25', 'www.umbot.com.ar', 'www.umbot.com.ar'),)


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
    reload = 'systemctl reload postfix vivero-relay-hostinger\n'
    command = ('umask 077\npostmap -F hash:/etc/postfix/vmail_ssl.map\n'
               'chmod 0600 /etc/postfix/vmail_ssl.map.db\n' + reload)
    if command in text:
        return text
    if text.count(reload) == 1:
        return text.replace(reload, command)
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
    files = [*configs, unit, hook, SNI_MAP]
    if any(p.is_symlink() or not p.is_file() for p in files):
        raise RuntimeError('Unexpected Postfix configuration type')
    if (SNI_DB.is_symlink() or not SNI_DB.is_file()
            or any(p.stat().st_uid != 0 or p.stat().st_mode & 0o777 != 0o600 for p in (SNI_MAP, SNI_DB))):
        raise RuntimeError('SNI text and compiled private-key map must remain root-only')
    previous = {p: p.read_text() for p in files}
    modes = {p: p.stat().st_mode & 0o777 for p in files}
    replacements = {p: mail_config(previous[p], lineage) for p, lineage in configs.items()}
    replacements[unit], replacements[hook] = relay_unit(previous[unit]), renewal_hook(previous[hook])
    replacements[SNI_MAP] = sni_map(previous[SNI_MAP])
    for index, (p, text) in enumerate(previous.items()):
        (root / ('before-' + str(index))).write_text(text)
    # postmap -F embeds private key material: retain the binary only in this
    # 0700 operation directory and install/restore it atomically at mode 0600.
    before_db = SNI_DB.read_bytes()
    (root / 'before-sni.db').write_bytes(before_db)
    (root / 'before-sni.db').chmod(0o600)
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
        candidate = root / 'renewed-sni.map'
        public.atomic(candidate, replacements[SNI_MAP], 0o600)
        run(['/usr/sbin/postmap', '-F', 'hash:' + str(candidate)])
        candidate_db = Path(str(candidate) + '.db')
        candidate_db.chmod(0o600)
        try:
            for p, text in replacements.items():
                public.atomic(p, text, modes[p])
            atomic_private_bytes(SNI_DB, candidate_db.read_bytes())
            for directory in ('/etc/postfix', '/etc/postfix-vivero'):
                run(['/usr/sbin/postfix', '-c', directory, 'check'])
            run(['systemd-analyze', 'verify', str(unit)])
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'postfix', 'vivero-relay-hostinger'])
            for address, hostname, lineage in smtp_probes():
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
                    raise RuntimeError('SMTP did not load its managed certificate: ' + address)
        except Exception:
            for p, text in previous.items():
                public.atomic(p, text, modes[p])
            atomic_private_bytes(SNI_DB, before_db)
            run(['systemctl', 'daemon-reload'])
            run(['systemctl', 'reload', 'postfix', 'vivero-relay-hostinger'])
            raise
        (root / 'operation.complete.json').write_text(json.dumps({'run': identifier,
            'postfix_certificates_managed': True, 'graceful_reload': True,
            'sni_map_private': True, 'smtp_25_certificate_verified': True,
            'both_smtp_certificates_verified': False,
            'vivero_587_tls_from_authorized_peer_pending': True, 'mail_sent': False}) + '\n')
    print('SMTP 25 SNI and renewal verified; 587 TLS from its authorized peer remains pending. No message was sent.')


if __name__ == '__main__':
    main(sys.argv[1])
