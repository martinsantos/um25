# PLAN SUPERADO - NO USAR COMO DIRECCIÓN ACTIVA

Este documento queda preservado solo como antecedente histórico. La dirección vigente está en `DESIGN.md` y en el contrato **UMSA Next Level 2026 / White Dossier industrial premium**.

Decisiones activas que reemplazan este plan:

- Rojo UMSA exacto: `#DC2626`.
- Titulares editoriales: Poppins `600`; Futura PT queda reservada para logo/marca.
- Sin glassmorphism, pills redondeadas, gradientes SaaS, sky blue genérico ni cambio de marca.
- Blanco editorial como base, negro técnico solo para evidencia/capacidad operativa.
- Diseño por prueba, alcance, evidencia y CTA; no por efectos cromáticos.

---

# ARCHIVO HISTÓRICO: PLAN DE REDISEÑO UI - ULTIMA MILLA
## Dirección descartada: Light Sofisticado · Acento Rojo de Marca

---

## 1. DIAGNÓSTICO DEL ESTADO ACTUAL

### Problemas Identificados
1. **Paleta genérica** — Sky blue (#0ea5e9) + rojo es común y no diferencia
2. **Sin identidad visual** — Logo es texto plano "ultimamilla.com.ar" sin diseño
3. **Heroes planos** — Overlay oscuro sobre imágenes stock, gradiente estándar
4. **Cards cookie-cutter** — Tarjetas blancas con hover lift básico, nada distintivo
5. **Emojis como iconos** — ✈️🍷🏗️ en tiles de sectores es informal para B2B tech
6. **Sin ritmo visual** — Secciones alternan white/light-gray monótonamente
7. **Tipografía blanda** — Open Sans es funcional pero sin personalidad
8. **Sin micro-interacciones** — Solo translateY básicos en hover
9. **Footer genérico** — Bloque oscuro estándar sin interés visual
10. **Sin storytelling de marca** — El diseño no comunica "última milla"

---

## 2. NUEVA DIRECCIÓN ESTÉTICA: "LIGHT SOFISTICADO"

Inspiración: Apple, Notion, Linear (modo light), Stripe docs
Concepto: **Elegancia silenciosa** — cada pixel tiene propósito, nada sobra

---

## 3. SISTEMA DE COLOR

### Paleta Principal
```
Background Level 0 (base):     #FFFFFF     Pure White
Background Level 1 (surface):  #FAFBFC     Subtle Warm Gray
Background Level 2 (elevated):  #F1F5F9     Slate 100
Background Level 3 (contrast):  #0F172A     Slate 900 (dark sections)
```

### Texto
```
Text Primary:       #0F172A     Slate 900 — títulos, headings
Text Secondary:     #334155     Slate 700 — body text
Text Tertiary:      #64748B     Slate 500 — captions, metadata
Text Muted:         #94A3B8     Slate 400 — placeholders
Text On Dark:       #F8FAFC     Slate 50
```

### Acento (marca)
```
Accent Primary:     #DC2626     Red 600 — CTAs, acciones principales
Accent Hover:       #B91C1C     Red 700
Accent Light:       #FEF2F2     Red 50 — backgrounds sutiles
Accent Glow:        rgba(220, 38, 38, 0.15)  — shadows de botones
```

### Secundario (información, links)
```
Secondary:          #1E40AF     Blue 800 — links, info
Secondary Light:    #DBEAFE     Blue 100 — badges informativos
```

### Semánticos
```
Success:            #059669     Emerald 600
Warning:            #D97706     Amber 600
Info:               #0284C7     Sky 600
```

### Gradientes
```
Hero Gradient:      linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)
Surface Gradient:   linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)
Accent Gradient:    linear-gradient(135deg, #DC2626 0%, #991B1B 100%)
Glass Effect:       background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2);
```

### Bordes
```
Border Default:     #E2E8F0     Slate 200
Border Subtle:      #F1F5F9     Slate 100
Border Strong:      #CBD5E1     Slate 300
```

---

## 4. TIPOGRAFÍA

### Font Pairing
```
Headings:   Inter (Google Fonts) — weight 600, 700, 800
            Alternativa: Geist (si se puede self-host)
Body:       Inter — weight 400, 500
Brand:      Mantener Futura PT solo para el logo
Mono:       JetBrains Mono — para stats/números
```

### Escala de Tamaños (fluid)
```
Display:    clamp(3rem, 5vw, 4.5rem)    — Hero principal
H1:         clamp(2.25rem, 4vw, 3.5rem) — Títulos de página
H2:         clamp(1.75rem, 3vw, 2.5rem) — Títulos de sección
H3:         clamp(1.25rem, 2vw, 1.5rem) — Subtítulos
Body L:     1.125rem (18px)              — Body destacado
Body:       1rem (16px)                  — Body principal
Body S:     0.875rem (14px)              — Captions
Caption:    0.75rem (12px)               — Metadata
```

### Letter Spacing
```
Display/H1: -0.025em (tight)
H2/H3:      -0.015em
Body:        0 (normal)
Uppercase:   0.05em (tracking-wide)
```

### Line Heights
```
Headings:   1.1 - 1.2
Body:       1.6 - 1.7
```

---

## 5. REDISEÑO POR COMPONENTE

### 5.1 NAVBAR — "Floating Glass Bar"
**Antes**: Barra blanca sólida pegada al top, texto "ultimamilla.com.ar" como logo
**Después**:
- Navbar flotante con margen top (mt-4) y bordes redondeados (rounded-2xl)
- Glass morphism: `bg-white/80 backdrop-blur-xl border border-slate-200/50`
- Max-width contained: `max-w-6xl mx-auto`
- Logo: Isotipo "UM" estilizado + "ultima milla" en Inter 700
- Links: text-slate-600, hover:text-slate-900 con underline animado (no color change)
- CTA "Contacto": pill button rojo `bg-red-600 text-white rounded-full px-6 py-2`
- Transición: se convierte en barra completa con shadow al hacer scroll
- Mobile: Sheet desde abajo (no dropdown), con backdrop blur

### 5.2 HERO — "Statement Typography"
**Antes**: Imagen de fondo con overlay oscuro, gradientes, stats en cards
**Después**:
- Background: Blanco limpio con gradiente radial sutil (`radial-gradient(ellipse at top, #F1F5F9, #FFFFFF)`)
- Título GRANDE: Display size, Inter 800, color slate-900
- Palabra clave destacada: text-red-600 con underline decorativo SVG animado
- Subtítulo: text-slate-500, max-w-2xl, Inter 400
- CTAs: Botón primario rojo + botón secundario outline slate
- Stats: Inline, separados por `|`, números en JetBrains Mono font-bold
- Elemento decorativo: Grid de puntos sutiles o líneas geométricas (CSS puro)
- Sin imagen de fondo — la tipografía ES el hero
- Debajo del hero: logos de clientes o sectores en escala de grises (trust bar)

### 5.3 SERVICE CARDS — "Minimal Elevated"
**Antes**: Imagen 16:9 + badge + título + descripción + hover lift
**Después**:
- Sin imagen prominente — icono SVG monocromático grande (64px) en slate-300
- Background: white con border-slate-200
- Hover: border-red-200, shadow-lg, icono transiciona a red-600
- Título: Inter 600, text-slate-900
- Descripción: 2 líneas, text-slate-500
- Footer: Flecha → que se mueve 4px a la derecha en hover
- Border-radius: rounded-2xl
- Padding generoso: p-8
- Layout: Grid uniforme, sin stacking visual

### 5.4 PROJECT CARDS — "Editorial Grid"
**Antes**: Imagen + overlay + badge + título + hover con lift/ring
**Después**:
- Imagen full-width con aspect-[4/3], rounded-xl, NO overlay permanente
- Hover: escala sutil (1.02) con shadow-2xl, imagen brightness sube
- Debajo: tag de sector como pill pequeño (text-xs, bg-slate-100, text-slate-600)
- Título: Inter 600, line-clamp-2, text-slate-900
- Cliente: text-slate-400, font-mono text-xs uppercase tracking-wider
- Sin border en card — la imagen ya da la estructura visual
- Spacing entre imagen y texto: mt-4
- Link "Ver proyecto →" en red-600

### 5.5 SECTOR TILES — "Icon + Label Grid"
**Antes**: Emojis (✈️🍷🏗️) con texto, hover color
**Después**:
- Iconos SVG de Lucide (ya instalado) en slate-400 — 32px
- Background: transparent, hover → bg-slate-50 con border-slate-200
- Layout: horizontal flex, icono izquierda + texto derecha
- Texto: Inter 500, text-slate-700
- Border-radius: rounded-xl
- Transición suave de color en hover
- Grid: 3 cols desktop, 2 cols tablet, 1 col mobile

### 5.6 CTA SECTIONS — "Clean Statement"
**Antes**: Imagen de fondo con overlay oscuro, gradiente
**Después** (opción A — light):
- Background: #F1F5F9 (slate-100)
- Título grande centrado: Inter 700, text-slate-900
- Subtítulo: text-slate-500
- Botón rojo prominente centrado
- Decoración: línea horizontal roja delgada encima del título (w-16 h-0.5 bg-red-600)

**Después** (opción B — dark accent):
- Background: #0F172A (slate-900)
- Título: text-white, Inter 700
- Subtítulo: text-slate-400
- Botón blanco con texto oscuro
- Usado máximo 1 vez por página para contraste

### 5.7 FOOTER — "Structured & Clean"
**Antes**: bg-um-dark estándar, 4 columnas, gris sobre oscuro
**Después**:
- Background: #FAFBFC con border-t border-slate-200
- Texto: slate-600 / slate-400
- Logo en slate-900 (no invertido)
- Layout: 4 columnas pero con más jerarquía visual
- Títulos de columna: text-xs uppercase tracking-widest text-slate-400 font-medium
- Links: text-slate-600 hover:text-red-600
- Bottom bar: separador sutil, copyright en text-slate-400
- Alternativa: Footer dark como única sección oscura de la página (contraste elegante)

### 5.8 CONTACT FORM — "Elevated Panel"
**Antes**: Form estándar + mapa google
**Después**:
- Form en card elevada: bg-white rounded-3xl shadow-xl border border-slate-100 p-10
- Inputs: border-b border-slate-200 (sin border completo), focus → border-red-600
- Labels: text-xs uppercase tracking-wider text-slate-400
- Botón submit: full-width, bg-red-600, rounded-xl, h-14
- Info de contacto: sidebar con iconos Lucide en slate-400
- Mapa: rounded-2xl con border, sin filtro grayscale

### 5.9 FILTER BARS — "Pill Tabs"
**Antes**: Chips con border, activo en primary bg
**Después**:
- Pills minimalistas: bg-transparent, text-slate-500
- Activo: bg-slate-900 text-white rounded-full (no rojo — neutro)
- Hover inactivo: bg-slate-100
- Transición suave entre estados
- Search: input con rounded-full, bg-slate-50, border-slate-200

### 5.10 PAGE HEROES — "Clean Typography Headers"
**Antes**: Dark hero con bg-image, badge, stats
**Después**:
- Background: white → slate-50 gradiente sutil
- Breadcrumb: text-sm text-slate-400 con separadores "/"
- Título: Display size, Inter 800, text-slate-900
- Palabra clave: text-red-600
- Subtítulo: text-lg text-slate-500 max-w-3xl
- Sin imagen de fondo — limpio y tipográfico
- Stats opcionales debajo en formato inline

---

## 6. MICRO-INTERACCIONES & MOTION

### Hover Effects
```css
/* Cards */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
hover: shadow-lg → shadow-xl, border-color shift

/* Links */
.link-underline: position relative, ::after pseudo-element
  width 0 → 100% on hover, height 1px, bg-red-600

/* Buttons */
hover: scale(1.02), shadow increase
active: scale(0.98)
```

### Scroll Animations (CSS only, no JS library)
```css
/* Intersection Observer con classes */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered children */
.reveal-stagger > *:nth-child(1) { transition-delay: 0.1s; }
.reveal-stagger > *:nth-child(2) { transition-delay: 0.2s; }
/* etc. */
```

### Loading States
- Skeleton screens con gradiente animado (shimmer)
- Image loading: blur-up con placeholder color

### Page Transitions
- Mantener simple: fade 200ms entre páginas via View Transitions API de Astro

---

## 7. ELEMENTOS DIFERENCIADORES

### Identidad "Última Milla"
- Motivo visual de "conexión": líneas punteadas que conectan secciones
- Isotipo "UM" como marca reducida (en favicon, corners)
- Concepto de "último tramo" en las animaciones (elementos que "llegan" desde la derecha)

### Lo que hace único este diseño
- **Espacio negativo generoso** — respira, no satura
- **Tipografía como protagonista** — no depende de imágenes stock
- **Coherencia cromática** — rojo solo para acción, todo lo demás en escala de slates
- **Detalles craft** — bordes redondeados consistentes, shadows calibrados, spacing perfecto
- **Professional restraint** — menos es más, cada elemento justifica su presencia

---

## 8. ARCHIVOS A MODIFICAR

### Configuración
- [ ] `tailwind.config.mjs` — Nuevos color tokens
- [ ] `src/styles/v4.css` — Variables CSS, animaciones, utilidades

### Layout & Chrome
- [ ] `src/layouts/LayoutV4.astro` — Fonts, meta, inline styles
- [ ] `src/components/v4/NavbarV4.astro` — Floating glass navbar
- [ ] `src/components/v4/FooterV4.astro` — Light footer redesign

### Componentes
- [ ] `src/components/v4/HeroPageV4.astro` — Clean typography hero
- [ ] `src/components/v4/ServiceCard.astro` — Minimal elevated cards
- [ ] `src/components/v4/CTASection.astro` — Clean statement CTA
- [ ] `src/components/ProjectCard.astro` — Editorial grid cards

### Páginas (solo clases visuales)
- [ ] `src/pages/index.astro` — Homepage sections redesign
- [ ] `src/pages/contacto.astro` — Elevated form panel
- [ ] `src/pages/servicios/index.astro` — Filter + grid visual update
- [ ] `src/pages/antecedentes/index.astro` — Filter pills + editorial grid
- [ ] Sector pages (constructoras, bodegas, salud, etc.) — Unified visual update
- [ ] `src/pages/nosotros.astro` — About page refresh

### Total estimado: ~20 archivos, cambios solo visuales/CSS
