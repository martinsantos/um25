import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('refresh',Path(__file__).with_name('refresh-rehearsal-data.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RefreshGuards(unittest.TestCase):
    def test_mismatched_or_system_databases_are_not_replaced(self):
        for source,target in [(['sgi_production'],['other']),(['mysql'],['mysql']),(['postgres'],['postgres'])]:
            with self.assertRaises(RuntimeError):module.validate_inventory(source,target)
        module.validate_inventory(['sgi_production'],['sgi_production'])

    def test_untrusted_database_identifiers_are_rejected(self):
        for rows in ('name;id','name\nname','../mysql',''):
            with self.assertRaises(ValueError):module.names(rows)
        self.assertEqual(module.names('sgi_production\ndirectus\n'),['directus','sgi_production'])

    def test_only_the_empty_rpm_test_database_may_be_extra(self):
        module.maria_inventory(['sgi_production'],['sgi_production','test'],True)
        with self.assertRaises(RuntimeError):
            module.maria_inventory(['sgi_production'],['sgi_production','test'],False)
        with self.assertRaises(RuntimeError):
            module.maria_inventory(['sgi_production'],['other','sgi_production'],True)

    def test_cutover_blocks_refresh_even_with_a_completed_rehearsal(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/'.target').write_text('179.198.115.115\n')
            for marker in ('persist-rehearsal.complete','internal-rotation.complete'):(root/marker).touch()
            with patch.object(module,'STAGE',root),patch.object(module.socket,'gethostname',return_value='srv2101069.hstgr.cloud'):
                module.target_guard()
                (root/'production.active').touch()
                with self.assertRaisesRegex(RuntimeError,'after public cutover'):module.target_guard()

    def test_sitrep_cutover_also_blocks_the_bulk_refresh(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/'.target').write_text('179.198.115.115\n')
            for marker in ('persist-rehearsal.complete','internal-rotation.complete'):(root/marker).touch()
            with patch.object(module,'STAGE',root),patch.object(module.socket,'gethostname',return_value='srv2101069.hstgr.cloud'):
                for marker in ('sitrep-final-refresh.started','sitrep-ingress-source-only.started','sitrep-public-activation.started'):
                    with self.subTest(marker=marker):
                        (root/marker).touch()
                        with self.assertRaisesRegex(RuntimeError,'after public cutover'):module.target_guard()
                        (root/marker).unlink()

    def test_wrong_host_cannot_refresh_any_data(self):
        with patch.object(module.socket,'gethostname',return_value='production-origin'):
            with self.assertRaisesRegex(RuntimeError,'Wrong destination'):module.target_guard()
