#!/usr/bin/env python3
"""Rehearse an isolated, SITREP-only ingress without changing active services."""
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-clean-proxy/nginx')
SITE = ROOT / 'conf.d/sitrep.conf'
SOURCE_IP = '23.105.176.45'
PUBLIC_HOST = 'sitrep.ultimamilla.com.ar'
PROBES = ('/', '/app/', '/manifest.json', '/api/auth/profile', '/precrimen/')


def render_config(site, directory):
    if (site.count('listen 127.0.0.1:80;') != 1
            or site.count('listen 127.0.0.1:443 ssl http2;') != 2
            or 'server_name sitrep.ultimamilla.com.ar;' not in site
            or 'server_name www.sitrep.ultimamilla.com.ar;' not in site):
        raise ValueError('SITREP vhost has changed and must be reviewed')
    vhost = site.replace('listen 127.0.0.1:80;', 'listen 127.0.0.1:18080;')
    vhost = vhost.replace('listen 127.0.0.1:443 ssl http2;', 'listen 127.0.0.1:18443 ssl http2;')
    return f'''pid {directory}/nginx.pid;
error_log {directory}/nginx-error.log warn;
events {{ worker_connections 256; }}
http {{
    include {ROOT}/mime.types;
    default_type application/octet-stream;
    include {ROOT}/conf.d/01-sitrep-precrimen-session.conf;
    set_real_ip_from {SOURCE_IP};
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;
    access_log off;
{vhost}
}}
'''


def result(port, path):
    # Preserve the actual domain as TLS SNI and Host.
    return subprocess.check_output([
        'curl', '--noproxy', '*', '--silent', '--show-error', '--max-time', '15',
        '--output', '/dev/null', '--write-out', '%{http_code} %{redirect_url}\\n',
        '--connect-to', f'{PUBLIC_HOST}:443:127.0.0.1:{port}', f'https://{PUBLIC_HOST}{path}',
    ], text=True).strip()


def main(identifier):
    if (not re.fullmatch(r'[0-9]+-[0-9]+', identifier)
            or socket.gethostname() != 'srv2101069.hstgr.cloud'
            or STAGE.is_symlink() or SITE.is_symlink()
            or (STAGE / '.target').read_text().strip() != '179.198.115.115'
            or (STAGE / 'production.active').exists()):
        raise RuntimeError('Not the reviewed isolated migration destination')
    os.umask(0o077)
    for port in (18080, 18443):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', port))
    directory = STAGE / 'sitrep-ingress-rehearsals' / identifier
    directory.mkdir(parents=True, mode=0o700, exist_ok=False)
    config = directory / 'nginx.conf'
    config.write_text(render_config(SITE.read_text(), directory))
    with (directory / 'proof.log').open('wb') as log:
        subprocess.run(['nginx', '-t', '-c', str(config)], check=True, stdout=log, stderr=log)
        process = subprocess.Popen(['nginx', '-c', str(config), '-g', 'daemon off;'], stdout=log, stderr=log)
        try:
            for _ in range(30):
                if process.poll() is not None:
                    raise RuntimeError('Candidate ingress stopped unexpectedly')
                try:
                    with socket.create_connection(('127.0.0.1', 18443), timeout=1):
                        break
                except OSError:
                    time.sleep(0.2)
            else:
                raise RuntimeError('Candidate ingress did not start')
            checks = []
            for path in PROBES:
                baseline, candidate = result(443, path), result(18443, path)
                if baseline != candidate or not re.match(r'^[1-4][0-9]{2}(?:\s|$)', candidate):
                    raise RuntimeError('Candidate response differs for ' + path)
                checks.append(path + ' ' + candidate)
            (directory / 'checks.txt').write_text('\n'.join(checks) + '\n')
        finally:
            process.terminate()
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
    (directory / 'rehearsal.complete').write_text('Local-only nginx rehearsal; no public listener, source change or DNS change.\n')
    print('SITREP-only ingress matches isolated baseline for five read-only routes; no production traffic changed.')


if __name__ == '__main__':
    main(sys.argv[1])
