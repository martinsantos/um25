#!/usr/bin/env python3
"""Offline scope/archive tests and opt-in localhost Directus 11.13.4 test."""

import copy
import gzip
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tarfile
import unittest
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from unittest.mock import patch


REPO = Path(__file__).resolve().parents[3]
SCRIPT = Path(__file__).with_name('recover-directus-service-assets.py')
SPEC = importlib.util.spec_from_file_location('recover_directus_service_assets', SCRIPT)
RECOVERY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RECOVERY)


def fixture_payload():
    return {
        asset['path']: (REPO / asset['path']).read_bytes()
        for asset in RECOVERY.ASSETS
    }


def archive_bytes(payload, *, extra=None, first_as_symlink=False):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode='w:gz') as archive:
        for index, asset in enumerate(RECOVERY.ASSETS):
            info = tarfile.TarInfo(asset['path'])
            if first_as_symlink and index == 0:
                info.type = tarfile.SYMTYPE
                info.linkname = 'somewhere-else.png'
                archive.addfile(info)
            else:
                blob = payload[asset['path']]
                info.size = len(blob)
                archive.addfile(info, io.BytesIO(blob))
        if extra:
            info = tarfile.TarInfo(extra)
            info.size = 1
            archive.addfile(info, io.BytesIO(b'x'))
    return output.getvalue()


class MemoryAPI:
    """Small in-memory API double for failure-path tests; it never uses a socket."""

    def __init__(self, rows):
        self.rows = {row['id']: copy.deepcopy(row) for row in rows}
        self.writes = []
        self.candidate_files = {}

    def json(self, path, method='GET', value=None):
        file_id = path.removeprefix('/files/')
        if method == 'PATCH':
            self.writes.append((method, path, copy.deepcopy(value)))
            self.rows[file_id].update(copy.deepcopy(value))
        return copy.deepcopy(self.rows[file_id])

    def request(self, path, method='GET', data=None, content_type=None, public=False):
        self.writes.append((method, path, content_type))
        if method == 'PATCH' and content_type and content_type.startswith('multipart/form-data;'):
            file_id = path.removeprefix('/files/')
            self.candidate_files[file_id] = True  # marker that upload data was accepted
        return 200, {}, b''


class TestDirectusServiceAssetGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = fixture_payload()
        cls.rows = [
            {
                'id': asset['id'],
                'storage': 'local',
                'filename_disk': asset['filenameDisk'],
                'filename_download': asset['filenameDownload'],
                'title': f"Service {asset['service']}",
                'type': 'image/jpeg',
                'filesize': asset['bytes'],
                'width': asset['width'],
                'height': asset['height'],
                'folder': None,
                'description': None,
                'location': None,
                'tags': [],
                'focal_point_x': None,
                'focal_point_y': None,
                'uploaded_by': None,
                'created_on': '2026-11-01T00:00:00.000Z',
                'uploaded_on': '2026-11-01T00:00:00.000Z',
                'metadata': {},
            }
            for asset in RECOVERY.ASSETS
        ]

    def test_candidate_hash_and_png_header_are_pinned(self):
        for asset in RECOVERY.ASSETS:
            with self.subTest(service=asset['service']):
                RECOVERY.validate_bytes(asset, self.payload[asset['path']])

        first = RECOVERY.ASSETS[0]
        corrupted = bytearray(self.payload[first['path']])
        corrupted[-1] ^= 1
        with self.assertRaisesRegex(RuntimeError, 'Candidate bytes changed'):
            RECOVERY.validate_bytes(first, bytes(corrupted))

    def test_payload_archive_requires_exact_eight_regular_files(self):
        payload = RECOVERY.payload_from_tar(archive_bytes(self.payload))
        self.assertEqual(set(payload), {asset['path'] for asset in RECOVERY.ASSETS})

        with self.assertRaisesRegex(RuntimeError, 'only the eight reviewed PNGs'):
            RECOVERY.payload_from_tar(archive_bytes(self.payload, extra='unexpected.txt'))
        with self.assertRaisesRegex(RuntimeError, 'link or unexpected file'):
            RECOVERY.payload_from_tar(archive_bytes(self.payload, first_as_symlink=True))

        malformed = b'not a gzip-compressed tar archive'
        with self.assertRaises((tarfile.ReadError, EOFError, OSError, ValueError, gzip.BadGzipFile)):
            RECOVERY.payload_from_tar(malformed)

    def test_api_rejects_remote_origin_and_writes_outside_eight_files(self):
        with self.assertRaisesRegex(RuntimeError, 'loopback Directus API'):
            RECOVERY.API('test-token', 'https://admin.ultimamilla.com.ar')

        api = RECOVERY.API('test-token', 'http://127.0.0.1:18055')
        first_id = RECOVERY.ASSETS[0]['id']
        for path, public in [
            ('/files/not-reviewed', False),
            ('/items/Servicios/101', False),
            ('/files/' + first_id, True),
        ]:
            with self.subTest(path=path, public=public):
                with self.assertRaisesRegex(RuntimeError, 'outside the eight reviewed file IDs'):
                    api.request(path, 'PATCH', data=b'fixture', public=public)

    def test_metadata_drift_aborts_before_any_write(self):
        snapshot = {'files': copy.deepcopy(self.rows), 'references': []}
        api = MemoryAPI(self.rows)
        changed_id = RECOVERY.ASSETS[0]['id']
        original_json = api.json

        def changed_once(path, method='GET', value=None):
            row = original_json(path, method, value)
            if method == 'GET' and path == '/files/' + changed_id:
                row['title'] = 'changed after inspection'
            return row

        api.json = changed_once
        reports = []
        with self.assertRaisesRegex(RuntimeError, 'Recovery stopped'):
            RECOVERY.recover(api, snapshot, self.payload, reports.append, public=False)
        self.assertEqual(api.writes, [])
        self.assertEqual(reports[-1]['state'], 'failed')
        self.assertEqual(reports[-1]['restored_metadata_for'], 0)

    def test_rollback_failure_is_reported_and_candidate_is_retained(self):
        snapshot = {'files': copy.deepcopy(self.rows), 'references': []}
        api = MemoryAPI(self.rows)
        asset = RECOVERY.ASSETS[0]
        reports = []
        with patch.object(RECOVERY, 'verify_asset', side_effect=RuntimeError('simulated verification failure')):
            with patch.object(RECOVERY, 'restore_metadata', side_effect=RuntimeError('simulated rollback failure')):
                with self.assertRaisesRegex(RuntimeError, 'Failures: 1'):
                    RECOVERY.recover(api, snapshot, self.payload, reports.append, public=False)

        self.assertEqual(reports[-1]['metadata_rollback_failures'], [asset['id']])
        self.assertEqual(reports[-1]['restored_metadata_for'], 0)
        self.assertEqual([path for method, path, *_ in api.writes if method != 'GET'], ['/files/' + asset['id']])
        self.assertEqual(self.payload[asset['path']][:8], b'\x89PNG\r\n\x1a\n')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise AssertionError('Local fixture redirected the request')


