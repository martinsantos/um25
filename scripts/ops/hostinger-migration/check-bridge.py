#!/usr/bin/env python3
"""Fail closed before a persistent bridge could reach a different container."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


def main(name):
    spec = importlib.util.spec_from_file_location('bridges', Path(__file__).with_name('rehearsal-bridges.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    container, network, local, remote = module.TARGETS[name]
    metadata = json.loads(subprocess.check_output(['docker', 'inspect', container]))[0]
    address = module.destination(container, network, metadata)
    text = Path('/etc/systemd/system/umsa-rehearsal-bridge-' + name + '.service').read_text()
    if f'TCP4:{address}:{remote}\n' not in text:
        raise RuntimeError('Container endpoint changed; bridge refuses to start')


if __name__ == '__main__':
    main(sys.argv[1])
