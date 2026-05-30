# Honestidad de contenido — auditoría 30 mayo 2026

**Rama de trabajo:** `codex/umsa-white-dossier-local` (réplica local)  
**Regla:** no publicar ISO corporativas, logos de cliente ni métricas sin fuente en CMS/snapshot.

---

## Hallucinaciones detectadas y corrección

| Claim inventado o desactualizado | Ubicación | Acción |
|----------------------------------|-----------|--------|
| ISO 9001 / ISO 27001 como certificación de la empresa | `certificaciones.astro`, `TrustStrip.astro` | Eliminado. Página reescrita: documentación bajo solicitud; NFPA/IRAM solo como referencia de proyecto. |
| NFPA como sello corporativo | `certificaciones.astro`, `TrustStrip` | Reformulado: experiencia SDI + normas según proyecto/cliente. |
| Chips ISO/NFPA en TrustStrip | `TrustStrip.astro` | Reemplazado por clientes del campo `Cliente` (top 6 del snapshot) y enlace a documentación. |
| Logos de cliente sin archivo en `public/` | `TrustStrip` (slots vacíos) | Eliminados placeholders; solo texto con enlace a filtro `/antecedentes?cliente=`. |
| **469+** antecedentes (snapshot actual: **518**) | home, nosotros, contacto, servicios, sectores, blog, EN, geo, llms | Centralizado en `src/utils/verifiedProof.ts` desde `snapshots/antecedentes.json`. |
| Stats CMS `469+`, `100% certificación`, ISO en bullets | `servicios/[id]/[slug].astro` + `sanitizeServiceStats` / `sanitizeServiceBulletList` | Filtrado en render. |
| «Técnicos certificados» (ambiguo = ISO) | servicio detalle proceso genérico | «Técnicos especializados». |
| Categoría blog «certificaciones del equipo» | `blog/categoria/[cat].astro` | Copy neutro sin certificaciones no probadas. |

**No modificado en esta pasada (fuera del sitio Astro principal):** `public/js/UMTerminalAdvanced.js`, plugins CLI, scripts de migración históricos, informes de auditoría Forbes/Shenzhen (metodología interna, no copy público).

---

## Fuentes permitidas (implementadas)

- **Conteo de antecedentes:** `src/data/snapshots/antecedentes.json` → `getAntecedentesCatalogCount()` (518 al 30/05/2026).
- **Clientes TrustStrip:** `getTopClienteNames()` por frecuencia de `Cliente` en el mismo snapshot.
- **KPIs en fichas:** `extractCaseMetricsFromAntecedente()` — solo números literales en título/descripción CMS.
- **Datasheets:** botón solo si existe `public/datasheets/{slug}.pdf` (`getDatasheetPublicPath`).
- **NFPA en blog:** contenido editorial de notas (normativa de referencia), no certificación UMSA.

---

## Buildable sin inventar vs. requiere cliente

| Buildable ya (honesto) | Requiere material del cliente |
|------------------------|-------------------------------|
| Catálogo 518 antecedentes + filtros | Logos de cliente autorizados (PNG/SVG en `public/uploads/logos/`) |
| Nombres de cliente en chips (CMS) | Certificados ISO 9001/27001 **si existen** — PDF para dossier, no badge web |
| Página documentación / contacto | Datasheets PDF por servicio en `public/datasheets/` |
| SDI/incendio con casos reales (107, antecedentes) | Métricas de resultado (uptime, SLA) con fuente contractual |
| EN factual (conteos desde snapshot) | Versión EN completa de copy legal/compliance |
| Blog técnico (NFPA como educación) | Página «seguridad de la información» solo con políticas firmadas |

---

## Verificación

Ejecutar:

```bash
npm run replica:gate
npm run check
```

Revisión manual sugerida: `/certificaciones`, `/`, `/servicios/107/*`, `/antecedentes/3065/*`, home TrustStrip.
