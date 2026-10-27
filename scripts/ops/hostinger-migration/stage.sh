#!/usr/bin/env bash
# Initial migration only: the source is read-only, all writes are isolated on target.
set -euo pipefail
umask 077
phase=${1:-preflight}
case "$phase" in preflight|bootstrap|copy-data|copy-runtime|install-runtime|snapshot-data|restore-databases|materialize-files|rehearsal|prepare-mail) ;; *) echo 'Unknown phase' >&2; exit 2 ;; esac
source_host=23.105.176.45
target_host=179.198.115.115
target_name=srv2101069.hstgr.cloud
stage=/srv/umsa-migration
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
known_hosts="$script_dir/known_hosts"
[[ "$source_host" != "$target_host" ]]
[[ -s "$known_hosts" ]]
ssh_opts=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$known_hosts" -o ConnectTimeout=15 -o ServerAliveInterval=30 -o ServerAliveCountMax=6)

# Fail closed if either SSH identity/host is wrong. No changes precede these checks.
actual_name=$(ssh "${ssh_opts[@]}" "root@$target_host" hostname)
[[ "$actual_name" == "$target_name" ]] || { echo 'Unexpected target hostname' >&2; exit 3; }
ssh "${ssh_opts[@]}" "root@$source_host" 'test -d /root/fumbling-field && test -d /opt/directus-admin && printf "Source application roots confirmed\n"'
ssh "${ssh_opts[@]}" "root@$target_host" 'test "$(id -u)" = 0; cat /etc/os-release; nproc; free -m; df -h /'
[[ "$phase" != preflight ]] || exit 0

if [[ "$phase" == bootstrap ]]; then
  ssh "${ssh_opts[@]}" "root@$target_host" bash -s <<'TARGET'
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
source /etc/os-release
test "$ID" = almalinux
test "${VERSION_ID%%.*}" = 9
stage=/srv/umsa-migration
if [[ -e "$stage" ]]; then
  test ! -L "$stage"
  test "$(cat "$stage/.target")" = 179.198.115.115
else
  install -d -m 0700 "$stage"
  printf '179.198.115.115\n' > "$stage/.target"
fi
install -d -m 0700 "$stage/source" "$stage/receipts"
test "$(realpath "$stage/source")" = /srv/umsa-migration/source
dnf -y install rsync tar gzip python3 openssl
printf 'Staging utilities installed; no application started.\n'
TARGET
  scp "${ssh_opts[@]}" "$known_hosts" "root@$target_host:$stage/known_hosts"
  exit 0
fi

if [[ "$phase" == copy-runtime ]]; then
  ssh -A "${ssh_opts[@]}" "root@$target_host" bash -s <<'TARGET'
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
stage=/srv/umsa-migration
test ! -L "$stage"
test "$(cat "$stage/.target")" = 179.198.115.115
test "$(realpath "$stage/source")" = /srv/umsa-migration/source
test -S "$SSH_AUTH_SOCK"
receipt="$stage/receipts/runtime-copy-$(date -u +%Y%m%dT%H%M%SZ).log"
ionice -c3 nice -n 19 rsync -aHAX --numeric-ids --relative --timeout=180 --info=stats2 \
  --rsync-path='ionice -c3 nice -n 19 rsync' \
  -e "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$stage/known_hosts -o ConnectTimeout=15 -o ServerAliveInterval=30" \
  root@23.105.176.45:/usr/bin/node :/usr/bin/npm :/usr/bin/npx \
  :/usr/bin/pm2 :/usr/bin/pm2-dev :/usr/bin/pm2-docker :/usr/bin/pm2-runtime \
  :/usr/lib/node_modules/ :/usr/local/CyberCP/ :/usr/local/lscp/ :/usr/local/lsws/ \
  "$stage/source/" > "$receipt" 2>&1
printf 'Runtime files preserved; private receipt=%s\n' "$receipt"
TARGET
  exit 0
fi

if [[ "$phase" == snapshot-data ]]; then
  ssh "${ssh_opts[@]}" "root@$target_host" 'test "$(hostname)" = srv2101069.hstgr.cloud && test "$(cat /srv/umsa-migration/.target)" = 179.198.115.115 && install -d -m 0700 /srv/umsa-migration/tooling'
  scp "${ssh_opts[@]}" "$script_dir/snapshot-data.sh" "$script_dir/sqlite-snapshot.py" "root@$target_host:$stage/tooling/"
  ssh -A "${ssh_opts[@]}" "root@$target_host" "bash $stage/tooling/snapshot-data.sh"
  exit 0
fi

