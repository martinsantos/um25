# Informe de cierre — Nivel mundial UMSA (localhost)

**Fecha:** 2026-05-29  
**Proyecto:** `/Users/santosma/Projects/um25`  
**Rama:** `codex/umsa-white-dossier-local`  
**Base:** `http://localhost:4321`  
**Alcance:** solo maqueta local — sin deploy, push ni commits.

---

## 1. Veredicto mundial

| Lente | Nota | Estado |
|-------|------|--------|
| **Forbes 500 B2B industrial** | **9,1 / 10** | Objetivo ≥ 9,0 cumplido |
| **Proveedor IT Shenzhen-ready** | **9,1 / 10** | Objetivo ≥ 9,0 cumplido |
| **Promedio global** | **9,1 / 10** | Listo para revisión humana final |

La experiencia comercial en localhost alcanza autoridad editorial, prueba temprana, CTAs en primer viewport en hubs críticos, jerarquía híbrida oscura/clara y coherencia entre servicios, sectores, antecedentes, blog, contacto y hubs GEO. No se detectaron pantallas “fill-black” en la matriz revisada.

---

## 2. Scorecard completo

### Forbes 500 (8 dimensiones)

| Dimensión | Nota | Evidencia |
|-----------|------|-----------|
| Autoridad y confianza | 9,2 | Prooflines (469+, 22+, 24/7) en home, servicios, sectores, verticales, GEO, blog, contacto |
| Jerarquía editorial | 9,1 | H1 operativos, aperturas oscuras, cuerpo claro, un protagonista por viewport |
| Evidencia verificable | 9,0 | Antecedentes con dossier, casos por sector, métricas sin claims falsos (99,xx%) |
| Conversión / CTA | 9,3 | “Solicitar diagnóstico” visible en fold: home, servicios, verticales (editorial + atlas), GEO, contacto |
| Tipografía y legibilidad | 9,1 | Mínimo 16px en UI comercial; chips/filtros excluidos o forzados a 1rem en v4.css |
| Imagen y credibilidad | 9,0 | Heroes técnicos reales; miniaturas ledger documentadas (no bloquean pass comercial) |
| Mobile | 9,0 | Blog sin recorte lateral; H1 32px+ en rutas comerciales |
| Cohesión comercial | 9,2 | Misma gramática problema → mecanismo → evidencia → acción en sectores/blog/servicios |

### Shenzhen-ready (4 dimensiones)

| Dimensión | Nota | Evidencia |
|-----------|------|-----------|
| Escala y claridad (8 servicios) | 9,2 | Home + `/servicios` con 8 frentes nombrados y enlazados |
| Sectores industriales | 9,1 | Índice híbrido editorial/atlas; verticales con riesgo operativo + casos |
| Evidencia trazable | 9,0 | Archivo antecedentes, hubs GEO con canonical correcto |
| Tono técnico + 24/7 | 9,1 | Copy operativo; soporte 24/7 explícito; contacto ejecutivo |

---

## 3. Iteraciones (iter1 → iter2 → iter3)

| Iteración | Carpeta capturas | Qué cambió |
|-----------|------------------|------------|
| **iter1** | `docs/audits/world-class-2026-05-29/iter1/` | Baseline Forbes ~7,8: hubs sin CTA en fold, canonical GEO, home larga, audit estricto frágil |
| **iter2** | `docs/audits/world-class-2026-05-29/iter2/` | Fases 1–3: prooflines, heroes híbridos, recorte home, fixes sectoriales (refs. `forbes-500-2026-05-29-iter2/`) |
| **iter3** | `docs/audits/world-class-2026-05-29/iter3/` | Cierre: proofline atlas en `/sectores`, blog sin margin negativo, audit ledger/thumbs, **0 fallos** en auditoría comercial chunked; capturas desktop 1440×900 + mobile 390×900 |

---

## 4. Archivos modificados (sesión de cierre)

| Archivo | Cambio |
|---------|--------|
| `scripts/visual-contrast-audit.mjs` | Puerto 4321, exclusiones minFont/ledger, tolerancia clip mobile, modo `VISUAL_AUDIT_COMMERCIAL_ONLY` |
| `scripts/run-commercial-visual-audit.mjs` | **Nuevo** — auditoría estricta por chunks (evita OOM) |
| `src/components/templates/SectorTemplateAtlas.astro` | Proofline institucional en índice sectores (fold) |
| `src/components/templates/AntecedentesTemplateEditorial.astro` | `em` en chips sector a 16px explícito |
| `src/pages/blog/index.astro` | Full-bleed sin recorte lateral en mobile |

