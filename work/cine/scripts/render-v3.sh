#!/usr/bin/env bash
# Lote v3: por escena, pasada cine (Cycles, reanudable con reintentos) → esqueleto (Workbench)
# → composición glitch → codificación. Un Blender por vez. Desde la raíz del repo, con nohup.
set -uo pipefail
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
F=192
for scene in ${@:-bodega fachada aeropuerto hospital planta}; do
  start=$(date +%s)
  for attempt in 1 2 3 4 5 6 7 8; do
    n=$(ls work/cine/out/$scene/v3/cine 2>/dev/null | wc -l | tr -d ' ')
    [ "$n" = "$F" ] && break
    "$BLENDER" -b --factory-startup --python work/cine/scripts/render-cine.py -- "$scene" --flight --pass cine --frames $F --width 1920 --samples 32 \
      >> "work/cine/out/render-v3-$scene.log" 2>&1
    echo "PASS $scene cine attempt=$attempt exit=$? frames=$(ls work/cine/out/$scene/v3/cine 2>/dev/null | wc -l | tr -d ' ')"
  done
  for attempt in 1 2 3; do
    n=$(ls work/cine/out/$scene/v3/skel 2>/dev/null | wc -l | tr -d ' ')
    [ "$n" = "$F" ] && break
    "$BLENDER" -b --factory-startup --python work/cine/scripts/render-cine.py -- "$scene" --flight --pass skeleton --frames $F --width 1920 \
      >> "work/cine/out/render-v3-$scene.log" 2>&1
  done
  c=$(ls work/cine/out/$scene/v3/cine 2>/dev/null | wc -l | tr -d ' '); k=$(ls work/cine/out/$scene/v3/skel 2>/dev/null | wc -l | tr -d ' ')
  echo "RENDER $scene cine=$c skel=$k seconds=$(( $(date +%s) - start ))"
  if [ "$c" = "$F" ] && [ "$k" = "$F" ]; then
    python3 work/cine/scripts/compose-glitch.py "$scene" && bash work/cine/scripts/encode-v3.sh "$scene" > "work/cine/out/encode-v3-$scene.log" 2>&1 && echo "ENCODED $scene" || echo "ENCODE_FAILED $scene"
  fi
done
echo "ALL_DONE"
