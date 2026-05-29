# Réplica local = www.ultimamilla.com.ar (tema nuevo)

Objetivo: validar en **http://localhost:4321** la misma experiencia que producción (datos CMS, skin **hybrid**, fallbacks) con el **White Dossier** aplicado. Cuando el gate local esté en **0 fallos**, merge a `master` y deploy.

---

## 1. Qué imita la réplica

| Aspecto | Dev normal | Réplica (`UMSA_LOCAL_REPLICA=1`) | Producción |
|---------|------------|----------------------------------|------------|
| Skin | `?skin=white` permitido | **hybrid** fijo (ignora query) | hybrid fijo |
| Blog fallback | mock estático | HTML de **ultimamilla.com.ar** | Directus live |
| Canonical SEO | localhost | **ultimamilla.com.ar** en meta | igual |
| Directus vacío | 404 / lista vacía | **snapshots** JSON | live + snapshots en error |
| Gate visual | opcional | `npm run replica:gate` | post-deploy prod URL |

---

## 2. Setup (una vez)

```bash
cd /Users/santosma/Projects/um25
cp .env.replica.example .env
# Editar DIRECTUS_STATIC_TOKEN (token del VPS / Directus admin)
```

### Datos CMS desde producción

Terminal 1 — túnel SSH:

```bash
ssh -N -L 8055:127.0.0.1:8055 root@23.105.176.45
```

Terminal 2 — snapshots + imágenes:

```bash
npm run replica:sync
npm run download-images   # opcional, recomendado
```

---

## 3. Correr la réplica

```bash
npm run dev:replica
# http://localhost:4321
```

---

## 4. Gate antes de producción

Con `dev:replica` activo:

```bash
npm run replica:gate
```

Incluye:

1. `replica:preflight` — Directus + snapshots + dev up  
2. `replica:parity-check` — mismos HTTP status prod vs local (30 rutas)  
3. `audit:e2e:visual` — 64 checks comerciales strict (hybrid, sin `?skin=white`)

Alternativa manual:

```bash
npm run replica:preflight
npm run replica:parity-check
npm run audit:e2e:visual
npm run check
```

---

## 5. Pasar a producción

1. Gate local **0 fallos**  
2. `npm run check`  
3. Merge `codex/umsa-white-dossier-local` → `master`  
4. Deploy CI (rsync + PM2)  
5. Post-deploy: `VISUAL_AUDIT_BASE_URL=https://ultimamilla.com.ar npm run audit:visual:commercial`  
6. Pendiente infra: proxy `/plantilla-arca/api`, tokens en PM2 (no en repo)

---

## 6. Archivos clave

- `src/config/runtime.ts` — flags réplica  
- `src/lib/directus.ts` — fallbacks snapshot si API vacía  
- `src/utils/getBlogData.ts` — sin mock en réplica  
- `src/utils/skinVariant.ts` — sin override `?skin` en réplica  
- `scripts/replica-*.mjs` — sync, parity, gate  

---

## 7. Limitaciones conocidas

- **Plantilla ARCA API** sigue sin proxy en nginx local/prod hasta cablear FastAPI.  
- **Paridad HTTP** no valida contenido textual (usar audit visual).  
- **GEO sitemap** usa snapshots; refrescar con `replica:sync` tras cambios CMS.
