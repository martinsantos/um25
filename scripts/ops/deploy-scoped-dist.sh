#!/usr/bin/env bash
set -Eeuo pipefail

release_id="${1:-}"
mode="${2:-deploy}"
if [[ ! "$release_id" =~ ^[0-9]+-[0-9]+$ ]] || [[ "$mode" != deploy && "$mode" != rollback ]]; then
  echo 'Usage: deploy-scoped-dist.sh RUN_ID-ATTEMPT [deploy|rollback]' >&2
  exit 2
fi

app=/root/fumbling-field
release="$app/backups/umsa-campaign-$release_id"
current="$app/dist"
previous="$release/previous-dist"
incoming="$release/incoming-dist"
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
    echo 'No active scoped release to roll back'
  fi
  exit 0
fi

if [[ ! -d "$current/server" || ! -d "$current/client" ||
      ! -f "$incoming/server/entry.mjs" ||
      ! -f "$incoming/client/images/software-comunidades/credencial-demo-email.gif" ]]; then
  echo 'Runtime or campaign asset missing; refusing deployment' >&2
  exit 1
fi
if [[ -e "$previous" || -e "$release/active" ]]; then
  echo 'Release ID already used; refusing deployment' >&2
  exit 1
fi
if [[ -e "$current/client/images/software-comunidades/credencial-demo-email.gif" ]]; then
  echo 'Campaign GIF appeared in live runtime; refusing to overwrite concurrent work' >&2
  exit 1
fi

mkdir -p "$release"
sha256sum "${protected[@]}" > "$release/protected.before.sha256"
available_kb="$(df -Pk "$app" | awk 'NR==2 {print $4}')"
if (( available_kb < 2500000 )); then
  echo 'Insufficient free space for staged runtime and rollback' >&2
  exit 1
fi

# Preserve every currently published un-hashed asset, including unfinished
# cinema/3D work. Only the new campaign GIF and candidate _astro bundles differ.
rsync -anic --delete \
  --exclude='/_astro/***' \
  --exclude='/images/software-comunidades/credencial-demo-email.gif' \
  "$current/client/" "$incoming/client/" > "$release/asset-overlay-dry-run.txt"
rsync -ac --delete \
  --exclude='/_astro/***' \
  --exclude='/images/software-comunidades/credencial-demo-email.gif' \
  "$current/client/" "$incoming/client/"
mkdir -p "$incoming/client/_astro"
rsync -a --ignore-existing "$current/client/_astro/" "$incoming/client/_astro/"
# Keep older server chunks for requests already in flight during the swap.
rsync -a --ignore-existing "$current/server/" "$incoming/server/"

# A fresh staging process verifies its own SSR imports, route, CSS/JS and GIF.
# It never binds to a public interface and does not submit a form.
port=$((45000 + ${release_id%%-*} % 10000))
if ss -H -ltn "( sport = :$port )" | grep -q .; then
  echo "Staging port $port is already in use" >&2
  exit 1
fi
ln -s "$app/node_modules" "$release/node_modules"
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
for _ in $(seq 1 20); do
  if curl -4 -fsS --max-time 3 "http://127.0.0.1:$port/software/gestion-de-comunidades-profesionales" \
      -o "$release/staging-landing.html" &&
     grep -Fq 'Nuestro software para colegios permite:' "$release/staging-landing.html"; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  echo 'Staged landing failed SSR check' >&2
  exit 1
fi
curl -4 -fsS --max-time 8 \
  "http://127.0.0.1:$port/images/software-comunidades/credencial-demo-email.gif" \
  -o "$release/staging-credential.gif"
cmp "$release/staging-credential.gif" \
  "$incoming/client/images/software-comunidades/credencial-demo-email.gif"
stage_cleanup
trap - EXIT
sha256sum -c "$release/protected.before.sha256"

# Stage and previous runtime stay on the same filesystem for atomic renames.
trap rollback_live ERR
mv "$current" "$previous"
mv "$incoming" "$current"
cd "$app"
pm2 restart astro-ultimamilla

healthy=0
for _ in $(seq 1 30); do
  if curl -4 -fsS --max-time 3 http://127.0.0.1:4321/health >/dev/null &&
     curl -4 -fsS --max-time 8 \
       http://127.0.0.1:4321/software/gestion-de-comunidades-profesionales \
       -o "$release/origin-landing.html" &&
     grep -Fq 'Nuestro software para colegios permite:' "$release/origin-landing.html"; then
    healthy=1
    break
  fi
  sleep 2
done
if [[ "$healthy" != 1 ]]; then
  echo 'New runtime failed origin health or landing check' >&2
  false
fi
for path in / /blog /antecedentes \
  /images/software-comunidades/credencial-demo-email.gif; do
  curl -4 -fsS --max-time 12 "http://127.0.0.1:4321$path" -o /dev/null
done
for path in /cine/media/cine-aeropuerto-poster.jpg \
  /3d/models/hospital-walkthrough.glb; do
  curl -4 -fsSI --max-time 12 "http://127.0.0.1:4321$path" -o /dev/null
done
sha256sum -c "$release/protected.before.sha256"
for relative in 3d/hospital.html 3d/models/hospital-walkthrough.glb \
  cine/servicios/102-x.webp; do
  cmp "$previous/client/$relative" "$current/client/$relative"
done
touch "$release/active"
trap - ERR
echo "Scoped Astro release $release_id passed origin and protected-file checks"