def fixture_request(base, path, *, method='GET', payload=None, token=None):
    parsed = urlsplit(base)
    if parsed.scheme != 'http' or parsed.hostname != '127.0.0.1' or not parsed.port:
        raise AssertionError('Directus integration requests are restricted to 127.0.0.1')
    if not path.startswith('/') or '..' in path.split('/'):
        raise AssertionError('Fixture request path is not allowed')
    headers = {'Accept': 'application/json'}
    body = None
    if payload is not None:
        body = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = Request(base + path, data=body, headers=headers, method=method)
    opener = build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=20) as response:
            raw = response.read()
            status = response.status
    except HTTPError as error:
        raw = error.read()
        status = error.code
    value = None
    if raw:
        try:
            value = json.loads(raw)
        except (UnicodeDecodeError, json.JSONDecodeError):
            value = raw
    return status, value


class AuditedAPI(RECOVERY.API):
    def __init__(self, token, base):
        super().__init__(token, base)
        self.mutations = []

    def request(self, path, method='GET', data=None, content_type=None, public=False):
        if method != 'GET':
            self.mutations.append((method, path, public))
        return super().request(path, method, data, content_type, public)


@unittest.skipUnless(os.environ.get('DIRECTUS_RECOVERY_TEST_URL'), 'set DIRECTUS_RECOVERY_TEST_URL to opt into disposable Directus integration')
class TestDirectusServiceAssetIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.base = os.environ['DIRECTUS_RECOVERY_TEST_URL'].rstrip('/')
        parsed = urlsplit(cls.base)
        if (parsed.scheme != 'http' or parsed.hostname != '127.0.0.1' or not parsed.port
                or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment):
            raise AssertionError('DIRECTUS_RECOVERY_TEST_URL must be bare http://127.0.0.1:<port>')

        run_temp = Path(os.environ.get('RUNNER_TEMP', '/tmp')).resolve(strict=True)
        upload_value = os.environ.get('DIRECTUS_RECOVERY_TEST_UPLOADS')
        if not upload_value:
            raise AssertionError('DIRECTUS_RECOVERY_TEST_UPLOADS must point at the disposable Directus upload bind mount')
        cls.uploads = Path(upload_value).resolve(strict=True)
        try:
            cls.uploads.relative_to(run_temp)
        except ValueError as error:
            raise AssertionError('test uploads must live under RUNNER_TEMP') from error
        if cls.uploads.is_symlink() or not cls.uploads.is_dir():
            raise AssertionError('test uploads must be an existing regular directory')

        email = os.environ.get('DIRECTUS_RECOVERY_TEST_EMAIL', 'recovery@example.test')
        password = os.environ.get('DIRECTUS_RECOVERY_TEST_PASSWORD', 'Test-recovery-20261101!')
        status, login = fixture_request(cls.base, '/auth/login', method='POST',
                                        payload={'email': email, 'password': password})
        if status != 200 or not isinstance(login, dict) or not login.get('data', {}).get('access_token'):
            raise AssertionError('Could not authenticate to the disposable Directus fixture')
        cls.token = login['data']['access_token']
        cls.api = AuditedAPI(cls.token, cls.base)

        # The workflow verifies /directus/package.json in the disposable container.
        cls._seed_fixture()

    @classmethod
    def _seed_fixture(cls):
        status, collections = fixture_request(cls.base, '/collections', token=cls.token)
        if status != 200 or not isinstance(collections, dict):
            raise AssertionError('Could not list collections in the disposable Directus fixture')
        existing_collections = {row.get('collection') for row in collections.get('data', [])}
        if 'Servicios' in existing_collections:
            raise AssertionError('Refusing to modify a fixture where Servicios already exists')

        status, _ = fixture_request(cls.base, '/collections', method='POST', token=cls.token,
                                    payload={'collection': 'Servicios',
                                             'meta': {'hidden': True, 'note': 'Temporary image recovery test fixture'},
                                             'schema': {'name': 'Servicios'},
                                             'fields': [{'field': 'id', 'type': 'integer',
                                                         'schema': {'is_primary_key': True, 'has_auto_increment': True}}]})
        if status not in (200, 201):
            raise AssertionError('Could not create temporary Servicios collection')

        status, fields = fixture_request(cls.base, '/fields/Servicios', token=cls.token)
        if status != 200 or not isinstance(fields, dict):
            raise AssertionError('Could not inspect temporary Servicios fields')
        existing = {field['field']: field for field in fields.get('data', [])}
        id_field = existing.get('id')
        if id_field is None:
            status, _ = fixture_request(
                cls.base, '/fields/Servicios', method='POST', token=cls.token,
                payload={'field': 'id', 'type': 'integer',
                         'schema': {'is_primary_key': True, 'has_auto_increment': True}},
            )
            if status not in (200, 201):
                raise AssertionError('Could not create temporary integer primary key')
            status, fields = fixture_request(cls.base, '/fields/Servicios', token=cls.token)
            if status != 200 or not isinstance(fields, dict):
                raise AssertionError('Could not verify temporary Servicios fields')
            existing = {field['field']: field for field in fields.get('data', [])}
            id_field = existing.get('id')
        if (not id_field or id_field.get('type') != 'integer'
                or not id_field.get('schema', {}).get('is_primary_key')
                or not id_field.get('schema', {}).get('has_auto_increment')):
            raise AssertionError('Directus collection default primary key must be integer id')
        if 'Imagen' in existing:
            raise AssertionError('Temporary Servicios unexpectedly has Imagen already')
        status, _ = fixture_request(cls.base, '/fields/Servicios', method='POST', token=cls.token,
                                    payload={'field': 'Imagen', 'type': 'string',
                                             'meta': {'interface': 'input', 'hidden': False}})
        if status not in (200, 201):
            raise AssertionError('Could not create temporary Imagen string field')

        for asset in RECOVERY.ASSETS:
            old_disk = cls.uploads / asset['filenameDisk']
            new_disk = cls.uploads / (asset['id'] + '.png')
            if old_disk.exists() or old_disk.is_symlink() or new_disk.exists() or new_disk.is_symlink():
                raise AssertionError('Disposable Directus uploads directory must start empty for reviewed IDs')

        for asset in RECOVERY.ASSETS:
            status, _ = fixture_request(cls.base, '/items/Servicios', method='POST', token=cls.token,
                                        payload={'id': asset['service'], 'Imagen': asset['id']})
            if status not in (200, 201):
                raise AssertionError('Could not seed temporary service row')
            status, _ = fixture_request(cls.base, '/files', method='POST', token=cls.token,
                                        payload={'id': asset['id'], 'storage': 'local',
                                                 'filename_disk': asset['filenameDisk'],
                                                 'filename_download': asset['filenameDownload'],
                                                 'title': 'Service ' + str(asset['service']),
                                                 'type': 'image/jpeg', 'filesize': asset['bytes'],
                                                 'width': asset['width'], 'height': asset['height'],
                                                 'tags': None})
            if status not in (200, 201):
                raise AssertionError('Could not seed missing-file metadata row')

        cls.snapshot = {
            'files': [cls.api.json('/files/' + asset['id']) for asset in RECOVERY.ASSETS],
            'references': RECOVERY.references(cls.api),
        }
        for asset in RECOVERY.ASSETS:
            if cls.api.request('/assets/' + asset['id'])[0] not in (403, 404):
                raise AssertionError('Fixture asset should be missing before recovery')

    def test_local_patch_recovery_and_metadata_rollback(self):
        payload = fixture_payload()
        first = RECOVERY.ASSETS[0]

        # Simulate a metadata change after inspection; it must abort before PATCH.
        drift_api = AuditedAPI(self.token, self.base)
        real_json = drift_api.json
        drifted = False

        def return_drift_once(path, method='GET', value=None):
            nonlocal drifted
            row = real_json(path, method, value)
            if not drifted and method == 'GET' and path == '/files/' + first['id']:
                row['title'] = 'drift after snapshot'
                drifted = True
            return row

        drift_api.json = return_drift_once
        drift_reports = []
        with self.assertRaisesRegex(RuntimeError, 'Recovery stopped'):
            RECOVERY.recover(drift_api, self.snapshot, payload, drift_reports.append, public=False)
        self.assertTrue(drifted)
        self.assertEqual(drift_api.mutations, [])
        self.assertEqual(drift_reports[-1]['restored_metadata_for'], 0)

        # Fail the first post-upload verification. Metadata must roll back exactly;
        # the local PNG remains in storage for inspection/retry.
        self.api.mutations.clear()
        failure_reports = []
        with patch.object(RECOVERY, 'verify_asset', side_effect=RuntimeError('simulated verification failure')):
            with self.assertRaisesRegex(RuntimeError, 'Failures: 0'):
                RECOVERY.recover(self.api, self.snapshot, payload, failure_reports.append, public=False)
        self.assertEqual(failure_reports[-1]['metadata_rollback_failures'], [])
        restored = self.api.json('/files/' + first['id'])
        original = self.snapshot['files'][0]
        for key in (*RECOVERY.RESTORE_FIELDS, *RECOVERY.PRESERVE_FIELDS):
            self.assertEqual(restored.get(key), original.get(key), f'rollback field {key}')
        retained = self.uploads / (first['id'] + '.png')
        self.assertTrue(retained.is_file())
        self.assertEqual(hashlib.sha256(retained.read_bytes()).hexdigest(), first['sha256'])

        # A failed metadata rollback must be reported; it must not delete the PNG.
        fake = MemoryAPI(self.snapshot['files'])
        failed_reports = []
        with patch.object(RECOVERY, 'verify_asset', side_effect=RuntimeError('simulated verification failure')):
            with patch.object(RECOVERY, 'restore_metadata', side_effect=RuntimeError('simulated rollback failure')):
                with self.assertRaisesRegex(RuntimeError, 'Failures: 1'):
                    RECOVERY.recover(fake, self.snapshot, payload, failed_reports.append, public=False)
        self.assertEqual(failed_reports[-1]['metadata_rollback_failures'], [first['id']])
        self.assertEqual(failed_reports[-1]['restored_metadata_for'], 0)
        self.assertEqual([path for method, path, *_ in fake.writes if method != 'GET'], ['/files/' + first['id']])
        self.assertTrue(fake.candidate_files[first['id']])
        self.assertEqual(hashlib.sha256(payload[first['path']]).hexdigest(), first['sha256'])

        # Use a fresh snapshot so Directus-managed modification timestamps from the
        # failed upload/rollback are treated as the current state on a safe retry.
        retry_snapshot = {
            'files': [self.api.json('/files/' + asset['id']) for asset in RECOVERY.ASSETS],
            'references': RECOVERY.references(self.api),
        }

        # The real local API then verifies originals and thumbnails for all eight.
        # The recovery wrapper only permits PATCH writes to these reviewed file IDs.
        self.api.mutations.clear()
        results = RECOVERY.recover(self.api, retry_snapshot, payload, lambda _: None, public=False)
        expected_paths = {'/files/' + asset['id'] for asset in RECOVERY.ASSETS}
        self.assertEqual(len(results), 8)
        self.assertEqual({path for method, path, public in self.api.mutations}, expected_paths)
        self.assertTrue(all(method == 'PATCH' and not public for method, path, public in self.api.mutations))
        self.assertEqual(RECOVERY.references(self.api), retry_snapshot['references'])
        for asset in RECOVERY.ASSETS:
            row = self.api.json('/files/' + asset['id'])
            self.assertEqual(row['type'], 'image/png')
            self.assertEqual(row['filename_disk'], asset['id'] + '.png')
            self.assertEqual(row['filename_download'], Path(asset['filenameDownload']).stem + '.png')


if __name__ == '__main__':
    unittest.main()
