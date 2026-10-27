#!/usr/bin/env python3
"""Build a bounded, database-scoped MariaDB read lock for SGI migration."""
import re
import socket
import subprocess
import sys

DATABASE = 'sgi_production'
LOCK_SECONDS = 28800


def lock_sql(table_names):
    names = sorted(table_names)
    if (not names or len(names) != len(set(names))
            or any(not re.fullmatch(r'[A-Za-z0-9_]{1,64}', name) for name in names)):
        raise ValueError('Unexpected SGI table inventory')
    tables = ', '.join('`' + DATABASE + '`.`' + name + '` READ' for name in names)
    return ('SET SESSION lock_wait_timeout=15;\nLOCK TABLES ' + tables +
            ';\nSELECT SLEEP(' + str(LOCK_SECONDS) + ');\nUNLOCK TABLES;\n')


def inventory():
    query = ("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='sgi_production' "
             "AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;")
    output = subprocess.check_output(['mariadb', '--no-defaults', '-uroot', '--batch', '--skip-column-names',
                                      '-e', query], text=True, timeout=15)
    return output.splitlines()


def main():
    if socket.gethostname() != 'FTS-23.105.176.45':
        raise RuntimeError('Refusing to lock an unexpected host')
    sql = lock_sql(inventory())
    subprocess.run(['mariadb', '--no-defaults', '-uroot', '--batch', '--skip-column-names'],
                   input=sql, text=True, check=True, timeout=LOCK_SECONDS + 60)


if __name__ == '__main__':
    main()
