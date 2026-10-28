#!/usr/bin/env python3
"""Restore MediaWiki 1.29.3 ResourceLoader and its exact two-line upstream PHP backport."""
import base64
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import stat
import subprocess
import sys
import tarfile
import tempfile
import time

URL = 'https://releases.wikimedia.org/mediawiki/1.29/mediawiki-1.29.3.tar.gz'
ARCHIVE_SHA = '4f28a812694c95bd6778d1ac322ea80d3bbfedbda69c4562b75c8d450cc8d3f0'
MANIFEST_SHA = 'a1af40fe6146f09acdf385c1b25c166546a936a8baf482ff6dede4fcfbf4a351'
VENDOR_SHA = 'b8073b5b76e0ca6227248bf7049fd80160bdb5c368623e11ae9026e261b63af0'
STUB_SHA = '21f05f83d5607a9832f7b8bb291aa1ad870dcd324e7ee2dd15d914bdaf9be539'
WIKI = Path('/srv/umsa-clean-php/wiki')
STAGE = Path('/srv/umsa-migration')
PROVENANCE = STAGE / 'trusted/cms-20261027-v1/application/provenance.json'
PHP = '/opt/remi/php74/root/usr/bin/php'
LOCK = Path('/run/umsa-web-publish.lock')
UPSTREAM = 'https://github.com/wikimedia/mediawiki/commit/24ffbd9bd182944daa8b12244b729562cd5f50db'
TASK = 'https://phabricator.wikimedia.org/T200595'
BACKPORTS = {
    'languages/LanguageConverter.php': (
        '0eaca13c88c1a3d8cefe60c2f3efd9b590bb536fdc36b2cc9a5044617f692346',
        'e6148e2d1251ac909bae1b02448a57c0c563ad73381ac1777e6fadf3573164ee',
        b'\t\t\t\t\t\t$startPos += 2;\n\t\t\t\t\t\tcontinue;'),
    'includes/json/FormatJson.php': (
        '24a90b38087213a2c78eb69d9eb938eca928b8956ebe6c6818d4d5ba61ffd6c6',
        '33e356af3d22873c3dab03878bf8e9358c2244ca1e4a4a8ae2d2ce64f9aad9eb',
        b'\t\t\t\t\tif ( $inString ) {\n\t\t\t\t\t\tcontinue;'),
}
ORDER = [*BACKPORTS, 'load.php']  # Enable the loader only after its two PHP compatibility fixes.


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def official(archive):
    if sha(Path(archive).read_bytes()) != ARCHIVE_SHA:
        raise RuntimeError('Official MediaWiki archive fingerprint differs')
    manifest = {}
    files = {}
    with tarfile.open(archive) as package:
        for entry in package:
            if entry.isdir():
                continue
            name = entry.name.removeprefix('mediawiki-1.29.3/')
            if (not entry.isfile() or name == entry.name or name.startswith('/') or
                    '..' in Path(name).parts or name in manifest):
                raise RuntimeError('Unexpected official archive member')
            data = package.extractfile(entry).read()
            manifest[name] = sha(data)
            if name in ORDER:
                files[name] = data
    if sha(canonical(manifest)) != MANIFEST_SHA or sha(files['load.php']) != VENDOR_SHA:
        raise RuntimeError('Exact MediaWiki version or file inventory differs')
    for name, (before, after, needle) in BACKPORTS.items():
        source = files[name]
        if sha(source) != before or source.count(needle) != 1:
            raise RuntimeError('Backport context differs from exact 1.29.3 source')
        files[name] = source.replace(needle, needle.replace(b'continue;', b'break;'))
        if sha(files[name]) != after:
            raise RuntimeError('Exact upstream two-line backport fingerprint differs')
    return manifest, files


def regular(path):
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
        raise RuntimeError('Preserve unexpected file identity')
    return info


