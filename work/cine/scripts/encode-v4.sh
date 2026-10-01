#!/usr/bin/env bash
# v4: calidad de entrega. Desktop/tablet: MP4 H.264 1080p (CRF 27; el VP9 anterior
# medía SSIM 0,86 contra 0,96 del H.264 al mismo peso). Teléfonos: recorte cuadrado
# 1080×1080 centrado al 58 % (donde encuadra el escenario móvil), píxel a píxel.
# Uso: work/cine/scripts/encode-v4.sh <escena>   (desde la raíz del repo)
set -euo pipefail
scene="$1"
src="work/cine/out/$scene/v3"
dst="work/cine/media"
common=(-hide_banner -loglevel error -y -framerate 24 -i "$src/comp/f_%04d.jpg" -an -pix_fmt yuv420p)
ffmpeg "${common[@]}" -c:v libx264 -preset slow -crf 27 -profile:v high -movflags +faststart "$dst/cine-$scene.mp4"
ffmpeg "${common[@]}" -vf "crop=1080:1080:487:0" -c:v libx264 -preset slow -crf 28 -profile:v high -movflags +faststart "$dst/cine-$scene-sq.mp4"
ls -la "$dst"/cine-"$scene".mp4 "$dst"/cine-"$scene"-sq.mp4 | awk '{print $5, $9}'
