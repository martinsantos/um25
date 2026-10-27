import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('clean_tools',Path(__file__).with_name('clean-tools-plan.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PlanCredentials(unittest.TestCase):
    def test_read_only_login_values_as_literal_data(self):
        self.assertEqual(module.plan_credentials('ADMIN_USER=owner\nADMIN_PASSWORD="literal$(no-command)"\nNODE_OPTIONS=bad'),
                         {'ADMIN_USER':'owner','ADMIN_PASSWORD':'literal$(no-command)'})

    def test_incomplete_or_duplicate_login_is_not_started(self):
        for text in ('ADMIN_USER=owner','ADMIN_USER=owner\nADMIN_PASSWORD=change-me',
                     'ADMIN_USER=owner\nADMIN_PASSWORD=secret\nADMIN_USER=another'):
            with self.assertRaises(RuntimeError):
                module.plan_credentials(text)


if __name__ == '__main__':
    unittest.main()
