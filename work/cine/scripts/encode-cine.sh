#!/usr/bin/env bash
# Codifica un plano cine en bucle ida y vuelta (empieza en el plano abierto con la
# cordillera, entra a la escena y vuelve) sin cargar cuadros en memoria: el orden se
# arma con enlaces simbólicos y ffmpeg lee la secuencia en streaming.
# Uso: work/cine/scripts/encode-cine.sh <escena>   (desde la raíz del repo)
set -euo pipefail
scene="$1"
src="work/cine/out/$scene/frames"
dst="work/cine/media"
seq="$(mktemp -d)"
trap 'rm -rf "$seq"' EXIT
n=$(ls "$src"/f_*.jpg | wc -l | tr -d ' ')
hold=24  # 1 s quieto en el plano abierto (cordillera) antes de entrar
total=$((hold + 2 * n - 2))
for ((k = 0; k < total; k++)); do
  j=$((k - hold))
  if ((j < 0)); then s=$n; elif ((j < n)); then s=$((n - j)); else s=$((j - n + 2)); fi
  ln -s "$PWD/$src/$(printf 'f_%04d.jpg' "$s")" "$seq/$(printf 's_%04d.jpg' "$k")"
done
mkdir -p "$dst"
common=(-hide_banner -loglevel error -y -framerate 24 -i "$seq/s_%04d.jpg" -an -pix_fmt yuv420p)
ffmpeg "${common[@]}" -c:v libx264 -preset slow -crf 25 -profile:v high -movflags +faststart "$dst/cine-$scene.mp4"
ffmpeg "${common[@]}" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 24 -movflags +faststart "$dst/cine-$scene-720.mp4"
ffmpeg "${common[@]}" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -deadline good -cpu-used 2 "$dst/cine-$scene.webm"
ffmpeg -hide_banner -loglevel error -y -i "$src/$(printf 'f_%04d.jpg' "$n")" -vf scale=1920:-2 -q:v 3 "$dst/cine-$scene-poster.jpg"
node -e "const f=require('fs');const t=JSON.parse(f.readFileSync(process.argv[1]));t.hold=+process.argv[3];t.order='hold-reverse-forward';f.writeFileSync(process.argv[2],JSON.stringify(t))" "work/cine/out/$scene/ar-track.json" "$dst/cine-$scene-ar.json" "$hold"
ls -la "$dst"/cine-"$scene"* | awk '{print $5, $9}'
