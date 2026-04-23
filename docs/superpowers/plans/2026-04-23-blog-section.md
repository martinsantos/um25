# Blog Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a world-class blog section at `/blog` with Tumblr-style feed, homepage widget band, and single post page — all connected to a new `blog_posts` Directus collection.

**Architecture:** Directus `blog_posts` collection feeds three surfaces: `/blog` (Tumblr-style feed with hero + stacked items), `/blog/[slug]` (single post with sticky TOC), and a `BlogBand` component embedded in the homepage. All pages use `LayoutV4`. Data fetching uses the existing `getClient()` SDK pattern from `src/lib/directus.ts`.

**Tech Stack:** Astro 5.7.4 SSR, Directus SDK v13, Tailwind CSS, Alpine.js, date-fns, Node.js migration script for collection creation.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/directus.ts` | Modify | Update `EntradaBlog` interface; add `getBlogPostsListing`, `getBlogPost`, `getBlogPostsForBand` |
| `scripts/create-blog-collection.mjs` | Create | One-time Directus schema migration |
| `src/utils/blogUtils.ts` | Create | `addHeadingIds()` helper (TOC generation) |
| `src/components/blog/BlogBand.astro` | Create | Homepage widget — 3 latest posts |
| `src/components/blog/BlogHero.astro` | Create | Hero post in feed (full-width image) |
| `src/components/blog/BlogFeedItem.astro` | Create | Feed item (posts 2+) with fade + "leer más" |
| `src/components/blog/BlogCategoryTabs.astro` | Create | Category filter tabs |
| `src/components/blog/BlogPagination.astro` | Create | Prev/next pagination |
| `src/components/blog/BlogTOC.astro` | Create | Sticky table of contents for single post |
| `src/pages/blog/index.astro` | Create | /blog listing page |
| `src/pages/blog/categoria/[cat].astro` | Create | /blog/categoria/:cat filtered feed |
| `src/pages/blog/[slug].astro` | Create | Single post page |
| `src/pages/index.astro` | Modify | Add `<BlogBand>` before `</LayoutV4>` |
| `__tests__/blogUtils.test.ts` | Create | Tests for `addHeadingIds` |

---

## Task 1: Update Directus Types & Add Blog Helpers

**Files:**
- Modify: `src/lib/directus.ts`

- [ ] **Step 1: Write the failing test for getBlogPostsForBand**

Create `__tests__/blogUtils.test.ts` — will fail until helpers are exported:

```typescript
// __tests__/blogUtils.test.ts
import { addHeadingIds } from '../src/utils/blogUtils';

test('addHeadingIds adds id to h2', () => {
  const html = '<h2>Seguridad perimetral</h2><p>Texto</p>';
  const { html: out, headings } = addHeadingIds(html);
  expect(out).toContain('id="seguridad-perimetral"');
  expect(headings).toHaveLength(1);
  expect(headings[0]).toEqual({ level: 2, id: 'seguridad-perimetral', text: 'Seguridad perimetral' });
});

test('addHeadingIds handles h3 and special chars', () => {
  const html = '<h3>Redes inalámbricas (Wi-Fi)</h3>';
  const { headings } = addHeadingIds(html);
  expect(headings[0].id).toBe('redes-inal-mbricas-wi-fi');
});

