"""Install only the two reviewed, hash-pinned pilot files on the approved host."""
from pathlib import Path
from hashlib import sha256
import os
import shlex
import subprocess
root = Path(__file__).resolve().parent
if (os.environ.get('GITHUB_ACTIONS'), os.environ.get('GITHUB_REF'), os.environ.get('GITHUB_EVENT_NAME')) != ('true', 'refs/heads/master', 'push'):
    raise SystemExit('Only the reviewed production maintenance workflow may install this service')
known = root/'known_hosts'
program = (root/'share-static-20261122.py').read_text()
unit = (root/'umsa-share-static.service').read_text()
def sig(text):
    return sha256(text.encode()).hexdigest()
assert sig(program) == "f93180d7381417194fcbf54fb0a2b64f976b3cb9ae66a1f09c4dce1689999839"
assert sig(unit) == "faecc9c552b22edac987deb9b2790308bc6bd9c3fa19aa43a8d96a43d5dde825"
shell = """set -eu
test "$(hostname)" = srv2101069.hstgr.cloud
test "$(systemctl show -p ActiveState --value umsa-active-backup.service)" = inactive
test -d /usr/local/libexec
test "$(realpath /usr/local/libexec)" = /usr/local/libexec
test "$(realpath /etc/systemd/system)" = /etc/systemd/system
umask 077
work=$(mktemp -d /run/umsa-static-review-XXXXXXXX)
trap 'rm -f "$work/share-static.py" "$work/umsa-share-static.service"; rmdir "$work"' EXIT
cd "$work"
"""
for name, body in [('share-static.py',program),('umsa-share-static.service',unit)]:
    assert 'UMSA_REVIEWED_EOF' not in body and body.endswith('\n')
    shell += "cat > "+name+" <<'UMSA_REVIEWED_EOF'\n"+body+"UMSA_REVIEWED_EOF\n"
    shell += "printf '%s\\n' "+shlex.quote(sig(body)+'  '+name)+" | sha256sum -c -\n"
shell += """if [ ! -d /usr/local/libexec/umsa ]; then mkdir -m 0755 /usr/local/libexec/umsa; fi
test "$(realpath /usr/local/libexec/umsa)" = /usr/local/libexec/umsa
test "$(stat -c %u:%g:%a /usr/local/libexec/umsa)" = 0:0:755
place() {
  if [ -e "$2" ] || [ -L "$2" ]; then
    test -f "$2" && test ! -L "$2" && cmp "$1" "$2" && test "$(stat -c %u:%g:%a "$2")" = 0:0:644
  else
    temp=$(mktemp "$(dirname "$2")/.umsa-static-install-XXXXXXXX")
    if install -m 0644 -o root -g root "$1" "$temp" && ln -T "$temp" "$2"; then rm "$temp"; else rm "$temp"; return 1; fi
  fi
}
place share-static.py /usr/local/libexec/umsa/share-static.py
systemd-analyze verify "$work/umsa-share-static.service"
place umsa-share-static.service /etc/systemd/system/umsa-share-static.service
systemctl daemon-reload
test "$(systemctl show -p FragmentPath --value umsa-share-static.service)" = /etc/systemd/system/umsa-share-static.service
test -z "$(systemctl show -p DropInPaths --value umsa-share-static.service)"
test "$(systemctl show -p UnitFileState --value umsa-share-static.service)" = static
sha256sum /usr/local/libexec/umsa/share-static.py /etc/systemd/system/umsa-share-static.service
systemctl show umsa-share-static.service -p UnitFileState -p ActiveState -p LoadState
start=$(date -u +%s)
if ! systemctl start umsa-share-static.service; then
    journalctl -u umsa-share-static.service --since="@$start" --no-pager -o cat
    exit 1
fi
test "$(systemctl show -p Result --value umsa-share-static.service)" = success
test "$(systemctl show -p ConditionResult --value umsa-share-static.service)" = yes
journalctl -u umsa-share-static.service --since="@$start" --no-pager -o cat
df -B1 --output=avail /srv
"""
subprocess.run(['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(known),'root@179.198.115.115','bash -se'],input=shell,text=True,check=True)
