import importlib.util
from pathlib import Path
import tarfile
import unittest

spec = importlib.util.spec_from_file_location('clean_sitrep', Path(__file__).with_name('clean-sitrep.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReleaseArchiveGuards(unittest.TestCase):
    def test_regular_release_files(self):
        member = tarfile.TarInfo('./dist/index.js')
        member.size = 100
        module.validate_members([member])

    def test_rejects_escaping_and_special_members(self):
        for name, kind in [('../outside', tarfile.REGTYPE), ('/etc/test', tarfile.REGTYPE),
                           ('link', tarfile.SYMTYPE), ('hardlink', tarfile.LNKTYPE),
                           ('device', tarfile.CHRTYPE)]:
            member = tarfile.TarInfo(name)
            member.type = kind
            with self.assertRaises(ValueError):
                module.validate_members([member])

    def test_rejects_duplicate_paths_and_oversized_archives(self):
        member = tarfile.TarInfo('./dist/index.js')
        with self.assertRaises(ValueError):
            module.validate_members([member, member])
        member.size = 2 * 1024 * 1024 * 1024
        with self.assertRaises(ValueError):
            module.validate_members([member])
