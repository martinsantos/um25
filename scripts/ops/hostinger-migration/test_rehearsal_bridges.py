import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('bridges', Path(__file__).with_name('rehearsal-bridges.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BridgeGuards(unittest.TestCase):
    def test_only_expected_running_container_and_internal_address(self):
        row = {'Name':'/dge-demo-web','State':{'Running':True},'NetworkSettings':{'Networks':{'umsa-clean-dge':{'IPAddress':'172.18.0.3'}}}}
        self.assertEqual(module.destination('dge-demo-web','umsa-clean-dge',row),'172.18.0.3')
        row['NetworkSettings']['Networks']['umsa-clean-dge']['IPAddress'] = '1.1.1.1'
        with self.assertRaises(RuntimeError):
            module.destination('dge-demo-web','umsa-clean-dge',row)
        row['State']['Running'] = False
        with self.assertRaises(RuntimeError):
            module.destination('dge-demo-web','umsa-clean-dge',row)


if __name__ == '__main__':
    unittest.main()
