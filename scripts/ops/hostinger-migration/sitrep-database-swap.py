#!/usr/bin/env python3
"""Prepare a reversible database swap without removing an existing database."""
import re
import subprocess

CURRENT = 'trazabilidad_rrpp'


def names(identifier):
    if not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier):
        raise ValueError('Invalid migration run identifier')
    suffix = identifier.replace('-', '_')
    return 'umsa_sr_next_' + suffix, 'umsa_sr_before_' + suffix


def rename_statement(old, new):
    if not all(re.fullmatch(r'[a-z][a-z0-9_]{0,62}', item) for item in (old, new)):
        raise ValueError('Unsafe database identifier')
    return f'ALTER DATABASE "{old}" RENAME TO "{new}";'


def rename(container, administrator, old, new):
    subprocess.run(['docker', 'exec', container, 'psql', '-X', '-w', '-U', administrator,
                    '-d', 'postgres', '--set', 'ON_ERROR_STOP=1', '-c', rename_statement(old, new)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def swap(container, administrator, identifier):
    staged, previous = names(identifier)
    rename(container, administrator, CURRENT, previous)
    try:
        rename(container, administrator, staged, CURRENT)
    except Exception:
        rename(container, administrator, previous, CURRENT)
        raise


def undo_private_swap(container, administrator, identifier):
    staged, previous = names(identifier)
    rename(container, administrator, CURRENT, staged)
    try:
        rename(container, administrator, previous, CURRENT)
    except Exception:
        rename(container, administrator, staged, CURRENT)
        raise
