#!/usr/bin/env bash

set -euo pipefail

# The public site is owned by astro-ultimamilla. The legacy astro-app name is
# allowlisted here because it has been observed as an orphaned restart loop.
if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 is required to clean stale processes" >&2
  exit 1
fi

if pm2 describe astro-app >/dev/null 2>&1; then
  echo "Removing stale PM2 process astro-app"
  pm2 del astro-app
else
  echo "No stale PM2 process astro-app found"
fi
