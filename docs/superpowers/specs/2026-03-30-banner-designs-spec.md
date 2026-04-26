# Banner Designs Spec — 9 Sectores + 8 Servicios

## Context

Each sector and service page needs a thematic 3-layer banner where the text effect, background, and overlay tell a story unique to that vertical. Currently all pages share the same generic dark overlay + pretext effect. This spec defines the complete visual identity per page.

## Architecture: 3-Layer Stack

```
z-30: Text effect (pretextFx engine)
z-20: Thematic overlay (CSS/SVG, sector-specific)
z-10: Background photo (existing Unsplash/Directus images)
```

Implemented as a shared Astro component: `BannerHero.astro`

## SECTORS

### 1. Salud — Monitor ECG
- **Photo**: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=80`
- **Overlay**: Medical monitor grid (green lines 40px), vitals HUD: "♥ 72 bpm" + "SpO2 98%" top-right
- **Text effect**: `heartbeat` — ECG rhythm with char scale-pulse, green ECG bar at line.width
- **Color**: `#22c55e`

### 2. Aeropuertos — Panel de Vuelos
- **Photo**: `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80`
- **Overlay**: Split-flap board cells (grid of dark cells with thin borders, monospace feel)
- **Text effect**: `departure` — words flip through alphabet before settling
- **Color**: `#38bdf8`

### 3. Bodegas — Cosecha Elegante
- **Photo**: `https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1920&q=80`
- **Overlay**: Aged paper texture (noise SVG filter, opacity 0.04) + golden horizontal rule that draws itself
- **Text effect**: `pour` — clip-path fill top-down, wine gradient, line by line
- **Color**: `#a855f7`

