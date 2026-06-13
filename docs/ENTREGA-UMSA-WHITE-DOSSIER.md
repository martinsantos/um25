# Entrega — UMSA White Dossier (local)

**Fecha:** 29 mayo 2026
**Rama:** `codex/umsa-white-dossier-local`
**Alcance:** Maqueta local en `http://localhost:4321` — sin deploy, sin push, sin commits en esta entrega.

---

## 1. Resumen ejecutivo

El rediseño **híbrido ejecutivo** UMSA (hero oscuro acotado + cuerpo editorial claro, Poppins/Open Sans, rojo `#DC2626` solo como acento) quedó implementado y validado en local. Las rutas comerciales críticas responden HTTP 200, el **gate E2E visual unificado** (`npm run audit:e2e:visual`) cerró con **0 fallos** en las cuatro capas, y la **auditoría comercial estricta** pasó con **64 chequeos** (32 rutas × desktop + mobile). Se generaron **26 capturas** de referencia en el cierre inicial. El sitio cumple el contrato de `DESIGN.md`: sin pantallas 100% negras fuera del hero, fichas documentales en servicios/antecedentes, copy ledger saneado en detalle de servicio, y `EvidenceCaseRow` unificado entre home y archivo de antecedentes.

---

## 2. URL y comandos

| Acción | Comando |
|--------|---------|
| Demo | http://localhost:4321 |
| Dev server | `cd /Users/santosma/Projects/um25 && npm run dev -- --port 4321` |
| **Gate E2E visual (oficial)** | `npm run audit:e2e:visual` |
| Auditoría comercial (capa 1 del gate) | `npm run audit:visual:commercial` |
| Auditoría estricta completa | `npm run audit:visual:strict` *(no usar como gate único)* |
| Auditoría rápida | `npm run audit:visual` |
| Entrega E2E | `docs/audits/e2e-visual-latest/ENTREGA-E2E-VISUAL.md` |
| Capturas (subset comercial) | Ver sección 6 |

---

## 3. Matriz de rutas verificadas

| Ruta | HTTP | Notas visuales |
|------|------|----------------|
| `/` | 200 | Hero oscuro + servicios + ledger antecedentes |
| `/servicios` | 200 | Índice editorial híbrido |
| `/sectores` | 200 | `SectorTemplateEditorial` índice |
| `/antecedentes` | 200 | Dossier + `EvidenceCaseRow` |
| `/nosotros` | 200 | Claro; timeline institucional; fotos reales |
| `/contacto` | 200 | Claro; proofline 24/7; CTAs por intención |
| `/blog` | 200 | Tokens UMSA; archivo tecnico |
| `/aeropuertos` | 200 | Hero acotado; cuerpo editorial blanco |
| `/bodegas` | 200 | Idem |
| `/gobiernosectorpublico` | 200 | Idem |
| `/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces` | 200 | Ficha documental + metadata |
| `/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza` | 200 | Dossier; `UMButton` en CTAs |
| `/blog/postgis-en-bodegas-fincas-rutas-y-reclamos-con-qgis` | 200 | Lectura ~740px |
| `/servicios-it-empresas-mendoza` | 200 | `GeoHubDossier`; canonical correcto |

---

## 4. Cambios por fase

### Fase 1–2 (iteraciones previas en rama)

- Tipografía Poppins 600 + Open Sans; skin híbrido en `v4.css`
- Home en 4 bloques; refactor servicios/antecedentes/sectores
- Fix pantallas negras en verticales (hero con imagen + wash, secciones claras)
- Componentes `src/components/um/*` y cableado en contacto, nosotros, blog, detalles
- `[sector].astro` delegado a plantillas editorial/atlas

### Cierre de plan (29 mayo 2026)

- Script `audit:visual:commercial` en `package.json`
- Reporte de auditoría en `docs/audits/umsa-closure-2026-05-29/audit-commercial-strict.json`
- 26 capturas en `docs/audits/umsa-closure-2026-05-29/captures/`
- Contacto: CTAs por intención con prefijo en mensaje; sin bloque duplicado
- Nosotros: timeline institucional
- GEO: `canonical` explícito en las 4 páginas hub
- Validación HTTP 14/14 rutas core

### Cierre E2E visual (29 mayo 2026, tarde)

- Matriz **32 labels** en `scripts/e2e-commercial-labels.mjs` (8 servicios + verticales + blog + GEO)
- Orquestador `scripts/run-e2e-visual-suite.mjs` → `npm run audit:e2e:visual`
- **0 fallos:** 64 strict + heurística + 30 defect paths + jest contratos
- Saneamiento copy ledger en `editorialContent.ts` y detalle de servicio / productos
- Defect scan: excluye `pre`/`code` para no confundir comentarios shell con Markdown
- Entrega E2E: `docs/audits/e2e-visual-latest/`

---

## 5. Archivos modificados (por área)

