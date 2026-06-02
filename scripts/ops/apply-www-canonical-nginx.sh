#!/usr/bin/env bash
set -euo pipefail

SITE_FILES_ENV="${SITE_FILES:-/etc/nginx/sites-enabled/ultimamilla.com.ar:/etc/nginx/sites-available/ultimamilla.com.ar}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/nginx-www-canonical-backups}"
DRY_RUN="${DRY_RUN:-0}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
TMP_DIR="$(mktemp -d)"

IFS=':' read -r -a SITE_FILES <<< "$SITE_FILES_ENV"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

log() {
  printf '[www-canonical] %s\n' "$*"
}

changed_files=()

restore_backups() {
  if [ "${#changed_files[@]}" -eq 0 ]; then
    return 0
  fi

  log "Restoring Nginx files from $BACKUP_DIR"
  for file in "${changed_files[@]}"; do
    backup_file="${BACKUP_DIR}${file}"
    if [ -f "$backup_file" ]; then
      cp "$backup_file" "$file"
    fi
  done
}

transform_file() {
  local source_file="$1"
  local output_file="$2"

  node - "$source_file" "$output_file" <<'NODE'
const fs = require('fs');

const [sourceFile, outputFile] = process.argv.slice(2);
let content = fs.readFileSync(sourceFile, 'utf8');
const original = content;

const cert = content.match(/ssl_certificate\s+([^;]+);/)?.[1] || '/etc/letsencrypt/live/ultimamilla.com.ar-0001/fullchain.pem';
const certKey = content.match(/ssl_certificate_key\s+([^;]+);/)?.[1] || '/etc/letsencrypt/live/ultimamilla.com.ar-0001/privkey.pem';

const apexRedirectBlock = `# ====================================================================
# Apex to WWW Redirect (SEO canonical - 301 Permanent)
# ====================================================================
server {
    listen 80;
    listen 443 ssl http2;
    server_name ultimamilla.com.ar;

    ssl_certificate ${cert};
    ssl_certificate_key ${certKey};

    return 301 https://www.ultimamilla.com.ar$request_uri;
}`;

const existingWwwToApexBlock = /# ====================================================================\n# WWW to non-WWW Redirect[\s\S]*?# ====================================================================\nserver\s*\{\s*listen 80;\s*listen 443 ssl http2;\s*server_name www\.ultimamilla\.com\.ar;[\s\S]*?return 301 https:\/\/ultimamilla\.com\.ar\$request_uri;\s*\n\}/m;

if (existingWwwToApexBlock.test(content)) {
  content = content.replace(existingWwwToApexBlock, apexRedirectBlock);
} else if (!/Apex to WWW Redirect/.test(content)) {
  content = `${apexRedirectBlock}\n\n${content}`;
}

const protectedBlocks = [];
content = content.replace(
  /# ====================================================================\n# Apex to WWW Redirect[\s\S]*?return 301 https:\/\/www\.ultimamilla\.com\.ar\$request_uri;\s*\n\}/m,
  (match) => {
    protectedBlocks.push(match);
    return `__UMSA_CANONICAL_REDIRECT_BLOCK_${protectedBlocks.length - 1}__`;
  },
);

content = content
  .replace(/server_name\s+ultimamilla\.com\.ar\s+www\.ultimamilla\.com\.ar\s*;/g, 'server_name www.ultimamilla.com.ar;')
  .replace(/server_name\s+www\.ultimamilla\.com\.ar\s+ultimamilla\.com\.ar\s*;/g, 'server_name www.ultimamilla.com.ar;')
  .replace(/server_name\s+ultimamilla\.com\.ar\s*;/g, 'server_name www.ultimamilla.com.ar;')
  .replace(
    /if\s*\(\$host = ultimamilla\.com\.ar\)\s*\{\s*return 301 https:\/\/\$host\$request_uri;\s*\}/g,
    'if ($host = ultimamilla.com.ar) {\n        return 301 https://www.ultimamilla.com.ar$request_uri;\n    }',
  );

content = content.replace(/__UMSA_CANONICAL_REDIRECT_BLOCK_(\d+)__/g, (_, index) => protectedBlocks[Number(index)]);

const failures = [];
if (!/server_name\s+ultimamilla\.com\.ar\s*;[\s\S]*?return 301 https:\/\/www\.ultimamilla\.com\.ar\$request_uri;/.test(content)) {
  failures.push('missing apex to www redirect server block');
}
if (/return 301 https:\/\/ultimamilla\.com\.ar\$request_uri;/.test(content)) {
  failures.push('still redirects to apex domain');
}
if (/server_name\s+(ultimamilla\.com\.ar\s+www\.ultimamilla\.com\.ar|www\.ultimamilla\.com\.ar\s+ultimamilla\.com\.ar)\s*;/.test(content)) {
  failures.push('application server block still serves both apex and www');
}
if (failures.length > 0) {
  console.error(`Invalid transformed Nginx config for ${sourceFile}: ${failures.join(', ')}`);
  process.exit(1);
}

fs.writeFileSync(outputFile, content);
if (content === original) {
  process.exitCode = 10;
}
NODE
}

