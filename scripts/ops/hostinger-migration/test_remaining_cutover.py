import importlib.util
from pathlib import Path
import tempfile
import unittest


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


source = load('remaining_source', 'remaining-source-cutover.py')
target = load('remaining_target', 'remaining-target-cutover.py')


class RemainingCutoverTests(unittest.TestCase):
    def test_read_lock_cannot_include_sgi_or_other_schemas(self):
        text = source.lock_sql([['vecinorabioso', 'wp_posts'], ['ultimami_wiki', 'page']])
        self.assertIn('`vecinorabioso`.`wp_posts` READ', text)
        self.assertIn('`ultimami_wiki`.`page` READ', text)
        for rows in ([], [['sgi_production', 'users']], [['vecinorabioso', 'bad`;sql']],
                     [['vecinorabioso', 'wp_posts'], ['vecinorabioso', 'wp_posts']]):
            with self.assertRaises(ValueError):
                source.lock_sql(rows)

    def test_only_the_reviewed_plan_link_is_permitted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'wiki').symlink_to('../wiki')
            self.assertEqual(target.manifest(root, 'plan-docs'), {'wiki': 'LINK:../wiki'})
            with self.assertRaises(RuntimeError):
                target.manifest(root, 'wordpress-uploads')
            (root / 'escape').symlink_to('/etc/passwd')
            with self.assertRaises(RuntimeError):
                target.manifest(root, 'plan-docs')

    def test_data_destinations_do_not_replace_verified_application_code(self):
        self.assertEqual(set(source.DATABASES), {'ultimami_wiki', 'ultimami_wiki_new', 'vecinorabioso'})
        for _, destination in target.PATHS.values():
            self.assertNotIn(destination.name, {'node_modules', '.next', 'admin', 'src', '.git'})


if __name__ == '__main__':
    unittest.main()
