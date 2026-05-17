#!/usr/bin/env bash
set -euo pipefail

SITES_ENABLED="${SITES_ENABLED:-/etc/nginx/sites-enabled}"
DISABLED_ROOT="${DISABLED_ROOT:-/etc/nginx/disabled-enabled-backups}"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
DISABLED_DIR="$DISABLED_ROOT/$RUN_ID"

if [ ! -d "$SITES_ENABLED" ]; then
  echo "Missing Nginx enabled-sites directory: $SITES_ENABLED" >&2
  exit 1
fi

if ! nginx -t; then
  echo "Nginx config is not valid before cleanup; refusing to move files." >&2
  exit 1
fi

mkdir -p "$DISABLED_DIR"
moved=0

restore_moved_files() {
  if [ "$moved" -eq 0 ]; then
    return
  fi

  for item in "$DISABLED_DIR"/*; do
    [ -e "$item" ] || continue
    mv "$item" "$SITES_ENABLED/$(basename "$item")"
  done
}

for item in "$SITES_ENABLED"/*; do
  [ -e "$item" ] || continue
  name="$(basename "$item")"

  case "$name" in
    *.bak|*.bak.*|*.backup|*.backup.*|*backup*|*.old|*.save)
      echo "Disabling enabled backup config: $name"
      mv "$item" "$DISABLED_DIR/$name"
      moved=$((moved + 1))
      ;;
  esac
done

if ! nginx -t; then
  echo "Nginx config failed after cleanup; restoring moved files." >&2
  restore_moved_files
  nginx -t || true
  exit 1
fi

systemctl reload nginx

if [ "$moved" -eq 0 ]; then
  echo "No enabled backup configs found."
else
  echo "Disabled $moved enabled backup config(s)."
  echo "Moved files to: $DISABLED_DIR"
fi
