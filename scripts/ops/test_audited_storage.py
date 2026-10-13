import hashlib
import importlib.util
import io
import json
import os
import tarfile
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location('storage', Path(__file__).with_name('clean-audited-storage.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DuplicateArchiveTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.folder = self.root / 'qa'
        (self.folder / 'expanded').mkdir(parents=True)
        self.data = b'reproducible public test bundle' * 5000
        (self.folder / 'expanded/test.js').write_bytes(self.data)
        self.archive = self.folder / 'candidate.tar.gz'
        with tarfile.open(self.archive,'w:gz') as tf:
            info = tarfile.TarInfo('dist/test.js')
            info.size = len(self.data)
            tf.addfile(info,io.BytesIO(self.data))
        os.utime(self.archive,(time.time()-4*86400,)*2)

    def tearDown(self):
        self.temp.cleanup()

    def select(self,refs=None):
        with mock.patch.object(module,'has_mount',return_value=False):
            return module.archive_target(self.archive,self.folder,refs or set(),set())

    def test_archive_requires_an_identical_retained_copy_for_every_member(self):
        selected = self.select()
        self.assertEqual(selected['kind'],'archive')
        self.assertEqual(selected['proof'][0]['sha256'],hashlib.sha256(self.data).hexdigest())
        self.assertEqual(Path(selected['proof'][0]['retained']).read_bytes(),self.data)

    def test_unique_payload_prevents_selection(self):
        (self.folder / 'expanded/test.js').write_bytes(b'new unique version')
        self.assertIsNone(self.select())

    def test_a_process_using_the_qa_folder_prevents_selection(self):
        self.assertIsNone(self.select({self.folder/'server.log'}))

    def test_recent_archive_is_preserved(self):
        os.utime(self.archive,None)
        self.assertIsNone(self.select())

    def test_unsafe_or_link_member_is_preserved(self):
        with tarfile.open(self.archive,'w:gz') as tf:
            info = tarfile.TarInfo('../test.js')
            info.size = len(self.data)
            tf.addfile(info,io.BytesIO(self.data))
        os.utime(self.archive,(time.time()-4*86400,)*2)
        self.assertIsNone(self.select())

    def test_other_archives_cannot_be_the_only_retained_payload(self):
        nested = self.folder / 'payload.tar.gz'
        nested.write_bytes(self.data)
        with tarfile.open(self.archive,'w:gz') as tf:
            info = tarfile.TarInfo('payload.tar.gz')
            info.size = len(self.data)
            tf.addfile(info,io.BytesIO(self.data))
        os.utime(self.archive,(time.time()-4*86400,)*2)
        self.assertIsNone(self.select())

    def test_a_changed_retained_copy_changes_the_plan_fingerprint(self):
        target = self.select()
        first=module.fingerprint({'operation':'temporary-archives','targets':[target]})
        path=Path(target['proof'][0]['retained'])
        os.utime(path,(time.time()-3600,)*2)
        after=self.select()
        self.assertNotEqual(first,module.fingerprint({'operation':'temporary-archives','targets':[after]}))

    def test_a_changed_plan_aborts_before_retirement(self):
        plan={'operation':'temporary-archives','targets':[self.select()]}
        with mock.patch.object(module,'make_plan',return_value={'operation':'temporary-archives','targets':[]}):
            with mock.patch.object(module,'fresh_backup') as backup:
                with self.assertRaises(RuntimeError):
                    module.apply(plan,module.fingerprint(plan),module.fingerprint(plan))
                backup.assert_not_called()
        self.assertTrue(self.archive.exists())

class DependencyVolumeTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name).resolve()
        self.name='astro_node_modules'
        self.path=self.root/self.name/'_data'
        (self.path/'example').mkdir(parents=True)
        (self.path/'example/index.js').write_text('module.exports = 1;')
        (self.path/'.package-lock.json').write_text(json.dumps({'packages':{'node_modules/example':{'version':'1.0.0'}}}))
        os.utime(self.path,(time.time()-10*86400,)*2)

    def tearDown(self):
        self.temp.cleanup()

    def select(self,paths=None,mounts=None):
        def output(args,**kwargs):
            if args[:3]==['docker','volume','inspect']:
                return json.dumps([{'Driver':'local','Mountpoint':str(self.path)}])
            if args[:2]==['du','-sk']:
                return '128\t'+str(self.path)
            raise AssertionError(args)
        with mock.patch.object(module,'VOLUME_ROOT',self.root),mock.patch.object(module,'has_mount',return_value=False),mock.patch.object(module.subprocess,'check_output',side_effect=output):
            return module.volume_target(self.name,paths or set(),mounts or set())

    def test_an_inactive_volume_requires_a_complete_dependency_lock(self):
        selected=self.select()
        self.assertEqual(selected['name'],self.name)
        self.assertEqual(selected['lock_sha256'],module.sha(self.path/'.package-lock.json'))

    def test_a_referenced_or_mounted_volume_is_never_selected(self):
        self.assertIsNone(self.select(paths={self.path/'example/index.js'}))
        self.assertIsNone(self.select(mounts={self.path}))

    def test_unique_root_content_cannot_be_removed_as_dependencies(self):
        (self.path/'customer-data.csv').write_text('keep unrelated content')
        os.utime(self.path,(time.time()-10*86400,)*2)
        with self.assertRaises(RuntimeError):
            self.select()

    def test_dependency_changes_change_the_plan_hash(self):
        first=self.select()
        (self.path/'example/index.js').write_text('user changed dependency')
        second=self.select()
        self.assertNotEqual(first['tree_sha256'],second['tree_sha256'])

    def test_empty_optional_package_scopes_have_no_unique_payload(self):
        (self.path/'@optional').mkdir()
        os.utime(self.path,(time.time()-10*86400,)*2)
        self.assertEqual(self.select()['kind'],'volume')

if __name__ == '__main__':
    unittest.main()
