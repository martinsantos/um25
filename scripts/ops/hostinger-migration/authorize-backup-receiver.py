#!/usr/bin/env python3
"""Authorize one restricted UMSA backup key; preserve all existing services/keys."""
import base64
import hashlib
import os
from pathlib import Path
import pwd
import shutil
import socket
import struct
import sys

GUARD_SHA='a4cdd7012d33923c21bb209f5350548d367079b4b712a2f4a0227c3903c34fb7'


def authorized_line(public):
    fields=public.strip().split()
    if len(fields)!=3 or fields[0]!='ssh-ed25519' or fields[2]!='umsa-hostinger-backups-20261027':
        raise ValueError('Not the dedicated backup public key')
    blob=base64.b64decode(fields[1],validate=True)
    if (len(blob)!=51 or blob[:4]!=struct.pack('>I',11) or blob[4:15]!=b'ssh-ed25519'
            or blob[15:19]!=struct.pack('>I',32)):
        raise ValueError('Invalid Ed25519 key structure')
    return ('restrict,from="179.198.115.115",command="/usr/local/bin/umbak-recibe" '
            + ' '.join(fields) + '\n')


def main(public):
    os.umask(0o077)
    line=authorized_line(public)
    if socket.gethostname()!='srv1342577.hstgr.cloud':raise RuntimeError('Wrong backup receiver')
    account=pwd.getpwnam('umbak')
    if account.pw_uid!=984 or account.pw_dir!='/home/umbak':raise RuntimeError('Receiver identity differs')
    guard=Path('/usr/local/bin/umbak-recibe')
    if guard.is_symlink() or hashlib.sha256(guard.read_bytes()).hexdigest()!=GUARD_SHA:
        raise RuntimeError('Restricted backup command differs from the reviewed version')
    keys=Path('/home/umbak/.ssh/authorized_keys')
    if keys.is_symlink() or keys.parent.is_symlink() or keys.stat().st_mode&0o777!=0o600:
        raise RuntimeError('Unexpected authorization file')
    old=keys.read_text()
    if line in old:print('Dedicated restricted key already authorized.');return
    if 'umsa-hostinger-backups-20261027' in old or public.split()[1] in old:
        raise RuntimeError('Ambiguous existing key; inspect before changing it')
    backup=keys.with_name('authorized_keys.before-hostinger-20261027')
    if backup.exists():raise RuntimeError('An earlier change is retained; inspect before retry')
    shutil.copy2(keys,backup)
    temp=keys.with_name('authorized_keys.hostinger-pending')
    with temp.open('x') as stream:
        stream.write(old.rstrip('\n')+'\n'+line);stream.flush();os.fsync(stream.fileno())
    os.chown(temp,keys.stat().st_uid,keys.stat().st_gid)
    temp.chmod(0o600)
    os.replace(temp,keys)
    print('Dedicated key authorized only from Hostinger for the existing forced backup command. Existing keys/services preserved.')


if __name__=='__main__':main(sys.stdin.read())
