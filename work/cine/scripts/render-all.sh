#!/usr/bin/env bash
# Lote completo: un Blender por vez (RAM ~2 GB), luego codificación. Desde la raíz del repo.
# El render es reanudable (saltea cuadros existentes): si el proceso se corta, se reintenta.
set -uo pipefail
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
for scene in ${@:-bodega fachada aeropuerto hospital planta}; do
  start=$(date +%s)
  for attempt in 1 2 3 4 5 6; do
    frames=$(ls work/cine/out/$scene/frames 2>/dev/null | wc -l | tr -d ' ')
    [ "$frames" = 144 ] && break
    "$BLENDER" -b --factory-startup --python work/cine/scripts/render-cine.py -- "$scene" --frames 144 --width 1920 --samples 40 \
      >> "work/cine/out/render-$scene.log" 2>&1
    echo "PASS $scene attempt=$attempt exit=$? frames=$(ls work/cine/out/$scene/frames 2>/dev/null | wc -l | tr -d ' ')"
  done
  frames=$(ls work/cine/out/$scene/frames 2>/dev/null | wc -l | tr -d ' ')
  echo "RENDER $scene frames=$frames seconds=$(( $(date +%s) - start ))"
  if [ "$frames" = 144 ] && [ ! -f "work/cine/media/cine-$scene.webm" ]; then
    bash work/cine/scripts/encode-cine.sh "$scene" > "work/cine/out/encode-$scene.log" 2>&1 && echo "ENCODED $scene" || echo "ENCODE_FAILED $scene"
  fi
done
echo "ALL_DONE"
