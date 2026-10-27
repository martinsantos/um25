import importlib.util
import io
from pathlib import Path
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('snapshot', Path(__file__).with_name('sqlite-snapshot.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SQLiteSnapshotTests(unittest.TestCase):
    def test_restores_committed_wal_data_without_modifying_source(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source.db'
            with sqlite3.connect(path) as writer:
                writer.execute('PRAGMA journal_mode=WAL')
                writer.execute('CREATE TABLE item(id INTEGER PRIMARY KEY, label TEXT)')
                writer.execute('INSERT INTO item VALUES (1, ?)', ('última milla',))
                writer.commit()
                before = {p.name: p.read_bytes() for p in path.parent.glob('*') if not p.name.endswith('-shm')}
                output = io.StringIO()
                module.snapshot(path, output)
                with sqlite3.connect(':memory:') as restored:
                    restored.executescript(output.getvalue())
                    self.assertEqual(restored.execute('SELECT * FROM item').fetchall(), [(1, 'última milla')])
                after = {p.name: p.read_bytes() for p in path.parent.glob('*') if not p.name.endswith('-shm')}
                self.assertEqual(before, after)


if __name__ == '__main__':
    unittest.main()
