# UMSA Global Provider UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar la demo localhost de ULTIMA MILLA a una experiencia UI/UX de proveedor IT internacional, con narrativa Executive Industrial Evidence, rutas/SEO/GEO intactos y validacion visual estricta.

**Architecture:** The work stays inside the existing Astro V4 system. The first iteration is deliberately scoped to the highest-impact shared surfaces: global design contract, home proof/trust, servicios opening, antecedentes/sectores information hubs, blog readability and contacto action flow. Existing data contracts, Directus helpers, slugs, canonicals and production deployment remain untouched.

**Tech Stack:** Astro 5 SSR, TypeScript, CSS V4 tokens, Directus snapshot/fallback data, Jest, custom visual audit scripts, in-app Browser QA.

---

## File Structure

- Modify `DESIGN.md`: record the active Executive Industrial Evidence goal as the current acceptance contract.
- Modify `src/components/um/TrustStrip.astro`: keep evidence-based trust, remove weak chip feel, preserve no invented logos/certifications.
- Modify `src/pages/index.astro`: make home narrative tighter; one proof sequence, no redundant institutional bands.
- Modify `src/pages/servicios/index.astro`: keep early CTAs and compact dossier hierarchy.
- Modify `src/components/templates/AntecedentesTemplateEditorial.astro`: preserve sticky one-line filters, opaque mask, archive readability.
- Modify `src/components/templates/SectorTemplateAtlas.astro` and/or `SectorTemplateEditorial.astro`: keep sectors as markets/operations, not family/catalog language.
- Modify `src/pages/blog/index.astro` and `src/pages/blog/[slug].astro`: keep real thumbnails/featured images and production-grade reading rhythm.
- Modify `src/pages/contacto.astro`: keep four-field fast form, clean contrast, visible expected next step.
- Modify `src/styles/v4.css`: only shared token/contract fixes; no blanket selectors that break dark panels.
- Test with `scripts/visual-contrast-audit.mjs`, `scripts/css-contract-audit.mjs`, Jest and Astro build.

---

### Task 1: Lock The Current Goal Into The Design Contract

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Add the super-goal section near the top of `DESIGN.md`**

Insert this section after the opening metadata:

```markdown
## GOAL Superador UMSA Global Provider 2026

La direccion activa es Executive Industrial Evidence: una web de servicios IT con percepcion de proveedor internacional, capaz de explicar problema operativo, capacidad UMSA, evidencia y siguiente paso en menos de 30 segundos por pantalla.

La aceptacion ya no depende solo de pasar auditorias tecnicas. Una pantalla no esta lista si contiene ruido visual, duplicacion, bordes innecesarios, filtros administrativos, imagenes decorativas, titulares desproporcionados, CTAs corridos, contraste dudoso o copy generico sin prueba.

El sistema debe mantener marca, rutas, canonicals, sitemap, robots, JSON-LD, GEO/LLM, Directus y produccion intactos. Todo se prueba primero en localhost.
```

- [ ] **Step 2: Confirm no contradictory goal remains**

Run:

```bash
rg -n "White Dossier puro|skins no son diseno|Executive Industrial|Forbes|Shenzhen" DESIGN.md
```

Expected: The active direction is compatible with Executive Industrial Evidence, and old skin-only language is framed as insufficient rather than current target.

---

### Task 2: Re-Audit The Current Localhost State Before UI Changes

**Files:**
- No source changes.
- Output outside repo: `/tmp/umsa-visual-strict-before.json`

- [ ] **Step 1: Run strict visual audit with stable CDP timeout**

```bash
VISUAL_AUDIT_STRICT=1 \
VISUAL_AUDIT_CDP_TIMEOUT_MS=30000 \
VISUAL_AUDIT_ROUTE_TIMEOUT_MS=45000 \
npm run audit:visual:strict > /tmp/umsa-visual-strict-before.json
```

Expected: JSON parses and either reports `failures: []` or gives concrete failures to fix first.

- [ ] **Step 2: Summarize failures**

```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('/tmp/umsa-visual-strict-before.json','utf8'); const json=JSON.parse(s.slice(s.indexOf('{'))); console.log(JSON.stringify({checked:json.checked, failures:json.failures}, null, 2));"
```

Expected: Known state is documented before visual iteration.

---

### Task 3: Tighten Home Trust And Evidence

**Files:**
- Modify: `src/components/um/TrustStrip.astro`
- Modify: `src/pages/index.astro` only if duplicate proof bands remain visible in first two scrolls.

- [ ] **Step 1: Keep trust evidence concrete**

Ensure `TrustStrip.astro` uses:

```astro
const catalogCount = getAntecedentesCatalogCount();
const catalogShort = getAntecedentesCountShort();
const clientRecords = getTopClienteRecords(6);
```

Expected: no invented client logos, no fake ISO/certification claims, client names tied to antecedente counts.

- [ ] **Step 2: Remove chip/card treatment if it reads as noisy**

Use row/list treatment, not decorative chips:

