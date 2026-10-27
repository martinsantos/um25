#!/usr/bin/env python3
"""Make destination MariaDB read its reviewed local-only configuration."""
import os
from pathlib import Path
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
EXPECTED = ('[mysqld]\nbind-address=127.0.0.1\nevent_scheduler=OFF\n'
            'character-set-server=latin1\ncollation-server=latin1_swedish_ci\n'
            'default-time-zone=-03:00\nmax_allowed_packet=16777216\n')


def validate_config(text):
    if text != EXPECTED:
        raise RuntimeError('MariaDB configuration differs from reviewed settings')


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'internal-rotation.complete').is_file():
        raise RuntimeError('Rotated destination required')
    config = Path('/etc/my.cnf.d/umsa-migration.cnf')
    if config.is_symlink():
        raise RuntimeError('Unexpected configuration symlink')
    validate_config(config.read_text())
    backup = STAGE / 'mariadb-config-before-restriction'
    if not backup.exists():
        backup.write_bytes(config.read_bytes())
    # This file contains no credentials. The mysql service must be able to read it.
    config.chmod(0o644)
    subprocess.run(['systemctl', 'restart', 'mariadb'], check=True)
    result = subprocess.check_output(['mariadb', '-NBe',
        'SELECT @@bind_address, @@event_scheduler, @@time_zone, @@character_set_server, @@collation_server'], text=True).strip()
    if result != '127.0.0.1\tOFF\t-03:00\tlatin1\tlatin1_swedish_ci':
        raise RuntimeError('MariaDB did not load reviewed settings')
    listeners = subprocess.check_output(['ss', '-Hlnpt', 'sport = :3306'], text=True).splitlines()
    if len(listeners) != 1 or listeners[0].split()[3] != '127.0.0.1:3306':
        raise RuntimeError('Unexpected database listener')
    (STAGE / 'database-network-restricted.complete').write_text(result + '\n')
    print('Destination MariaDB verified on loopback; reviewed timezone, charset and disabled events applied. Source untouched.')


if __name__ == '__main__':
    main()
