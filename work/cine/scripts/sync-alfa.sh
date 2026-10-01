#!/usr/bin/env bash
# Copia los medios cine codificados al alfa (public/cine/media). Desde la raíz del repo.
set -euo pipefail
dst="../umsa-sitio-alfa/public/cine/media"
mkdir -p "$dst"
for f in work/cine/media/cine-*; do cp -p "$f" "$dst/"; done
ls -la "$dst"/cine-* | awk '{s+=$5; print $5, $9} END {printf "total %.1f MB\n", s/1048576}'
