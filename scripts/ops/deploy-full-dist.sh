#!/usr/bin/env bash
# Deploy ordinario del runtime Astro (dist/) con staging verificado, swap
# atómico y rollback. Reemplaza al release "scoped" de la campaña de colegios:
# publica todo el build (server + client, incluidos assets nuevos y cambiados)
# y sólo preserva el trabajo de cine/3D que vive en el servidor fuera del repo.
#
# Uso (desde el runner, por ssh):  bash -s -- RUN_ID-ATTEMPT deploy|rollback
set -Eeuo pipefail

release_id="${1:-}"
mode="${2:-deploy}"
if [[ ! "$release_id" =~ ^[0-9]+-[0-9]+$ ]] || [[ "$mode" != deploy && "$mode" != rollback ]]; then
  echo 'Usage: deploy-full-dist.sh RUN_ID-ATTEMPT [deploy|rollback]' >&2
  exit 2
fi

app=/root/fumbling-field
release="$app/backups/umsa-release-$release_id"
current="$app/dist"
previous="$release/previous-dist"
incoming="$release/incoming-dist"
# Trabajo de cine/3D publicado desde el servidor y todavía no integrado al
# repositorio: el runtime nuevo hereda estas carpetas del runtime vivo.
server_owned_dirs=(3d hospital-3d sector-3d)
# Archivos puntuales que nunca cambian en un deploy ordinario.
server_owned_files=(cine/servicios/102-x.webp)
protected=(
  "$app/public/3d/hospital.html"
  "$app/public/3d/models/hospital-walkthrough.glb"
  "$app/public/cine/servicios/102-x.webp"
  "$app/work/um-territorio/src/hospitalServiceEffects.js"
  "$app/work/um-territorio/src/hospitalSurface.js"
)

rollback_live() {
  trap - ERR
  if [[ -d "$previous" ]]; then
    echo 'Restoring previous Astro runtime'
    if [[ -d "$current" ]]; then
      mv "$current" "$release/failed-dist"
    fi
    mv "$previous" "$current"
    cd "$app"
    pm2 restart astro-ultimamilla
    rm -f "$release/active"
    sha256sum -c "$release/protected.before.sha256"
  fi
}

if [[ "$mode" == rollback ]]; then
  if [[ -f "$release/active" ]]; then
    rollback_live
  else
    echo 'No active release to roll back'
  fi
  exit 0
fi

if [[ ! -d "$current/server" || ! -d "$current/client" ||
      ! -f "$incoming/server/entry.mjs" || ! -d "$incoming/client" ]]; then
  echo 'Runtime missing; refusing deployment' >&2
  exit 1
fi
if [[ -e "$previous" || -e "$release/active" ]]; then
  echo 'Release ID already used; refusing deployment' >&2
  exit 1
fi

mkdir -p "$release"
sha256sum "${protected[@]}" > "$release/protected.before.sha256"
available_kb="$(df -Pk "$app" | awk 'NR==2 {print $4}')"
if (( available_kb < 2500000 )); then
  echo 'Insufficient free space for staged runtime and rollback' >&2
  exit 1
fi

# El runtime vivo manda sólo en lo que no está en el repo.
for dir in "${server_owned_dirs[@]}"; do
  if [[ -d "$current/client/$dir" ]]; then
    rm -rf "$incoming/client/$dir"
    rsync -a "$current/client/$dir/" "$incoming/client/$dir/"
  fi
done
for file in "${server_owned_files[@]}"; do
  if [[ -f "$current/client/$file" ]]; then
    mkdir -p "$(dirname "$incoming/client/$file")"
    cp -a "$current/client/$file" "$incoming/client/$file"
  fi
done
# Chunks viejos siguen disponibles para requests en vuelo durante el swap.
rsync -a --ignore-existing "$current/client/_astro/" "$incoming/client/_astro/"
rsync -a --ignore-existing "$current/server/" "$incoming/server/"

# Un proceso de staging verifica sus propios imports SSR y las rutas clave.
# Nunca se liga a una interfaz pública.
port=$((45000 + ${release_id%%-*} % 10000))
if ss -H -ltn "( sport = :$port )" | grep -q .; then
  echo "Staging port $port is already in use" >&2
  exit 1
fi
ln -sfn "$app/node_modules" "$release/node_modules"
(
  cd "$release"
  exec env HOST=127.0.0.1 PORT="$port" NODE_ENV=production \
    node incoming-dist/server/entry.mjs > "$release/staging.log" 2>&1
) &
stage_pid=$!
stage_cleanup() {
  kill "$stage_pid" 2>/dev/null || true
  wait "$stage_pid" 2>/dev/null || true
}
trap stage_cleanup EXIT
ready=0
for _ in $(seq 1 30); do
  if curl -4 -fsS --max-time 3 "http://127.0.0.1:$port/health" -o /dev/null &&
     curl -4 -fsS --max-time 8 "http://127.0.0.1:$port/" -o "$release/staging-home.html" &&
     grep -Fq 'ULTIMA MILLA' "$release/staging-home.html"; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  echo 'Staged runtime failed SSR check' >&2
  exit 1
fi
for path in /servicios /sectores /antecedentes /certificaciones /contacto \
  /manifest.json /cine/media/cine-bodega-poster.jpg; do
  curl -4 -fLsS --max-time 12 "http://127.0.0.1:$port$path" -o /dev/null
done
stage_cleanup
trap - EXIT
sha256sum -c "$release/protected.before.sha256"

# Staging y runtime anterior en el mismo filesystem: renames atómicos.
trap rollback_live ERR
mv "$current" "$previous"
mv "$incoming" "$current"
cd "$app"
pm2 restart astro-ultimamilla

healthy=0
for _ in $(seq 1 30); do
  if curl -4 -fsS --max-time 3 http://127.0.0.1:4321/health >/dev/null &&
     curl -4 -fsS --max-time 8 http://127.0.0.1:4321/ -o "$release/origin-home.html" &&
     grep -Fq 'ULTIMA MILLA' "$release/origin-home.html"; then
    healthy=1
    break
  fi
  sleep 2
done
if [[ "$healthy" != 1 ]]; then
  echo 'New runtime failed origin health check' >&2
  false
fi
for path in / /blog /antecedentes /servicios /manifest.json; do
  curl -4 -fLsS --max-time 12 "http://127.0.0.1:4321$path" -o /dev/null
done
for path in /cine/media/cine-aeropuerto-poster.jpg /3d/models/hospital-walkthrough.glb; do
  curl -4 -fsSI --max-time 12 "http://127.0.0.1:4321$path" -o /dev/null
done
sha256sum -c "$release/protected.before.sha256"
for relative in "${server_owned_files[@]}" 3d/hospital.html 3d/models/hospital-walkthrough.glb; do
  if [[ -f "$previous/client/$relative" ]]; then
    cmp "$previous/client/$relative" "$current/client/$relative"
  fi
done
touch "$release/active"
trap - ERR
echo "Astro release $release_id passed origin and protected-file checks"
