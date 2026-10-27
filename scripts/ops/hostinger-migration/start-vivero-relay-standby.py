#!/usr/bin/env python3
"""Start the prepared Vivero relay for a restricted, no-message readiness test."""
import os
from pathlib import Path
import re
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
RELAY = Path('/etc/postfix-vivero')
UNIT = 'vivero-relay-hostinger'
SETTINGS = {
    'inet_interfaces': '179.198.115.115',
    'smtpd_client_restrictions': 'check_client_access cidr:/etc/postfix-vivero/allowed-clients.cidr, reject',
    'smtpd_relay_restrictions': 'permit_sasl_authenticated, reject',
    'smtpd_recipient_restrictions': 'reject_non_fqdn_recipient, check_recipient_access regexp:/etc/postfix-vivero/allowed-recipients.regexp',
    'smtpd_sasl_auth_enable': 'yes',
    'smtpd_tls_auth_only': 'yes',
    'smtpd_tls_cert_file': '/etc/letsencrypt/live/ultimamilla.com.ar-0001/fullchain.pem',
    'smtpd_tls_key_file': '/etc/letsencrypt/live/ultimamilla.com.ar-0001/privkey.pem',
    'queue_directory': '/var/spool/postfix-vivero',
}


def validate_config(settings, clients, master):
    if settings != SETTINGS:
        raise ValueError('Relay restrictions differ from reviewed configuration')
    rows = [line.split()[:2] for line in clients.splitlines()
            if line.strip() and not line.lstrip().startswith('#')]
    if rows != [['68.168.218.28/32', 'OK'], ['0.0.0.0/0', 'REJECT'], ['::/0', 'REJECT']]:
        raise ValueError('Relay client restrictions differ')
    listeners = [line.split()[0] for line in master.splitlines()
                 if line.strip() and not line[0].isspace() and not line.startswith('#')
                 and len(line.split()) > 1 and line.split()[1] == 'inet']
    if listeners != ['179.198.115.115:587']:
        raise ValueError('Unexpected SMTP listener')


def validate_recipient_denial(value):
    if not value.startswith('REJECT '):
        raise ValueError('Unrelated recipients must be rejected')


def main(identifier):
    os.umask(0o077)
    if (not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or RELAY.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()
            or not (STAGE / 'relay-certificate-prepared.complete').is_file()):
        raise RuntimeError('Not the reviewed isolated target')
    started = STAGE / 'vivero-relay-standby.started'
    if started.exists() or (STAGE / 'vivero-relay-standby.complete').exists():
        raise RuntimeError('Earlier standby attempt requires inspection')
    if subprocess.run(['systemctl', 'is-active', '--quiet', UNIT]).returncode == 0:
        raise RuntimeError('Relay was already active')
    settings = {key: subprocess.check_output(['postconf', '-c', str(RELAY), '-h', key], text=True).strip()
                for key in SETTINGS}
    validate_config(settings, (RELAY / 'allowed-clients.cidr').read_text(), (RELAY / 'master.cf').read_text())
    denial = subprocess.check_output(['postmap', '-q', 'migration-probe@example.invalid',
                                       'regexp:' + str(RELAY / 'allowed-recipients.regexp')], text=True).strip()
    validate_recipient_denial(denial)
    queue = subprocess.check_output(['postqueue', '-c', str(RELAY), '-p'], stderr=subprocess.DEVNULL, text=True)
    if 'Mail queue is empty' not in queue:
        raise RuntimeError('Relay queue is not empty')
    with (STAGE / 'receipts/vivero-relay-standby.log').open('ab') as log:
        def run(args):
            return subprocess.run(args, check=True, stdout=log, stderr=log)
        run(['postfix', '-c', str(RELAY), 'check'])
        with started.open('x') as marker:
            marker.write(identifier + '\nStarting the restricted relay for a no-message client test.\n')
        try:
            run(['systemctl', 'start', UNIT])
            run(['systemctl', 'is-active', '--quiet', UNIT])
        except Exception:
            subprocess.run(['systemctl', 'stop', UNIT], stdout=log, stderr=log)
            raise
    print('Restricted relay started; external TLS and authentication test still required.')


if __name__ == '__main__':
    main(sys.argv[1])
