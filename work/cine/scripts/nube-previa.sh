#!/usr/bin/env bash
# Vista previa v4 de servicios en otras escenas, para aprobar la cámara antes del render final.
# Por combinación: recorrido completo en Workbench con entorno (1280 px → MP4 liviano) y tres
# cuadros cine (Cycles) en t = .2/.5/.85. Sale en work/cine/nube/previas/<escena>-<variante>/.
# Uso, desde la raíz del repo:  bash work/cine/scripts/nube-previa.sh <variante>:<escena> [...]
# (PREVIAS=previas-v2 cambia la carpeta de salida, para comparar contra una tanda anterior)
set -uo pipefail
PY=work/cine/.venv-bpy/bin/python; F=192; W=1280
if [ ! -x $PY ]; then
  python3 -m pip install -q --user uv || pip install -q uv
  export PATH="$HOME/.local/bin:$PATH"
  uv venv -q -p 3.13 work/cine/.venv-bpy
  uv pip install -q -p $PY bpy==5.2.1
fi
{ command -v ffmpeg >/dev/null && ldconfig -p | grep -q libEGL.so.1; } || (apt-get update -qq && apt-get install -y -qq ffmpeg libegl1) || true

for combo in "$@"; do
  variante=${combo%%:*}; escena=${combo##*:}; nombre=$escena-$variante
  tmp=work/cine/out/previa/$nombre; dst=work/cine/nube/${PREVIAS:-previas}/$nombre; log=work/cine/out/previa-$nombre.log
  mkdir -p "$tmp" "$dst"; t0=$(date +%s)
  $PY work/cine/scripts/render-cine.py -- "$escena" --variant "$variante" --en "$escena" --pass preview \
    --frames $F --width $W --out "$tmp" > "$log" 2>&1
  ffmpeg -hide_banner -loglevel error -y -framerate 24 -i "$tmp/preview/f_%04d.jpg" -an -pix_fmt yuv420p \
    -c:v libx264 -preset medium -crf 30 -movflags +faststart "$dst/recorrido.mp4"
  for at in .2 .5 .85; do
    $PY work/cine/scripts/render-cine.py -- "$escena" --variant "$variante" --en "$escena" --still --at $at \
      --frames $F --width $W --samples 40 --out "$tmp" >> "$log" 2>&1 && mv "$tmp/still-$W.jpg" "$dst/cine-${at#.}.jpg"
  done
  echo "PREVIA $nombre $(ls "$tmp/preview" 2>/dev/null | wc -l) cuadros, $(ls "$dst"/cine-*.jpg 2>/dev/null | wc -l) fijos, $(( $(date +%s) - t0 )) s"
done