```css
.um-trust-strip__client {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) max-content;
  gap: 16px;
  align-items: center;
  min-height: 78px;
  padding: 16px 20px;
  text-decoration: none;
}

.um-trust-strip__client + .um-trust-strip__client {
  border-top: 1px solid rgba(17, 17, 17, 0.08);
}
```

Expected: trust section reads as evidence ledger, not chips or badges.

---

### Task 4: Preserve Services First-Viewport Conversion

**Files:**
- Modify: `src/pages/servicios/index.astro`

- [ ] **Step 1: Keep CTAs before proofline**

The hero order must be:

```astro
<h1>{serviciosIndexH1}</h1>
<p>...</p>
<div class="services-actions services-actions--intents">...</div>
<dl class="services-hero__proofline">...</dl>
```

Expected: `npm run audit:visual:strict` finds at least one CTA in `/servicios` first viewport on compact desktop.

- [ ] **Step 2: Keep service index compact**

Avoid returning to eight giant repeated rows. The dossier list should remain compact and scannable through `.services-dossier__list` and `.service-dossier-item`.

Expected: servicios feels like a commercial dossier, not a long catalog.

---

### Task 5: Stabilize Information Hubs

**Files:**
- Modify: `src/components/templates/AntecedentesTemplateEditorial.astro`
- Modify: `src/components/templates/SectorTemplateAtlas.astro`
- Modify: `src/components/templates/SectorTemplateEditorial.astro`

- [ ] **Step 1: Keep antecedentes filter sticky and visually quiet**

Required CSS:

```css
.ante-dossier__controls {
  position: sticky;
  top: 72px;
  background: var(--ante-page);
  backdrop-filter: none;
  box-shadow: 0 -18px 0 var(--ante-page);
}
```

Expected: filter is sticky on desktop, opaque, masks clipped content, and does not look like an administrative toolbar.

- [ ] **Step 2: Keep sector language as market/operation**

Search:

```bash
rg -n "familia|familias|catalogo|catálogo" src/components/templates/SectorTemplate*.astro src/pages/sectores.astro
```

Expected: no public-facing “familia” language in sector hub. Sectors are markets, operations or verticals.

---

### Task 6: Blog Readability Pass

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/[slug].astro`
- Modify: `src/utils/blogHelpers.ts` only if images are missing or fallback logic is wrong.

- [ ] **Step 1: Ensure each blog card uses real image data**

Verify `blogPostImageUrl(post)` is used for cards and `imgUrl` for single hero. Fallback folios are allowed only when the post truly has no image.

Expected: blog index has thumbnails; blog single has a featured image.

- [ ] **Step 2: Keep article reading measure and hierarchy**

Required article constraints:

```css
.article-body {
  max-width: 860px;
}

.prose {
  font-size: 1.0625rem;
  line-height: 1.78;
}
```

Expected: single blog reads better than or equal to the old production single.

---

### Task 7: Contacto Fast Action Pass

**Files:**
- Modify: `src/pages/contacto.astro`
- Preserve: `src/pages/api/contact.ts`

- [ ] **Step 1: Keep the visible form simple**

Visible fields remain:

```text
name
email
company
message
```

Hidden antispam remains:

```text
website
startedAt
```

Expected: no captcha-like noise, no long select flow, no decorative sidebars competing with the form.

- [ ] **Step 2: Confirm contrast on dark panels**

Any dark panel in contacto must explicitly set white text and muted white copy, not depend on global skin selectors.

Expected: no black text on black panel in visual audit/browser review.

---

### Task 8: Verification Gate

**Files:**
- No source changes unless a gate fails.

- [ ] **Step 1: Run static and visual checks**

```bash
npm run typecheck
npm run lint -- --quiet
npm run audit:css
VISUAL_AUDIT_STRICT=1 VISUAL_AUDIT_CDP_TIMEOUT_MS=30000 VISUAL_AUDIT_ROUTE_TIMEOUT_MS=45000 npm run audit:visual:strict > /tmp/umsa-visual-strict-after.json
```

Expected: typecheck, lint, CSS audit and strict visual audit pass.

- [ ] **Step 2: Run tests and build**

```bash
npm test
npm run build
```

Expected: all tests pass and Astro build completes.

- [ ] **Step 3: Browser sanity check**

Open these routes on localhost:

```text
http://localhost:4321/
http://localhost:4321/servicios
http://localhost:4321/antecedentes?sector=aeropuertos
http://localhost:4321/sectores?sector=bodegas
http://localhost:4321/blog
http://localhost:4321/contacto
```

Expected: no framework overlay, no blank page, no obvious mobile collapse, no duplicate proof/CTA noise.

---

## Self-Review

- Spec coverage: covers the active super-goal, critical page families, SEO/GEO constraints and localhost-only validation.
- Placeholder scan: no TBD/TODO placeholders.
- Scope check: this is a Phase 1 plan, not a full redesign freeze. It is intentionally scoped to shared surfaces and gates so it can be executed safely on the current dirty worktree.
