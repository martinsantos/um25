#!/usr/bin/env python3
"""Recreate only service identities, without passwords or interactive logins."""
import grp
import pwd
import subprocess
from pathlib import Path

USERS = ('mysql', 'nginx', 'apache', 'redis', 'memcached', 'postfix', 'opendkim',
         'cyberpanel', 'lsadm', 'lscpd', 'pdns', 'vmail', 'dovecot', 'dovenull', 'docker')


def plan(passwd_text, group_text, target_users, target_groups):
    users = {p[0]: p for l in passwd_text.splitlines() if len(p := l.split(':')) == 7}
    groups = {p[0]: p for l in group_text.splitlines() if len(p := l.split(':')) == 4}
    selected = [users[n] for n in USERS if n in users]
    required_gids = {int(u[3]) for u in selected}
    selected_groups = [g for g in groups.values() if int(g[2]) in required_gids or g[0] == 'postdrop']
    commands = []
    for g in selected_groups:
        name, gid = g[0], int(g[2])
        if name in target_groups:
            if target_groups[name] != gid:
                raise ValueError(f'Existing group ID differs: {name}')
        elif gid in target_groups.values():
            raise ValueError(f'Group ID is already occupied: {gid}')
        else:
            commands.append(['groupadd', '--gid', str(gid), name])
    for u in selected:
        name, uid, gid = u[0], int(u[2]), int(u[3])
        if uid == 0 or gid == 0:
            raise ValueError('A service identity cannot be root')
        if name in target_users:
            if target_users[name] != (uid, gid):
                raise ValueError(f'Existing user ID differs: {name}')
        elif any(v[0] == uid for v in target_users.values()):
            raise ValueError(f'User ID is already occupied: {uid}')
        else:
            commands.append(['useradd', '--uid', str(uid), '--gid', str(gid),
                             '--home-dir', u[5], '--no-create-home', '--shell', '/sbin/nologin', name])
    return commands


def main():
    if subprocess.check_output(['hostname'], text=True).strip() != 'srv2101069.hstgr.cloud':
        raise SystemExit('Wrong host')
    stage = Path('/srv/umsa-migration')
    if stage.is_symlink() or (stage / '.target').read_text().strip() != '179.198.115.115':
        raise SystemExit('Wrong staging identity')
    commands = plan((stage / 'source/etc/passwd').read_text(), (stage / 'source/etc/group').read_text(),
                    {u.pw_name: (u.pw_uid, u.pw_gid) for u in pwd.getpwall()},
                    {g.gr_name: g.gr_gid for g in grp.getgrall()})
    for command in commands:
        subprocess.run(command, check=True)
    print(f'Service identity setup complete: {len(commands)} operations; passwords untouched.')


if __name__ == '__main__':
    main()
