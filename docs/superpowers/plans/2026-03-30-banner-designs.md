# Banner Designs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every sector (9) and service (8) page a unique 3-layer banner with thematic overlay + text effect tied to its industry identity.

**Architecture:** New `BannerHero.astro` component + `banner-overlays.css` with 15 overlay themes. Each page passes a `theme` prop that selects its overlay. Text effects already work via `pretextFx.ts`. No new JS dependencies.

**Tech Stack:** Astro components, CSS animations, SVG patterns, existing pretextFx engine.

---

### Task 1: Create banner-overlays.css with all 15 themes

**Files:**
- Create: `src/styles/banner-overlays.css`

- [ ] **Step 1: Create the overlay CSS file with all 15 themes**

```css
/* src/styles/banner-overlays.css — Thematic overlays for BannerHero */

/* ═══ BASE ═══ */
.banner-overlay {
  position: absolute; inset: 0; z-index: 20; pointer-events: none; overflow: hidden;
}

/* ═══ SALUD — Medical monitor grid + vitals HUD ═══ */
.overlay-salud {
  background:
    linear-gradient(rgba(34,197,94,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.07) 1px, transparent 1px);
  background-size: 40px 40px;
}
.overlay-salud::before {
  content: '♥ 72 bpm';
  position: absolute; top: 16px; right: 16px;
  font: 600 11px/1 'SF Mono','Fira Code',monospace;
  color: #22c55e; opacity: 0.7;
  animation: _bpm 1s steps(1) infinite;
}
.overlay-salud::after {
  content: 'SpO₂ 98%';
  position: absolute; top: 34px; right: 16px;
  font: 600 11px/1 'SF Mono','Fira Code',monospace;
  color: #22c55e; opacity: 0.5;
}
@keyframes _bpm { 0%,70%{opacity:.7} 71%,100%{opacity:.3} }

/* ═══ AEROPUERTOS — Split-flap board cells ═══ */
.overlay-aeropuertos {
  background:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 60px 50px;
}
.overlay-aeropuertos::before {
  content: 'GATE B12 · ON TIME';
  position: absolute; top: 16px; right: 16px;
  font: 700 10px/1 'SF Mono',monospace;
  color: #38bdf8; opacity: 0.5; letter-spacing: 0.1em; text-transform: uppercase;
}

/* ═══ BODEGAS — Aged paper + golden rule ═══ */
.overlay-bodegas {
  background: radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(168,85,247,0.04) 100%);
}
.overlay-bodegas::after {
  content: '';
  position: absolute; bottom: 25%; left: 5%; right: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c5a55a, transparent);
  opacity: 0.4;
  animation: _rule 2s ease forwards;
  transform-origin: left;
  transform: scaleX(0);
}
@keyframes _rule { to { transform: scaleX(1); } }

/* ═══ CONSTRUCCION — Blueprint grid ═══ */
.overlay-constructoras {
  background:
    linear-gradient(rgba(0,188,212,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,188,212,0.08) 1px, transparent 1px);
  background-size: 20px 20px;
}
.overlay-constructoras::before {
  content: 'PLANO Nº 2024-UM-001 · ESC 1:100';
  position: absolute; bottom: 12px; right: 16px;
  font: 600 9px/1 monospace;
  color: rgba(0,188,212,0.3); letter-spacing: 0.1em; text-transform: uppercase;
}

/* ═══ GOBIERNO — Official paper + watermark ═══ */
.overlay-gobierno {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 39px,
      rgba(16,185,129,0.04) 39px,
      rgba(16,185,129,0.04) 40px
    );
}
.overlay-gobierno::before {
  content: 'DOCUMENTO OFICIAL';
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%) rotate(-25deg);
  font: 800 48px/1 'Futura PT','Futura',sans-serif;
  color: rgba(16,185,129,0.04);
  letter-spacing: 0.2em; text-transform: uppercase;
  white-space: nowrap; pointer-events: none;
}

/* ═══ INDUSTRIA — Hazard stripes + conveyor belt ═══ */
.overlay-industria::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 6px;
  background: repeating-linear-gradient(
    -45deg,
    #fbbf24 0px, #fbbf24 10px,
    #111 10px, #111 20px
  );
  opacity: 0.6;
}
.overlay-industria::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 6px;
  background: repeating-linear-gradient(
    -45deg,
    #fbbf24 0px, #fbbf24 10px,
    #111 10px, #111 20px
  );
  opacity: 0.6;
}

/* ═══ MINERIA — Dust particles ═══ */
.overlay-mineria {
  background: radial-gradient(circle at 30% 70%, rgba(249,115,22,0.06) 0%, transparent 50%);
}
/* Particles are generated in BannerHero.astro as child divs */

/* ═══ SEGURIDAD — CRT scanlines + camera brackets + HUD ═══ */
.overlay-seguridad {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.05) 2px,
    rgba(0,0,0,0.05) 4px
  );
}
.overlay-seguridad::before {
  content: '';
  position: absolute; inset: 12px;
  border: 1px solid rgba(34,211,238,0.15);
  border-radius: 2px;
  /* Camera corner brackets via clip-path */
  clip-path: polygon(
    0 0, 20px 0, 20px 1px, 1px 1px, 1px 20px, 0 20px,
    0 calc(100% - 20px), 1px calc(100% - 20px), 1px calc(100% - 1px), 20px calc(100% - 1px), 20px 100%, 0 100%,
    100% 100%, calc(100% - 20px) 100%, calc(100% - 20px) calc(100% - 1px), calc(100% - 1px) calc(100% - 1px), calc(100% - 1px) calc(100% - 20px), 100% calc(100% - 20px),
    100% 20px, calc(100% - 1px) 20px, calc(100% - 1px) 1px, calc(100% - 20px) 1px, calc(100% - 20px) 0, 100% 0
  );
}
/* HUD is rendered by pretextFx surveillance engine */

/* ═══ SOFTWARE — Terminal chrome ═══ */
.overlay-software {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  margin: 8px;
  background: rgba(30,30,30,0.6);
}
.overlay-software::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 32px;
  background: rgba(50,50,50,0.8);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.overlay-software::after {
  content: '● ● ●';
  position: absolute; top: 8px; left: 14px;
  font-size: 12px; letter-spacing: 4px; line-height: 1;
  background: linear-gradient(90deg, #ff5f57 33%, #ffbd2e 33% 66%, #27c93f 66%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ═══ SERVICE OVERLAYS ═══ */

/* REDES — Data flow lines */
.overlay-redes {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 59px,
      rgba(249,115,22,0.06) 59px,
      rgba(249,115,22,0.06) 60px
    );
}
.overlay-redes::before {
  content: '○ ── ○ ── ○ ── ○';
  position: absolute; bottom: 16px; left: 16px;
  font: 10px/1 monospace; color: rgba(249,115,22,0.25); letter-spacing: 2px;
  animation: _flow 3s linear infinite;
}
@keyframes _flow { 0%{opacity:.2} 50%{opacity:.5} 100%{opacity:.2} }

/* TELECOM — Signal waves */
.overlay-telecom {
  background: radial-gradient(ellipse at 80% 50%, rgba(56,189,248,0.06) 0%, transparent 60%);
}
.overlay-telecom::before {
  content: ')))';
  position: absolute; top: 20px; right: 20px;
  font: 700 24px/1 sans-serif; color: rgba(56,189,248,0.15);
  animation: _wave 2s ease-in-out infinite;
}
@keyframes _wave { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.3;transform:scale(1.1)} }

/* SOPORTE — Uptime dots */
.overlay-soporte::before {
  content: '● ● ● ● ● ● ● ● ● ●';
  position: absolute; top: 16px; right: 16px;
  font-size: 8px; letter-spacing: 4px; color: #22c55e; opacity: 0.5;
  animation: _uptime 2s ease-in-out infinite;
}
@keyframes _uptime { 0%,100%{opacity:.3} 50%{opacity:.7} }

/* CONSULTORIA — Official blue (gobierno variant) */
.overlay-consultoria {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 39px,
      rgba(99,102,241,0.04) 39px,
      rgba(99,102,241,0.04) 40px
    );
}

/* INCENDIOS — Emergency strobe */
.overlay-incendios::before {
  content: '';
  position: absolute; inset: 0;
  border: 2px solid rgba(239,68,68,0.2);
  border-radius: 4px;
  animation: _strobe 1.5s ease-in-out infinite;
}
@keyframes _strobe { 0%,80%,100%{border-color:rgba(239,68,68,0.08)} 85%,95%{border-color:rgba(239,68,68,0.35)} }

/* ELECTRICOS — Circuit traces */
.overlay-electricos {
  background:
    linear-gradient(90deg, transparent 49%, rgba(245,158,11,0.05) 49%, rgba(245,158,11,0.05) 51%, transparent 51%),
    linear-gradient(0deg, transparent 49%, rgba(245,158,11,0.05) 49%, rgba(245,158,11,0.05) 51%, transparent 51%);
  background-size: 60px 60px;
}
.overlay-electricos::before {
  content: '⚡';
  position: absolute; top: 16px; right: 16px;
  font-size: 16px; opacity: 0.3;
  animation: _pulse 2s ease-in-out infinite;
}
@keyframes _pulse { 0%,100%{opacity:.2} 50%{opacity:.5} }

/* ═══ REDUCED MOTION ═══ */
@media (prefers-reduced-motion: reduce) {
  .overlay-salud::before,
  .overlay-bodegas::after,
  .overlay-redes::before,
  .overlay-telecom::before,
  .overlay-soporte::before,
  .overlay-incendios::before,
  .overlay-electricos::before {
    animation: none !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/banner-overlays.css
git commit -m "feat: add 15 thematic banner overlay CSS classes"
```

