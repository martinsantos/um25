#!/usr/bin/env python3
"""Prepare a SITREP-only network probe, restricted to the old server.

This stage serves only a health token; it does not expose SITREP application
content, accept writes, change DNS or activate production traffic.
"""
import importlib.util
import json
import os
from pathlib import Path
import re
import shlex
import socket
import subprocess
import sys

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-clean-proxy/nginx')
SITE = ROOT / 'conf.d/sitrep.conf'
UNIT_FILE = Path('/etc/systemd/system/umsa-sitrep-ingress.service')
ADDRESS = '179.198.115.115'
SOURCE_ADDRESS = '23.105.176.45'
HOST = 'sitrep.ultimamilla.com.ar'
CERT = '/etc/letsencrypt/live/sitrep.ultimamilla.com.ar/fullchain.pem'
KEY = '/etc/letsencrypt/live/sitrep.ultimamilla.com.ar/privkey.pem'


def valid_id(value):
    if not re.fullmatch(r'[0-9]{1,20}-[0-9]{1,4}', value):
        raise ValueError('Invalid run identifier')
    return value


def health_config(directory, identifier):
    token = 'umsa-sitrep-' + valid_id(identifier)
    return f'''pid {directory}/nginx.pid;
error_log {directory}/nginx-error.log warn;
events {{ worker_connections 64; }}
http {{
    access_log off;
    server {{ listen {ADDRESS}:80 default_server; server_name _; return 444; }}
    server {{
        listen {ADDRESS}:443 ssl default_server;
        server_name {HOST};
        ssl_certificate {CERT};
        ssl_certificate_key {KEY};
        location = /.well-known/{token} {{ default_type text/plain; return 200 '{token}'; }}
        location / {{ return 404; }}
    }}
}}
'''


def source_only_unit(config):
    return f'''[Unit]
Description=UMSA SITREP source-only network readiness probe
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
ExecStartPre=/usr/sbin/nginx -t -c {config}
ExecStart=/usr/sbin/nginx -c {config} -g "daemon off;"
ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGQUIT
TimeoutStopSec=30
IPAddressDeny=any
IPAddressAllow=localhost
IPAddressAllow={SOURCE_ADDRESS}/32
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
'''


def live_unit(config):
    return f'''[Unit]
Description=UMSA SITREP public ingress
After=network-online.target umsa-clean-sitrep-backend.service
Wants=network-online.target
Requires=umsa-clean-sitrep-backend.service
[Service]
Type=simple
ExecStartPre=/usr/sbin/nginx -t -c {config}
ExecStart=/usr/sbin/nginx -c {config} -g "daemon off;"
ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGQUIT
TimeoutStopSec=30
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
'''


def live_config(site, directory):
    result = load_rehearsal().render_config(site, directory)
    if result.count('listen 127.0.0.1:18080;') != 1 or result.count('listen 127.0.0.1:18443 ssl http2;') != 2:
        raise ValueError('Unexpected SITREP rehearsal listener layout')
    result = result.replace('listen 127.0.0.1:18080;', f'listen {ADDRESS}:80;')
    result = result.replace('listen 127.0.0.1:18443 ssl http2;', f'listen {ADDRESS}:443 ssl http2;')
    optimization = '''    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript
        application/x-javascript application/xml application/xml+rss application/vnd.ms-fontobject
        font/truetype font/opentype image/svg+xml;
'''
    anchor = '    default_type application/octet-stream;\n'
    if result.count(anchor) != 1:
        raise ValueError('Unexpected SITREP HTTP configuration')
    result = result.replace(anchor, anchor + optimization, 1)
    defaults = f'''server {{ listen {ADDRESS}:80 default_server; server_name _; return 444; }}
server {{
    listen {ADDRESS}:443 ssl http2 default_server;
    server_name _;
    ssl_certificate {CERT};
    ssl_certificate_key {KEY};
    return 444;
}}
'''
    if result.count('upstream sitrep_backend {') != 1:
        raise ValueError('Unexpected SITREP upstream layout')
    return result.replace('upstream sitrep_backend {', defaults + 'upstream sitrep_backend {', 1)