if [[ "$phase" == materialize-files ]]; then
  # Read-only proof from GitHub that this migration's initial copy completed.
  test -n "${GH_TOKEN:-}"
  proof=$(mktemp)
  trap 'rm -f "$proof"' EXIT
  gh api repos/martinsantos/um25/actions/runs/40498669903 > "$proof"
  python3 -c 'import json,sys; r=json.load(open(sys.argv[1])); assert r["id"] == 40498669903 and r["conclusion"] == "success" and r["event"] == "workflow_dispatch" and r["path"] == ".github/workflows/hostinger-migration.yml"' "$proof"
  scp "${ssh_opts[@]}" "$proof" "root@$target_host:$stage/receipts/initial-copy-run.json"
  scp "${ssh_opts[@]}" "$script_dir/materialize-files.py" "root@$target_host:$stage/tooling/"
  ssh -A "${ssh_opts[@]}" "root@$target_host" bash -s <<'TARGET'
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
stage=/srv/umsa-migration
test "$(cat "$stage/.target")" = 179.198.115.115
test "$(realpath "$stage/source")" = /srv/umsa-migration/source
ionice -c3 nice -n 19 rsync -aHAX --numeric-ids --relative --timeout=180 \
  --rsync-path='ionice -c3 nice -n 19 rsync' \
  -e "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$stage/known_hosts -o ConnectTimeout=15" \
  root@23.105.176.45:/var/lib/sgi-arca/ "$stage/source/" \
  > "$stage/receipts/sgi-arca-copy.log" 2>&1
python3 "$stage/tooling/materialize-files.py"
TARGET
  exit 0
fi

if [[ "$phase" == prepare-mail ]]; then
  scp "${ssh_opts[@]}" "$script_dir/prepare-mail.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/prepare-mail.py"
  exit 0
fi

if [[ "$phase" == rehearsal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/rehearsal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/rehearsal.py"
  exit 0
fi

if [[ "$phase" == restore-databases ]]; then
  ssh "${ssh_opts[@]}" "root@$target_host" 'test "$(hostname)" = srv2101069.hstgr.cloud && test "$(cat /srv/umsa-migration/.target)" = 179.198.115.115 && install -d -m 0700 /srv/umsa-migration/tooling'
  scp "${ssh_opts[@]}" "$script_dir/restore-databases.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/restore-databases.py"
  exit 0
fi

if [[ "$phase" == install-runtime ]]; then
  ssh "${ssh_opts[@]}" "root@$target_host" 'test "$(hostname)" = srv2101069.hstgr.cloud && test "$(cat /srv/umsa-migration/.target)" = 179.198.115.115 && install -d -m 0700 /srv/umsa-migration/tooling'
  scp "${ssh_opts[@]}" "$script_dir/runtime-accounts.py" "$script_dir/install-runtime.sh" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "bash $stage/tooling/install-runtime.sh"
  exit 0
fi

# Agent forwarding is limited to our newly provisioned target for this transfer.
# It avoids copying the source private key to either VPS. No private key or data
# archive is uploaded as a GitHub artifact. The forwarded agent ends with the job.
ssh -A "${ssh_opts[@]}" "root@$target_host" bash -s <<'TARGET'
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
stage=/srv/umsa-migration
test ! -L "$stage"
test "$(cat "$stage/.target")" = 179.198.115.115
test "$(realpath "$stage/source")" = /srv/umsa-migration/source
test -S "$SSH_AUTH_SOCK"
test -s "$stage/known_hosts"
available=$(df -Pk "$stage" | awk 'NR==2 {print $4}')
test "$available" -gt 104857600  # >100 GiB before the initial complete copy
receipt="$stage/receipts/copy-$(date -u +%Y%m%dT%H%M%SZ).log"
set +e
ionice -c3 nice -n 19 rsync -aHAX --numeric-ids --relative --timeout=180 --info=stats2 \
  --rsync-path='ionice -c3 nice -n 19 rsync' \
  --exclude='/root/.ssh/***' --exclude='/root/.cache/***' --exclude='/root/.npm/***' \
  -e "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$stage/known_hosts -o ConnectTimeout=15 -o ServerAliveInterval=30" \
  root@23.105.176.45:/root/ :/etc/ :/home/ :/opt/ :/var/www/ :/var/backups/ :/var/spool/cron/ \
  "$stage/source/" > "$receipt" 2>&1
result=$?
set -e
printf 'Transfer exit=%s; private receipt=%s\n' "$result" "$receipt"
df -h "$stage"
test "$result" = 0
printf 'Initial files copied. Live databases, Docker images, final sync, activation and DNS remain pending.\n'
TARGET
