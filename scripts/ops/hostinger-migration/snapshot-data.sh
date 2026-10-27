#!/usr/bin/env bash
# Initial rehearsal snapshots only. MyISAM requires a separate final write gate.
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
stage=/srv/umsa-migration
test ! -L "$stage"
test "$(cat "$stage/.target")" = 179.198.115.115
test -S "$SSH_AUTH_SOCK"
test -s "$stage/known_hosts"
snapshot="$stage/snapshots/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 0700 "$snapshot"
ssh_opts=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$stage/known_hosts" -o ConnectTimeout=15 -o ServerAliveInterval=30 -o ServerAliveCountMax=6)
source_host=root@23.105.176.45
receipt="$snapshot/receipt.log"

# Dumps, hashes, environment values and container metadata stay on the private VPS.
# Output pipelines fail closed and are named .partial until fully received.
ssh "${ssh_opts[@]}" "$source_host" 'docker exec directus-admin-database-1 pg_dumpall -U directus' 2>>"$receipt" | gzip -1 > "$snapshot/postgres-shared.sql.gz.partial"
gzip -t "$snapshot/postgres-shared.sql.gz.partial"
mv "$snapshot/postgres-shared.sql.gz.partial" "$snapshot/postgres-shared.sql.gz"
ssh "${ssh_opts[@]}" "$source_host" 'docker exec -u postgres dge-demo-db pg_dumpall -U postgres' 2>>"$receipt" | gzip -1 > "$snapshot/postgres-dge.sql.gz.partial"
gzip -t "$snapshot/postgres-dge.sql.gz.partial"
mv "$snapshot/postgres-dge.sql.gz.partial" "$snapshot/postgres-dge.sql.gz"

# No global write lock on the live source. This is NOT the final MyISAM snapshot.
ssh "${ssh_opts[@]}" "$source_host" 'mariadb-dump --no-defaults -uroot --all-databases --single-transaction --skip-lock-tables --routines --events --triggers --hex-blob' 2>>"$receipt" | gzip -1 > "$snapshot/mariadb-rehearsal.sql.gz.partial"
gzip -t "$snapshot/mariadb-rehearsal.sql.gz.partial"
mv "$snapshot/mariadb-rehearsal.sql.gz.partial" "$snapshot/mariadb-rehearsal.sql.gz"
ssh "${ssh_opts[@]}" "$source_host" 'python3 -' < "$stage/tooling/sqlite-snapshot.py" 2>>"$receipt" | gzip -1 > "$snapshot/aceite.sql.gz.partial"
gzip -t "$snapshot/aceite.sql.gz.partial"
mv "$snapshot/aceite.sql.gz.partial" "$snapshot/aceite.sql.gz"

ssh "${ssh_opts[@]}" "$source_host" 'docker ps -aq | xargs -r docker inspect' > "$snapshot/docker-inspect.json.partial" 2>>"$receipt"
python3 -m json.tool "$snapshot/docker-inspect.json.partial" > /dev/null
mv "$snapshot/docker-inspect.json.partial" "$snapshot/docker-inspect.json"
ssh "${ssh_opts[@]}" "$source_host" 'docker network ls -q | xargs -r docker network inspect' > "$snapshot/docker-networks.json.partial" 2>>"$receipt"
python3 -m json.tool "$snapshot/docker-networks.json.partial" > /dev/null
mv "$snapshot/docker-networks.json.partial" "$snapshot/docker-networks.json"
ssh "${ssh_opts[@]}" "$source_host" 'pm2 jlist' > "$snapshot/pm2.json.partial" 2>>"$receipt"
python3 -m json.tool "$snapshot/pm2.json.partial" > /dev/null
mv "$snapshot/pm2.json.partial" "$snapshot/pm2.json"

# Export exactly the container images in this snapshot, including historical rollbacks.
# The argument list is restricted to full hexadecimal image IDs before shell use.
images=$(python3 - "$snapshot/docker-inspect.json" <<'PY'
import json, re, sys
images = sorted({x['Image'] for x in json.load(open(sys.argv[1]))})
assert images and all(re.fullmatch(r'sha256:[0-9a-f]{64}', x) for x in images)
print(' '.join(images))
PY
)
ssh "${ssh_opts[@]}" "$source_host" "ionice -c3 nice -n 19 docker image save $images" 2>>"$receipt" | gzip -1 > "$snapshot/docker-images.tar.gz.partial"
gzip -t "$snapshot/docker-images.tar.gz.partial"
mv "$snapshot/docker-images.tar.gz.partial" "$snapshot/docker-images.tar.gz"
sha256sum "$snapshot"/*.gz "$snapshot"/*.json > "$snapshot/SHA256SUMS"
printf 'Initial rehearsal only; final MyISAM write gate and final synchronization remain required.\n' > "$snapshot/REHEARSAL-ONLY"
printf '%s\n' "$snapshot" > "$stage/latest-snapshot"
printf 'Private snapshots complete at %s; no services started or source files changed.\n' "$snapshot"
du -sh "$snapshot"