if [ "$DRY_RUN" != "1" ]; then
  mkdir -p "$BACKUP_DIR"
  log "Checking current Nginx configuration"
  nginx -t
else
  log "DRY_RUN=1: no files will be changed and Nginx will not be reloaded"
fi

for file in "${SITE_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    log "Skipping missing file: $file"
    continue
  fi

  tmp_file="${TMP_DIR}/$(basename "$file").transformed"
  if transform_file "$file" "$tmp_file"; then
    :
  else
    status=$?
    if [ "$status" -eq 10 ]; then
      log "No canonical redirect change needed in $file"
      continue
    fi
    exit "$status"
  fi

  if cmp -s "$file" "$tmp_file"; then
    log "No canonical redirect change needed in $file"
    continue
  fi

  if [ "$DRY_RUN" = "1" ]; then
    log "Diff for $file"
    diff -u "$file" "$tmp_file" || true
    continue
  fi

  backup_file="${BACKUP_DIR}${file}"
  mkdir -p "$(dirname "$backup_file")"
  cp "$file" "$backup_file"
  cp "$tmp_file" "$file"
  changed_files+=("$file")
  log "Updated $file"
done

if [ "$DRY_RUN" = "1" ]; then
  exit 0
fi

if [ "${#changed_files[@]}" -eq 0 ]; then
  log "No files changed; validating current public routing"
else
  log "Validating transformed Nginx configuration"
  if ! nginx -t; then
    restore_backups
    nginx -t || true
    exit 1
  fi

  log "Reloading Nginx"
  if ! systemctl reload nginx; then
    restore_backups
    nginx -t || true
    systemctl reload nginx || true
    exit 1
  fi
fi

check_public_routing() {
  local www_headers apex_headers
  www_headers="$(curl -4 -sSI --max-time 20 https://www.ultimamilla.com.ar/ || true)"
  apex_headers="$(curl -4 -sSI --max-time 20 https://ultimamilla.com.ar/ || true)"

  printf '%s\n%s\n' '--- www headers ---' "$www_headers"
  printf '%s\n%s\n' '--- apex headers ---' "$apex_headers"

  if ! printf '%s\n' "$www_headers" | grep -Eq '^HTTP/[0-9.]+ 200'; then
    log "Expected www.ultimamilla.com.ar to return 200 without redirect"
    return 1
  fi
  if printf '%s\n' "$www_headers" | grep -Eiq '^location:'; then
    log "Expected www.ultimamilla.com.ar to avoid Location redirects"
    return 1
  fi
  if ! printf '%s\n' "$apex_headers" | grep -Eq '^HTTP/[0-9.]+ 30(1|8)'; then
    log "Expected apex ultimamilla.com.ar to return a permanent redirect"
    return 1
  fi
  if ! printf '%s\n' "$apex_headers" | grep -Eiq '^location: https://www\.ultimamilla\.com\.ar/'; then
    log "Expected apex Location header to point to https://www.ultimamilla.com.ar/"
    return 1
  fi
}

if ! check_public_routing; then
  if [ "${#changed_files[@]}" -gt 0 ]; then
    restore_backups
    nginx -t || true
    systemctl reload nginx || true
  fi
  exit 1
fi

log "Canonical host routing is correct"
