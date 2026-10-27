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

    def test_non_web_upstreams_remain_unchanged(self):
        old='proxy_pass http://127.0.0.1:4321;\nproxy_pass http://127.0.0.1:18191;\nproxy_pass http://127.0.0.1:3000;\n'
        new=module.transform_config(old,module.INITIAL,Path('/srv/new/nginx'),Path('/srv/new/assets'),4322)
        self.assertIn('http://127.0.0.1:4322;',new)
        self.assertIn('http://127.0.0.1:18191;',new)
        self.assertIn('http://127.0.0.1:3000;',new)

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
