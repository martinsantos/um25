#!/usr/bin/env python3
"""Stage official CMS distributions and verified site customizations in CI."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import tarfile
import tempfile
import urllib.request
import zipfile

PACKAGES = {
    'wordpress.tar.gz': ('https://wordpress.org/wordpress-7.1.1.tar.gz', '3996fee13448ef12e07e9f0c77db2f655ffa1b7cde71c80a4965d3bf1fb956b3'),
    'wiki.tar.gz': ('https://releases.wikimedia.org/mediawiki/1.29/mediawiki-1.29.3.tar.gz', '4f28a812694c95bd6778d1ac322ea80d3bbfedbda69c4562b75c8d450cc8d3f0'),
    'acf.zip': ('https://downloads.wordpress.org/plugin/advanced-custom-fields.6.8.10.zip', '92d51a8f1d839f60aee4efb6a9cd269b37d1599a9fb44d03f792352dfe34c744'),
    'akismet.zip': ('https://downloads.wordpress.org/plugin/akismet.5.7.2.zip', 'e76d9ad61b95fb36c99b580e23c23e16a2cf9fd8483baa16d756d47f1994126d'),
    'classic.zip': ('https://downloads.wordpress.org/plugin/classic-editor.1.7.0.zip', '7cc7799b0b7d820fbb7528dbff8027c736e52513992416cb37279f44d3d9dd77'),
    'theme.zip': ('https://downloads.wordpress.org/theme/twentytwentyfive.1.3.zip', '209467fc310c3d01c2329d0d2d660ef77271dad99251a50b9d892319f26f0288'),
    'seo.tar.gz': ('https://registry.npmjs.org/directus-extension-seo/-/directus-extension-seo-1.5.11.tgz', '9015826fec09d8861a92dd9106bbf1bd4dc5d5bb263e9307f5645047b93c270b'),
}
CUSTOM = '0fadf46f3bd4d9df91373ed905c63649d3d400311365f592b0cc2e1417791379'
DIRECTUS = 'directus/directus@sha256:76ade668de9dd6f5c4e01b8cb13896c1f8c63dbc7140cd9ca98f471f41b18d72'
DIRECTUS_CONFIG = 'sha256:3105ad1d6fcc077974bff62fffa2d12d37c3856a235a19c4a5cc162e907c372d'
TARGET = 'root@179.198.115.115'
STAGE = '/srv/umsa-migration'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def safe_name(name):
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts:
        raise ValueError('Unsafe archive path')


def extract(archive, destination):
    destination.mkdir(parents=True, exist_ok=True)
    if archive.suffix == '.zip':
        with zipfile.ZipFile(archive) as stream:
            for member in stream.infolist():
                safe_name(member.filename)
                if stat.S_ISLNK(member.external_attr >> 16):
                    raise ValueError('Unexpected archive link')
            stream.extractall(destination)
    else:
        with tarfile.open(archive) as stream:
            for member in stream.getmembers():
                safe_name(member.name)
                if not (member.isdir() or member.isfile()):
                    raise ValueError('Unexpected archive link or special file')
            stream.extractall(destination, filter='data')


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('GITHUB_REF') != 'refs/heads/master':
        raise RuntimeError('Run only from reviewed master in GitHub Actions')
    os.umask(0o077)
    root = Path(tempfile.mkdtemp(prefix='cms-clean-', dir=os.environ['RUNNER_TEMP']))
    bundle = root / 'bundle'
    bundle.mkdir()
    for name, (url, expected) in PACKAGES.items():
        request = urllib.request.Request(url, headers={'User-Agent': 'UMSA-Migration/1.0'})
        with urllib.request.urlopen(request, timeout=90) as response, (root / name).open('wb') as output:
            shutil.copyfileobj(response, output)
        if digest(root / name) != expected:
            raise RuntimeError('Official distribution fingerprint differs: ' + name)
    extract(root / 'wordpress.tar.gz', bundle)
    extract(root / 'wiki.tar.gz', bundle)
    (bundle / 'mediawiki-1.29.3').rename(bundle / 'wiki')
    wp = bundle / 'wordpress'
    # Remove only bundled defaults inside this new disposable CI build directory.
    for name in ('plugins', 'themes'):
        shutil.rmtree(wp / 'wp-content' / name)
        (wp / 'wp-content' / name).mkdir()
    for name in ('acf.zip', 'akismet.zip', 'classic.zip'):
        extract(root / name, wp / 'wp-content/plugins')
    extract(root / 'theme.zip', wp / 'wp-content/themes')
    extract(root / 'seo.tar.gz', root / 'seo')
    extension = bundle / 'directus-extensions/directus/extensions/.registry/f3f88993-f718-40b8-b2a3-a6dd1b46794d'
    extension.parent.mkdir(parents=True)
    shutil.move(str(root / 'seo/package'), extension)
    known = Path(__file__).with_name('known_hosts').resolve()
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', f'UserKnownHostsFile={known}']
    def run(args, **kwargs):
        return subprocess.run(args, check=True, **kwargs)
    collector = '''import pathlib,hashlib,sys,tarfile
p=pathlib.Path('/home/vecinorabioso.com.ar/public_html');rows=[]
for sub in ('wp-content/themes/vecino-rabioso','wp-content/mu-plugins'):
 for f in (p/sub).rglob('*'):
  if f.is_file() and not f.is_symlink():rows.append((f.relative_to(p).as_posix(),hashlib.sha256(f.read_bytes()).hexdigest()))
rows.sort()
if len(rows)!=40 or hashlib.sha256(''.join(h+'  '+n+'\\n' for n,h in rows).encode()).hexdigest()!='CUSTOM':raise RuntimeError('Customizations changed')
with tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz') as t:
 for name,h in rows:t.add(p/name,arcname=name,recursive=False)
'''.replace('CUSTOM', CUSTOM)
    with (root / 'custom.tar.gz').open('wb') as output:
        run(['ssh', *options, TARGET, 'python3', '-'], input=collector.encode(), stdout=output)
    custom = root / 'custom'
    extract(root / 'custom.tar.gz', custom)
    rows = sorted((p.relative_to(custom).as_posix(), digest(p)) for p in (custom / 'wp-content').rglob('*') if p.is_file())
    if len(rows) != 40 or hashlib.sha256(''.join(h + '  ' + n + '\n' for n, h in rows).encode()).hexdigest() != CUSTOM:
        raise RuntimeError('Transferred customization fingerprint mismatch')
    shutil.copytree(custom / 'wp-content', wp / 'wp-content', dirs_exist_ok=True)
    # Future builds use the same vendor entry point and exact two-line upstream PHP backport.
    # Never reintroduce the inherited CSS-only load.php stub or fetch Wiki executable code from a runtime.
    spec = importlib.util.spec_from_file_location('wiki_loader', Path(__file__).with_name('restore-wiki-loader.py'))
    wiki_loader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(wiki_loader)
    unused_manifest, wiki_files = wiki_loader.official(root / 'wiki.tar.gz')
    for name, data in wiki_files.items():
        (bundle / 'wiki' / name).write_bytes(data)
    (wp / '.user.ini').write_text('file_uploads=On\nupload_max_filesize=10M\npost_max_size=12M\nmemory_limit=256M\nmax_file_uploads=5\nmax_execution_time=300\nmax_input_time=300\n')
    proof = dict(official_packages=PACKAGES, custom_fingerprint=CUSTOM,
        custom_review='Independent local Git/files; whitespace diffs reviewed; existing 33-line security guard reviewed',
        wiki_loader_sha256={name: hashlib.sha256(data).hexdigest() for name, data in wiki_files.items()},
        wiki_php_compatibility_patch=wiki_loader.UPSTREAM,
        directus_image=DIRECTUS, directus_config=DIRECTUS_CONFIG,
        github_run=os.environ['GITHUB_RUN_ID'])
    (bundle / 'provenance.json').write_text(json.dumps(proof, indent=2) + '\n')
    package = root / 'cms.tar.gz'
    with tarfile.open(package, 'w:gz') as stream:
        stream.add(bundle, arcname='application')
    expected = digest(package)
    destination = STAGE + '/trusted/cms-20261027-v1'
    run(['ssh', *options, TARGET, f'test "$(hostname)" = srv2101069.hstgr.cloud && test "$(cat {STAGE}/.target)" = 179.198.115.115 && test ! -e {destination} && install -d -m 0700 {destination}'])
    run(['scp', *options, str(package), f'{TARGET}:{destination}/package.tar.gz'])
    command = f'''set -eu
cd {destination}
printf '%s  package.tar.gz\\n' {expected} | sha256sum --check
tar --no-same-owner -xzf package.tar.gz
docker pull {DIRECTUS}
test "$(docker image inspect --format '{{{{.Id}}}}' {DIRECTUS})" = {DIRECTUS_CONFIG}
printf '%s\\n' {expected} > archive.sha256
printf '%s\\n' {destination} > {STAGE}/trusted-cms
'''
    run(['ssh', *options, TARGET, 'bash', '-s'], input=command, text=True)
    print('Official CMS distributions and verified customizations staged; no service activated.')


if __name__ == '__main__':
    main()