---

### Task 2: Create BannerHero.astro component

**Files:**
- Create: `src/components/BannerHero.astro`

- [ ] **Step 1: Create the component**

```astro
---
/**
 * BannerHero — 3-layer thematic banner for sector and service pages
 * Layer 1: Background photo (bgImage prop)
 * Layer 2: Thematic CSS overlay (theme prop)
 * Layer 3: pretextFx text effect (effect prop, runs client-side)
 */
import '../styles/banner-overlays.css';

export interface Props {
  title: string;
  theme: string;
  bgImage: string;
  color: string;
  effect: string;
  speed?: number;
  breadcrumb?: { label: string; href: string }[];
  badge?: string;
  emoji?: string;
  description?: string;
  stats?: { value: string; label: string }[];
}

const {
  title,
  theme,
  bgImage,
  color,
  effect,
  speed = 18,
  breadcrumb = [],
  badge,
  emoji,
  description,
  stats = [],
} = Astro.props;

// Theme → overlay class mapping
const overlayClass = `overlay-${theme}`;

// Dust particles for mineria
const isMineria = theme === 'mineria';
const particles = isMineria ? Array.from({ length: 18 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 3}px`,
  delay: `${Math.random() * 5}s`,
  duration: `${3 + Math.random() * 4}s`,
})) : [];
---

