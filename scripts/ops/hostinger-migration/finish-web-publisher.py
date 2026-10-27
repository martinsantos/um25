#!/usr/bin/env python3
"""Resume exactly the initial, unopened CI artifact after auditing npm's hardlink."""
import hashlib
import importlib.util
from pathlib import Path
import socket

STAGE=Path('/srv/umsa-migration')
REVISION='7d7298d56963a07708591008774b8967b666a147'
RUN='40551865293'
SHA='4758968e08105fed915740ee7f29a5f23ce9f407790f62e9a629828bda84831d'


def main():
    if socket.gethostname()!='srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE/'.target').read_text().strip()!='179.198.115.115':
        raise RuntimeError('Wrong destination')
    identifier=REVISION+'-'+RUN+'-1'
    root=Path('/srv/umsa-web-releases')/identifier
    saved=STAGE/'web-attempt-before-esbuild-hardlink'
    if (saved.exists() or root.is_symlink() or not root.is_dir()
            or {p.name for p in root.iterdir()}!={'application'}
            or (root/'application').is_symlink() or any((root/'application').iterdir())
            or (STAGE/'production.active').exists()
            or (Path('/etc/systemd/system')/('umsa-web-'+identifier+'.service')).exists()):
        raise RuntimeError('Not the reviewed unopened publisher attempt')
    package=STAGE/'incoming'/(identifier+'.tar.gz')
    if package.is_symlink():raise RuntimeError('Unexpected package link')
    digest=hashlib.sha256()
    with package.open('rb') as stream:
        while chunk:=stream.read(1024*1024):digest.update(chunk)
    if digest.hexdigest()!=SHA:raise RuntimeError('Immutable CI package differs')
    root.rename(saved)
    spec=importlib.util.spec_from_file_location('publisher',Path(__file__).with_name('publish-web.py'))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.main('rehearse',REVISION,RUN,'1',SHA)


if __name__=='__main__':main()
