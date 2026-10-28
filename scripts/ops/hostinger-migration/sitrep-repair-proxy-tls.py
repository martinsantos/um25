#!/usr/bin/env python3
"""Repair the already-committed SITREP source proxy without weakening TLS."""
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys

ROOT = Path('/root/umsa-sitrep-migration')
GATE = Path('/etc/nginx/conf.d/00-umsa-sitrep-migration.conf')
OLD_RENDERER_SHA256 = '59ad92fa884b16de56c357658e4b58bc41ba712806af21766cdcbad1d811abbc'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_renderer(filename):
    spec = importlib.util.spec_from_file_location('reviewed_gate', filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def install_renderer(existing, revised, backup):
    old_bytes, new_bytes = existing.read_bytes(), revised.read_bytes()
    if digest(old_bytes) == digest(new_bytes):
        return
    if digest(old_bytes) != OLD_RENDERER_SHA256:
        raise RuntimeError('Existing source gate renderer is not the reviewed version')
    with backup.open('xb') as saved:
        saved.write(old_bytes)
        saved.flush()
        os.fsync(saved.fileno())
    candidate = existing.with_name('.gate-renderer-tls-repair')
    fd = os.open(candidate, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as output:
        output.write(new_bytes)
        output.flush()
        os.fsync(output.fileno())
    os.replace(candidate, existing)


def main(identifier, backup_sha, files_sha):
    if (socket.gethostname() != 'FTS-23.105.176.45' or not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', identifier)
            or not all(re.fullmatch(r'[0-9a-f]{64}', value) for value in (backup_sha, files_sha))):
        raise RuntimeError('Unexpected source host or recovery identifier')
    run = ROOT / identifier
    renderer = run / 'sitrep-gate-config.py'
    fencer = run / 'sitrep-source-fence.py'
    revised = Path(__file__).with_name('sitrep-gate-config.py')
    backup = Path(__file__).with_name('previous-gate-renderer.py')
    marker = run / 'target-writes-authorized'
    if (ROOT.is_symlink() or run.is_symlink() or GATE.is_symlink() or not GATE.is_file()
            or any(path.is_symlink() or not path.is_file() for path in (renderer, fencer, revised, marker))):
        raise RuntimeError('SITREP recovery inputs have changed')
    expected = {'run': identifier, 'offsite_sha256': backup_sha, 'offsite_files_sha256': files_sha}
    if json.loads(marker.read_text()) != expected:
        raise RuntimeError('The target-writer boundary does not match the verified backups')
    module = load_renderer(revised)
    proxy = module.render_gate('proxy')
    maintenance = module.render_gate('maintenance')
    if ('proxy_ssl_verify on;' not in proxy or 'proxy_ssl_verify_depth 4;' not in proxy
            or GATE.read_text() not in (maintenance, proxy)):
        raise RuntimeError('The reviewed TLS proxy or current maintenance gate differs')
    with (run / 'transition.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        install_renderer(renderer, revised, backup)
    # The original fencer validates the lock, tests upstream health, reloads
    # only the SITREP gate and returns to maintenance on failure.
    subprocess.run(['/usr/bin/python3', str(fencer), '--proxy', identifier], check=True, timeout=180)
    print('SITREP source proxy restored with validated TLS and the old writer still fenced.')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
