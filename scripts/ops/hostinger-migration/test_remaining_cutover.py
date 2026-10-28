import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


source = load('remaining_source', 'remaining-source-cutover.py')
target = load('remaining_target', 'remaining-target-cutover.py')
public = load('remaining_public', 'public-vhost.py')


class RemainingCutoverTests(unittest.TestCase):
    def test_php_include_keeps_original_prefix_when_vhost_is_relocated(self):
        original = 'server {\n listen 127.0.0.1:80;\n location / {\n  include fastcgi_params;\n }\n}\n'
        rendered = public.public_listeners(original)
        self.assertIn('include /srv/umsa-clean-proxy/nginx/fastcgi_params;', rendered)
        self.assertIn('listen 179.198.115.115:80;', rendered)
        absolute = original.replace('include fastcgi_params;', 'include /etc/letsencrypt/options-ssl-nginx.conf;')
        self.assertIn('include /etc/letsencrypt/options-ssl-nginx.conf;', public.public_listeners(absolute))

    @unittest.skipUnless(os.environ.get('PHP_VHOST_NGINX_CI') == '1', 'requires disposable Nginx')
    def test_real_nginx_accepts_relocated_php_vhost_without_relative_helper(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'front').mkdir()
            (root / 'fastcgi_params').write_text('fastcgi_param QUERY_STRING $query_string;\n')
            original = 'server {\n listen 127.0.0.1:80;\n server_name wiki.example;\n location / {\n include fastcgi_params;\n fastcgi_pass 127.0.0.1:9000;\n }\n}\n'
            (root / 'front/nginx.conf').write_text('events {}\nhttp { include /workspace/front/vhost.conf; }\n')
            command = ['docker', 'run', '--rm', '--network', 'none', '--entrypoint', 'nginx',
                '-v', str(root) + ':/workspace:ro', '-v', str(root / 'fastcgi_params') +
                ':/srv/umsa-clean-proxy/nginx/fastcgi_params:ro', 'nginx:1.28-alpine',
                '-t', '-c', '/workspace/front/nginx.conf']
            (root / 'front/vhost.conf').write_text(original)
            broken = subprocess.run(command, capture_output=True)
            self.assertNotEqual(broken.returncode, 0)
            self.assertIn(b'fastcgi_params', broken.stderr)
            # The isolated CI container does not own the VPS public address.
            # Listener rendering is asserted separately; this test proves include resolution.
            rendered = public.public_listeners(original).replace('listen 179.198.115.115:80;', 'listen 127.0.0.1:80;')
            (root / 'front/vhost.conf').write_text(rendered)
            subprocess.run(command, check=True)

    def test_read_lock_cannot_include_sgi_or_other_schemas(self):
        text = source.lock_sql([['vecinorabioso', 'wp_posts'], ['ultimami_wiki', 'page']])
        self.assertIn('`vecinorabioso`.`wp_posts` READ', text)
        self.assertIn('`ultimami_wiki`.`page` READ', text)
        for rows in ([], [['sgi_production', 'users']], [['vecinorabioso', 'bad`;sql']],
                     [['vecinorabioso', 'wp_posts'], ['vecinorabioso', 'wp_posts']]):
            with self.assertRaises(ValueError):
                source.lock_sql(rows)

    def test_only_the_reviewed_plan_link_is_permitted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'wiki').symlink_to('../wiki')
            self.assertEqual(target.manifest(root, 'plan-docs'), {'wiki': 'LINK:../wiki'})
            with self.assertRaises(RuntimeError):
                target.manifest(root, 'wordpress-uploads')
            (root / 'escape').symlink_to('/etc/passwd')
            with self.assertRaises(RuntimeError):
                target.manifest(root, 'plan-docs')

    def test_data_destinations_do_not_replace_verified_application_code(self):
        self.assertEqual(set(source.DATABASES), {'ultimami_wiki', 'ultimami_wiki_new', 'vecinorabioso'})
        for _, destination in target.PATHS.values():
            self.assertNotIn(destination.name, {'node_modules', '.next', 'admin', 'src', '.git'})


if __name__ == '__main__':
    unittest.main()