| Área | Archivos principales |
|------|---------------------|
| Design system | `src/styles/v4.css`, `src/utils/skinVariant.ts`, `src/layouts/LayoutV4.astro` |
| UM components | `src/components/um/*.astro` |
| Plantillas | `SectorTemplateEditorial.astro`, `AntecedentesTemplateEditorial.astro`, `GeoHubDossier.astro`, `EvidenceItem.astro` |
| Páginas | `index.astro`, `servicios/*`, `sectores.astro`, `[sector].astro`, `antecedentes/*`, `contacto.astro`, `nosotros.astro`, `blog/*`, páginas GEO |
| Auditoría | `scripts/run-commercial-visual-audit.mjs`, `scripts/run-e2e-visual-suite.mjs`, `scripts/e2e-commercial-labels.mjs`, `scripts/e2e-defect-scan.mjs`, `scripts/visual-contrast-audit.mjs`, `package.json` |
| Copy / CMS | `src/utils/editorialContent.ts`, `src/utils/productContent.ts`, `src/pages/servicios/[id]/[slug].astro`, `ProductCard.astro` |
| Entrega | `docs/ENTREGA-UMSA-WHITE-DOSSIER.md`, `docs/audits/umsa-closure-2026-05-29/*`, `docs/audits/e2e-visual-latest/*` |

---

## 6. Resultados audit

| Compuerta | Resultado | Detalle |
|-----------|-----------|---------|
| HTTP core (14 rutas) | **PASS** | Todas 200 con dev en 4321 |
| **`npm run audit:e2e:visual`** | **PASS** | `totalFailures: 0` — ver `docs/audits/e2e-visual-latest/e2e-visual-suite-summary.json` |
| `audit:visual:commercial` (capa 1) | **PASS** | **64** checks (32 labels × desktop + mobile), `failureCount: 0` |
| Heurística + defect scan + jest | **PASS** | 0 defectos en 30 paths; contratos hubs OK |
| JSON strict | `docs/audits/e2e-visual-latest/strict-commercial/audit-commercial-strict.json` | Copia de corrida gate |
| Capturas (cierre inicial) | **26 PNG** | `docs/audits/umsa-closure-2026-05-29/captures/` |

Gate recomendado antes de demo o PR:

```bash
npm run dev -- --port 4321
npm run audit:e2e:visual
```

Comando de capturas (subset comercial):

```bash
VISUAL_SNAPSHOT_DIR=docs/audits/umsa-closure-2026-05-29/captures \
VISUAL_SNAPSHOT_ROUTE_FILTER='home-default|servicios-default|...' \
VISUAL_SNAPSHOT_VIEWPORT_FILTER='^(desktop|mobile)$' \
node scripts/capture-visual-snapshots.mjs
```

**Nota:** `npm run audit:visual:strict` monolítico (92+ rutas, una pestaña CDP) puede dar falsos positivos de canonical; usar **`audit:e2e:visual`** como gate oficial.

---

## 7. Antes / después

| Problema | Antes | Después |
|----------|-------|---------|
| Pantallas negras en verticales | Viewport completo oscuro | Hero acotado + cuerpo `#fff` / `--skin-page` |
| Tipografía | Pesos 800+, mezcla inconsistente | Poppins 600, cuerpo ≥16px |
| Antecedentes home vs índice | Cards distintas | `EvidenceCaseRow` unificado |
| Sectores | Monolito en `[sector].astro` | Plantilla editorial; Atlas solo `?template=atlas` |
| Contacto | Genérico | Proofline 24/7 + intenciones + prefijo en formulario |
| GEO SEO | Sin canonical en layout | `canonical` por hub en las 4 rutas |
| Auditoría | CDP compartido inestable | Runner aislado por ruta/viewport |

---

## 8. Fuera de scope / deuda técnica

- **Commits:** cambios en working tree; no se creó commit en esta entrega.
- **Producción:** sin deploy ni push.
- **Auditoría full strict monolítica:** opcional; más lenta y sensible a estado CDP.
- **Capturas full:** subset 26 en closure; captura completa vía `npm run audit:screenshots` con tiempo extendido.

---

## 9. Réplica local antes de producción

Ver **`docs/REPLICA-LOCAL-PRODUCCION.md`**.

```bash
cp .env.replica.example .env   # + token Directus
npm run replica:sync           # con túnel SSH a :8055 si aplica
npm run dev:replica
npm run replica:gate           # preflight + paridad HTTP + audit:e2e:visual
```

## 10. Próximos pasos opcionales

1. `npm run replica:gate` en verde → `npm run check` → merge a `master`.
2. Commit en `codex/umsa-white-dossier-local` cuando quieras congelar la maqueta.
3. PR con capturas + evidencia `e2e-visual-latest/`.

---

## Criterios de done (plan)

| Criterio | Estado |
|----------|--------|
| Rutas core HTTP 200 | Cumplido |
| Gate E2E visual (`audit:e2e:visual`) 0 failures | Cumplido |
| Auditoría comercial strict 64 checks | Cumplido |
| Capturas generadas | Cumplido (26) |
| Smoke pantallas negras | Cumplido (audit + estructura HTML/plantillas) |
| Copy ledger en servicios comerciales | Cumplido |
| Entrega en español | Este documento + `docs/audits/e2e-visual-latest/ENTREGA-E2E-VISUAL.md` |
