#!/usr/bin/env python3
"""Add a completed service cutover to the existing live SITREP ingress."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time

STAGE = Path('/srv/umsa-migration')
FRONT = STAGE / 'sitrep-public-ingress/40607817805-1/nginx.conf'
ROOT = Path('/srv/umsa-public-vhosts')
SITES = Path('/srv/umsa-clean-proxy/nginx/sites-enabled')
FILES = {'sgi': ['sgi.ultimamilla.com.ar'], 'umbot': ['umbot.com.ar'],
         'umsa': ['ultimamilla.com.ar', 'directus-admin'],
         'wiki': ['wiki.ultimamilla.com.ar']}


def public_listeners(text):
    text = re.sub(r'(?m)^\s*listen \[::1\]:(?:80|443)[^;]*;\s*\n', '\n', text)
    text, count = re.subn(r'\blisten 127\.0\.0\.1:(80|443)\b', r'listen 179.198.115.115:\1', text)
    if not count or re.search(r'\blisten\s+(?!179\.198\.115\.115:)', text):
        raise RuntimeError('Unexpected public vhost listener')
    return text


def extend_front(original):
    if 'include /srv/umsa-public-vhosts/*.conf;' in original:
        return original
    if original.count('set_real_ip_from 23.105.176.45;') != 1 or not original.rstrip().endswith('}'):
        raise RuntimeError('Unexpected live SITREP ingress baseline')
    # The old bridge is closed. Only Cloudflare networks in the reviewed snippet
    # may supply a client IP; direct requests cannot spoof it.
    text = original.replace('    set_real_ip_from 23.105.176.45;\n', '')
    text = text.replace('    real_ip_header CF-Connecting-IP;\n', '')
    text = text.replace('    real_ip_recursive on;\n', '')
    additions = '''
    server_tokens off;
    limit_req_zone $binary_remote_addr zone=wp_login:10m rate=5r/m;
    proxy_cache_path /var/cache/nginx/umsa-public-directus levels=1:2 keys_zone=directus_assets:50m max_size=2g inactive=30d use_temp_path=off;
    include /srv/umsa-clean-proxy/nginx/conf.d/00-ultimamilla-llm-analytics.conf;
    include /srv/umsa-clean-proxy/nginx/conf.d/php-fpm.conf;
    include /srv/umsa-public-vhosts/*.conf;
'''
    position = text.rfind('}')
    return text[:position] + additions + text[position:]


def atomic(path, content, mode=0o600):
    temp = path.with_name(path.name + '.pending')
    with temp.open('x') as stream:
        stream.write(content)
        stream.flush()
        os.fsync(stream.fileno())
    temp.chmod(mode)
    os.replace(temp, path)


def probe(host, route, accepted):
    for _ in range(20):
        result = subprocess.run(['curl', '--noproxy', '*', '-sS', '--max-time', '8',
            '--resolve', host + ':443:179.198.115.115', '-o', '/dev/null', '-w', '%{http_code}',
            'https://' + host + route], capture_output=True, text=True, timeout=12)
        if result.returncode == 0 and result.stdout in accepted:
            return
        time.sleep(0.5)
    raise RuntimeError('Target public route failed: ' + host + route)


def preflight(service, directory):
    """Validate the exact extra vhost before the source is interrupted."""
    if service not in FILES or FRONT.is_symlink() or not FRONT.is_file():
        raise RuntimeError('Unsupported preflight service or live ingress')
    parts = []
    for name in FILES[service]:
        source = SITES / name
        if source.is_symlink() or not source.is_file():
            raise RuntimeError('Reviewed vhost is missing')
        parts.append(public_listeners(source.read_text()))
    draft = directory / 'public-vhost.preflight.conf'
    draft.write_text('\n'.join(parts))
    text = extend_front(FRONT.read_text())
    anchor = '    include /srv/umsa-public-vhosts/*.conf;'
    if text.count(anchor) != 1:
        raise RuntimeError('Unexpected public include structure')
    config = directory / 'public-front.preflight.conf'
    config.write_text(text.replace(anchor, anchor + '\n    include ' + str(draft) + ';'))
    subprocess.run(['/usr/sbin/nginx', '-t', '-c', str(config)], check=True)


def activate(service, directory):
    if service not in FILES or FRONT.is_symlink() or not FRONT.is_file():
        raise RuntimeError('Unsupported public service or live ingress')
    if not (STAGE / '.target').is_file() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong migration target')
    ROOT.mkdir(mode=0o700, exist_ok=True)
    if ROOT.is_symlink() or any((ROOT / (name + '.conf')).exists() for name in FILES[service]):
        raise RuntimeError('Public vhost already present; inspect before another activation')
    previous = FRONT.read_text()
    saved = directory / 'public-front.before.conf'
    with saved.open('x') as stream:
        stream.write(previous)
    added = []
    switched = False
    try:
        for name in FILES[service]:
            source = SITES / name
            if source.is_symlink() or not source.is_file():
                raise RuntimeError('Reviewed private vhost is missing')
            file = ROOT / (name + '.conf')
            with file.open('x') as stream:
                stream.write(public_listeners(source.read_text()))
            added.append(file)
        atomic(FRONT, extend_front(previous))
        switched = True
        subprocess.run(['/usr/sbin/nginx', '-t', '-c', str(FRONT)], check=True)
        subprocess.run(['systemctl', 'reload', 'umsa-sitrep-ingress'], check=True)
        probe('sitrep.ultimamilla.com.ar', '/api/health', {'200'})
        routes = {'sgi': ('sgi.ultimamilla.com.ar', '/', {'200', '302'}),
                  'umsa': ('www.ultimamilla.com.ar', '/', {'200'}),
                  'umbot': ('www.umbot.com.ar', '/aceite/', {'200'}),
                  'wiki': ('wiki.ultimamilla.com.ar', '/wiki/Alcance', {'200'})}
        probe(*routes[service])
        (directory / 'public-vhost.complete.json').write_text(json.dumps({
            'service': service, 'files': FILES[service], 'sitrep_health': '200',
            'front_sha256': hashlib.sha256(FRONT.read_bytes()).hexdigest()}) + '\n')
    except Exception:
        if switched:
            atomic(FRONT, previous)
        for file in added:
            file.rename(directory / (file.name + '.failed'))
        subprocess.run(['/usr/sbin/nginx', '-t', '-c', str(FRONT)], check=True)
        subprocess.run(['systemctl', 'reload', 'umsa-sitrep-ingress'], check=True)
        raise
