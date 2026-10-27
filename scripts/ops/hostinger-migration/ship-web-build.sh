#!/usr/bin/env bash
# Transfer only a freshly built package to the pinned Hostinger destination.
set -euo pipefail
mode=${1:-}
case "$mode" in rehearse|publish) ;; *) exit 2 ;; esac
[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ && "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]
test -s "$CLEAN_WEB_PACKAGE"
scripts=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ssh_opts=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$scripts/known_hosts" -o ConnectTimeout=15 -o ServerAliveInterval=30)
target=root@179.198.115.115
stage=/srv/umsa-migration
identifier="$GITHUB_SHA-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
digest=$(sha256sum "$CLEAN_WEB_PACKAGE" | cut -d' ' -f1)
[[ "$digest" =~ ^[0-9a-f]{64}$ ]]
ssh "${ssh_opts[@]}" "$target" "test \"\$(hostname)\" = srv2101069.hstgr.cloud && test ! -L $stage && test \"\$(cat $stage/.target)\" = 179.198.115.115 && test -f $stage/persist-rehearsal.complete && install -d -m 0700 $stage/incoming && test ! -e $stage/incoming/$identifier.tar.gz"
scp "${ssh_opts[@]}" "$CLEAN_WEB_PACKAGE" "$target:$stage/incoming/$identifier.tar.gz"
scp "${ssh_opts[@]}" "$scripts/publish-web.py" "$target:$stage/tooling/publish-web.py"
ssh "${ssh_opts[@]}" "$target" "python3 $stage/tooling/publish-web.py $mode $GITHUB_SHA $GITHUB_RUN_ID $GITHUB_RUN_ATTEMPT $digest"
