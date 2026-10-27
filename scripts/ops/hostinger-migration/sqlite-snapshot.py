"""Consistent, read-only source snapshot streamed as SQL; no source temp files."""
import sqlite3
import sys
from pathlib import Path


def snapshot(path, output):
    source = Path(path).resolve(strict=True)
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as original:
        with sqlite3.connect(':memory:') as copy:
            original.backup(copy, pages=128, sleep=0.1)
            if copy.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                raise RuntimeError('SQLite integrity check failed')
            for statement in copy.iterdump():
                output.write(statement + '\n')


if __name__ == '__main__':
    snapshot('/var/www/umbot-aceite/current/db/custom.db', sys.stdout)