### 4. Construcción — Plano Técnico
- **Photo**: `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80`
- **Overlay**: Blueprint grid (cyan lines every 20px on deep blue #003366) + dimension marks
- **Text effect**: `blueprint` — lines unfold scaleX(0→1) from left, text cyan→white
- **Color**: `#f59e0b`

### 5. Gobierno — Impresora Oficial
- **Photo**: `https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=1920&q=80`
- **Overlay**: Official paper (cream bg, horizontal rules like form lines) + watermark diagonal text "DOCUMENTO OFICIAL"
- **Text effect**: `official` — word-by-word reveal, last word STAMPS with scale(2.5)+rotate(-8°)
- **Color**: `#10b981`

### 6. Industria — Línea de Montaje
- **Photo**: `https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80`
- **Overlay**: Hazard stripes (diagonal yellow/black) at top+bottom edges + animated conveyor belt texture
- **Text effect**: `assembly` — words fly in from scattered positions (±300px, ±30° rotation)
- **Color**: `#6366f1`

### 7. Minería — Perforación
- **Photo**: `https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1920&q=80`
- **Overlay**: Dust particles (15-20 small divs, random position, float animation) + crack SVG line
- **Text effect**: `drill` — words punch up from translateY(100%), heavy chunky motion
- **Color**: `#f97316`

### 8. Seguridad Electrónica — CCTV
- **Photo**: `https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1920&q=80`
- **Overlay**: CRT scanlines (repeating-gradient 2px) + camera corner brackets + HUD "● REC HH:MM:SS CAM-01"
- **Text effect**: `surveillance` — typewriter with random glitch on 15% chars
- **Color**: `#22d3ee`

### 9. Software — Terminal
- **Photo**: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80`
- **Overlay**: Terminal chrome (title bar with 3 dots: red/yellow/green, dark bg #1E1E1E) wrapping entire hero content
- **Text effect**: `terminal` — `$ ` prefix, green chars settling to white, block cursor
- **Color**: `#22c55e`

## SERVICES

### 101. Redes / Fibra Óptica — Decode
- **Photo**: Directus image via `getDirectusImageUrl(servicio.Imagen)`
- **Overlay**: Data flow grid (horizontal dashed lines with moving dots, simulating network packets)
- **Text effect**: `decode` — random chars resolve left-to-right
- **Color**: `#f97316`

### 102. Seguridad Electrónica CCTV — Surveillance
- **Photo**: Directus image
- **Overlay**: Same CCTV overlay as sector (scanlines + corner brackets + HUD)
- **Text effect**: `surveillance` — glitch typewriter + REC overlay
- **Color**: `#22d3ee`

### 103. Telecomunicaciones — Departure
- **Photo**: Directus image
- **Overlay**: Signal wave pattern (SVG sine waves at different frequencies, subtle animation)
- **Text effect**: `departure` — words flip through alphabet
- **Color**: `#38bdf8`

### 104. Software a Medida — Terminal
- **Photo**: Directus image
- **Overlay**: Terminal chrome (same as sector Software)
- **Text effect**: `terminal` — `$ ` prompt, green→white
- **Color**: `#22c55e`

### 105. Soporte 24/7 — Heartbeat
- **Photo**: Directus image
- **Overlay**: Uptime monitor grid (green dots = up, pulsing) like a status dashboard
- **Text effect**: `heartbeat` — ECG rhythm, always-on feel
- **Color**: `#22c55e`

### 106. Consultoría IT — Official
- **Photo**: Directus image
- **Overlay**: Official paper (same as sector Gobierno but with blue tones)
- **Text effect**: `official` — word-by-word + stamp seal
- **Color**: `#6366f1`

### 107. Incendios — Drill Alarm
- **Photo**: Directus image
- **Overlay**: Emergency strobe (subtle red pulse animation on edges) + alarm icon
- **Text effect**: `drill` — chars punch up urgently + red flash
- **Color**: `#ef4444`

### 108. Eléctricos — Fade Energy
- **Photo**: Directus image
- **Overlay**: Circuit board pattern (SVG traces with nodes at intersections, subtle)
- **Text effect**: `fade` — blur-to-sharp per char, energy warming up
- **Color**: `#f59e0b`

## Implementation

### New component: `src/components/BannerHero.astro`

Props:
```typescript
interface Props {
  title: string;
  theme: 'salud' | 'aeropuertos' | 'bodegas' | 'constructoras' | 'gobierno' | 'industria' | 'mineria' | 'seguridad' | 'software' | 'redes' | 'telecom' | 'soporte' | 'consultoria' | 'incendios' | 'electricos';
  bgImage: string;
  color: string;
  effect: WritingStyle;
  breadcrumb?: { label: string; href: string }[];
  badge?: string;
  emoji?: string;
  description?: string;
  stats?: { value: string; label: string }[];
}
```

### New CSS file: `src/styles/banner-overlays.css`

Contains all 15 overlay themes as CSS classes:
- `.overlay-salud` (medical grid + HUD)
- `.overlay-aeropuertos` (split-flap cells)
- `.overlay-bodegas` (aged paper + gold rule)
- `.overlay-constructoras` (blueprint grid)
- `.overlay-gobierno` (official paper + watermark)
- `.overlay-industria` (hazard stripes + conveyor)
- `.overlay-mineria` (dust particles + crack)
- `.overlay-seguridad` (CRT + camera brackets + HUD)
- `.overlay-software` (terminal chrome)
- `.overlay-redes` (data flow lines)
- `.overlay-telecom` (signal waves)
- `.overlay-soporte` (uptime dots)
- `.overlay-consultoria` (official blue)
- `.overlay-incendios` (emergency strobe)
- `.overlay-electricos` (circuit traces)

### Modified files:
- 9 sector pages: replace hero section with `<BannerHero>`
- Service detail page: replace hero section with `<BannerHero>`
- Homepage: keep showcase (already has its own structure)

## Verification

After implementation, test all 20 pages:
- Photos load correctly
- Overlays render without covering text
- Text effects fire and are readable
- Mobile responsive (overlays simplify on small screens)
- No performance issues (overlays are CSS-only, no JS)
