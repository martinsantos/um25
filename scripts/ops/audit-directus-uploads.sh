#!/usr/bin/env bash
# Read-only inventory of historical uploads backups; no pruning is implemented.
set -euo pipefail
mode="${1:---plan}"
[[ "$mode" == --plan ]] || { echo "Read-only audit only; cleanup proposal withheld after checkpoint review"; exit 2; }
base=/opt/directus-backups
[[ -d "$base" && ! -L "$base" && "$(readlink -e "$base")" == "$base" ]] || exit 1
expected='fingerprint=18bebdbeeafc2ddc5a21c45b44e68075b1a0acb2ce725b15ca7b8678a8ba6c85
archive=directus-uploads-20260923-020001.tar.gz'
[[ "$(<"$base/directus-uploads-content.state")" == "$expected" ]] || { echo 'Uploads changed; repeat audit'; exit 1; }
names=(
  directus-uploads-20260630-020001.tar.gz:956164103
  directus-uploads-20260711-221307.tar.gz:956164103
  directus-uploads-20260712-000526.tar.gz:956164111
  directus-uploads-20260712-020002.tar.gz:956164179
  directus-uploads-20260713-020002.tar.gz:956164102
  directus-uploads-20260714-020001.tar.gz:956164102
  directus-uploads-20260728-020001.tar.gz:956164181
  directus-uploads-20260729-020001.tar.gz:956164175
  directus-uploads-20260814-020001.tar.gz:956164174
)
retained=(
  directus-uploads-20260831-020001.tar.gz:2df47c51c05579c4fa1712997d60b5e418bcc1b6fe0fc775fcc66aaadd0a075c
  directus-uploads-20260905-020002.tar.gz:649a276d3f7940c8e511383adcd77f7cbbaf5d922e928c5513d30c02ab639e71
  directus-uploads-20260923-020001.tar.gz:8a3e90b913c8140fd41fd31074c7ec59322349aae2894c52253d13bed6c91d46
)
for item in "${retained[@]}"; do
  file="$base/${item%%:*}"
  [[ -f "$file" && ! -L "$file" ]] || exit 1
  printf '%s  %s\n' "${item#*:}" "$file" | sha256sum --quiet -c -
done
db="$base/directus-db-20261004-020001.sql.gz"
[[ -f "$db" && ! -L "$db" ]] || exit 1
gzip -t "$db"
[[ $(find "$base" -maxdepth 1 -type f -name 'directus-db-*.sql.gz' -mmin -2880 | wc -l) -ge 1 ]] || exit 1
total=0; targets=()
for item in "${names[@]}"; do
  file="$base/${item%%:*}"
  [[ -e "$file" ]] || continue
  [[ -f "$file" && ! -L "$file" && "$(stat -c %h "$file")" == 1 ]] || exit 1
  [[ "$(stat -c %s "$file")" == "${item#*:}" && "$(stat -c %d "$file")" == "$(stat -c %d "$base")" ]] || exit 1
  printf 'historical=%s bytes=%s\n' "${item%%:*}" "${item#*:}"
  total=$((total + ${item#*:})); targets+=("$file")
done
printf 'mode=%s targets=%s archive_bytes=%s retained_uploads=3\n' "$mode" "${#targets[@]}" "$total"
df -h "$base"
for file in "${targets[@]}"; do
  refs="$(grep -Flx "uploads=${file##*/}" "$base"/directus-checkpoint-*.txt | wc -l || true)"
  printf 'historical=%s preserved_checkpoint_refs=%s
' "${file##*/}" "$refs"
done
echo 'Audit only. Every checkpoint reference must remain restorable; no archives are removed.'
