#!/usr/bin/env python3
"""Recover exact published SGI sources with independent Git-history evidence."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile

EXPECTED = '4a56887078475c77ba6631d0135f4fedff9e5bb2100c04f379697b58f337637c'
COUNT = 639
TARGET = 'root@179.198.115.115'
STAGE = '/srv/umsa-migration'
# All 639 included files matched independent local Git blobs. The excluded
# browser-audit helper has no verified provenance and is not application code.
COLLECT = '''
import hashlib,json,pathlib,sys,tarfile
p=pathlib.Path('/home/sgi.ultimamilla.com.ar').resolve(strict=True)
if str(p)!='/home/sgi-releases/20260520-114741':raise RuntimeError('Unexpected source root')
paths=[p/'package.json',p/'package-lock.json']
for d in ('src','scripts','database'):paths.extend((p/d).rglob('*'))
rows=[]
for f in paths:
 if not f.is_file() or f.is_symlink() or f.name.startswith('._'):continue
 if any(s in f.parts for s in ('__tests__','node_modules','uploads')):continue
 name=f.relative_to(p).as_posix()
 if name=='scripts/audit-browser-ui.js':continue
 rows.append((name,hashlib.sha256(f.read_bytes()).hexdigest()))
rows.sort()
fingerprint=hashlib.sha256(''.join(h+'  '+n+'\\n' for n,h in rows).encode()).hexdigest()
if len(rows)!=639 or fingerprint!='4a56887078475c77ba6631d0135f4fedff9e5bb2100c04f379697b58f337637c':raise RuntimeError('Independent SGI source fingerprint differs')
with tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz') as archive:
 for name,h in rows:archive.add(p/name,arcname=name,recursive=False)
'''


def verify_tree(root):
    rows = sorted((p.relative_to(root).as_posix(), hashlib.sha256(p.read_bytes()).hexdigest())
                  for p in root.rglob('*') if p.is_file())
    actual = hashlib.sha256(''.join(h + '  ' + n + '\n' for n, h in rows).encode()).hexdigest()
    if len(rows) != COUNT or actual != EXPECTED:
        raise RuntimeError('SGI source fingerprint mismatch')


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('GITHUB_REF') != 'refs/heads/master':
        raise RuntimeError('Run only from reviewed master in GitHub Actions')
    os.umask(0o077)
    root = Path(tempfile.mkdtemp(prefix='sgi-clean-', dir=os.environ['RUNNER_TEMP']))
    known = Path(__file__).with_name('known_hosts').resolve()
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', f'UserKnownHostsFile={known}']
    def run(args, **kwargs):
        return subprocess.run(args, check=True, **kwargs)
    if subprocess.check_output(['ssh', *options, TARGET, 'hostname'], text=True).strip() != 'srv2101069.hstgr.cloud':
        raise RuntimeError('Wrong destination')
    archive = root / 'source.tar.gz'
    with archive.open('wb') as stream:
        run(['ssh', *options, TARGET, 'python3', '-'], input=COLLECT.encode(), stdout=stream)
    spec = importlib.util.spec_from_file_location('clean_sitrep', Path(__file__).with_name('clean-sitrep.py'))
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    application = root / 'application'
    application.mkdir()
    with tarfile.open(archive) as stream:
        members = stream.getmembers()
        helper.validate_members(members)
        stream.extractall(application, members=members, filter='data')
    verify_tree(application)
    run(['npm', 'ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], cwd=application)
    run(['node', '--check', 'src/server.js'], cwd=application)
    run(['node', '-e', "for(const p of ['express','mysql2','express-handlebars','express-session','pdfkit','exceljs'])require(p);console.log('SGI runtime imports passed')"], cwd=application)
    proof = dict(source_fingerprint=EXPECTED, files=COUNT, provenance='639 exact independent Git-history blob matches',
                 dependencies='fresh npm ci --omit=dev --ignore-scripts', github_run=os.environ['GITHUB_RUN_ID'])
    (application / 'migration-provenance.json').write_text(json.dumps(proof, indent=2) + '\n')
    package = root / 'clean-sgi.tar.gz'
    with tarfile.open(package, 'w:gz') as stream:
        stream.add(application, arcname='application')
    expected = helper.digest(package)
    destination = f'{STAGE}/trusted/sgi-{EXPECTED[:16]}'
    run(['ssh', *options, TARGET, f'test "$(cat {STAGE}/.target)" = 179.198.115.115 && test ! -e {destination} && install -d -m 0700 {destination}'])
    run(['scp', *options, str(package), f'{TARGET}:{destination}/package.tar.gz'])
    command = f'''set -eu
cd {destination}
printf '%s  package.tar.gz\\n' {expected} | sha256sum --check
tar --no-same-owner -xzf package.tar.gz
printf '%s\\n' {expected} > archive.sha256
printf '%s\\n' {destination} > {STAGE}/trusted-sgi
'''
    run(['ssh', *options, TARGET, 'bash', '-s'], input=command, text=True)
    print('Exact published SGI sources and fresh dependencies staged; no application activated.')


if __name__ == '__main__':
    main()