<section class="relative bg-um-dark pt-20 sm:pt-24 pb-8 sm:pb-12 lg:pb-16 overflow-hidden">
  <!-- Layer 1: Background photo -->
  <div class="absolute inset-0 opacity-35" style={`background-image:url('${bgImage}');background-position:center;background-size:cover;`}></div>
  <div class="absolute inset-0 bg-gradient-to-b from-um-dark/70 to-um-dark/90"></div>

  <!-- Layer 2: Thematic overlay -->
  <div class={`banner-overlay ${overlayClass}`}>
    {isMineria && particles.map(p => (
      <div
        style={`position:absolute;left:${p.left};top:${p.top};width:${p.size};height:${p.size};background:rgba(249,115,22,0.3);border-radius:50%;animation:_dust ${p.duration} ease-in-out ${p.delay} infinite;`}
      ></div>
    ))}
  </div>

  <!-- Layer 3: Content -->
  <div class="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Terminal theme: extra top padding for chrome bar */}
    {theme === 'software' && <div class="h-8"></div>}

    <!-- Breadcrumb -->
    {breadcrumb.length > 0 && (
      <nav class="flex items-center gap-2 mb-4 sm:mb-6">
        {breadcrumb.map((item, i) => (
          <>
            {i > 0 && (
              <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            )}
            {item.href ? (
              <a href={item.href} class="text-white/60 hover:text-white text-xs sm:text-sm transition-colors">{item.label}</a>
            ) : (
              <span class="text-white text-xs sm:text-sm">{item.label}</span>
            )}
          </>
        ))}
      </nav>
    )}

    <div class="max-w-3xl">
      {/* Badge */}
      {badge && (
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide mb-4 sm:mb-5" style={`background:${color}22;color:${color};`}>
          {badge}
        </span>
      )}

      {/* Emoji */}
      {emoji && <div class="text-4xl sm:text-5xl mb-3" aria-hidden="true">{emoji}</div>}

      {/* Title — pretextFx target */}
      <div id="hero-fx" class="mb-4 sm:mb-6" data-title={title} data-effect={effect} data-color={color} data-speed={speed}></div>
      <h1 class="sr-only">{title}</h1>

      {/* Description */}
      {description && (
        <p class="hero-fade text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8" style="opacity:0;">{description}</p>
      )}

      {/* Stats */}
      {stats.length > 0 && (
        <div class="hero-fade flex flex-wrap items-center gap-3 sm:gap-4" style="opacity:0;">
          {stats.map(stat => (
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 text-center border border-white/20 min-w-[100px] sm:min-w-[120px]">
              <div class="text-3xl sm:text-4xl font-extrabold text-white">{stat.value}</div>
              <div class="text-xs sm:text-sm text-white/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</section>

<style>
  .hero-fade { transition: opacity 0.8s ease, transform 0.6s ease; transform: translateY(8px); }
  .hero-fade.show { opacity: 1 !important; transform: translateY(0); }
  @keyframes _dust { 0%,100%{transform:translateY(0) scale(1);opacity:.3} 50%{transform:translateY(-20px) scale(1.2);opacity:.1} }
</style>

<script>
  import { heroFx } from '../utils/pretextFx';
  import type { WritingStyle } from '../utils/pretextFx';

  function init() {
    const el = document.getElementById('hero-fx');
    if (!el) return;
    const title = el.dataset.title || '';
    const effect = (el.dataset.effect || 'typewriter') as WritingStyle;
    const color = el.dataset.color || '#ef4444';
    const speed = parseInt(el.dataset.speed || '18');

    if (title) {
      heroFx(el, title, {
        lines: 3, color, speed, style: effect,
        onDone: () => {
          document.querySelectorAll('.hero-fade').forEach((el, i) => {
            setTimeout(() => el.classList.add('show'), i * 150);
          });
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('astro:page-load', init);
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BannerHero.astro
git commit -m "feat: add BannerHero component with 3-layer thematic banners"
```

---

### Task 3: Integrate BannerHero into all 9 sector pages

**Files:**
- Modify: `src/pages/salud.astro` (replace lines 58-90)
- Modify: `src/pages/aeropuertos.astro` (same pattern)
- Modify: `src/pages/bodegas.astro`
- Modify: `src/pages/constructoras.astro`
- Modify: `src/pages/gobiernosectorpublico.astro`
- Modify: `src/pages/industria.astro`
- Modify: `src/pages/mineria.astro`
- Modify: `src/pages/seguridad-electronica.astro`
- Modify: `src/pages/software.astro`

Each sector page currently has a hero section (lines 58-90) that needs to be replaced with the BannerHero component. Also remove the old inline script block that calls heroFx directly.

**Sector configuration map:**

| Page file | theme | effect | color | speed |
|-----------|-------|--------|-------|-------|
| salud.astro | `salud` | `heartbeat` | `#22c55e` | 14 |
| aeropuertos.astro | `aeropuertos` | `departure` | `#38bdf8` | 22 |
| bodegas.astro | `bodegas` | `pour` | `#a855f7` | 12 |
| constructoras.astro | `constructoras` | `blueprint` | `#f59e0b` | 18 |
| gobiernosectorpublico.astro | `gobierno` | `official` | `#10b981` | 16 |
| industria.astro | `industria` | `assembly` | `#6366f1` | 20 |
| mineria.astro | `mineria` | `drill` | `#f97316` | 18 |
| seguridad-electronica.astro | `seguridad` | `surveillance` | `#22d3ee` | 20 |
| software.astro | `software` | `terminal` | `#22c55e` | 18 |

- [ ] **Step 1: Add BannerHero import to each sector page**

In the frontmatter of each page, add:
```astro
import BannerHero from '../components/BannerHero.astro';
```

- [ ] **Step 2: Replace hero section in each page**

Replace the old hero section (from `<section class="relative bg-um-dark pt-20...">` through the closing `</section>` before the value_props section) with:

```astro
<BannerHero
  title={`Tecnología para ${nombre}`}
  theme="salud"
  bgImage={hero_image}
  color="#22c55e"
  effect="heartbeat"
  speed={14}
  emoji={emoji}
  description={descripcion}
  breadcrumb={[
    { label: 'Inicio', href: '/' },
    { label: 'Sectores', href: '/sectores' },
    { label: nombre, href: '' },
  ]}
  stats={[...stats.map(s => ({ value: s.value, label: s.label })), { value: `${antecedentes.length}+`, label: 'Proyectos' }]}
/>
```

Adjust `theme`, `color`, `effect`, `speed` per the config map above for each page.

- [ ] **Step 3: Remove the old `<style>` and `<script>` blocks from each sector page**

Delete the blocks that contain `heroFx` import and `hero-fade` styles — these are now inside BannerHero.

- [ ] **Step 4: Verify all 9 sector pages compile**

```bash
for url in /salud /aeropuertos /bodegas /constructoras /gobiernosectorpublico /industria /mineria /seguridad-electronica /software; do
  curl -s -o /dev/null -w "%{http_code} $url\n" "http://localhost:4321$url"
done
```

Expected: all 200

- [ ] **Step 5: Commit**

```bash
git add src/pages/salud.astro src/pages/aeropuertos.astro src/pages/bodegas.astro src/pages/constructoras.astro src/pages/gobiernosectorpublico.astro src/pages/industria.astro src/pages/mineria.astro src/pages/seguridad-electronica.astro src/pages/software.astro
git commit -m "feat: integrate BannerHero into all 9 sector pages"
```

---

### Task 4: Integrate BannerHero into service detail page

**Files:**
- Modify: `src/pages/servicios/[id]/[slug].astro` (replace lines 115-155, update script)

The service detail page needs a theme-per-service mapping. The script already has `serviceEffects` — extend it with the theme overlay.

- [ ] **Step 1: Add BannerHero import**

In frontmatter, add:
```astro
import BannerHero from '../../../components/BannerHero.astro';
```

- [ ] **Step 2: Create service → theme mapping in frontmatter**

```typescript
const serviceThemes: Record<string, { theme: string; effect: string; color: string; speed: number }> = {
  '101': { theme: 'redes',        effect: 'decode',        color: '#f97316', speed: 20 },
  '102': { theme: 'seguridad',    effect: 'surveillance',  color: '#22d3ee', speed: 20 },
  '103': { theme: 'telecom',      effect: 'departure',     color: '#38bdf8', speed: 22 },
  '104': { theme: 'software',     effect: 'terminal',      color: '#22c55e', speed: 18 },
  '105': { theme: 'soporte',      effect: 'heartbeat',     color: '#22c55e', speed: 14 },
  '106': { theme: 'consultoria',  effect: 'official',      color: '#6366f1', speed: 16 },
  '107': { theme: 'incendios',    effect: 'drill',         color: '#ef4444', speed: 18 },
  '108': { theme: 'electricos',   effect: 'fade',          color: '#f59e0b', speed: 15 },
};
const svcTheme = serviceThemes[id] || { theme: 'redes', effect: 'typewriter', color: '#ef4444', speed: 18 };
```

- [ ] **Step 3: Replace hero section with BannerHero**

Replace lines 115-155 (from `<!-- HERO SECTION -->` through `</section>`) with:

```astro
<BannerHero
  title={servicio.Titulo}
  theme={svcTheme.theme}
  bgImage={getDirectusImageUrl(servicio.Imagen)}
  color={svcTheme.color}
  effect={svcTheme.effect}
  speed={svcTheme.speed}
  badge={servicio.area}
  description={servicio.subtitulo}
  breadcrumb={[
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: servicio.Titulo, href: '' },
  ]}
/>
```

- [ ] **Step 4: Remove old script block**

Delete the `<script>` block that imports heroFx and has the `serviceEffects` map — BannerHero handles this now. Keep only the `paragraphFx` call for the description section if it exists.

- [ ] **Step 5: Verify all 8 service pages**

```bash
for id in 101 102 103 104 105 106 107 108; do
  slug=$(curl -s http://localhost:4321/servicios | grep -o "href=\"/servicios/${id}/[^\"]*" | head -1 | sed "s|href=\"||")
  curl -s -o /dev/null -w "%{http_code} $slug\n" "http://localhost:4321$slug"
done
```

Expected: all 200

- [ ] **Step 6: Commit**

```bash
git add src/pages/servicios/\[id\]/\[slug\].astro
git commit -m "feat: integrate BannerHero into service detail pages with per-service themes"
```

---

### Task 5: Final verification of all 20 pages

**Files:** None (read-only verification)

- [ ] **Step 1: Test all pages return 200**

```bash
for url in / /sectores /antecedentes \
  /salud /aeropuertos /bodegas /constructoras /gobiernosectorpublico \
  /industria /mineria /seguridad-electronica /software \
  /servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces \
  /servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi \
  /servicios/103/telecomunicaciones-datos-voz-video \
  /servicios/104/desarrollo-de-software-a-medida-web-mobile-erp \
  /servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it \
  /servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria \
  /servicios/107/sistemas-de-deteccion-y-alarma-de-incendios \
  /servicios/108/servicios-electricos-para-it; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321$url")
  echo "$code $url"
done
```

- [ ] **Step 2: Visual check each unique overlay**

Open each URL in browser and verify:
- Background photo visible through dark overlay
- Thematic overlay renders (grid lines, HUD text, hazard stripes, etc.)
- Text effect fires correctly with proper color
- Spaces visible between words
- Mobile responsive (shrink browser)
- No console errors

- [ ] **Step 3: Commit any final fixes**
