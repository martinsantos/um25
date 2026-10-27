#!/usr/bin/env python3
"""Hold a bounded, read-compatible PostgreSQL lock during SITREP handoff.

The complete, fixed SQL is sent noninteractively. The lock protects user tables
from writes while permitting the final dump. It must only be started after the
old SITREP application has been fenced and stopped.
"""
import os
import re
import socket
import subprocess
import sys

DATABASE_CONTAINER = 'directus-admin-database-1'
DATABASE_NAME = 'trazabilidad_rrpp'
LOCK_SECONDS = 28800

LOCK_SQL = r'''
BEGIN;
SET LOCAL lock_timeout = '15s';
SELECT format('LOCK TABLE %s IN SHARE MODE;',
              string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY n.nspname, c.relname))
FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname <> 'information_schema'
  AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\';
\gexec
SELECT pg_sleep(28800);
ROLLBACK;
'''


def application_name(identifier):
    if not re.fullmatch(r'[0-9]+-[0-9]+', identifier):
        raise ValueError('Invalid migration run identifier')
    return 'umsa_sitrep_fence_' + identifier.replace('-', '_')


def lock_command(container, identifier):
    return ['docker', 'exec', '-i', '-e', 'PGAPPNAME=' + application_name(identifier),
            container, 'psql', '-X', '-w', '-U', 'directus', '-d', DATABASE_NAME,
            '--set', 'ON_ERROR_STOP=1', '--file', '-']


def main(identifier):
    if socket.gethostname() != 'FTS-23.105.176.45':
        raise RuntimeError('Refusing to lock an unexpected host')
    os.umask(0o077)
    subprocess.run(lock_command(DATABASE_CONTAINER, identifier), input=LOCK_SQL,
                   text=True, check=True, timeout=LOCK_SECONDS + 60)


if __name__ == '__main__':
    main(sys.argv[1])
