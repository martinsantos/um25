#!/usr/bin/env bash
# Cabeceras de la fuente UM Sans en www.ultimamilla.com.ar para que el SGI
# (otro origen) pueda cargarla con @font-face y para que no se descargue en cada visita.
#
# Alcance: SÓLO el bloque server de www.ultimamilla.com.ar (listen 443) dentro de
# /etc/nginx/sites-enabled/ultimamilla.com.ar. No toca ningún otro server block ni
# archivo (sgi.ultimamilla.com.ar queda intacto) y verifica que el SGI responda igual
# antes y después; ante cualquier diferencia o error restaura el respaldo.
#
# Modos: UMSANS_FONT_MODE=dry-run (escribe, valida con nginx -t, muestra el diff y
# restaura, sin recargar) | apply (valida, recarga y verifica).
set -euo pipefail

CONFIG_PATH="${NGINX_UMSA_SITE:-/etc/nginx/sites-enabled/ultimamilla.com.ar}"
BACKUP_DIR="${NGINX_UMSA_BACKUP_DIR:-/etc/nginx/umsa-canonical-backups}"
MODE="${UMSANS_FONT_MODE:-dry-run}"
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/ultimamilla.com.ar.fonts.$STAMP.bak"
FONT_URL="https://www.ultimamilla.com.ar/fonts/um-sans/UMSans-Variable.woff2?v=1.2.0-production"
SGI_URL="https://sgi.ultimamilla.com.ar/"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Nginx site config not found: $CONFIG_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "$CONFIG_PATH" "$BACKUP_PATH"
restore_backup() { cp "$BACKUP_PATH" "$CONFIG_PATH"; }

sgi_status() { curl -4 -sS -o /dev/null --max-time 20 -w "%{http_code}" "$SGI_URL" || echo "000"; }
SGI_BEFORE="$(sgi_status)"
echo "SGI antes: $SGI_BEFORE"

python3 - "$CONFIG_PATH" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
source = path.read_text()
MARK = "# UMSA: fuente UM Sans para el SGI (CORS + cache)"

def blocks(text):
    """Devuelve (inicio, fin) de cada 'server { ... }' de primer nivel."""
    out, i = [], 0
    for m in re.finditer(r"(?m)^\s*server\s*\{", text):
        if m.start() < i:
            continue
        depth, j = 0, m.end() - 1
        while j < len(text):
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
                if depth == 0:
                    out.append((m.start(), j + 1))
                    i = j + 1
                    break
            j += 1
    return out

targets = []
for start, end in blocks(source):
    body = source[start:end]
    names = re.search(r"server_name\s+([^;]+);", body)
    if not names or "www.ultimamilla.com.ar" not in names.group(1).split():
        continue
    if not re.search(r"listen\s+443", body):
        continue
    if re.search(r"return\s+30[18]", body) and "location" not in body:
        continue
    targets.append((start, end))

if len(targets) != 1:
    raise SystemExit(f"Se esperaba 1 server block de www en 443 y hay {len(targets)}; no se modifica nada")

start, end = targets[0]
body = source[start:end]
if MARK in body:
    print("Cabeceras de UM Sans ya presentes; sin cambios")
    sys.exit(0)

root_loc = re.search(r"location\s+/\s*\{([^{}]*)\}", body)
proxy = re.search(r"proxy_pass\s+([^;]+);", root_loc.group(1)) if root_loc else None
if not proxy:
    raise SystemExit("No se encontró proxy_pass en 'location /' del bloque www; no se modifica nada")

block = f"""
    {MARK}
    location ^~ /fonts/um-sans/ {{
        proxy_pass {proxy.group(1).strip()};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;
        proxy_hide_header Pragma;
        proxy_hide_header Expires;
        proxy_hide_header Access-Control-Allow-Origin;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400" always;
        add_header X-Content-Type-Options "nosniff" always;
    }}
"""
# Se inserta antes del primer 'location' del bloque www (prefijo ^~ gana a regex).
first_loc = re.search(r"(?m)^\s*location\b", body)
insert_at = start + (first_loc.start() if first_loc else body.rfind("}"))
path.write_text(source[:insert_at] + block + source[insert_at:])
print("Bloque de UM Sans agregado al server www.ultimamilla.com.ar")
PY

echo "--- diff ---"
diff -u "$BACKUP_PATH" "$CONFIG_PATH" || true

if ! nginx -t; then
  echo "nginx -t falló; restaurando $BACKUP_PATH" >&2
  restore_backup
  nginx -t || true
  exit 1
fi

if [[ "$MODE" != "apply" ]]; then
  echo "dry-run: configuración válida; se restaura el original sin recargar nginx"
  restore_backup
  exit 0
fi

reload() { if command -v systemctl >/dev/null 2>&1; then systemctl reload nginx; else nginx -s reload; fi; }
reload

for attempt in {1..10}; do
  HEADERS="$(curl -4 -sS -D - -o /dev/null --max-time 20 -H 'Origin: https://sgi.ultimamilla.com.ar' "$FONT_URL" || true)"
  CODE="$(printf '%s' "$HEADERS" | head -1 | awk '{print $2}')"
  WWW="$(curl -4 -sS -o /dev/null --max-time 20 -w '%{http_code}' https://www.ultimamilla.com.ar/ || true)"
  SGI_AFTER="$(sgi_status)"
  echo "intento $attempt: fuente=$CODE www=$WWW sgi=$SGI_AFTER"
  if [[ "$SGI_AFTER" != "$SGI_BEFORE" ]]; then
    echo "El SGI cambió de $SGI_BEFORE a $SGI_AFTER; restaurando" >&2
    restore_backup; nginx -t && reload; exit 1
  fi
  if [[ "$CODE" == "200" && "$WWW" == "200" ]] && \
     printf '%s' "$HEADERS" | grep -qi '^access-control-allow-origin: \*' && \
     printf '%s' "$HEADERS" | grep -qi '^cache-control: public, max-age=2592000'; then
    echo "Cabeceras de UM Sans aplicadas; SGI sin cambios ($SGI_AFTER)"
    exit 0
  fi
  sleep 3
done

echo "Las verificaciones no convergieron; restaurando" >&2
restore_backup; nginx -t && reload
exit 1
