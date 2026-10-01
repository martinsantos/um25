#!/usr/bin/env bash
# Prueba de render v4 en una sesión de Claude Code en la nube (Linux x86, sin GPU).
# Instala Blender 5.2.1 como módulo de Python (bpy, desde PyPI), renderiza los
# primeros N cuadros de una variante y deja la medición en work/cine/nube/.
# Uso, desde la raíz del repo:  bash work/cine/scripts/nube-prueba.sh [variante] [cuadros] [ancho] [samples]
set -euo pipefail
VARIANTE=${1:-incendios}; CUADROS=${2:-4}; ANCHO=${3:-2560}; SAMPLES=${4:-40}
DEST=work/cine/nube; mkdir -p "$DEST"
INFORME="$DEST/medicion-$VARIANTE.md"

if [ ! -x work/cine/.venv-bpy/bin/python ]; then
  python3 -m pip install -q --user uv || pip install -q uv
  export PATH="$HOME/.local/bin:$PATH"
  uv venv -q -p 3.13 work/cine/.venv-bpy
  uv pip install -q -p work/cine/.venv-bpy/bin/python bpy==5.2.1
fi
{ command -v ffmpeg >/dev/null && [ -x /usr/bin/time ] && ldconfig -p | grep -q libEGL.so.1; } || (apt-get update -qq && apt-get install -y -qq ffmpeg time libegl1) || true

{
  echo "# Medición de render en la nube: $VARIANTE"
  echo
  echo "- Fecha: $(date -u +%FT%TZ)"
  echo "- CPU: $(nproc) núcleos · $(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | xargs)"
  echo "- RAM: $(free -g | awk '/Mem:/ {print $2}') GB · disco libre: $(df -h . | awk 'NR==2 {print $4}')"
  echo "- Blender: $(work/cine/.venv-bpy/bin/python -c 'import bpy; print(bpy.app.version_string)')"
  echo "- Parámetros: $CUADROS cuadros, ${ANCHO} px, $SAMPLES samples"
} > "$INFORME"

medir() {  # pasada, cuadros
  local pasada=$1 n=$2 t0 t1 log="$DEST/render-$VARIANTE-$1.log"
  t0=$(date +%s)
  /usr/bin/time -v work/cine/.venv-bpy/bin/python work/cine/scripts/render-cine.py -- bodega --variant "$VARIANTE" \
    --pass "$pasada" --frames 192 --limit "$n" --width "$ANCHO" --samples "$SAMPLES" > "$log" 2>&1 || echo "FALLÓ, ver $log" >> "$INFORME"
  t1=$(date +%s)
  local pico=$(grep -m1 'Maximum resident' "$log" | awk '{print $NF}')
  echo "- Pasada $pasada: $n cuadros en $((t1 - t0)) s (incluye carga de escena) · RAM pico ${pico:-?} KB · dispositivo: $(grep -o 'CINE_SETUP [a-z]* [A-Z]*' "$log" | awk '{print $3}')" >> "$INFORME"
  grep -iE "missing|not found|error" "$log" | sort -u | head -10 | sed 's/^/    /' >> "$INFORME" || true
}
medir cine "$CUADROS"
medir skeleton "$CUADROS"

OUTDIR=$(ls -d work/cine/out/*-"$VARIANTE"/v3 | head -1)
mkdir -p "$DEST/cuadros-$VARIANTE"
for f in "$OUTDIR"/cine/f_0001.jpg "$OUTDIR"/cine/f_000"$CUADROS".jpg "$OUTDIR"/skel/f_0001.jpg; do
  [ -f "$f" ] && cp "$f" "$DEST/cuadros-$VARIANTE/$(basename "$(dirname "$f")")-$(basename "$f")"
done
echo >> "$INFORME"; echo "Referencia local (M4 Pro, Metal, lote v3): ~1100 s por escena, 192 cuadros cine + 192 esqueleto." >> "$INFORME"
cat "$INFORME"
