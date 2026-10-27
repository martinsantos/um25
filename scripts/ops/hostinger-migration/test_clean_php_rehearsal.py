import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('clean_php', Path(__file__).with_name('clean-php-rehearsal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CleanPHPGuards(unittest.TestCase):
    def test_wiki_settings_remain_inside_php_and_mail_is_disabled(self):
        text = module.wiki_configuration('<?php\n$wgServer="https://wiki.example";\n?>\n$wgMaxImageArea=100;')
        self.assertNotIn('?>',text)
        self.assertIn('$wgMaxImageArea=100;',text)
        self.assertTrue(text.endswith('$wgEnableUserEmail = false;\n'))

    def test_unexpected_wiki_structure_is_not_guessed(self):
        for text in ('<?php no closing marker', '<?php ?> ?>'):
            with self.assertRaises(ValueError):
                module.wiki_configuration(text)


if __name__ == '__main__':
    unittest.main()
