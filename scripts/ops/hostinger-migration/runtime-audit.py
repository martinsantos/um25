#!/usr/bin/env python3
"""Read the migrated runtime instead of applying one-off edits to a retired layout."""
import json
from pathlib import Path
import socket
import subprocess
import sys


def main(operation):
    if operation not in ('fonts', 'canonical', 'nginx', 'logging', 'storage'):
        raise ValueError('Unsupported runtime audit')
    stage = Path('/srv/umsa-migration')
    if (socket.gethostname() != 'srv2101069.hstgr.cloud'
            or (stage / '.target').read_text().strip() != '179.198.115.115'
            or not (stage / 'production.active').is_file()):
        raise RuntimeError('Wrong production destination')
    def run(args):
        return subprocess.run(args, check=True, capture_output=True, text=True, timeout=30).stdout.strip()
    state = json.loads((stage / 'web-publication-state.json').read_text())
    public = Path('/srv/umsa-public-vhosts/ultimamilla.com.ar.conf')
    data = {'operation': operation, 'target': '179.198.115.115',
            'unit_active': run(['systemctl', 'is-active', state['unit']]), 'read_only': True}
    if operation == 'storage':
        data['storage'] = run(['df', '-h', '/'])
        data['backup_timer'] = run(['systemctl', 'is-active', 'umsa-active-backup.timer'])
        data['backup_policy'] = 'Historical versions are preserved; cleanup requires a new layout-specific reviewed plan.'
    elif operation == 'fonts':
        import urllib.request
        request = urllib.request.Request('https://www.ultimamilla.com.ar/fonts/um-sans/UMSans-Regular.woff2', method='HEAD')
        with urllib.request.urlopen(request, timeout=20) as response:
            data['font_status'] = response.status
            data['cors'] = response.headers.get('Access-Control-Allow-Origin')
            data['cache_control'] = response.headers.get('Cache-Control')
            if response.status != 200 or data['cors'] != '*':
                raise RuntimeError('Migrated font header contract failed')
    elif operation == 'canonical':
        data['root_route'] = run(['curl', '-sS', '--max-time', '20', '-o', '/dev/null',
                                  '-w', '%{http_code} %{redirect_url}', 'https://ultimamilla.com.ar/'])
        if data['root_route'] not in ('301 https://www.ultimamilla.com.ar/', '308 https://www.ultimamilla.com.ar/'):
            raise RuntimeError('Migrated canonical redirect contract failed')
    elif operation == 'logging':
        config = Path(state['config']) / 'conf.d/00-ultimamilla-llm-analytics.conf'
        data['logging_config_present'] = config.is_file()
        data['managed_by'] = 'hostinger-production.yml / publish-web.py'
        if not config.is_file():
            raise RuntimeError('Managed logging configuration is missing')
    else:
        data['public_vhosts'] = sorted(p.name for p in public.parent.glob('*.conf'))
        if any('.backup' in p or '.bak.' in p for p in data['public_vhosts']):
            raise RuntimeError('Unexpected backup in the live public include')
        run(['/usr/sbin/nginx', '-t', '-c', str(stage / 'sitrep-public-ingress/40607817805-1/nginx.conf')])
        data['nginx_config_test'] = 'passed'
    print(json.dumps(data, indent=2))


if __name__ == '__main__':
    main(sys.argv[1])