test('addHeadingIds returns empty headings for plain html', () => {
  const html = '<p>No hay headings aquí</p>';
  const { headings } = addHeadingIds(html);
  expect(headings).toHaveLength(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern=blogUtils
```

Expected: FAIL — "Cannot find module '../src/utils/blogUtils'"

- [ ] **Step 3: Replace `EntradaBlog` interface in `src/lib/directus.ts`**

Find the existing `EntradaBlog` interface (around line 55) and replace it entirely:

```typescript
export interface EntradaBlog {
  id: string;
  status: 'published' | 'draft' | 'scheduled';
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_portada: string | null;
  categoria: 'noticias' | 'proyectos' | 'tecnico' | 'empresa';
  tags: string[];
  fecha_publicacion: string;
  tiempo_lectura: number;
}
```

- [ ] **Step 4: Add three blog helper functions to `src/lib/directus.ts`**

Add after the `getHeroHomeImages` function (before the export types section):

```typescript
/**
 * Obtiene posts del blog con paginación y filtro de categoría.
 * Retorna posts + total para calcular páginas.
 */
export async function getBlogPostsListing(
  page = 1,
  limit = 10,
  categoria?: string
): Promise<{ posts: EntradaBlog[]; total: number }> {
  const client = getClient();
  const filter: Record<string, unknown> = { status: { _eq: 'published' } };
  if (categoria) filter.categoria = { _eq: categoria };

  try {
    const posts = await client.request(
      readItems('blog_posts', {
        filter,
        sort: ['-fecha_publicacion'],
        limit,
        offset: (page - 1) * limit,
        fields: ['id', 'slug', 'titulo', 'resumen', 'imagen_portada', 'categoria', 'fecha_publicacion', 'tiempo_lectura']
      })
    );

    // Count via REST (aggregate not reliably typed in SDK v13)
    const catParam = categoria ? `&filter[categoria][_eq]=${categoria}` : '';
    const countRes = await fetch(
      `${DIRECTUS_CONFIG.url}/items/blog_posts?aggregate[count]=id&filter[status][_eq]=published${catParam}`,
      { headers: { Authorization: `Bearer ${DIRECTUS_CONFIG.token}` } }
    );
    const countData = await countRes.json();
    const total = Number(countData.data?.[0]?.count?.id || 0);

    return { posts: (posts || []) as EntradaBlog[], total };
  } catch (e) {
    console.error('Error fetching blog posts listing:', e);
    return { posts: [], total: 0 };
  }
}

/**
 * Obtiene un post completo por slug (incluye contenido HTML).
 */
export async function getBlogPost(slug: string): Promise<EntradaBlog | null> {
  const client = getClient();
  try {
    const result = await client.request(
      readItems('blog_posts', {
        filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
        limit: 1,
        fields: ['*']
      })
    );
    return ((result as EntradaBlog[])[0]) || null;
  } catch (e) {
    console.error('Error fetching blog post:', e);
    return null;
  }
}

/**
 * Obtiene los N posts más recientes para el widget de la homepage.
 */
export async function getBlogPostsForBand(limit = 3): Promise<EntradaBlog[]> {
  const client = getClient();
  try {
    const result = await client.request(
      readItems('blog_posts', {
        filter: { status: { _eq: 'published' } },
        sort: ['-fecha_publicacion'],
        limit,
        fields: ['id', 'slug', 'titulo', 'imagen_portada', 'categoria', 'fecha_publicacion']
      })
    );
    return (result || []) as EntradaBlog[];
  } catch (e) {
    console.error('Error fetching blog band posts:', e);
    return [];
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: build succeeds or fails only on unrelated issues (not on directus.ts types).

- [ ] **Step 6: Commit**

```bash
git add src/lib/directus.ts
git commit -m "feat(blog): add EntradaBlog interface and blog query helpers to directus.ts"
```

---

## Task 2: Create Directus Collection Migration Script

**Files:**
- Create: `scripts/create-blog-collection.mjs`

- [ ] **Step 1: Create the migration script**

```javascript
// scripts/create-blog-collection.mjs
// Run once: node scripts/create-blog-collection.mjs
// Creates the blog_posts collection in Directus with all required fields.

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

async function post(path, body) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    // 400 with "already exists" is acceptable
    const msg = data?.errors?.[0]?.message || '';
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log(`  ↳ Already exists, skipping: ${path}`);
      return data;
    }
    console.error(`  ✗ ${path}:`, msg);
    return null;
  }
  return data;
}

async function run() {
  console.log('Creating blog_posts collection...');

  // 1. Collection
  await post('/collections', {
    collection: 'blog_posts',
    meta: { icon: 'article', note: 'Blog y noticias de ULTIMA MILLA', sort: 10 },
    schema: { name: 'blog_posts' },
  });

  // 2. Fields
  const fields = [
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Publicado', value: 'published' }, { text: 'Borrador', value: 'draft' }, { text: 'Programado', value: 'scheduled' }] }, display: 'labels', width: 'half', required: true }, schema: { default_value: 'draft', max_length: 20 } },
    { field: 'slug', type: 'string', meta: { interface: 'input', note: 'URL del post (sin espacios, sin acentos)', width: 'half', required: true }, schema: { is_unique: true, max_length: 200 } },
    { field: 'titulo', type: 'string', meta: { interface: 'input', width: 'full', required: true }, schema: { max_length: 300 } },
    { field: 'resumen', type: 'text', meta: { interface: 'input-multiline', note: '2-3 líneas para cards y SEO', width: 'full', required: true }, schema: {} },
    { field: 'contenido', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' }, schema: {} },
    { field: 'imagen_portada', type: 'uuid', meta: { interface: 'file-image', width: 'half' }, schema: {} },
    { field: 'categoria', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Noticias', value: 'noticias' }, { text: 'Proyectos', value: 'proyectos' }, { text: 'Técnico', value: 'tecnico' }, { text: 'Empresa', value: 'empresa' }] }, width: 'half', required: true }, schema: { max_length: 20 } },
    { field: 'tags', type: 'json', meta: { interface: 'tags', width: 'full' }, schema: {} },
    { field: 'fecha_publicacion', type: 'timestamp', meta: { interface: 'datetime', width: 'half' }, schema: {} },
    { field: 'tiempo_lectura', type: 'integer', meta: { interface: 'input', note: 'Minutos estimados de lectura', width: 'half' }, schema: { default_value: 5 } },
  ];

  for (const field of fields) {
    console.log(`  Creating field: ${field.field}`);
    await post(`/fields/blog_posts`, field);
  }

  console.log('\n✓ blog_posts collection ready.');
  console.log('Next: go to http://localhost:8055/admin and publish your first post.');
}

run().catch(console.error);
```

- [ ] **Step 2: Run the migration against local Directus**

```bash
node scripts/create-blog-collection.mjs
```

Expected output:
```
Creating blog_posts collection...
  Creating field: status
  Creating field: slug
  ...
✓ blog_posts collection ready.
```

- [ ] **Step 3: Verify in Directus admin**

Open http://localhost:8055/admin → Settings → Data Model → confirm `blog_posts` appears with all 10 fields.

- [ ] **Step 4: Create one test post via admin UI**

In Directus admin → Content → blog_posts → New:
- status: published
- slug: `post-de-prueba`
- titulo: `Post de prueba del blog`
- resumen: `Este es un resumen de prueba para verificar que el blog funciona correctamente.`
- contenido: `<h2>Sección uno</h2><p>Párrafo de contenido.</p><h2>Sección dos</h2><p>Más contenido.</p>`
- categoria: `noticias`
- tiempo_lectura: `3`
- fecha_publicacion: now

- [ ] **Step 5: Commit**

```bash
git add scripts/create-blog-collection.mjs
git commit -m "feat(blog): Directus migration script for blog_posts collection"
```

---

## Task 3: blogUtils helper

**Files:**
- Create: `src/utils/blogUtils.ts`
- Test: `__tests__/blogUtils.test.ts`

- [ ] **Step 1: Create the utility file**

```typescript
// src/utils/blogUtils.ts

const CATEGORY_COLORS: Record<string, string> = {
  noticias: '#3b82f6',
  proyectos: '#10b981',
  tecnico: '#f59e0b',
  empresa: '#8b5cf6',
};

const CATEGORY_LABELS: Record<string, string> = {
  noticias: 'NOTICIAS',
  proyectos: 'PROYECTOS',
  tecnico: 'TÉCNICO',
  empresa: 'EMPRESA',
};

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#3b82f6';
}

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.toUpperCase();
}

export function formatBlogDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Injects id attributes into h2/h3 tags in HTML content.
 * Returns the processed HTML and an array of headings for TOC generation.
 */
export function addHeadingIds(html: string): {
  html: string;
  headings: Array<{ level: number; id: string; text: string }>;
} {
  const headings: Array<{ level: number; id: string; text: string }> = [];

  const processed = html.replace(
    /<h([23])([^>]*)>(.*?)<\/h[23]>/gi,
    (_match, level, attrs, inner) => {
      const plainText = inner.replace(/<[^>]+>/g, '');
      const id = plainText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      headings.push({ level: Number(level), id, text: plainText });
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  return { html: processed, headings };
}
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- --testPathPattern=blogUtils
```

Expected: 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/utils/blogUtils.ts __tests__/blogUtils.test.ts
git commit -m "feat(blog): blogUtils helpers — category colors, date format, heading IDs"
```

---

## Task 4: BlogBand Component (Homepage Widget)

**Files:**
- Create: `src/components/blog/BlogBand.astro`

- [ ] **Step 1: Create the component**

```astro
---
// src/components/blog/BlogBand.astro
import { getBlogPostsForBand } from '../../lib/directus';
import { getDirectusImageUrl, withBase } from '../../lib/directus';
import { getCategoryColor, getCategoryLabel, formatBlogDate } from '../../utils/blogUtils';

const posts = await getBlogPostsForBand(3);
if (posts.length === 0) return;
---

<section class="bg-[#0d1526] border-t border-[#1e3a5f] py-12">
  <div class="max-w-6xl mx-auto px-6 sm:px-8">

    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <div class="w-6 h-px bg-[#1e3a5f]"></div>
        <span class="text-[10px] font-mono text-white/30 uppercase tracking-widest">Lo último</span>
        <div class="flex-1 h-px bg-[#1e3a5f]"></div>
      </div>
      <a
        href={withBase('/blog')}
        class="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
      >
        Ver todo →
      </a>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {posts.map(post => {
        const imgUrl = getDirectusImageUrl(post.imagen_portada);
        const color = getCategoryColor(post.categoria);
        const label = getCategoryLabel(post.categoria);
        const date = formatBlogDate(post.fecha_publicacion);
        return (
          <a
            href={withBase(`/blog/${post.slug}`)}
            class="group flex gap-3 items-start hover:bg-white/[0.03] rounded-lg p-2 -m-2 transition-colors"
          >
            {imgUrl && (
              <img
                src={imgUrl}
                alt=""
                class="w-16 h-16 rounded-md object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            )}
            {!imgUrl && (
              <div class="w-16 h-16 rounded-md flex-shrink-0 bg-[#1e3a5f]/40 flex items-center justify-center">
                <span class="text-2xl opacity-40">📰</span>
              </div>
            )}
            <div class="min-w-0">
              <span
                class="text-[9px] font-mono font-semibold uppercase tracking-widest"
                style={`color: ${color}`}
              >{label}</span>
              <p class="text-white/80 text-sm font-medium leading-snug mt-0.5 line-clamp-2 group-hover:text-white transition-colors">
                {post.titulo}
              </p>
              <p class="text-white/30 text-[11px] mt-1">{date}</p>
            </div>
          </a>
        );
      })}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx astro check 2>&1 | grep -i "blog"
```

Expected: no errors related to BlogBand.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlogBand.astro
git commit -m "feat(blog): BlogBand homepage widget component"
```

---

## Task 5: Wire BlogBand into Homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add import at top of frontmatter in `src/pages/index.astro`**

Find the last import line in the frontmatter block (between `---` markers) and add after it:

```typescript
import BlogBand from '../components/blog/BlogBand.astro';
```

- [ ] **Step 2: Add `<BlogBand />` before the `<style>` tag**

In `src/pages/index.astro`, find the closing CTA section (around line 215):

```html
</section>

<style>
```

Replace with:

```html
</section>

<BlogBand />

<style>
```

- [ ] **Step 3: Verify build**

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321 | grep -i "último" | head -3
kill %1
```

Expected: response contains "último" (from BlogBand). If no posts exist yet, BlogBand returns nothing (early return guards it).

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(blog): add BlogBand widget to homepage"
```

---

## Task 6: Blog Feed Components

**Files:**
- Create: `src/components/blog/BlogHero.astro`
- Create: `src/components/blog/BlogFeedItem.astro`

- [ ] **Step 1: Create BlogHero**

```astro
---
// src/components/blog/BlogHero.astro
import type { EntradaBlog } from '../../lib/directus';
import { getDirectusImageUrl, withBase } from '../../lib/directus';
import { getCategoryColor, getCategoryLabel, formatBlogDate } from '../../utils/blogUtils';

interface Props {
  post: EntradaBlog;
}

const { post } = Astro.props;
const imgUrl = getDirectusImageUrl(post.imagen_portada) || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=480&fit=crop&q=80';
const color = getCategoryColor(post.categoria);
const label = getCategoryLabel(post.categoria);
const date = formatBlogDate(post.fecha_publicacion);
---

<article class="relative w-full h-[420px] sm:h-[480px] rounded-xl overflow-hidden mb-10 group">
  <img
    src={imgUrl}
    alt={post.titulo}
    class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
  />
  <div class="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/60 to-transparent"></div>

  <div class="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
    <div class="flex items-center gap-3 mb-3">
      <span
        class="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded"
        style={`color: ${color}; background: ${color}20; border: 1px solid ${color}40`}
      >{label}</span>
      <span class="text-white/40 text-xs">{post.tiempo_lectura} min</span>
      <span class="text-white/40 text-xs">·</span>
      <span class="text-white/40 text-xs">{date}</span>
    </div>

    <h1 class="um-h text-2xl sm:text-3xl lg:text-[2.25rem] text-white leading-tight mb-4 max-w-3xl">
      {post.titulo}
    </h1>

    <p class="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl mb-6 line-clamp-2">
      {post.resumen}
    </p>

    <a
      href={withBase(`/blog/${post.slug}`)}
      class="inline-flex items-center gap-2 px-5 py-2.5 border border-blue-500/60 text-blue-400 hover:bg-blue-500/10 text-sm font-medium rounded-lg transition-colors"
    >
      Leer artículo completo
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </a>
  </div>
</article>
```

- [ ] **Step 2: Create BlogFeedItem**

```astro
---
// src/components/blog/BlogFeedItem.astro
import type { EntradaBlog } from '../../lib/directus';
import { getDirectusImageUrl, withBase } from '../../lib/directus';
import { getCategoryColor, getCategoryLabel, formatBlogDate } from '../../utils/blogUtils';

interface Props {
  post: EntradaBlog;
}

const { post } = Astro.props;
const imgUrl = getDirectusImageUrl(post.imagen_portada);
const color = getCategoryColor(post.categoria);
const label = getCategoryLabel(post.categoria);
const date = formatBlogDate(post.fecha_publicacion);
---

<article class="py-8 border-b border-[#1e3a5f] last:border-0">
  <div class="flex gap-6">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-2">
        <span
          class="text-[9px] font-mono font-bold uppercase tracking-widest"
          style={`color: ${color}`}
        >{label}</span>
        <span class="text-white/30 text-xs">·</span>
        <span class="text-white/30 text-xs">{post.tiempo_lectura} min</span>
        <span class="text-white/30 text-xs">·</span>
        <span class="text-white/30 text-xs">{date}</span>
      </div>

      <h2 class="um-h text-lg sm:text-xl text-white font-bold leading-snug mb-2 hover:text-blue-300 transition-colors">
        <a href={withBase(`/blog/${post.slug}`)}>{post.titulo}</a>
      </h2>

      <div class="relative">
        <p class="text-white/50 text-sm leading-relaxed line-clamp-3">
          {post.resumen}
        </p>
      </div>

      <a
        href={withBase(`/blog/${post.slug}`)}
        class="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"
      >
        leer más →
      </a>
    </div>

    {imgUrl && (
      <div class="flex-shrink-0 hidden sm:block">
        <a href={withBase(`/blog/${post.slug}`)}>
          <img
            src={imgUrl}
            alt={post.titulo}
            class="w-36 h-24 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        </a>
      </div>
    )}
  </div>
</article>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlogHero.astro src/components/blog/BlogFeedItem.astro
git commit -m "feat(blog): BlogHero and BlogFeedItem feed components"
```

---

## Task 7: Blog Navigation Components

**Files:**
- Create: `src/components/blog/BlogCategoryTabs.astro`
- Create: `src/components/blog/BlogPagination.astro`

- [ ] **Step 1: Create BlogCategoryTabs**

```astro
---
// src/components/blog/BlogCategoryTabs.astro
import { withBase } from '../../lib/directus';

interface Props {
  current?: string; // undefined = "Todos"
}

const { current } = Astro.props;

const tabs = [
  { label: 'Todos', href: withBase('/blog'), key: undefined },
  { label: 'Noticias', href: withBase('/blog/categoria/noticias'), key: 'noticias' },
  { label: 'Proyectos', href: withBase('/blog/categoria/proyectos'), key: 'proyectos' },
  { label: 'Técnico', href: withBase('/blog/categoria/tecnico'), key: 'tecnico' },
  { label: 'Empresa', href: withBase('/blog/categoria/empresa'), key: 'empresa' },
];
---

<nav class="flex flex-wrap gap-2 mb-8" aria-label="Categorías del blog">
  {tabs.map(tab => {
    const isActive = tab.key === current;
    return (
      <a
        href={tab.href}
        class:list={[
          'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
          isActive
            ? 'bg-blue-600 text-white'
            : 'border border-[#1e3a5f] text-white/50 hover:text-white hover:border-white/20'
        ]}
        aria-current={isActive ? 'page' : undefined}
      >
        {tab.label}
      </a>
    );
  })}
</nav>
```

- [ ] **Step 2: Create BlogPagination**

```astro
---
// src/components/blog/BlogPagination.astro
import { withBase } from '../../lib/directus';

interface Props {
  page: number;
  totalPages: number;
  baseHref: string; // e.g. '/blog' or '/blog/categoria/noticias'
}

const { page, totalPages, baseHref } = Astro.props;

const prevHref = page > 1
  ? withBase(`${baseHref}?page=${page - 1}`)
  : null;

const nextHref = page < totalPages
  ? withBase(`${baseHref}?page=${page + 1}`)
  : null;
---

{totalPages > 1 && (
  <nav class="flex items-center justify-center gap-4 py-10 border-t border-[#1e3a5f] mt-4" aria-label="Paginación">
    {prevHref ? (
      <a
        href={prevHref}
        class="flex items-center gap-2 px-4 py-2 border border-[#1e3a5f] text-white/50 hover:text-white hover:border-white/20 rounded-lg text-sm transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        anterior
      </a>
    ) : (
      <span class="flex items-center gap-2 px-4 py-2 text-white/20 text-sm cursor-not-allowed select-none">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        anterior
      </span>
    )}

    <span class="text-white/30 text-xs font-mono">{page} / {totalPages}</span>

    {nextHref ? (
      <a
        href={nextHref}
        class="flex items-center gap-2 px-4 py-2 border border-[#1e3a5f] text-white/50 hover:text-white hover:border-white/20 rounded-lg text-sm transition-colors"
      >
        siguiente
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>
    ) : (
      <span class="flex items-center gap-2 px-4 py-2 text-white/20 text-sm cursor-not-allowed select-none">
        siguiente
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </span>
    )}
  </nav>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlogCategoryTabs.astro src/components/blog/BlogPagination.astro
git commit -m "feat(blog): BlogCategoryTabs and BlogPagination navigation components"
```

---

## Task 8: Blog Listing Page

**Files:**
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Create the listing page**

```astro
---
// src/pages/blog/index.astro
import LayoutV4 from '../../layouts/LayoutV4.astro';
import BlogHero from '../../components/blog/BlogHero.astro';
import BlogFeedItem from '../../components/blog/BlogFeedItem.astro';
import BlogCategoryTabs from '../../components/blog/BlogCategoryTabs.astro';
import BlogPagination from '../../components/blog/BlogPagination.astro';
import { getBlogPostsListing } from '../../lib/directus';

const PAGE_SIZE = 10;
const page = Number(Astro.url.searchParams.get('page') || '1');
const { posts, total } = await getBlogPostsListing(page, PAGE_SIZE);
const totalPages = Math.ceil(total / PAGE_SIZE);

const [hero, ...feedPosts] = posts;

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog ULTIMA MILLA',
  url: 'https://ultimamilla.com.ar/blog',
};
---

<LayoutV4
  title="Blog — ULTIMA MILLA"
  description="Noticias, proyectos y artículos técnicos sobre infraestructura IT, seguridad electrónica y telecomunicaciones."
  structuredData={schema}
>
  <main class="min-h-screen bg-[#0a0f1e]">
    <div class="max-w-3xl mx-auto px-6 sm:px-8 py-16">

      <header class="mb-10">
        <p class="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">ULTIMA MILLA</p>
        <h1 class="um-h text-4xl sm:text-5xl text-white font-bold mb-2">Blog</h1>
        <p class="text-white/40 text-sm">Noticias, proyectos y artículos técnicos.</p>
      </header>

      <BlogCategoryTabs />

      {hero && <BlogHero post={hero} />}

      {feedPosts.length > 0 && (
        <div>
          {feedPosts.map(post => <BlogFeedItem post={post} />)}
        </div>
      )}

      {posts.length === 0 && (
        <div class="text-center py-20">
          <p class="text-white/30 text-sm">No hay artículos publicados aún.</p>
        </div>
      )}

      <BlogPagination page={page} totalPages={totalPages} baseHref="/blog" />

    </div>
  </main>
</LayoutV4>

<style>
  .um-h { font-family: 'Futura PT', 'Futura', 'Trebuchet MS', sans-serif; font-weight: 700; }
</style>
```

- [ ] **Step 2: Start dev server and verify the page loads**

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321/blog | grep -i "blog" | head -5
kill %1
```

Expected: HTML contains "Blog" heading.

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat(blog): /blog listing page with Tumblr-style feed and pagination"
```

---

## Task 9: Blog Category Page

**Files:**
- Create: `src/pages/blog/categoria/[cat].astro`

- [ ] **Step 1: Create the category filter page**

```astro
---
// src/pages/blog/categoria/[cat].astro
import LayoutV4 from '../../../layouts/LayoutV4.astro';
import BlogHero from '../../../components/blog/BlogHero.astro';
import BlogFeedItem from '../../../components/blog/BlogFeedItem.astro';
import BlogCategoryTabs from '../../../components/blog/BlogCategoryTabs.astro';
import BlogPagination from '../../../components/blog/BlogPagination.astro';
import { getBlogPostsListing } from '../../../lib/directus';
import { getCategoryLabel } from '../../../utils/blogUtils';

const VALID_CATS = ['noticias', 'proyectos', 'tecnico', 'empresa'];
const cat = Astro.params.cat || '';

if (!VALID_CATS.includes(cat)) {
  return Astro.redirect('/blog');
}

const PAGE_SIZE = 10;
const page = Number(Astro.url.searchParams.get('page') || '1');
const { posts, total } = await getBlogPostsListing(page, PAGE_SIZE, cat);
const totalPages = Math.ceil(total / PAGE_SIZE);
const [hero, ...feedPosts] = posts;

const catLabel = getCategoryLabel(cat);
---

<LayoutV4
  title={`${catLabel} — Blog ULTIMA MILLA`}
  description={`Artículos de ${catLabel.toLowerCase()} sobre infraestructura IT, seguridad electrónica y telecomunicaciones.`}
>
  <main class="min-h-screen bg-[#0a0f1e]">
    <div class="max-w-3xl mx-auto px-6 sm:px-8 py-16">

      <header class="mb-10">
        <p class="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">
          <a href="/blog" class="hover:text-white/50 transition-colors">BLOG</a>
          {' '}/ {catLabel}
        </p>
        <h1 class="um-h text-4xl sm:text-5xl text-white font-bold mb-2">{catLabel}</h1>
      </header>

      <BlogCategoryTabs current={cat} />

      {hero && <BlogHero post={hero} />}

      {feedPosts.length > 0 && (
        <div>
          {feedPosts.map(post => <BlogFeedItem post={post} />)}
        </div>
      )}

      {posts.length === 0 && (
        <div class="text-center py-20">
          <p class="text-white/30 text-sm">No hay artículos en esta categoría aún.</p>
        </div>
      )}

      <BlogPagination page={page} totalPages={totalPages} baseHref={`/blog/categoria/${cat}`} />

    </div>
  </main>
</LayoutV4>

<style>
  .um-h { font-family: 'Futura PT', 'Futura', 'Trebuchet MS', sans-serif; font-weight: 700; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/categoria/[cat].astro
git commit -m "feat(blog): /blog/categoria/[cat] filtered feed page"
```

---

## Task 10: BlogTOC Component

**Files:**
- Create: `src/components/blog/BlogTOC.astro`

- [ ] **Step 1: Create the sticky TOC component**

```astro
---
// src/components/blog/BlogTOC.astro

interface Heading {
  level: number;
  id: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

const { headings } = Astro.props;
---

{headings.length > 1 && (
  <nav
    class="hidden lg:block sticky top-24 w-52 flex-shrink-0 self-start"
    x-data="{ active: '' }"
    x-init="
      const els = document.querySelectorAll('h2[id], h3[id]');
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) active = e.target.id; });
      }, { rootMargin: '-20% 0px -70% 0px' });
      els.forEach(el => obs.observe(el));
    "
    aria-label="Tabla de contenidos"
  >
    <p class="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-4">Contenidos</p>
    <ul class="space-y-1">
      {headings.map(h => (
        <li style={h.level === 3 ? 'padding-left: 0.75rem' : ''}>
          <a
            href={`#${h.id}`}
            class:list={[
              'block text-xs leading-snug py-0.5 transition-colors',
              'hover:text-white',
            ]}
            :class={`active === '${h.id}' ? 'text-blue-400' : 'text-white/30'`}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/BlogTOC.astro
git commit -m "feat(blog): BlogTOC sticky table of contents with Alpine.js scroll spy"
```

---

## Task 11: Single Post Page

**Files:**
- Create: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Create the single post page**

```astro
---
// src/pages/blog/[slug].astro
import LayoutV4 from '../../layouts/LayoutV4.astro';
import BlogTOC from '../../components/blog/BlogTOC.astro';
import { getBlogPost, getBlogPostsListing, getDirectusImageUrl, withBase } from '../../lib/directus';
import { addHeadingIds, getCategoryColor, getCategoryLabel, formatBlogDate } from '../../utils/blogUtils';

const slug = Astro.params.slug || '';
const post = await getBlogPost(slug);

if (!post) {
  return Astro.redirect('/blog');
}

const { html: contentHtml, headings } = addHeadingIds(post.contenido || '');
const imgUrl = getDirectusImageUrl(post.imagen_portada);
const color = getCategoryColor(post.categoria);
const label = getCategoryLabel(post.categoria);
const date = formatBlogDate(post.fecha_publicacion);

// Prev / Next navigation (simple: get 20 recent posts and find neighbours)
const { posts: allRecent } = await getBlogPostsListing(1, 20);
const idx = allRecent.findIndex(p => p.slug === slug);
const prevPost = idx > 0 ? allRecent[idx - 1] : null;
const nextPost = idx < allRecent.length - 1 ? allRecent[idx + 1] : null;

const schema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.titulo,
  description: post.resumen,
  datePublished: post.fecha_publicacion,
  image: imgUrl || undefined,
  publisher: {
    '@type': 'Organization',
    name: 'ULTIMA MILLA',
    url: 'https://ultimamilla.com.ar',
  },
};
---

<LayoutV4
  title={`${post.titulo} — ULTIMA MILLA Blog`}
  description={post.resumen?.substring(0, 160)}
  image={imgUrl || undefined}
  structuredData={schema}
>
  <main class="min-h-screen bg-[#0a0f1e] py-16">
    <div class="max-w-5xl mx-auto px-6 sm:px-8">

      {/* Breadcrumb */}
      <p class="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-10">
        <a href={withBase('/blog')} class="hover:text-white/50 transition-colors">Blog</a>
        {' '}/ {label}
      </p>

      <div class="flex gap-12 items-start">

        {/* TOC — left column, sticky */}
        <BlogTOC headings={headings} />

        {/* Main content */}
        <article class="flex-1 min-w-0 max-w-[720px]">

          {/* Header */}
          <header class="mb-8">
            <div class="flex items-center gap-2 mb-4">
              <span
                class="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={`color: ${color}; background: ${color}20; border: 1px solid ${color}40`}
              >{label}</span>
              <span class="text-white/30 text-xs">{post.tiempo_lectura} min lectura</span>
              <span class="text-white/30 text-xs">·</span>
              <span class="text-white/30 text-xs">{date}</span>
            </div>

            <h1 class="um-h text-3xl sm:text-4xl text-white font-bold leading-tight mb-6">
              {post.titulo}
            </h1>

            {imgUrl && (
              <img
                src={imgUrl}
                alt={post.titulo}
                class="w-full rounded-xl object-cover max-h-96 mb-8"
              />
            )}
          </header>

          {/* Body */}
          <div class="blog-prose" set:html={contentHtml} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div class="flex flex-wrap gap-2 mt-10 pt-6 border-t border-[#1e3a5f]">
              {post.tags.map((tag: string) => (
                <span class="text-[11px] text-white/40 border border-[#1e3a5f] rounded px-2 py-0.5">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Prev / Next */}
          <nav class="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-[#1e3a5f]">
            {prevPost ? (
              <a
                href={withBase(`/blog/${prevPost.slug}`)}
                class="group p-4 border border-[#1e3a5f] rounded-lg hover:border-white/20 transition-colors"
              >
                <p class="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">← anterior</p>
                <p class="text-white/70 text-sm group-hover:text-white transition-colors line-clamp-2">{prevPost.titulo}</p>
              </a>
            ) : <div></div>}

            {nextPost && (
              <a
                href={withBase(`/blog/${nextPost.slug}`)}
                class="group p-4 border border-[#1e3a5f] rounded-lg hover:border-white/20 transition-colors text-right"
              >
                <p class="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">siguiente →</p>
                <p class="text-white/70 text-sm group-hover:text-white transition-colors line-clamp-2">{nextPost.titulo}</p>
              </a>
            )}
          </nav>

        </article>
      </div>
    </div>
  </main>
</LayoutV4>

<style>
  .um-h { font-family: 'Futura PT', 'Futura', 'Trebuchet MS', sans-serif; font-weight: 700; }

  .blog-prose {
    color: rgba(226, 232, 240, 0.8);
    font-size: 1.05rem;
    line-height: 1.85;
  }
  .blog-prose h2 {
    font-family: 'Futura PT', 'Futura', 'Trebuchet MS', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 2.5rem 0 1rem;
    padding-top: 0.5rem;
  }
  .blog-prose h3 {
    font-family: 'Futura PT', 'Futura', 'Trebuchet MS', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 2rem 0 0.75rem;
  }
  .blog-prose p { margin-bottom: 1.25rem; }
  .blog-prose a { color: #3b82f6; text-decoration: underline; text-underline-offset: 3px; }
  .blog-prose a:hover { color: #60a5fa; }
  .blog-prose ul, .blog-prose ol { margin: 1rem 0 1.25rem 1.5rem; }
  .blog-prose li { margin-bottom: 0.4rem; }
  .blog-prose blockquote {
    border-left: 3px solid #1d4ed8;
    padding-left: 1.25rem;
    margin: 1.5rem 0;
    color: rgba(226, 232, 240, 0.5);
    font-style: italic;
  }
  .blog-prose pre {
    background: #111827;
    border: 1px solid #1e3a5f;
    border-radius: 8px;
    padding: 1.25rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    font-size: 0.875rem;
  }
  .blog-prose code {
    background: #111827;
    border: 1px solid #1e3a5f;
    border-radius: 4px;
    padding: 0.1em 0.4em;
    font-size: 0.875em;
    color: #60a5fa;
  }
  .blog-prose pre code {
    background: none;
    border: none;
    padding: 0;
    color: #e2e8f0;
  }
  .blog-prose img {
    width: 100%;
    border-radius: 8px;
    margin: 1.5rem 0;
  }
  .blog-prose strong { color: #f1f5f9; }
  .blog-prose hr {
    border: none;
    border-top: 1px solid #1e3a5f;
    margin: 2rem 0;
  }
</style>
```

- [ ] **Step 2: Test the single post page loads**

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321/blog/post-de-prueba | grep -i "post de prueba" | head -3
kill %1
```

Expected: HTML contains "Post de prueba" (the test post created in Task 2).

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/[slug].astro
git commit -m "feat(blog): /blog/[slug] single post page with sticky TOC and prev/next navigation"
```

---

## Task 12: Full Build Verification

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exits 0. Note any TypeScript warnings and fix them.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass including blogUtils tests.

- [ ] **Step 3: Preview production build locally**

```bash
npm run preview &
sleep 5
curl -s http://localhost:4321/blog | grep -c "Blog"
curl -s http://localhost:4321/blog/post-de-prueba | grep -c "post-de-prueba\|Post de prueba"
kill %1
```

Expected: both return count > 0.

- [ ] **Step 4: Final commit + push to trigger CI/CD**

```bash
git log --oneline -8
git push origin preview/modern-css
```

Expected: CI pipeline starts. Monitor at GitHub Actions.

---

## Production Notes

1. **Run the Directus migration on production** after deploying:
   ```bash
   ssh ultimamilla
   cd /root/fumbling-field
   PUBLIC_DIRECTUS_URL=http://localhost:8055 DIRECTUS_TOKEN=<prod-token> node scripts/create-blog-collection.mjs
   ```

2. **Create first real post** in production Directus admin → https://admin.ultimamilla.com.ar

3. **The `blog_posts` collection in Directus needs `Public` role read access** for published posts:
   Directus admin → Settings → Roles → Public → blog_posts → Read (filter: status = published)
