#!/usr/bin/env python3
"""Build ARCA from its published commit in CI, stage without activation."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

REVISION = '0e4d080d799a0adaf9b808828eb8687b9c8e237e'
TARGET = 'root@179.198.115.115'
STAGE = '/srv/umsa-migration'


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('GITHUB_REF') != 'refs/heads/master':
        raise RuntimeError('Run only from reviewed master in GitHub Actions')
    os.umask(0o077)
    root = Path(tempfile.mkdtemp(prefix='arca-clean-', dir=os.environ['RUNNER_TEMP']))
    def run(args, **kwargs):
        return subprocess.run(args, check=True, **kwargs)
    run(['git', 'clone', '--no-checkout', 'https://github.com/UltimaMilla/plantilla-arca.git', str(root / 'source')])
    run(['git', 'checkout', '--detach', REVISION], cwd=root / 'source')
    actual = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root / 'source', text=True).strip()
    if actual != REVISION:
        raise RuntimeError('Source revision mismatch')
    tag = 'umsa-migration-arca:' + REVISION
    run(['docker', 'pull', 'python:3.10-slim'])
    run(['docker', 'build', '--pull', '--tag', tag, '.'], cwd=root / 'source')
    run(['docker', 'run', '--rm', '--network', 'none', '--entrypoint', 'python', tag,
         '-c', 'import streamlit,sqlalchemy,psycopg2,reportlab; print("ARCA runtime imports passed")'])
    image_id = subprocess.check_output(['docker', 'image', 'inspect', '--format', '{{.Id}}', tag], text=True).strip()
    base = json.loads(subprocess.check_output(['docker', 'image', 'inspect', 'python:3.10-slim']))[0]
    archive = root / 'image.tar.gz'
    with archive.open('wb') as raw, gzip.GzipFile(fileobj=raw, mode='wb') as compressed:
        process = subprocess.Popen(['docker', 'save', tag], stdout=subprocess.PIPE)
        while chunk := process.stdout.read(1024 * 1024):
            compressed.write(chunk)
        if process.wait():
            raise RuntimeError('Image export failed')
    with archive.open('rb') as stream:
        expected = hashlib.file_digest(stream, 'sha256').hexdigest()
    proof = dict(repository='UltimaMilla/plantilla-arca', revision=REVISION, image_id=image_id,
                 base_digest=base['RepoDigests'], archive_sha256=expected, github_run=os.environ['GITHUB_RUN_ID'])
    (root / 'provenance.json').write_text(json.dumps(proof, indent=2) + '\n')
    known = Path(__file__).with_name('known_hosts').resolve()
    options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', f'UserKnownHostsFile={known}']
    destination = f'{STAGE}/trusted/arca-{REVISION}'
    run(['ssh', *options, TARGET, f'test "$(hostname)" = srv2101069.hstgr.cloud && test "$(cat {STAGE}/.target)" = 179.198.115.115 && test ! -e {destination} && install -d -m 0700 {destination}'])
    run(['scp', *options, str(archive), str(root / 'provenance.json'), f'{TARGET}:{destination}/'])
    run(['ssh', *options, TARGET, f"cd {destination} && printf '%s  image.tar.gz\\n' {expected} | sha256sum --check && printf '%s\\n' {destination} > {STAGE}/trusted-arca"])
    print('ARCA rebuilt from the published Git commit and staged privately; no application activated.')


if __name__ == '__main__':
    main()
