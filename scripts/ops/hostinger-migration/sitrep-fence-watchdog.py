#!/usr/bin/env python3
"""Recover an abandoned SITREP fence before any target writes are allowed."""
import fcntl
import importlib.util
from pathlib import Path
import re
import socket
import sys

ROOT = Path('/root/umsa-sitrep-migration')


def load_source(directory):
    script = directory / 'sitrep-source-fence.py'
    if script.is_symlink() or not script.is_file():
        raise RuntimeError('Source fence helper is missing')
    spec = importlib.util.spec_from_file_location('source_fence', script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main(identifier):
    if (not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or socket.gethostname() != 'FTS-23.105.176.45' or ROOT.is_symlink()):
        raise RuntimeError('Not the reviewed source host')
    directory = ROOT / identifier
    if directory.is_symlink() or not directory.is_dir():
        raise RuntimeError('Private run directory is missing')
    module = load_source(directory)
    application, unit = module.identifier_parts(identifier)
    with (directory / 'transition.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if ((directory / 'target-writes-authorized').exists()
                or (directory / 'fence.recovered').exists()
                or not (directory / 'fence.started.json').exists()):
            return
        gate_text = module.load_gate(directory)
        states = module.pm2_states()
        if len(states) != module.EXPECTED_PROCESSES:
            raise RuntimeError('Unexpected PM2 inventory; keep the gate and request review')
        if module.GATE.is_symlink():
            raise RuntimeError('Unexpected symbolic link for the gate')
        if not module.GATE.exists():
            module.release_lock(application, unit)
            if any(value != 'online' for value in states):
                module.command(['pm2', 'restart', 'sitrep-backend'])
                module.wait_pm2('online')
        elif module.GATE.is_file() and not module.GATE.is_symlink() and module.GATE.read_text() == gate_text:
            module.recover(application, unit, gate_text, any(value != 'online' for value in states), True, directory)
        elif (not module.GATE.is_symlink() and all(value == 'online' for value in states)
              and module.GATE.read_text().startswith('# SITREP migration gate disabled')):
            pass
        else:
            raise RuntimeError('Unexpected gate state; preserve it for review')
        (directory / 'fence.recovered').write_text('Watchdog restored source before target activation.\n')


if __name__ == '__main__':
    main(sys.argv[1])
