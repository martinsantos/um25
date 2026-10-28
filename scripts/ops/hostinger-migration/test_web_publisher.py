import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('publish-web.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublisherGuards(unittest.TestCase):
    def archive(self, name, link=None):
        data = io.BytesIO()
        with tarfile.open(fileobj=data, mode='w') as archive:
            entry = tarfile.TarInfo(name)
            if link is not None:
                entry.type=tarfile.SYMTYPE; entry.linkname=link
            archive.addfile(entry)
        data.seek(0)
        return tarfile.open(fileobj=data)

    def test_release_rejects_escape_and_credentials(self):
        for name,link in [('../etc/passwd',None),('/etc/passwd',None),('.env',None),
                          ('node_modules/.bin/evil','../../../etc/passwd'),('dist/server','/etc')]:
            with self.subTest(name=name), self.archive(name,link) as archive:
                with self.assertRaises(ValueError): module.validate_archive(archive)

    def test_internal_dependency_links_are_permitted(self):
        with self.archive('node_modules/.bin/astro','../astro/astro.js') as archive:
            module.validate_archive(archive)

    def test_hardlinks_require_an_already_validated_regular_member(self):
        for target,valid in [('node_modules/@esbuild/linux-x64/bin/esbuild',True),('../etc/passwd',False),
                             ('/etc/passwd',False),('node_modules/missing',False)]:
            data=io.BytesIO()
            with tarfile.open(fileobj=data,mode='w') as archive:
                archive.addfile(tarfile.TarInfo('node_modules/@esbuild/linux-x64/bin/esbuild'))
                link=tarfile.TarInfo('node_modules/esbuild/bin/esbuild')
                link.type=tarfile.LNKTYPE;link.linkname=target
                archive.addfile(link)
            data.seek(0)
            with tarfile.open(fileobj=data) as archive:
                if valid:module.validate_archive(archive)
                else:
                    with self.assertRaises(ValueError):module.validate_archive(archive)

    def test_non_web_upstreams_remain_unchanged(self):
        old='proxy_pass http://127.0.0.1:4321;\nproxy_pass http://127.0.0.1:18191;\nproxy_pass http://127.0.0.1:3000;\n'
        new=module.transform_config(old,module.INITIAL,Path('/srv/new/nginx'),Path('/srv/new/assets'),4322)
        self.assertIn('http://127.0.0.1:4322;',new)
        self.assertIn('http://127.0.0.1:18191;',new)
        self.assertIn('http://127.0.0.1:3000;',new)

    def test_public_config_tracks_the_same_new_web_port_without_changing_dge(self):
        original = 'server {\n listen 127.0.0.1:443 ssl;\n listen [::1]:443 ssl;\n proxy_pass http://127.0.0.1:4321;\n proxy_pass http://127.0.0.1:18191;\n}\n'
        private = module.transform_config(original, module.INITIAL, Path('/srv/new/nginx'), Path('/srv/new/assets'), 4322)
        public = module.public_listeners(private)
        self.assertIn('listen 179.198.115.115:443 ssl;', public)
        self.assertNotIn('[::1]', public)
        self.assertIn('http://127.0.0.1:4322;', public)
        self.assertIn('http://127.0.0.1:18191;', public)
        with self.assertRaises(RuntimeError):
            module.public_listeners('server { listen 443 ssl; }')

    def test_state_cannot_redirect_publication_to_other_services(self):
        module.validate_previous(module.INITIAL)
        bad=dict(module.INITIAL, config='/etc/nginx')
        with self.assertRaises(ValueError):module.validate_previous(bad)

    def test_publishing_requires_real_cutover_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            stage=Path(directory)
            (stage / '.target').write_text('179.198.115.115\n')
            (stage / 'persist-rehearsal.complete').touch()
            with patch.object(module,'STAGE',stage), patch.object(module.socket,'gethostname',return_value='srv2101069.hstgr.cloud'):
                with self.assertRaisesRegex(RuntimeError,'completed migration cutover'):
                    module.main('publish','a'*40,'123','1','b'*64)
                (stage / 'production.active').touch()
                with self.assertRaisesRegex(RuntimeError,'pre-cutover only'):
                    module.main('rehearse','a'*40,'123','1','b'*64)