def identity(info):
    return (info.st_dev, info.st_ino, info.st_mode, info.st_uid, info.st_gid,
            info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def core(manifest):
    if len(manifest) != 13468 or sha(canonical(manifest)) != MANIFEST_SHA:
        raise RuntimeError('Reviewed official core inventory differs')
    for name, expected in manifest.items():
        if name in ORDER:
            continue
        path = WIKI / name
        if path.resolve() != path or not path.is_file() or sha(path.read_bytes()) != expected:
            raise RuntimeError('Preserve changed or incomplete MediaWiki core: ' + name)
    return len(manifest) - len(ORDER)


def lint(files):
    version = subprocess.check_output([PHP, '-r', 'echo PHP_MAJOR_VERSION,".",PHP_MINOR_VERSION;'], timeout=10)
    if version != b'7.4':
        raise RuntimeError('Expected the existing PHP 7.4 runtime')
    for data in files.values():
        subprocess.run([PHP, '-l'], input=data, check=True, stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE, timeout=15)


def preflight(payload):
    if (os.geteuid() != 0 or os.environ.get('UMSA_EXECUTION_CONTEXT') != 'github-actions' or
            socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.resolve() != STAGE or
            (STAGE / '.target').read_text().strip() != '179.198.115.115' or
            not (STAGE / 'production.active').is_file() or WIKI.resolve() != WIKI or
            payload.get('mode') not in {'preflight', 'apply'} or
            not re.fullmatch(r'[0-9]+-[0-9]+', payload.get('run', '')) or
            not re.fullmatch(r'[a-f0-9]{40}', payload.get('commit', '')) or
            payload.get('expected_sha') not in {STUB_SHA, VENDOR_SHA}):
        raise RuntimeError('Reviewed CI context or current Hostinger identity is invalid')
    files = {name: base64.b64decode(data, validate=True) for name, data in payload['files'].items()}
    expected = {**{name: row[1] for name, row in BACKPORTS.items()}, 'load.php': VENDOR_SHA}
    if set(files) != set(ORDER) or any(sha(files[name]) != expected[name] for name in ORDER):
        raise RuntimeError('Candidate differs from the official loader and exact upstream backport')
    provenance_bytes = PROVENANCE.read_bytes()
    provenance = json.loads(provenance_bytes)
    if provenance['official_packages']['wiki.tar.gz'] != [URL, ARCHIVE_SHA]:
        raise RuntimeError('Preserve unexpected original CMS provenance')
    checked = core(payload['manifest'])
    previous, infos = {}, {}
    expected_before = {**{name: row[0] if payload['expected_sha'] == STUB_SHA else row[1]
                          for name, row in BACKPORTS.items()}, 'load.php': payload['expected_sha']}
    for name in ORDER:
        path = WIKI / name
        if path.resolve() != path:
            raise RuntimeError('Preserve unexpected managed core path')
        info = regular(path)
        if (info.st_uid, info.st_gid, stat.S_IMODE(info.st_mode)) != (0, 979, 0o644):
            raise RuntimeError('Preserve changed core ownership or permissions')
        previous[name], infos[name] = path.read_bytes(), info
        if sha(previous[name]) != expected_before[name]:
            raise RuntimeError('Three-file SHA compare-and-swap guard failed: ' + name)
    settings = WIKI / 'LocalSettings.php'
    regular(settings)
    protected = {'settings_sha': sha(settings.read_bytes()), 'provenance_sha': sha(provenance_bytes)}
    lint(files)
    return files, previous, infos, protected, checked


def protected_unchanged(protected):
    if (sha((WIKI / 'LocalSettings.php').read_bytes()) != protected['settings_sha'] or
            sha(PROVENANCE.read_bytes()) != protected['provenance_sha']):
        raise RuntimeError('Preserve concurrently changed configuration or provenance')


def atomic(path, data, mode, uid, gid):
    descriptor, temporary = tempfile.mkstemp(prefix='.umsa-wiki-loader-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'wb') as output:
            output.write(data)
            os.fchown(output.fileno(), uid, gid)
            os.fchmod(output.fileno(), mode)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def probe(path, kind):
    # GET only, with TLS/SNI for the production host; no cookies, credentials or response bodies logged.
    result = subprocess.run(['curl', '--noproxy', '*', '--silent', '--show-error', '--fail',
        '--max-time', '25', '--resolve', 'wiki.ultimamilla.com.ar:443:127.0.0.1',
        '--header', 'Cache-Control: no-cache', '--dump-header', '-',
        'https://wiki.ultimamilla.com.ar' + path], stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        timeout=30, check=True)
    response = result.stdout
    headers, body = response.split(b'\r\n\r\n', 1)
    header = headers.lower()
    if len(body) > 3 * 1024 * 1024:
        raise RuntimeError('Unexpectedly large Wiki response')
    if kind == 'scripts':
        valid = b'javascript' in header and b'mw.loader' in body
    elif kind == 'styles':
        valid = b'text/css' in header and b'.mw-body' in body and b'#column-one' in body
    elif kind == 'login':
        valid = b'text/html' in header and b'wpName' in body and b'wpPassword' in body
    else:
        valid = b'text/html' in header and b'Alcance' in body and b'mw-content-text' in body
    if not valid or any(marker in body for marker in
            [b'<b>Fatal error</b>', b'<b>Warning</b>', b'Exception caught', b'Internal Server Error']):
        raise RuntimeError('Wiki functional GET check failed: ' + kind)
    return {'kind': kind, 'bytes': len(body), 'sha256': sha(body)}


def public_checks():
    cachebuster = '&umsa_loader_check=' + str(time.time_ns())
    return [probe('/load.php?debug=false&lang=es&modules=startup&only=scripts&skin=monobook' + cachebuster, 'scripts'),
        probe('/load.php?debug=false&lang=es&modules=jquery%7Cmediawiki&only=scripts&skin=monobook' + cachebuster, 'scripts'),
        probe('/load.php?debug=false&lang=es&modules=skins.monobook.styles&only=styles&skin=monobook' + cachebuster, 'styles'),
        probe('/wiki/Alcance', 'page'),
        probe('/index.php?title=Especial:Entrar&returnto=Alcance', 'login')]


def eventual_checks():
    # Permit the existing FPM timestamp revalidation interval; never reset/restart FPM.
    for attempt in range(5):
        try:
            return public_checks()
        except (RuntimeError, subprocess.SubprocessError):
            if attempt == 4:
                raise
            time.sleep(1)


def execute(payload):
    files, previous, infos, protected, checked = preflight(payload)
    receipt = {'ok': True, 'version': '1.29.3', 'source_sha': {n: sha(v) for n, v in previous.items()},
               'target_sha': {n: sha(v) for n, v in files.items()},
               'core_files_checked': checked, 'services_restarted': False, 'database_commands': False,
               'configuration_changed': False, **protected}
    if payload['mode'] == 'preflight':
        return {**receipt, 'read_only': True}
    with LOCK.open('rb') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        core(payload['manifest'])
        def unchanged():
            for name in ORDER:
                path = WIKI / name
                if identity(regular(path)) != identity(infos[name]) or path.read_bytes() != previous[name]:
                    raise RuntimeError('Managed core changed before activation: ' + name)
        unchanged()
        protected_unchanged(protected)
        root = STAGE / 'wiki-loader-recoveries'
        root.mkdir(mode=0o700, exist_ok=True)
        root_info = root.lstat()
        if (not stat.S_ISDIR(root_info.st_mode) or root_info.st_uid != 0 or
                stat.S_IMODE(root_info.st_mode) != 0o700):
            raise RuntimeError('Preserve unexpected private recovery directory')
        backup = root / payload['run']
        backup.mkdir(mode=0o700)
        for number, name in enumerate(ORDER):
            atomic(backup / (str(number) + '.before'), previous[name], 0o600, 0, 0)
        addendum = {**receipt, 'archive_url': URL, 'archive_sha256': ARCHIVE_SHA,
            'commit': payload['commit'], 'run': payload['run'], 'original_provenance_unchanged': True,
            'upstream_patch': UPSTREAM, 'upstream_task': TASK,
            'backport': 'Exactly two continue-to-break substitutions; preserve pre-PHP7.3 switch semantics',
            'files': {name: {'backup': str(number) + '.before', 'mode': stat.S_IMODE(infos[name].st_mode),
                            'uid': infos[name].st_uid, 'gid': infos[name].st_gid,
                            'identity_before': identity(infos[name])} for number, name in enumerate(ORDER)},
            'reason': 'Restore vendor ResourceLoader with its minimal official PHP7.3 compatibility fix'}
        atomic(backup / 'provenance.addendum.json', canonical(addendum) + b'\n', 0o600, 0, 0)
        attempted = []
        try:
            protected_unchanged(protected)
            unchanged()
            for name in ORDER:
                attempted.append(name)
                atomic(WIKI / name, files[name], 0o644, infos[name].st_uid, infos[name].st_gid)
            checks = eventual_checks()
            if any((WIKI / name).read_bytes() != files[name] for name in ORDER):
                raise RuntimeError('Installed managed core changed concurrently')
            core(payload['manifest'])
            protected_unchanged(protected)
            result = {**receipt, 'read_only': False, 'backup': str(backup), 'checks': checks}
            atomic(backup / 'operation.complete.json', canonical(result) + b'\n', 0o600, 0, 0)
            return result
        except Exception as failure:
            concurrent = []
            for name in reversed(attempted):
                path = WIKI / name
                try:
                    current_info = regular(path)
                    if (current_info.st_uid, current_info.st_gid, stat.S_IMODE(current_info.st_mode)) != (
                            infos[name].st_uid, infos[name].st_gid, 0o644):
                        raise RuntimeError('Concurrent identity change')
                    current = path.read_bytes()
                except (OSError, RuntimeError):
                    concurrent.append(name)
                    continue
                if current == previous[name]:
                    continue
                if current != files[name]:
                    concurrent.append(name)
                    continue
                atomic(path, previous[name], 0o644, infos[name].st_uid, infos[name].st_gid)
                if path.read_bytes() != previous[name]:
                    raise RuntimeError('Managed core rollback verification failed') from failure
            if concurrent:
                raise RuntimeError('Concurrent managed core change preserved; other files rolled back') from failure
            raise RuntimeError('Wiki checks failed; all three previous core files preserved/restored') from failure


def main():
    try:
        payload = json.load(sys.stdin)
        print(json.dumps(execute(payload), sort_keys=True))
    except Exception as error:
        print(json.dumps({'ok': False, 'error': type(error).__name__,
                          'detail': str(error) if type(error) is RuntimeError else 'Wiki operation failed; inspect private evidence'}))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
