#!/usr/bin/env python3
"""Serve clean WordPress and MediaWiki on destination-only rehearsal ports."""
import os
from pathlib import Path
import pwd
import re
import socket
import subprocess

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/srv/umsa-clean-php')


def wiki_configuration(text):
    # The original local config accidentally printed its last settings as text.
    if text.count('?>') != 1 or not text.startswith('<?php'):
        raise ValueError('Unexpected wiki configuration structure')
    return text.replace('?>', '') + '\n$wgEnableEmail = false;\n$wgEnableUserEmail = false;\n'


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong destination')
    if not (STAGE / 'internal-rotation.complete').is_file() or Path('/etc/ld.so.preload').exists():
        raise RuntimeError('Missing security prerequisites')
    if ROOT.exists():
        raise RuntimeError('PHP rehearsal already prepared; inspect before retry')
    cms = Path((STAGE / 'trusted-cms').read_text().strip())
    if cms.parent != STAGE / 'trusted' or cms.is_symlink():
        raise RuntimeError('Untrusted CMS pointer')
    secure = STAGE / 'internal-credentials'
    wp = (secure / 'wp-config.php').read_text()
    if "$table_prefix = 'wp_';" not in wp or wp.count('require_once ABSPATH') != 1:
        raise RuntimeError('Unexpected WordPress configuration')
    admins = subprocess.check_output(['mariadb','--no-defaults','-uroot','vecinorabioso','-N','-e',
        "SELECT u.user_login FROM wp_users u JOIN wp_usermeta m ON u.ID=m.user_id WHERE m.meta_key='wp_capabilities' AND m.meta_value LIKE '%administrator%';"], text=True).splitlines()
    if set(admins) != {'santosma','marisita'}:
        raise RuntimeError('Existing custom guard would affect unexpected administrator accounts')
    wp = wp.replace('<?php', "<?php\ndefine('DISABLE_WP_CRON', true);", 1)
    wiki = wiki_configuration((secure / 'LocalSettings.php').read_text())
    for port in (9088,9089):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1',port))
    nginx_user = pwd.getpwnam('nginx')
    with (STAGE / 'receipts/clean-php-rehearsal.log').open('ab') as log:
        def run(args):
            subprocess.run(args,check=True,stdout=log,stderr=log)
        ROOT.mkdir(mode=0o755)
        ROOT.chmod(0o755)
        for name in ('wordpress','wiki'):
            run(['cp','-a','--reflink=always',str(cms / 'application' / name),str(ROOT / name)])
        for source,dest in [('/home/vecinorabioso.com.ar/public_html/wp-content/uploads','wordpress/wp-content/uploads'),
                            ('/home/wiki.ultimamilla.com.ar/images','wiki/images')]:
            target = ROOT / dest
            if target.exists():
                # Official MediaWiki supplies an empty images directory and index.html.
                if dest != 'wiki/images' or any(x.name not in ('index.html','.htaccess','README') for x in target.iterdir()):
                    raise RuntimeError('Unexpected media destination overlap')
                run(['cp','-a','--reflink=always',source + '/.',str(target)])
            else:
                run(['cp','-a','--reflink=always',source,str(target)])
        for item in ROOT.rglob('*'):
            if item.is_symlink():
                raise RuntimeError('Unexpected PHP application symlink')
            writable = item.is_relative_to(ROOT / 'wordpress/wp-content/uploads') or item.is_relative_to(ROOT / 'wiki/images')
            os.chown(item,nginx_user.pw_uid if writable else 0,nginx_user.pw_gid)
            item.chmod(0o755 if item.is_dir() else 0o644)
        for name,text in [('wordpress/wp-config.php',wp),('wiki/LocalSettings.php',wiki)]:
            path = ROOT / name
            path.write_text(text)
            os.chown(path,0,nginx_user.pw_gid)
            path.chmod(0o640)
        php_ini = Path('/etc/php.ini')
        old = 'extension=/usr/local/lsws/lsphp82/lib64/php/modules/intl.so'
        text = php_ini.read_text()
        if text.count(old) != 1:
            raise RuntimeError('Unexpected legacy PHP extension configuration')
        # Fresh RPM intl is already enabled in /etc/php.d/20-intl.ini.
        php_ini.write_text(text.replace(old,'; Legacy LSWS intl disabled; use the installed RPM extension.'))
        for service, directory in [('php-fpm','/etc/php.d'),('php74-php-fpm','/etc/opt/remi/php74/php.d')]:
            dropin = Path('/etc/systemd/system') / (service + '.service.d')
            dropin.mkdir(parents=True,exist_ok=True)
            (dropin / 'umsa-rehearsal.conf').write_text('[Service]\nIPAddressDeny=any\nIPAddressAllow=localhost\n')
            (Path(directory) / '99-umsa-rehearsal.ini').write_text('sendmail_path=/bin/false\nauto_prepend_file=\nauto_append_file=\n')
        nginx = 'user nginx;\npid /run/nginx-umsa-php-rehearsal.pid;\nerror_log /var/log/nginx/umsa-php-rehearsal-error.log;\nevents {}\nhttp {\ninclude /etc/nginx/mime.types;\n'
        for name, domain, port, upstream in [('wordpress','vecinorabioso.com.ar',9088,'127.0.0.1:9000'),
                ('wiki','wiki.ultimamilla.com.ar',9089,'unix:/var/opt/remi/php74/run/php-fpm/www.sock')]:
            root = str(ROOT / name)
            nginx += f'server {{ listen 127.0.0.1:{port}; server_name {domain}; root {root}; index index.php;\n'
            nginx += 'location ~ /\\. { deny all; }\nlocation ~* ^/(wp-content/uploads|images)/.*\\.php(?:/|$) { deny all; }\n'
            if name == 'wiki':
                nginx += 'location /wiki/ { rewrite ^/wiki/(.*)$ /index.php?title=$1 last; }\n'
            nginx += 'location / { try_files $uri $uri/ /index.php?$query_string; }\n'
            nginx += 'location ~ \\.php$ { try_files $uri =404; include /etc/nginx/fastcgi_params;\n'
            nginx += f'fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; fastcgi_param HTTPS on; fastcgi_pass {upstream}; }}\n}}\n'
        nginx += '}\n'
        config = ROOT / 'nginx-rehearsal.conf'
        config.write_text(nginx)
        run(['/usr/sbin/nginx','-t','-c',str(config)])
        run(['php-fpm','-t'])
        run(['/opt/remi/php74/root/usr/sbin/php-fpm','-t'])
        run(['systemctl','daemon-reload'])
        run(['systemctl','start','php-fpm','php74-php-fpm'])
        run(['systemd-run','--unit=umsa-clean-php-nginx','--property=IPAddressDeny=any',
            '--property=IPAddressAllow=localhost','/usr/sbin/nginx','-c',str(config),'-g','daemon off;'])
    (STAGE / 'clean-php-rehearsal.ready').write_text('Local HTTP rehearsal ports 9088 and 9089.\n')
    print('Clean WordPress and MediaWiki started for local rehearsal; external egress, email and WP cron disabled.')


if __name__ == '__main__':
    main()
