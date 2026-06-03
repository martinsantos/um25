#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH="${NGINX_UMSA_SITE:-/etc/nginx/sites-enabled/ultimamilla.com.ar}"
BACKUP_DIR="${NGINX_UMSA_BACKUP_DIR:-/etc/nginx/umsa-canonical-backups}"
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/ultimamilla.com.ar.$STAMP.bak"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Nginx site config not found: $CONFIG_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "$CONFIG_PATH" "$BACKUP_PATH"

restore_backup() {
  cp "$BACKUP_PATH" "$CONFIG_PATH"
}

python3 - "$CONFIG_PATH" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
source = path.read_text()
original = source

redirect_block = """# ====================================================================
# Apex to WWW Redirect (SEO Fix - 301 Permanent)
# ====================================================================
server {
    listen 443 ssl http2;
    server_name ultimamilla.com.ar;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ultimamilla.com.ar-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ultimamilla.com.ar-0001/privkey.pem;

    # Redirect permanente a www
    return 301 https://www.ultimamilla.com.ar$request_uri;
}
"""

source, count = re.subn(
    r"# ====================================================================\n"
    r"# WWW to non-WWW Redirect \(SEO Fix - 301 Permanent\)\n"
    r"# ====================================================================\n"
    r"server \{\n"
    r"    listen 80;\n"
    r"    listen 443 ssl http2;\n"
    r"    server_name www\.ultimamilla\.com\.ar;\n"
    r"    \n"
    r"    # SSL certificates\n"
    r"    ssl_certificate /etc/letsencrypt/live/ultimamilla\.com\.ar-0001/fullchain\.pem;\n"
    r"    ssl_certificate_key /etc/letsencrypt/live/ultimamilla\.com\.ar-0001/privkey\.pem;\n"
    r"    \n"
    r"    # Redirect permanente a sin www\n"
    r"    return 301 https://ultimamilla\.com\.ar\$request_uri;\n"
    r"\}\n",
    redirect_block,
    source,
    count=1,
)

if count == 0 and "Apex to WWW Redirect (SEO Fix - 301 Permanent)" not in source:
    raise SystemExit("Could not locate legacy www-to-apex redirect block")

source, main_count = re.subn(
    r"(server \{\n"
    r"    listen 443 ssl http2;\n"
    r"    server_name )ultimamilla\.com\.ar(;\s+"
    r"# Configuración SSL)",
    r"\1www.ultimamilla.com.ar\2",
    source,
    count=1,
)

if main_count == 0 and "server_name www.ultimamilla.com.ar;        \n    # Configuración SSL" not in source:
    raise SystemExit("Could not locate main apex SSL server block")

source = source.replace(
    "listen 80;\n    server_name ultimamilla.com.ar;    ",
    "listen 80;\n    server_name ultimamilla.com.ar www.ultimamilla.com.ar;    ",
    1,
)
source = source.replace(
    "return 301 https://$host$request_uri;",
    "return 301 https://www.ultimamilla.com.ar$request_uri;",
)
source = source.replace(
    "location / {\n        return 301 https://$host$request_uri;\n    }",
    "location / {\n        return 301 https://www.ultimamilla.com.ar$request_uri;\n    }",
    1,
)
source = re.sub(
    r"\n    if \(\$host = (?:www\.)?ultimamilla\.com\.ar\) \{\n"
    r"        return 301 https://www\.ultimamilla\.com\.ar\$request_uri;\n"
    r"    \} # managed by Certbot\n\n",
    "\n",
    source,
)

if source == original:
    print("Nginx canonical policy already up to date")
else:
    path.write_text(source)
    print("Updated Nginx canonical policy to www")
PY

if [[ "${NGINX_UMSA_VALIDATE_ONLY:-0}" == "1" ]]; then
  echo "Validation-only mode enabled; skipping nginx reload and remote HTTP checks"
  exit 0
fi

if ! nginx -t; then
  echo "nginx -t failed; restoring $BACKUP_PATH" >&2
  restore_backup
  nginx -t || true
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  nginx -s reload
fi

for attempt in {1..10}; do
  APEX_CHECK="$(curl -4 -sS -o /dev/null --max-time 20 -w "%{http_code} %{redirect_url}" https://ultimamilla.com.ar/ || true)"
  WWW_CHECK="$(curl -4 -sS -o /dev/null --max-time 20 -w "%{http_code}" https://www.ultimamilla.com.ar/ || true)"
  DIRECTUS_PING="$(curl -4 -sS --max-time 20 https://www.ultimamilla.com.ar/directus/server/ping || true)"

  echo "attempt $attempt apex check: $APEX_CHECK"
  echo "attempt $attempt www check: $WWW_CHECK"
  echo "attempt $attempt directus ping: $DIRECTUS_PING"

  if [[ "$WWW_CHECK" == "200" ]] && \
     [[ "$DIRECTUS_PING" == "pong" ]] && \
     [[ "$APEX_CHECK" =~ ^30(1|8)[[:space:]]+https://www\.ultimamilla\.com\.ar/ ]]; then
    echo "WWW canonical Nginx policy applied successfully"
    exit 0
  fi

  sleep 3
done

echo "WWW canonical checks did not converge after retries" >&2
exit 1