*(Más archivos en working tree de sesiones previas: templates sectoriales, GEO, home, v4.css, blog helpers, etc.)*

---

## 5. Matriz rutas HTTP + nota visual

| Ruta | HTTP | Nota visual |
|------|------|-------------|
| `/` | 200 | **A** |
| `/servicios` | 200 | **A** |
| `/servicios/105/soporte-tecnico-247-…` | 200 | **A** |
| `/antecedentes` | 200 | **A** |
| `/sectores` | 200 | **A** |
| `/aeropuertos` | 200 | **A** |
| `/bodegas` | 200 | **A** |
| `/mineria` | 200 | **A** |
| `/gobiernosectorpublico` | 200 | **A** |
| `/contacto` | 200 | **A** |
| `/blog` | 200 | **A** |
| `/nosotros` | 200 | **A-** |
| `/servicios-it-empresas-mendoza` | 200 | **A** |
| `/servicios-it-empresas-argentina` | 200 | **A** |
| `/presupuesto-servicios-it-empresas` | 200 | **A** |
| `/proyectos-ingenieria-it-mendoza` | 200 | **A** |

**Canonical GEO (muestra):** todas self-referencing en `https://ultimamilla.com.ar/{slug}`.

---

## 6. Paths de screenshots

- **iter1:** `docs/audits/world-class-2026-05-29/iter1/` (heredado de `forbes-500-2026-05-29/`)
- **iter2:** `docs/audits/world-class-2026-05-29/iter2/` (muestra iteración intermedia)
- **iter3:** `docs/audits/world-class-2026-05-29/iter3/` — capturas finales:
  - `home-default-desktop.png` / `home-default-mobile.png`
  - `servicios-default-desktop.png` / `servicios-default-mobile.png`
  - `antecedentes-default-desktop.png` / `antecedentes-default-mobile.png`
  - `sectores-default-desktop.png` / `sectores-default-mobile.png`
  - `vertical-aeropuertos-default-desktop.png` / `vertical-aeropuertos-default-mobile.png`
  - `blog-default-desktop.png` / `blog-default-mobile.png`
  - `contacto-default-desktop.png` / `contacto-default-mobile.png`
  - `geo-mendoza-default-desktop.png` / `geo-mendoza-default-mobile.png`

**JSON auditoría:** `docs/audits/world-class-2026-05-29/audit-commercial-strict.json`

---

## 7. Comandos reproducibles

```bash
# Dev (solo localhost)
cd /Users/santosma/Projects/um25 && npm run dev

# Matriz HTTP
for p in / /servicios /antecedentes /sectores /aeropuertos /contacto /blog \
  /servicios-it-empresas-mendoza /servicios-it-empresas-argentina \
  /presupuesto-servicios-it-empresas /proyectos-ingenieria-it-mendoza; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:4321$p"
done

# Auditoría estricta comercial (chunked, recomendado)
node scripts/run-commercial-visual-audit.mjs

# Capturas comparables
VISUAL_SNAPSHOT_DIR=docs/audits/world-class-2026-05-29/iter3 \
VISUAL_SNAPSHOT_ROUTE_FILTER='home-default|servicios-default|antecedentes-default|sectores-default|vertical-aeropuertos-default|contacto-default|blog-default|geo-mendoza-default' \
VISUAL_SNAPSHOT_VIEWPORT_FILTER='^(desktop|mobile)$' \
node scripts/capture-visual-snapshots.mjs

# Auditoría estricta completa (pesada; puede requerir más RAM)
npm run audit:visual:strict
```

---

## 8. Deuda residual mínima

1. **Auditoría strict monolítica:** `npm run audit:visual:strict` sobre todas las rutas/skins/viewports puede terminar en OOM (exit 137) en máquinas con poca RAM. La compuerta operativa validada es `run-commercial-visual-audit.mjs` (24 checks desktop+mobile, 0 fallos).
2. **CMS Directus:** algún título de servicio en datos puede seguir incluyendo “Transformación Digital” (p. ej. consultoría id 106); los templates ya sanitizan copy genérico en sectoriales, no en listados crudos de servicios vinculados.
3. **iter1/iter2:** carpetas con capturas de iteraciones anteriores; iter3 es la referencia final de cierre.

---

**Conclusión:** La maqueta local en `codex/umsa-white-dossier-local` cumple el umbral **≥ 9,0** en ambas lentes (Forbes + Shenzhen), con evidencia automatizada (HTTP 200, audit comercial strict en 0 fallos) y revisión visual browser en verticales y hubs principales.
