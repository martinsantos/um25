#!/usr/bin/env bash
# Replay POST de las 3 notas del 2026-04-30 — usar tras rotar credenciales.
# Requiere variables de entorno: UMSA_BLOG_USER y UMSA_BLOG_PASS
set -euo pipefail
if [ -z "${UMSA_BLOG_USER:-}" ] || [ -z "${UMSA_BLOG_PASS:-}" ]; then
  echo "ERROR: exporta UMSA_BLOG_USER y UMSA_BLOG_PASS antes de correr este script."
  exit 1
fi
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="https://ultimamilla.com.ar/api/blog"
AUTH="$(printf '%s:%s' "$UMSA_BLOG_USER" "$UMSA_BLOG_PASS" | base64 | tr -d '\n')"
for slot in A B C; do
  body=$(python3 -c "import json; p=json.load(open('$DIR/payloads_listos.json')); print(json.dumps([n['payload'] for n in p if n['slot']=='$slot'][0], ensure_ascii=False))")
  echo "POST slot $slot ..."
  curl -sS -L --post301 --post302 -X POST "$URL" \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json" \
    -H "User-Agent: UMSA-Blog-Editor/1.0" \
    -d "$body" | tee "$DIR/post_resp_$slot.json"
  echo
done
