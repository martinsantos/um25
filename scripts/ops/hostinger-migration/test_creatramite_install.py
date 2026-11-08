"""Valida fronteras del instalador sin conectarse ni escribir en producción."""
import hashlib
import importlib.util
from pathlib import Path
import sqlite3
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('creatramite_install', Path(__file__).with_name('install-creatramite.py'))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class Archive:
    def __init__(self, entries): self.entries = entries
    def getmembers(self): return self.entries


def item(name, kind=tarfile.REGTYPE, size=0):
    member = tarfile.TarInfo(name)
    member.type = kind
    member.size = size
    return member


def complete():
    return [item(name) for name in ('app/app.py', 'app/wsgi_production.py', 'app/simulator.py',
            'app/schema.sql', 'app/scripts/crear_base_demo_publica.py',
            'app/seed/semilla-sintetica-v2.sqlite3', 'app/seed/semilla-sintetica-v2.sha256',
            'vendor/gunicorn/__init__.py')]


class InstallSafety(unittest.TestCase):
    def test_only_expected_archive_entries_and_bounded_sizes(self):
        installer.validate_archive(Archive(complete()))
        for extra in [item('../etc/passwd'), item('/etc/passwd'), item('otro/archivo'),
                      item('app/enlace', tarfile.SYMTYPE), item('app/excesivo', size=151*1024**2),
                      item('app/app.py')]:
            with self.subTest(name=extra.name), self.assertRaises(ValueError):
                installer.validate_archive(Archive(complete()+[extra]))
        with self.assertRaises(ValueError): installer.validate_archive(Archive(complete()[:-1]))

    def test_revision_run_and_digest_are_exactly_scoped(self):
        installer.validate_ids('a'*40, '123-2', 'b'*64)
        for args in [('a'*39, '123-2', 'b'*64), ('a'*40, '../1', 'b'*64),
                     ('a'*40, '123-2', 'x'*64)]:
            with self.assertRaises(ValueError): installer.validate_ids(*args)

    def test_units_bind_only_to_loopback_and_isolated_user(self):
        for name,port in [('web','18891'),('simulator','18894')]:
            unit=installer.render_unit(name,Path('/srv/creatramite/releases/test'))
            for required in ('User=creatramite', '--bind 127.0.0.1:'+port,
                             'ProtectSystem=strict', 'NoNewPrivileges=true',
                             'ReadWritePaths=/srv/creatramite/runtime'):
                self.assertIn(required,unit)
            self.assertNotIn('umsa-sitrep-ingress',unit)

    def test_inventory_detects_document_corruption(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'demo.sqlite3'
            with sqlite3.connect(path) as db:
                for table in ('forms','publications','cases'):
                    db.execute('CREATE TABLE '+table+' (id TEXT PRIMARY KEY)')
                db.execute('CREATE TABLE case_documents (id TEXT PRIMARY KEY, digest TEXT, content BLOB)')
                content=b'ficcion'
                db.execute('INSERT INTO case_documents VALUES (?,?,?)',
                           ('uno',hashlib.sha256(content).hexdigest(),content))
            counts, docs=installer.demo_inventory(path)
            self.assertEqual(counts['case_documents'],1)
            self.assertEqual(len(docs),1)
            with sqlite3.connect(path) as db: db.execute("UPDATE case_documents SET content=X'00'")
            with self.assertRaises(RuntimeError): installer.demo_inventory(path)


if __name__ == '__main__': unittest.main()
