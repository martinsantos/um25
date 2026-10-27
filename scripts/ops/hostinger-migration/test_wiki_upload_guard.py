import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('guard-wiki-uploads.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class WikiGuard(unittest.TestCase):
    def test_guard_precedes_php_handler(self):
        original = 'server {\n' + module.NEEDLE + '\n }\n}\n'
        result = module.guarded(original)
        self.assertLess(result.index(module.GUARD), result.index(module.NEEDLE))
        self.assertEqual(result.replace(module.GUARD, ''), original)

    def test_rejects_unexpected_config(self):
        for text in ('server {}', module.NEEDLE + '\n' + module.NEEDLE, module.GUARD + module.NEEDLE):
            with self.assertRaises(ValueError):
                module.guarded(text)


if __name__ == '__main__':
    unittest.main()
