#!/usr/bin/env bash
# Reel de la portada v3: los 5 planos encadenados con corte seco (como en el sitio). Desde la raíz.
set -euo pipefail
list="$(mktemp)"; trap 'rm -f "$list"' EXIT
for s in bodega fachada aeropuerto hospital planta; do echo "file '$PWD/work/cine/media/cine-$s-720.mp4'" >> "$list"; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$list" -c copy -movflags +faststart work/cine/media/reel-ultimamilla-v3-720.mp4
ls -la work/cine/media/reel-ultimamilla-v3-720.mp4 | awk '{print $5}'
