#!/usr/bin/env bash
# Remove only reproducible dependencies in eleven audited, inactive June releases.
# Default is read-only. Current, builds, databases, uploads and .env files are retained.
set -euo pipefail
mode="${1:---plan}"
[[ "$mode" == --plan || "$mode" == --apply ]] || { echo 'Use --plan or --apply' >&2; exit 2; }
base=/var/www/umbot-aceite
expected="$base/releases/20260627-2002-e960e06"
active="$(readlink -e "$base/current")"
[[ "$active" == "$expected" ]] || { echo 'Current release changed; audit must be repeated' >&2; exit 1; }
names=(20260624-1540 20260624-1545 20260624-1602 20260624-1627 20260624-1635 20260624-1701 20260624-1705 20260624-1712 20260624-1906 20260624-1925 20260624-1930)
targets=(); total_kb=0
for name in "${names[@]}"; do
  release="$base/releases/$name"; target="$release/node_modules"
  [[ -d "$release" && ! -L "$release" ]] || { echo "Unexpected release: $name" >&2; exit 1; }
  [[ "$release" != "$active" ]] || exit 1
  # Dependencies may already have been removed by a completed maintenance run.
  [[ -e "$target" ]] || continue
  [[ -d "$target" && ! -L "$target" && "$(readlink -e "$target")" == "$target" ]] || exit 1
  [[ "$(stat -c %d "$target")" == "$(stat -c %d "$base")" ]] || exit 1
  if mountpoint -q "$target"; then echo "Refusing mounted target: $name" >&2; exit 1; fi
  for cwd in /proc/[0-9]*/cwd; do
    process_dir="$(readlink -e "$cwd" 2>/dev/null || true)"
    case "$process_dir" in "$release"|"$release"/*) echo "Release in use: $name" >&2; exit 1;; esac
  done
  [[ -f "$target/.package-lock.json" && -f "$release/package.json" ]] || { echo "Dependency inventory missing: $name" >&2; exit 1; }
  kb="$(du -sk "$target" | cut -f1)"; total_kb=$((total_kb + kb)); targets+=("$target")
  printf '%s\t%s KiB\n' "$target" "$kb"
done
echo "mode=$mode targets=${#targets[@]} reclaimable_kb=$total_kb current=$active"
df -h "$base"
if [[ "$mode" == --plan ]]; then exit 0; fi
[[ "$(readlink -e "$base/current")" == "$expected" ]] || exit 1
# This receipt contains hashes only. No .env values or database contents are emitted.
receipt="$(mktemp /tmp/umbot-dependency-retention.XXXXXX)"
trap 'rm -f "$receipt"' EXIT
for name in "${names[@]}"; do
  release="$base/releases/$name"
  if [[ -f "$release/node_modules/.package-lock.json" ]]; then
    inventory="$release/dependency-inventory.retained.json"
    if [[ -e "$inventory" ]]; then cmp --quiet "$release/node_modules/.package-lock.json" "$inventory"; else cp -p "$release/node_modules/.package-lock.json" "$inventory"; fi
    sha256sum "$inventory"
  fi
  find "$release" -path "$release/node_modules" -prune -o -type f -print0 |
    sort -z | xargs -0 -r sha256sum >> "$receipt"
done
sha256sum "$receipt"
for target in "${targets[@]}"; do
  [[ "$(readlink -e "$base/current")" == "$expected" ]] || exit 1
  for cwd in /proc/[0-9]*/cwd; do
    process_dir="$(readlink -e "$cwd" 2>/dev/null || true)"
    case "$process_dir" in "${target%/node_modules}"|"${target%/node_modules}"/*) echo 'Release became active; stopping' >&2; exit 1;; esac
  done
  rm -rf -- "$target"
  echo "Removed inactive dependencies: $target"
done
sha256sum --quiet -c "$receipt"
echo 'Retained builds, package locks, configuration and databases verified'
df -h "$base"
