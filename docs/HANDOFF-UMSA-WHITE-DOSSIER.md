# Handoff — UMSA White Dossier (réplica local + gate honesto)

**Fecha de cierre:** 30 mayo 2026
**Rama:** `codex/umsa-white-dossier-local`
**PR:** [#39 — UMSA White Dossier](https://github.com/martinsantos/um25/pull/39)
**Base objetivo Git Flow:** `develop` (no merge directo a `master` sin deploy acordado)

---

## Resumen ejecutivo

Trabajo de cierre del dossier editorial “white/hybrid” en réplica local de producción, con **gate verde** y **pase de honestidad de contenido** (Forbes Fase A/B/C documentadas; sin badges ISO/NFPA corporativos inventados).

**Veredicto del gate:** `READY_FOR_PRODUCTION_MERGE` en `docs/audits/replica-gate-latest.json` (generado 2026-05-30).

| Área | Estado |
|------|--------|
| Paridad HTTP prod vs local (31 rutas) | 0 mismatches |
| Paridad H1 vs ledger editorial | 0 mismatches (30 rutas) |
| E2E visual comercial strict | 0 fallos |
| `npm run check` | lint 0, 138 tests, build OK |
| Honestidad ISO/clientes/métricas | Aplicada — ver reglas abajo |

---

## Qué se logró

### Fase A — Ledger editorial y copy réplica
- Ledger en `src/data/replica-prod-copy.json` + script `scripts/replica-scrape-prod-copy.mjs`.
- Validación `npm run replica:content-parity` (H1 local vs ledger).
- Saneamiento CMS en `src/utils/editorialContent.ts`.

### Fase B — UI hybrid + layouts
- Hero oscuro acotado + cuerpo editorial claro (Poppins/Open Sans, acento `#DC2626`).
- Fixes layout: detalle antecedente, servicio 107, evidencia (`EvidenceCaseRow`), productos (`ProductCard`), GEO (`GeoHubDossier`).
- Componentes nuevos: `TrustStrip`, `HeroHybrid`, `BudgetBriefFields`.

### Fase C — Forbes / world-class (documentado, gate verde)
- Diagnóstico y roadmap: `docs/audits/diagnostico-forbes-2026/DIAGNOSTICO-Y-PROPUESTA.md`.
- Auditorías JSON en `docs/audits/e2e-visual-latest/` y `docs/audits/umsa-closure-2026-05-29/`.
- Capturas PNG grandes (~30–50 MB por carpeta) **no van al repo**; regenerar con `npm run audit:e2e:visual` si hace falta evidencia visual.

### Pase honestidad
- Reglas y tabla de correcciones: `docs/audits/diagnostico-forbes-2026/HONESTIDAD-CONTENIDO.md`.
- `src/utils/verifiedProof.ts` — conteo 518 → etiqueta pública `500+`.
- `/certificaciones` honesta (sin ISO corporativa).
- `TrustStrip` con nombres de cliente desde snapshot CMS (texto, sin logos inventados).
- EN parcial en `src/pages/en/` + `src/config/i18nRoutes.ts`.

---

## Archivos clave (agrupados)

### Runtime / réplica
- `src/config/runtime.ts` — flag `UMSA_LOCAL_REPLICA`
- `src/lib/directus.ts` — fallbacks snapshot cuando API cae
- `src/data/replica-prod-copy.json`, `src/utils/replicaProdCopy.ts`

### Contenido honesto
- `src/utils/verifiedProof.ts`, `src/utils/caseMetrics.ts`, `src/utils/datasheets.ts`
- `src/pages/certificaciones.astro`
- `src/components/um/TrustStrip.astro`

### Páginas y templates
- `src/pages/index.astro`, `contacto.astro`, `nosotros.astro`, `sectores.astro`
- `src/pages/antecedentes/[id]/[slug].astro`, `src/pages/servicios/[id]/[slug].astro`
- `src/components/templates/*Editorial*.astro`, `*Atlas*.astro`
- `src/pages/en/*` (parcial)

### Gate y scripts
- `scripts/replica-gate.mjs`, `replica-content-parity.mjs`, `replica-scrape-prod-copy.mjs`
- `scripts/antecedente-detail-layout-audit.mjs`, `run-e2e-visual-suite.mjs`
- `docs/audits/replica-gate-latest.json`

### Documentación
- `docs/REPLICA-LOCAL-PRODUCCION.md`, `docs/REPLICA-ENV-TEMPLATE.env` (plantilla, sin secretos)
- Este archivo: `docs/HANDOFF-UMSA-WHITE-DOSSIER.md`

---

## Cómo correr en otro IDE

```bash
git fetch origin
git checkout codex/umsa-white-dossier-local
npm ci
cp docs/REPLICA-ENV-TEMPLATE.env .env.local   # o ver docs/REPLICA-LOCAL-PRODUCCION.md
# NO commitear .env con tokens reales

npm run dev:replica          # http://localhost:4321 — skin réplica
npm run replica:gate         # gate completo (~varios min)
npm run check                # lint + typecheck + test + build
```

**Spot check manual sugerido:** `/`, `/certificaciones`, `/servicios/107/*`, `/antecedentes/3065/*`, TrustStrip en home.

---

## Reglas de honestidad (obligatorias)

Leer antes de tocar copy público:
`docs/audits/diagnostico-forbes-2026/HONESTIDAD-CONTENIDO.md`

- **No** publicar ISO 9001/27001 ni NFPA como sello corporativo sin PDF/fuente en CMS.
- Conteos de antecedentes solo vía `verifiedProof.ts` / snapshot.
- KPIs en fichas solo si están literales en título/descripción CMS (`caseMetrics.ts`).
- Datasheets: botón solo si existe `public/datasheets/{slug}.pdf`.

---

## Advertencias conocidas (no bloquean merge)

1. **22 títulos `<title>`** difieren del ledger editorial (`contentParityLedger.titleHeadWarnings` en gate JSON) — informativo.
2. **Directus `:8055` caído** en preflight local: el sitio usa snapshots; para CMS vivo levantar Docker en `directus-admin/`.
3. **Terminal/CLI** (`public/js/UMTerminalAdvanced.js`, plugins) conservan copy histórico `469+` — fuera del scope Astro público de esta pasada.

---

## Pendiente (requiere cliente / otra iteración)

| Item | Notas |
|------|--------|
| Logos de cliente autorizados | PNG/SVG en `public/uploads/logos/` |
| PDFs certificaciones / datasheets | `public/datasheets/` por servicio |
| EN completo | Rutas en `src/pages/en/` — solo parcial |
| Campos Directus v4 | Migraciones en `npm run migrate:v4:*` (dry-run primero) |
| Proxy nginx `/plantilla-arca/api` | Infra VPS, no en este PR |
| `DIRECTUS_STATIC_TOKEN` en PM2 producción | Solo en servidor, nunca en git |
| Cambiar base del PR de `master` a `develop` | Si aún apunta a master, retarget en GitHub |

---

## Merge checklist (revisor)

- [ ] `npm run replica:gate` en máquina limpia con rama actual
- [ ] `npm run check`
- [ ] Revisar `/certificaciones` y TrustStrip (sin ISO inventada)
- [ ] Confirmar que `.env` con secretos **no** entró al commit
- [ ] Merge PR #39 → **`develop`**
- [ ] Post-merge a `master` solo vía flujo deploy acordado + health check 30 min

---

## Contacto / contexto repo

- Producción: https://www.ultimamilla.com.ar
- Reglas servidor: `REGLAS_ARQUITECTURA_SERVIDOR.md`, `CLAUDE.md`
- Baseline tag: `v0.0.1-production-baseline`
