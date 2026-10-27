#!/usr/bin/env bash
# Initial migration only: the source is read-only, all writes are isolated on target.
set -euo pipefail
umask 077
phase=${1:-preflight}
case "$phase" in preflight|bootstrap|copy-data|copy-runtime|install-runtime|snapshot-data|restore-databases|recover-empty-storage|materialize-files|rehearsal|prepare-mail|build-clean-web|finish-file-validation|finish-mariadb|build-clean-sitrep|build-clean-arca|build-clean-sgi|rotate-internal|build-clean-cms|clean-node-rehearsal|clean-container-rehearsal|clean-php-rehearsal|clean-tools-plan|rehearsal-bridges|clean-proxy-rehearsal|finish-clean-runtime|restrict-database|finish-clean-proxy|persist-rehearsal|rehearse-web-publisher|refresh-rehearsal-data|finish-web-publisher|prepare-backup-identity|prepare-acme|finish-acme|rehearse-offsite-backups|rehearse-backup-restore|guard-wiki-uploads|stage-mutable-files) ;; *) echo 'Unknown phase' >&2; exit 2 ;; esac
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

if [[ "$phase" == stage-mutable-files ]]; then
  [[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]
  scp "${ssh_opts[@]}" "$script_dir/stage-mutable-files.py" "root@$target_host:$stage/tooling/"
  ssh -A "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/stage-mutable-files.py $GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
  exit 0
fi

if [[ "$phase" == guard-wiki-uploads ]]; then
  scp "${ssh_opts[@]}" "$script_dir/guard-wiki-uploads.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/guard-wiki-uploads.py"
  exit 0
fi

if [[ "$phase" == rehearse-backup-restore ]]; then
  scp "${ssh_opts[@]}" "$script_dir/rehearse-backup-restore.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/rehearse-backup-restore.py"
  exit 0
fi

if [[ "$phase" == rehearse-offsite-backups ]]; then
  [[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]
  scp "${ssh_opts[@]}" "$script_dir/rehearse-offsite-backups.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/rehearse-offsite-backups.py $GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
  exit 0
fi

if [[ "$phase" == finish-acme ]]; then
  scp "${ssh_opts[@]}" "$script_dir/prepare-acme.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/prepare-acme.py --resume-after-reload"
  exit 0
fi

if [[ "$phase" == prepare-acme ]]; then
  scp "${ssh_opts[@]}" "$script_dir/prepare-acme.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/prepare-acme.py"
  exit 0
fi

if [[ "$phase" == prepare-backup-identity ]]; then
  scp "${ssh_opts[@]}" "$script_dir/prepare-backup-identity.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/prepare-backup-identity.py"
  exit 0
fi

if [[ "$phase" == finish-web-publisher ]]; then
  scp "${ssh_opts[@]}" "$script_dir/publish-web.py" "$script_dir/finish-web-publisher.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/finish-web-publisher.py"
  exit 0
fi

if [[ "$phase" == refresh-rehearsal-data ]]; then
  [[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]
  scp "${ssh_opts[@]}" "$script_dir/refresh-rehearsal-data.py" "$script_dir/sqlite-snapshot.py" "root@$target_host:$stage/tooling/"
  ssh -A "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/refresh-rehearsal-data.py $GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
  exit 0
fi

if [[ "$phase" == rehearse-web-publisher ]]; then
  bash "$script_dir/ship-web-build.sh" rehearse
  exit 0
fi

if [[ "$phase" == persist-rehearsal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/persist-rehearsal.py" "$script_dir/check-bridge.py" "$script_dir/rehearsal-bridges.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/persist-rehearsal.py"
  exit 0
fi

if [[ "$phase" == finish-clean-proxy ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-proxy-rehearsal.py" "$script_dir/rehearsal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-proxy-rehearsal.py --retry-dangling-config"
  exit 0
fi

if [[ "$phase" == restrict-database ]]; then
  scp "${ssh_opts[@]}" "$script_dir/restrict-database.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/restrict-database.py"
  exit 0
fi

if [[ "$phase" == finish-clean-runtime ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-tools-plan.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-tools-plan.py --finish-config"
  exit 0
fi

if [[ "$phase" == clean-proxy-rehearsal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-proxy-rehearsal.py" "$script_dir/rehearsal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-proxy-rehearsal.py"
  exit 0
fi

if [[ "$phase" == rehearsal-bridges ]]; then
  scp "${ssh_opts[@]}" "$script_dir/rehearsal-bridges.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/rehearsal-bridges.py"
  exit 0
fi

if [[ "$phase" == clean-tools-plan ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-tools-plan.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-tools-plan.py"
  exit 0
fi

if [[ "$phase" == clean-php-rehearsal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-php-rehearsal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-php-rehearsal.py"
  exit 0
fi

if [[ "$phase" == clean-container-rehearsal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-container-rehearsal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-container-rehearsal.py"
  exit 0
fi

if [[ "$phase" == clean-node-rehearsal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/clean-node-rehearsal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/clean-node-rehearsal.py"
  exit 0
fi

if [[ "$phase" == build-clean-cms ]]; then
  python3 "$script_dir/clean-cms.py"
  exit 0
fi

if [[ "$phase" == build-clean-sgi ]]; then
  python3 "$script_dir/clean-sgi.py"
  exit 0
fi

if [[ "$phase" == build-clean-sitrep ]]; then
  python3 "$script_dir/clean-sitrep.py"
  exit 0
fi

if [[ "$phase" == build-clean-arca ]]; then
  python3 "$script_dir/clean-arca.py"
  exit 0
fi

if [[ "$phase" == build-clean-web ]]; then
  [[ "${GITHUB_SHA:-}" =~ ^[0-9a-f]{40}$ ]]
  test -s "${CLEAN_WEB_PACKAGE:-}"
  package_sha=$(sha256sum "$CLEAN_WEB_PACKAGE" | cut -d' ' -f1)
  [[ "$package_sha" =~ ^[0-9a-f]{64}$ ]]
  destination="$stage/trusted/umsa-$GITHUB_SHA"
  ssh "${ssh_opts[@]}" "root@$target_host" "test ! -e '$destination' && install -d -m 0700 '$destination'"
  scp "${ssh_opts[@]}" "$CLEAN_WEB_PACKAGE" "root@$target_host:$destination/package.tar.gz"
  ssh "${ssh_opts[@]}" "root@$target_host" bash -s -- "$GITHUB_SHA" "$package_sha" <<'TARGET'
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
test "$(cat /srv/umsa-migration/.target)" = 179.198.115.115
revision=$1
expected=$2
[[ "$revision" =~ ^[0-9a-f]{40}$ && "$expected" =~ ^[0-9a-f]{64}$ ]]
destination="/srv/umsa-migration/trusted/umsa-$revision"
test ! -L "$destination"
cd "$destination"
printf '%s  package.tar.gz\n' "$expected" | sha256sum --check
mkdir application
tar --no-same-owner -xzf package.tar.gz -C application
test -s application/dist/server/entry.mjs
printf 'repository=martinsantos/um25\nrevision=%s\narchive_sha256=%s\nnode=20.19.6\n' "$revision" "$expected" > provenance.txt
printf '%s\n' "$destination" > /srv/umsa-migration/trusted-web
printf 'Clean UMSA artifact prepared from reviewed Git. No application activated.\n'
TARGET
  exit 0
fi

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

if [[ "$phase" == rotate-internal ]]; then
  scp "${ssh_opts[@]}" "$script_dir/rotate-internal.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/rotate-internal.py"
  exit 0
fi

if [[ "$phase" == finish-mariadb ]]; then
  scp "${ssh_opts[@]}" "$script_dir/restore-databases.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/restore-databases.py --finish-mariadb"
  exit 0
fi

if [[ "$phase" == finish-file-validation ]]; then
  scp "${ssh_opts[@]}" "$script_dir/materialize-files.py" "root@$target_host:$stage/tooling/"
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/materialize-files.py --finish-validation"
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

if [[ "$phase" == restore-databases || "$phase" == recover-empty-storage ]]; then
  ssh "${ssh_opts[@]}" "root@$target_host" 'test "$(hostname)" = srv2101069.hstgr.cloud && test "$(cat /srv/umsa-migration/.target)" = 179.198.115.115 && install -d -m 0700 /srv/umsa-migration/tooling'
  scp "${ssh_opts[@]}" "$script_dir/restore-databases.py" "root@$target_host:$stage/tooling/"
  recovery_arg=''
  [[ "$phase" != recover-empty-storage ]] || recovery_arg='--recover-empty-storage'
  ssh "${ssh_opts[@]}" "root@$target_host" "python3 $stage/tooling/restore-databases.py $recovery_arg"
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
