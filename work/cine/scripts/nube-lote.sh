#!/usr/bin/env bash
# Lote v4 en una sesión de Claude Code en la nube (Linux x86, sin GPU): una variante completa.
# Renderiza las pasadas cine y esqueleto (192 cuadros), compone los cortes glitch, codifica
# y sube sólo los medios a work/cine/media/. Reanudable: si se corta, volver a correrlo
# saltea los cuadros ya escritos (mientras el contenedor siga vivo).
# Uso, desde la raíz del repo:  bash work/cine/scripts/nube-lote.sh <variante> [ancho] [samples] [escena]
# (escena: el mismo servicio en otra escena; por omisión, la suya en VARIANTS)
set -uo pipefail
VARIANTE=$1; ANCHO=${2:-2560}; SAMPLES=${3:-40}; F=192
PY=work/cine/.venv-bpy/bin/python
DST=work/cine/media; mkdir -p "$DST" work/cine/nube

if [ ! -x $PY ]; then
  python3 -m pip install -q --user uv || pip install -q uv
  export PATH="$HOME/.local/bin:$PATH"
  uv venv -q -p 3.13 work/cine/.venv-bpy
  uv pip install -q -p $PY bpy==5.2.1
fi
$PY -c 'import PIL' 2>/dev/null || { export PATH="$HOME/.local/bin:$PATH"; uv pip install -q -p $PY pillow; }
{ command -v ffmpeg >/dev/null && [ -x /usr/bin/time ] && ldconfig -p | grep -q libEGL.so.1; } || (apt-get update -qq && apt-get install -y -qq ffmpeg time libegl1) || true

ESCENA=${4:-$(python3 - "$VARIANTE" <<'PY'
import re, sys
src = open('work/cine/scripts/render-cine.py').read()
print(re.search(r"'%s':\s*dict\(scene='([a-z]+)'" % sys.argv[1], src).group(1))
PY
)}
NOMBRE=$ESCENA-$VARIANTE; DIR=work/cine/out/$NOMBRE/v3
LOG=work/cine/nube/lote-$([ -n "${4:-}" ] && echo "$NOMBRE" || echo "$VARIANTE").log
echo "$(date -u +%FT%TZ) LOTE $VARIANTE escena=$ESCENA ${ANCHO}px ${SAMPLES} samples $(nproc) núcleos" | tee -a "$LOG"

for pasada in cine skeleton; do
  sub=$([ $pasada = cine ] && echo cine || echo skel)
  for intento in 1 2 3 4; do
    n=$(ls "$DIR/$sub" 2>/dev/null | wc -l)
    [ "$n" -ge $F ] && break
    t0=$(date +%s)
    $PY work/cine/scripts/render-cine.py -- "$ESCENA" --variant "$VARIANTE" --en "$ESCENA" --pass $pasada \
      --frames $F --width "$ANCHO" --samples "$SAMPLES" > "work/cine/out/render-$NOMBRE-$pasada.log" 2>&1
    echo "$(date -u +%FT%TZ) PASADA $pasada intento=$intento salida=$? cuadros=$(ls "$DIR/$sub" 2>/dev/null | wc -l) segundos=$(( $(date +%s) - t0 ))" | tee -a "$LOG"
  done
  [ "$(ls "$DIR/$sub" 2>/dev/null | wc -l)" -ge $F ] || { echo "FALLÓ $pasada, ver work/cine/out/render-$NOMBRE-$pasada.log" | tee -a "$LOG"; exit 1; }
done

$PY work/cine/scripts/compose-glitch.py "$NOMBRE" | tee -a "$LOG"
# Máster a la resolución de render (CRF 18), 1080p de entrega (CRF 27, como encode-v4.sh)
# y recorte cuadrado 1080×1080 para teléfonos, sobre el 1080p.
in=(-hide_banner -loglevel error -y -framerate 24 -i "$DIR/comp/f_%04d.jpg" -an -pix_fmt yuv420p)
h264=(-c:v libx264 -preset slow -profile:v high -movflags +faststart)
ffmpeg "${in[@]}" "${h264[@]}" -crf 18 "$DST/cine-$NOMBRE-master.mp4"
ffmpeg "${in[@]}" -vf scale=1920:-2:flags=lanczos "${h264[@]}" -crf 27 "$DST/cine-$NOMBRE.mp4"
ffmpeg "${in[@]}" -vf "scale=1920:-2:flags=lanczos,crop=1080:1080:487:0" "${h264[@]}" -crf 28 "$DST/cine-$NOMBRE-sq.mp4"
ffmpeg "${in[@]}" -vf scale=960:-2:flags=lanczos "${h264[@]}" -crf 30 "$DST/cine-$NOMBRE-preview.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$DIR/cine/f_0012.jpg" -vf scale=1920:-2 -q:v 3 "$DST/cine-$NOMBRE-poster.jpg"
cp "$DIR/ar-track.json" "$DST/cine-$NOMBRE-ar.json"
ls -la "$DST"/cine-"$NOMBRE"* | awk '{print $5, $9}' | tee -a "$LOG"
echo "$(date -u +%FT%TZ) LOTE_TERMINADO $VARIANTE" | tee -a "$LOG"

git add "$DST"/cine-"$NOMBRE"* && git add -f "$LOG"
git commit -q -m "feat(cine): medios v4 de $VARIANTE ($ESCENA), ${ANCHO} px, $SAMPLES samples, render en la nube

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CFnGTriQtTmpJ14WhvFSHu"
rama=$(git rev-parse --abbrev-ref HEAD)
for espera in 2 4 8 16 32; do
  git pull -q --rebase origin "$rama" && git push -q -u origin "$rama" && { echo PUSH_OK; exit 0; }
  sleep $espera
done
echo PUSH_FALLÓ; exit 1
