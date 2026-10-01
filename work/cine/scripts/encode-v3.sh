#!/usr/bin/env bash
# Codifica el plano v3 compuesto (lineal, 8 s) en WebM VP9, MP4 H.264 y MP4 720p + póster.
# Uso: work/cine/scripts/encode-v3.sh <escena>   (desde la raíz del repo)
set -euo pipefail
scene="$1"
src="work/cine/out/$scene/v3"
dst="work/cine/media"
mkdir -p "$dst"
common=(-hide_banner -loglevel error -y -framerate 24 -i "$src/comp/f_%04d.jpg" -an -pix_fmt yuv420p)
ffmpeg "${common[@]}" -c:v libvpx-vp9 -b:v 0 -crf 46 -row-mt 1 -deadline good -cpu-used 2 "$dst/cine-$scene.webm"
ffmpeg "${common[@]}" -c:v libx264 -preset slow -crf 28 -profile:v high -movflags +faststart "$dst/cine-$scene.mp4"
ffmpeg "${common[@]}" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 28 -movflags +faststart "$dst/cine-$scene-720.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$src/cine/f_0012.jpg" -vf scale=1920:-2 -q:v 3 "$dst/cine-$scene-poster.jpg"
cp "$src/ar-track.json" "$dst/cine-$scene-ar.json"
ls -la "$dst"/cine-"$scene"* | awk '{print $5, $9}'
