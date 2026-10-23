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

    def test_generated_astro_and_vite_caches_are_reproducible(self):
        for name in ('.astro','.vite'):
            (self.path/name).mkdir()
            (self.path/name/'cache.json').write_text('{"generated":true}')
        os.utime(self.path,(time.time()-10*86400,)*2)
        self.assertEqual(self.select()['kind'],'volume')


class ReleaseFolderTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve() / 'releases'
        old = time.time() - 10 * 86400
        for i, name in enumerate(['r1-uploads-home', 'r2', 'r3', 'r4', 'r5']):
            (self.root / name).mkdir(parents=True)
            (self.root / name / 'index.js').write_text(name)
            os.utime(self.root / name, (old + i * 3600,) * 2)
        self.patches = [mock.patch.object(module, 'RELEASE_ROOTS', (self.root,)),
                        mock.patch.object(module, 'KEEP_NEWEST', 2),
                        mock.patch.object(module, 'has_mount', return_value=False)]
        for patch in self.patches:
            patch.start()

    def tearDown(self):
        for patch in self.patches:
            patch.stop()
        self.temp.cleanup()

    def old(self, refs=frozenset(), paths=frozenset()):
        with mock.patch.object(module, 'release_refs', return_value=set(refs)):
            ((_, keep, referenced, old),) = module.release_candidates(set(paths), set())
        return [p.name for p in keep], [p.name for p in referenced], sorted(p.name for p in old)

    def test_newest_releases_are_kept(self):
        keep, _, old = self.old()
        self.assertEqual(keep, ['r5', 'r4'])
        self.assertEqual(old, ['r1-uploads-home', 'r2', 'r3'])

    def test_release_holding_live_uploads_is_kept(self):
        _, referenced, old = self.old({self.root / 'r1-uploads-home' / 'uploads'})
        self.assertEqual(referenced, ['r1-uploads-home'])
        self.assertNotIn('r1-uploads-home', old)

    def test_release_used_by_a_process_is_kept(self):
        _, _, old = self.old(paths={self.root / 'r2' / 'index.js'})
        self.assertNotIn('r2', old)

    def test_recent_release_is_kept_even_beyond_newest(self):
        os.utime(self.root / 'r3', None)
        os.utime(self.root / 'r5', (time.time() - 9 * 86400,) * 2)
        _, _, old = self.old()
        self.assertNotIn('r3', old)

class DirectusUploadDuplicateTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.patches = [mock.patch.object(module, 'DIRECTUS_BACKUPS', self.root),
                        mock.patch.object(module, 'DIRECTUS_STATE', self.root / 'directus-uploads-content.state'),
                        mock.patch.object(module, 'has_mount', return_value=False)]
        for patch in self.patches:
            patch.start()

    def tearDown(self):
        for patch in self.patches:
            patch.stop()
        self.temp.cleanup()

    def archive(self, stamp, files):
        path = self.root / ('directus-uploads-%s.tar.gz' % stamp)
        with tarfile.open(path, 'w:gz') as tf:
            for name, data in files.items():
                info = tarfile.TarInfo('directus/uploads/' + name)
                info.size = len(data)
                tf.addfile(info, io.BytesIO(data))
        return path

    def plan(self):
        (self.root / 'directus-uploads-content.state').write_text(
            'fingerprint=x\narchive=directus-uploads-20261009-020001.tar.gz\n')
        return module.directus_duplicates(set(), set())

    def test_copy_differing_only_in_health_marker_is_retired(self):
        old = self.archive('20260711-221307', {'a.png': b'img', 'directus-health-file': b'old'})
        self.archive('20261009-020001', {'a.png': b'img', 'directus-health-file': b'new'})
        (self.root / 'directus-checkpoint-20260712-000725.txt').write_text('uploads=%s\n' % old.name)
        retained, targets = self.plan()
        self.assertEqual([t['path'] for t in targets], [str(old)])
        self.assertEqual(targets[0]['checkpoints'], ['directus-checkpoint-20260712-000725.txt'])
        self.assertTrue(retained['path'].endswith('20261009-020001.tar.gz'))

    def test_archive_with_an_image_the_newest_lacks_is_kept(self):
        self.archive('20260711-221307', {'a.png': b'img', 'deleted.png': b'only here'})
        self.archive('20261009-020001', {'a.png': b'img'})
        self.assertEqual(self.plan()[1], [])

    def test_same_name_different_bytes_is_kept(self):
        self.archive('20260711-221307', {'a.png': b'v1!'})
        self.archive('20261009-020001', {'a.png': b'v2!'})
        self.assertEqual(self.plan()[1], [])

    def test_newest_must_be_the_archive_the_state_names(self):
        self.archive('20261009-020001', {'a.png': b'img'})
        self.archive('20261020-020001', {'a.png': b'img'})
        with self.assertRaises(RuntimeError):
            self.plan()

if __name__ == '__main__':
    unittest.main()
