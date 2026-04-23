# Blog Section — ULTIMA MILLA · Design Spec
Date: 2026-04-23  
Status: Approved

---

## 1. Overview

New `/blog` section for www.ultimamilla.com.ar. Daily content production across four categories: noticias, proyectos, técnico, empresa. Three deliverables: listing feed, single post page, homepage widget band. Design follows UMSA style system (dark theme, Inter font, blue palette).

---

## 2. Directus Data Model

New collection: **`blog_posts`**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK auto |
| `status` | string enum | `published` / `draft` / `scheduled` |
| `slug` | string | unique, URL-safe |
| `titulo` | string | required |
| `resumen` | text | 2–3 lines, used in cards and meta description |
| `contenido` | wysiwyg | Full rich text body |
| `imagen_portada` | file (Directus UUID) | Same pipeline as existing images |
| `categoria` | string enum | `noticias` / `proyectos` / `tecnico` / `empresa` |
| `tags` | json array | Free-form string tags |
| `fecha_publicacion` | datetime | Sort order, displayed on cards |
| `tiempo_lectura` | integer | Minutes, set manually at publish time |

Category color mapping:
- `noticias` → `#3b82f6` (blue)
- `proyectos` → `#10b981` (green)
- `tecnico` → `#f59e0b` (amber)
- `empresa` → `#8b5cf6` (violet)

---

## 3. Routes

```
src/pages/blog/index.astro              → /blog
src/pages/blog/[slug].astro             → /blog/:slug
src/pages/blog/categoria/[cat].astro    → /blog/categoria/:cat
src/components/blog/BlogBand.astro      → widget for home
```

---

## 4. `/blog` — Listing Feed

**Layout:** Feed/stream (Tumblr-style), not card grid.

### Hero Post (first post)
- Full-width image, 480px height
- Dark gradient overlay (`from-transparent to-#0a0f1e`)
- Metadata line: `CATEGORÍA · X min · DD MMM`
- Title: `2.5rem` bold white
- Full resumen text (3–4 lines), light gray
- CTA button: `[Leer artículo completo →]` outline blue

### Feed Posts (2nd onward)
- No prominent image by default; if post has `imagen_portada`, float it right at 35% width
- Metadata line: `CATEGORÍA · X min · DD MMM` (category in its color)
- Title: `1.25rem` bold white
- First ~200 characters of `resumen`, with `mask-image` CSS fade at bottom
- Link: `[leer más →]` in `#3b82f6`
- Separator: `<hr>` with `border-color: #1e3a5f`

### Pagination
- 10 posts per page
- Server-side via `?page=N` query param
- Navigation: `[← anterior]` · `[siguiente →]`

### Category Filter
- Horizontal tab row above feed: `[Todos] [Noticias] [Proyectos] [Técnico] [Empresa]`
- Active tab: filled blue pill; inactive: ghost
- Clicking a tab navigates to `/blog/categoria/:cat`

---

## 5. `/blog/[slug]` — Single Post

**Layout:** Two-column desktop, single-column mobile.

### Left column (sticky, desktop only)
- Table of contents auto-generated from H2/H3 headings in content
- Highlights active heading on scroll (Alpine.js IntersectionObserver)
- Width ~220px

### Main column
- Max-width: 720px, centered
- Header: `CATEGORÍA · X min lectura · DD MMM YYYY`
- Title: `2.25rem` bold
- `imagen_portada` full width below title (if present)
- Body: Inter `1.1rem`, `line-height: 1.8`, rich text rendered as HTML
- Syntax highlighting for code blocks (Shiki, dark theme)
- Tags: inline chips below body (`#seguridad`, `#redes`, etc.)
- Footer navigation: `[← post anterior]` · `[post siguiente →]`

No author attribution. No comments. No social share buttons.

---

## 6. Homepage Widget — `BlogBand`

Compact horizontal band, placed before the footer in `index.astro`.

- Background: `#0d1526`
- Header row: `── LO ÚLTIMO ──` left · `[Ver todo →]` right
- Three cards side by side (3 most recent `published` posts)
- Each card: square thumbnail 80×80px + category label (colored) + title max 2 lines + date
- No resumen in widget cards
- Mobile: horizontal scroll or single column stacked

---

## 7. Components

| Component | Purpose |
|---|---|
| `BlogBand.astro` | Homepage widget, fetches 3 latest posts |
| `BlogHero.astro` | Hero post in listing feed |
| `BlogFeedItem.astro` | Single feed entry (posts 2+) |
| `BlogPagination.astro` | Prev/next pagination controls |
| `BlogCategoryTabs.astro` | Category filter tabs |
| `BlogTOC.astro` | Sticky table of contents for single post |

---

## 8. Data Fetching Pattern

```typescript
// Standard Directus pattern, consistent with existing codebase
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const posts = await directus.request(
  readItems('blog_posts', {
    filter: { status: { _eq: 'published' } },
    sort: ['-fecha_publicacion'],
    limit: 10,
    offset: (page - 1) * 10,
    fields: ['id', 'slug', 'titulo', 'resumen', 'imagen_portada', 'categoria', 'fecha_publicacion', 'tiempo_lectura']
  })
);
```

Single post fetches full `contenido` field additionally.

---

## 9. SEO

- `<title>`: `{titulo} — ULTIMA MILLA Blog`
- `<meta name="description">`: `resumen` field (truncated to 160 chars)
- `<link rel="canonical">`: `/blog/{slug}`
- Open Graph: `og:image` from `imagen_portada` via Directus URL
- Blog index: no `noindex` (fully public, crawlable)

---

## 10. Out of Scope

- Comments / reactions
- Author profiles
- Newsletter signup
- RSS feed (can be added later)
- Search within blog
