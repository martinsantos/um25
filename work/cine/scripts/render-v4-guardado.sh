#!/usr/bin/env bash
# Lote v4: un recorrido por servicio (VARIANTS en render-cine.py), 2560×1440.
# Un Blender por vez y sólo con recursos: antes de cada lanzamiento espera a que haya
# swap libre, memoria libre y disco suficientes; si no, pausa y vuelve a medir.
# Reanudable (use_overwrite=False). Uso, desde la raíz del repo y con nohup:
#   nohup bash work/cine/scripts/render-v4-guardado.sh redes seguridad ... > work/cine/out/v4.log 2>&1 &
set -uo pipefail
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
F=192; W=2560; SAMPLES=40
MIN_SWAP_MB=3000; MIN_FREE_PCT=45; MIN_DISK_GB=12

scene_of() { python3 - "$1" <<'PY'
import re, sys
src = open('work/cine/scripts/render-cine.py').read()
m = re.search(r"'%s':\s*dict\(scene='([a-z]+)'" % sys.argv[1], src)
print(m.group(1))
PY
}

recursos_ok() {
  local swap_free free_pct disk_gb
  swap_free=$(sysctl -n vm.swapusage | sed -E 's/.*free = ([0-9.]+)M.*/\1/' | cut -d. -f1)
  free_pct=$(memory_pressure | awk -F': ' '/free percentage/ {gsub("%","",$2); print $2}')
  disk_gb=$(df -g /System/Volumes/Data | awk 'NR==2 {print $4}')
  echo "$(date +%H:%M:%S) recursos swap_libre=${swap_free}MB mem_libre=${free_pct}% disco=${disk_gb}GB"
  [ "${swap_free:-0}" -ge $MIN_SWAP_MB ] && [ "${free_pct:-0}" -ge $MIN_FREE_PCT ] && [ "${disk_gb:-0}" -ge $MIN_DISK_GB ]
}

esperar_recursos() {
  until recursos_ok; do echo "  esperando recursos (60 s)"; sleep 60; done
}

for variant in "$@"; do
  scene=$(scene_of "$variant"); dir="work/cine/out/$scene-$variant/v3"
  start=$(date +%s)
  for pass in cine skeleton; do
    sub=$([ $pass = cine ] && echo cine || echo skel)
    for attempt in 1 2 3 4 5 6 7 8; do
      n=$(ls "$dir/$sub" 2>/dev/null | wc -l | tr -d ' ')
      [ "$n" = "$F" ] && break
      esperar_recursos
      "$BLENDER" -b --factory-startup --python work/cine/scripts/render-cine.py -- "$scene" --variant "$variant" \
        --pass $pass --frames $F --width $W --samples $SAMPLES >> "work/cine/out/render-v4-$variant.log" 2>&1
      echo "PASS $variant $pass intento=$attempt salida=$? cuadros=$(ls "$dir/$sub" 2>/dev/null | wc -l | tr -d ' ')"
    done
  done
  c=$(ls "$dir/cine" 2>/dev/null | wc -l | tr -d ' '); k=$(ls "$dir/skel" 2>/dev/null | wc -l | tr -d ' ')
  echo "RENDER $variant cine=$c skel=$k segundos=$(( $(date +%s) - start ))"
done
echo "LOTE_TERMINADO"