def load_rehearsal():
    file = Path(__file__).with_name('rehearse-sitrep-ingress.py')
    spec = importlib.util.spec_from_file_location('sitrep_ingress_rehearsal', file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main(identifier, fence_id, rehearsal_id):
    identifier, fence_id, rehearsal_id = map(valid_id, (identifier, fence_id, rehearsal_id))
    snapshot = STAGE / 'sitrep-final-refreshes' / identifier
    ready = STAGE / 'sitrep-final-refresh.ready'
    rehearsal = STAGE / 'sitrep-ingress-rehearsals' / rehearsal_id
    if (socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink()
            or (STAGE / '.target').read_text().strip() != ADDRESS
            or (STAGE / 'production.active').exists() or (STAGE / 'sitrep-public-activation.started').exists()
            or (STAGE / 'sitrep-ingress-source-only.started').exists() or UNIT_FILE.exists()
            or ready.is_symlink() or not ready.is_file() or ready.read_text().strip() != str(snapshot)
            or snapshot.is_symlink() or rehearsal.is_symlink()
            or not (rehearsal / 'rehearsal.complete').is_file() or SITE.is_symlink()
            or not os.environ.get('SSH_AUTH_SOCK')):
        raise RuntimeError('SITREP private data or network probe prerequisites are missing')
    receipt = json.loads((snapshot / 'refresh.complete.json').read_text())
    if (receipt.get('run') != identifier or receipt.get('fence_run') != fence_id
            or not receipt.get('offsite_size_confirmed')):
        raise RuntimeError('SITREP refresh receipt differs')
    expected = load_rehearsal().render_config(SITE.read_text(), rehearsal)
    if (rehearsal / 'nginx.conf').read_text() != expected:
        raise RuntimeError('SITREP vhost changed since the private ingress rehearsal')
    known = STAGE / 'known_hosts'
    if known.is_symlink() or not known.is_file():
        raise RuntimeError('Pinned source host key is missing')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o',
           'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=15', 'root@' + SOURCE_ADDRESS]
    source_tool = '/root/umsa-sitrep-migration/' + fence_id + '/sitrep-source-fence.py'
    def source_command(args):
        return ssh + [shlex.join(args)]
    def verify_source():
        subprocess.run(source_command(['/usr/bin/python3', source_tool, '--verify', fence_id]),
                       check=True, stdout=subprocess.DEVNULL)
    verify_source()
    os.umask(0o077)
    directory = STAGE / 'sitrep-public-ingress' / identifier
    directory.mkdir(parents=True, mode=0o700, exist_ok=False)
    config = directory / 'nginx.conf'
    config.write_text(health_config(directory, identifier))
    candidate = directory / 'live-candidate.conf'
    candidate.write_text(live_config(SITE.read_text(), directory))
    subprocess.run(['nginx', '-t', '-c', str(config)], check=True)
    subprocess.run(['nginx', '-t', '-c', str(candidate)], check=True)
    (STAGE / 'sitrep-ingress-source-only.started').write_text(str(directory) + '\n')
    with UNIT_FILE.open('x') as unit:
        unit.write(source_only_unit(config))
        unit.flush()
        os.fsync(unit.fileno())
    os.chmod(UNIT_FILE, 0o644)
    try:
        subprocess.run(['systemctl', 'daemon-reload'], check=True)
        subprocess.run(['systemctl', 'start', 'umsa-sitrep-ingress'], check=True)
        token = 'umsa-sitrep-' + identifier
        curl = ['curl', '--noproxy', '*', '--silent', '--show-error', '--max-time', '15',
                '--resolve', HOST + ':443:' + ADDRESS]
        response = subprocess.check_output(source_command(curl + ['https://' + HOST + '/.well-known/' + token]), text=True)
        code = subprocess.check_output(source_command(curl + ['--output', '/dev/null', '--write-out', '%{http_code}',
            'https://' + HOST + '/api/health']), text=True)
        if response != token or code != '404':
            raise RuntimeError('Source-only network probe returned an unexpected response')
        verify_source()
        (directory / 'source-only.complete').write_text('TLS and connectivity passed; application routes remain closed.\n')
        (STAGE / 'sitrep-ingress-source-only.ready').write_text(str(directory) + '\n')
    except Exception:
        subprocess.run(['systemctl', 'stop', 'umsa-sitrep-ingress'], check=False)
        raise
    print('SITREP network probe is reachable only from the old server; all application routes remain closed.')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
