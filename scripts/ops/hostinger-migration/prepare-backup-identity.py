#!/usr/bin/env python3
"""Create a dedicated target-side backup key; its private half never leaves it."""
import os
from pathlib import Path
import socket
import subprocess

STAGE=Path('/srv/umsa-migration')
KEY=Path('/root/.ssh/umsa_offsite_20261027')
PEER='76.13.234.213 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGadIi6cY0FHZ61LALb7dIAG0o9/zfT1UYnZDRZ5aan5\n'


def main():
    os.umask(0o077)
    if socket.gethostname()!='srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE/'.target').read_text().strip()!='179.198.115.115':
        raise RuntimeError('Wrong destination')
    if (not (STAGE/'persist-rehearsal.complete').is_file() or KEY.exists() or KEY.is_symlink()
            or KEY.parent.is_symlink() or KEY.with_suffix('.pub').exists() or KEY.with_suffix('.pub').is_symlink()):
        raise RuntimeError('Unexpected identity preparation state')
    KEY.parent.mkdir(mode=0o700,exist_ok=True)
    subprocess.run(['ssh-keygen','-q','-t','ed25519','-N','','-C','umsa-hostinger-backups-20261027','-f',str(KEY)],check=True)
    peer=STAGE/'backup-known-hosts'
    with peer.open('x') as stream:stream.write(PEER)
    public=KEY.with_suffix('.pub').read_text().strip()
    actual=subprocess.check_output(['ssh-keygen','-y','-f',str(KEY)],text=True).strip()
    if public.split()[:2]!=actual.split()[:2]:raise RuntimeError('Key pair did not verify')
    (STAGE/'backup-identity.prepared').write_text(public+'\n')
    print(public)


if __name__=='__main__':main()
