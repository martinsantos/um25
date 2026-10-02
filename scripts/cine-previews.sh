#!/usr/bin/env bash
# Vista previa liviana (960 px, sin audio) de cada movie v4, para las grillas de la web
# (se reproduce al pasar el mouse). Sale junto a los medios en work/cine/media.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in work/cine/media/cine-*-*.mp4; do
  case "$f" in *-master.mp4|*-sq.mp4|*-preview.mp4) continue;; esac
  out=${f%.mp4}-preview.mp4
  [ -s "$out" ] && [ "$out" -nt "$f" ] && continue
  ffmpeg -hide_banner -loglevel error -y -i "$f" -an -vf scale=960:-2:flags=lanczos -pix_fmt yuv420p \
    -c:v libx264 -preset slow -crf 30 -movflags +faststart "$out"
  echo "PREVIEW $out $(stat -c %s "$out")"
done
