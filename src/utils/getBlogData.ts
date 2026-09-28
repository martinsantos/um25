import type { EntradaBlog } from '../lib/directus';
import { MOCK_POSTS } from '../data/blog-mock';
import { BLOG_POSTS as UM26_BLOG_POSTS } from '../lib/um26-data/blog';
import type { BlogPost as Um26BlogPost } from '../lib/um26-data/types';
import {
  allowMockBlogFallback,
  allowPublicBlogFallback,
  getDirectusInternalUrl,
  getDirectusToken,
  getPublicSiteUrl,
} from '../config/runtime';
import { SITE_URL } from '../config/seo';
import { isCanonicalBlogSlug } from '../data/seoRedirects';
import { addVisibleBlogStatusFilter } from './blogPublishing';
import { fetchWithTimeout, getFetchTimeoutMs } from './fetchWithTimeout';
import {
  BLOG_COVER_DIVERSITY_LIMIT,
  diversifyBlogPostCovers,
  diversifySortedBlogPostCovers,
} from './blogCoverDiversity.js';

const DIRECTUS_URL = getDirectusInternalUrl();
const DIRECTUS_TOKEN = getDirectusToken();
const PUBLIC_SITE_URL = allowPublicBlogFallback() ? SITE_URL : getPublicSiteUrl();
const ENABLE_PUBLIC_BLOG_FALLBACK = allowPublicBlogFallback();

const publicBlogIndexCache = new Map<string, { at: number; promise: Promise<string[]> }>();
const publicBlogPostCache = new Map<string, { at: number; promise: Promise<EntradaBlog | null> }>();
const PUBLIC_CACHE_TTL_MS = 10 * 60 * 1000;

// Timeouts cortos: un CMS caído debe degradar al fallback sin frenar el SSR.
const DIRECTUS_BLOG_TIMEOUT_MS = getFetchTimeoutMs(
  typeof process !== 'undefined' ? process.env['DIRECTUS_BLOG_TIMEOUT_MS'] : undefined,
  3500,
);
const PUBLIC_BLOG_TIMEOUT_MS = 6000;
// Circuit breaker: tras un fallo de red/timeout no se reintenta Directus por 60 s.
const DIRECTUS_COOLDOWN_MS = 60 * 1000;
let directusUnavailableUntil = 0;

async function directusFetch(url: string): Promise<Response> {
  if (Date.now() < directusUnavailableUntil) throw new Error('directus cooldown');
  try {
    const res = await fetchWithTimeout(url, { headers: authHeaders() }, DIRECTUS_BLOG_TIMEOUT_MS);
    if (res.status >= 500) directusUnavailableUntil = Date.now() + DIRECTUS_COOLDOWN_MS;
    return res;
  } catch (error) {
    directusUnavailableUntil = Date.now() + DIRECTUS_COOLDOWN_MS;
    throw error;
  }
}

function publicFetch(url: string): Promise<Response> {
  return fetchWithTimeout(url, {}, PUBLIC_BLOG_TIMEOUT_MS);
}

function escapeHtml(value = ''): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function um26PostToEntrada(post: Um26BlogPost, index: number): EntradaBlog {
  const tags = post.tags || [];
  const tagList = tags.length
    ? `<ul>${tags.slice(0, 5).map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
    : '';

  return {
    id: `um26-${index}`,
    status: 'published',
    slug: post.slug,
    titulo: post.title,
    resumen: post.excerpt || post.summary,
    contenido: `
      <p>${escapeHtml(post.summary || post.excerpt)}</p>
      <h2>Contexto operativo</h2>
      <p>${escapeHtml(post.excerpt || post.summary)}</p>
      <h2>Puntos de lectura</h2>
      ${tagList || '<p>Lectura editorial de ULTIMA MILLA para decisiones de infraestructura, continuidad y operacion IT.</p>'}
    `,
    imagen_portada: null,
    imagen_portada_alt: post.title,
    categoria: post.category,
    tags,
    fecha_publicacion: `${post.date}T12:00:00Z`,
    tiempo_lectura: post.readingMinutes,
    meta_title: `${post.title} | ULTIMA MILLA`,
    meta_description: post.summary || post.excerpt,
    meta_keywords: tags.join(', '),
  };
}

const UM26_FALLBACK_POSTS: EntradaBlog[] = UM26_BLOG_POSTS
  .map(um26PostToEntrada)
  .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime());

function getUm26BlogListing(page: number, limit: number, categoria?: string): { posts: EntradaBlog[]; total: number } {
  const offset = (page - 1) * limit;
  const filtered = (categoria
    ? UM26_FALLBACK_POSTS.filter((post) => post.categoria === categoria)
    : UM26_FALLBACK_POSTS
  ).filter((post) => isCanonicalBlogSlug(post.slug));

  const diversified = diversifyBlogPostCovers(filtered) as EntradaBlog[];
  return { posts: diversified.slice(offset, offset + limit), total: filtered.length };
}

function authHeaders(): HeadersInit {
  return DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {};
}

function decodeHtml(value = ''): string {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function stripTags(value = ''): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function metaContent(html: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const propPattern = new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i');
  const namePattern = new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i');
  return decodeHtml((html.match(propPattern) || html.match(namePattern))?.[1] || '');
}

function normalizeCategory(value = ''): EntradaBlog['categoria'] {
  const clean = value.toLowerCase();
  if (clean.includes('proyecto')) return 'proyectos';
  if (clean.includes('técnico') || clean.includes('tecnico')) return 'tecnico';
  if (clean.includes('tecnolog')) return 'tecnologia';
  if (clean.includes('empresa')) return 'empresa';
  return 'noticias';
}

function uniqueSlugsFromBlogHtml(html: string): string[] {
  const slugs = new Set<string>();
  for (const match of html.matchAll(/href=["']\/blog\/(?!categoria\/)([^"'?#/]+)[^"']*["']/gi)) {
    const slug = decodeURIComponent(match[1] || '').trim();
    if (slug && slug !== 'page' && isCanonicalBlogSlug(slug)) slugs.add(slug);
  }
  return [...slugs];
}

async function fetchPublicBlogSlugs(categoria?: string): Promise<string[]> {
  if (!ENABLE_PUBLIC_BLOG_FALLBACK) return [];

  const cacheKey = categoria || 'all';
  const cached = publicBlogIndexCache.get(cacheKey);
  if (cached && Date.now() - cached.at < PUBLIC_CACHE_TTL_MS) return cached.promise;

  const promise = (async () => {
    const allSlugs: string[] = [];
    const seen = new Set<string>();
    const basePath = categoria ? `/blog/categoria/${encodeURIComponent(categoria)}` : '/blog';

    for (let page = 1; page <= 30; page += 1) {
      const url = `${PUBLIC_SITE_URL}${basePath}${page === 1 ? '' : `?page=${page}`}`;
      const res = await publicFetch(url);
      if (!res.ok) break;
      const html = await res.text();
      const pageSlugs = uniqueSlugsFromBlogHtml(html).filter((slug) => !seen.has(slug));
      if (pageSlugs.length === 0) break;

      for (const slug of pageSlugs) {
        seen.add(slug);
        allSlugs.push(slug);
      }

      const hasNext = html.includes('rel="next"') || html.includes("rel='next'") || html.includes(`href="${basePath}?page=${page + 1}"`);
      if (!hasNext && page > 1) break;
    }

    return allSlugs;
  })();

  publicBlogIndexCache.set(cacheKey, { at: Date.now(), promise });
  // Un fallo no queda cacheado: el próximo request vuelve a intentar.
  promise.catch(() => publicBlogIndexCache.delete(cacheKey));
  return promise;
}

async function fetchPublicBlogPost(slug: string): Promise<EntradaBlog | null> {
  if (!ENABLE_PUBLIC_BLOG_FALLBACK) return null;
  const cached = publicBlogPostCache.get(slug);
  if (cached && Date.now() - cached.at < PUBLIC_CACHE_TTL_MS) return cached.promise;
  const promise = fetchPublicBlogPostUncached(slug);
  publicBlogPostCache.set(slug, { at: Date.now(), promise });
  promise.then((post) => { if (!post) publicBlogPostCache.delete(slug); }, () => publicBlogPostCache.delete(slug));
  return promise;
}

async function fetchPublicBlogPostUncached(slug: string): Promise<EntradaBlog | null> {
  try {
    const res = await publicFetch(`${PUBLIC_SITE_URL}/blog/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const html = await res.text();

    const title = stripTags(html.match(/<h1[^>]*class=["'][^"']*article-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
    if (!title) return null;

    const lead = stripTags(html.match(/<p[^>]*class=["'][^"']*article-lead[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
    const prose = (
      html.match(
        /<div class=["']prose["'][^>]*>([\s\S]*?)<\/div>\s*(?:<section\b[^>]*(?:um-intent-link-graph|post-|bp-author|bp-topic)|<ul\b[^>]*class=["'][^"']*bp-tags|<nav\b[^>]*class=["'][^"']*(?:post-nav|bp-pn)|<aside\b|<div\b[^>]*class=["'][^"']*tags-row|<\/article>)/i,
      )?.[1] || ''
    );
    const category = normalizeCategory(metaContent(html, 'article:section'));
    const tags = Array.from(html.matchAll(/<meta[^>]+property=["']article:tag["'][^>]+content=["']([^"']+)["']/gi)).map((match) => decodeHtml(match[1]));
    const image = metaContent(html, 'og:image');
    const published = metaContent(html, 'article:published_time');

    return {
      id: `public-${slug}`,
      status: 'published',
      slug,
      titulo: title,
      resumen: lead || metaContent(html, 'description'),
      contenido: prose || `<p>${lead || metaContent(html, 'description')}</p>`,
      imagen_portada: image || null,
      imagen_portada_alt: title,
      categoria: category,
      tags,
      fecha_publicacion: published || new Date().toISOString(),
      fecha_modificacion: metaContent(html, 'article:modified_time') || published || undefined,
      tiempo_lectura: Number(html.match(/(\d+)\s+min de lectura/i)?.[1] || 4),
      meta_title: metaContent(html, 'title') || `${title} | ULTIMA MILLA`,
      meta_description: metaContent(html, 'description') || lead,
      meta_keywords: metaContent(html, 'keywords') || tags.join(', '),
      social_image: image || undefined,
    };
  } catch {
    return null;
  }
}

async function fetchPublicBlogListing(page: number, limit: number, categoria?: string): Promise<{ posts: EntradaBlog[]; total: number } | null> {
  if (!ENABLE_PUBLIC_BLOG_FALLBACK) return null;

  try {
    const all = await fetchPublicBlogSlugs(categoria);
    const offset = (page - 1) * limit;
    const pageItems = all.slice(offset, offset + limit);
    if (pageItems.length === 0) return { posts: [], total: all.length };

    const posts = await Promise.all(pageItems.map(async (slug) => {
      const full = await fetchPublicBlogPost(slug);
      return full || {
        id: `public-${slug}`,
        status: 'published' as const,
        slug,
        titulo: slug.replace(/-/g, ' '),
        resumen: '',
        contenido: '',
        imagen_portada: null,
        imagen_portada_alt: slug.replace(/-/g, ' '),
        categoria: categoria || 'noticias',
        tags: [],
        fecha_publicacion: new Date().toISOString(),
        tiempo_lectura: 4,
      };
    }));

    return { posts: diversifyBlogPostCovers(posts) as EntradaBlog[], total: all.length };
  } catch {
    return null;
  }
}

async function fetchDirectusBlogCoverCorpus(limit = BLOG_COVER_DIVERSITY_LIMIT): Promise<EntradaBlog[]> {
  const params = addVisibleBlogStatusFilter(new URLSearchParams());
  params.set('sort', '-fecha_publicacion');
  params.set('limit', String(limit));
  params.set('fields', 'id,slug,titulo,imagen_portada,categoria,fecha_publicacion,status');

  const res = await directusFetch(`${DIRECTUS_URL}/items/blog_posts?${params.toString()}`);
  if (!res.ok) return [];

  const data = await res.json();
  return ((data.data || []) as EntradaBlog[]).filter((post) => isCanonicalBlogSlug(post.slug));
}

async function attachDiverseCover(post: EntradaBlog): Promise<EntradaBlog> {
  try {
    const corpus = await fetchDirectusBlogCoverCorpus();
    const match = (diversifyBlogPostCovers(corpus) as EntradaBlog[])
      .find((item) => item.slug === post.slug);
    return match ? { ...post, imagen_portada: match.imagen_portada } : post;
  } catch {
    return post;
  }
}

export async function fetchBlogListing(
  page = 1,
  limit = 10,
  categoria?: string
): Promise<{ posts: EntradaBlog[]; total: number }> {
  const fields = 'id,slug,titulo,resumen,imagen_portada,imagen_portada_alt,categoria,tags,fecha_publicacion,fecha_modificacion,tiempo_lectura,meta_title,meta_description,meta_keywords';
  const offset = (page - 1) * limit;
  const now = new Date();
  const itemsParams = new URLSearchParams();
  const countParams = new URLSearchParams();

  if (categoria) {
    addVisibleBlogStatusFilter(itemsParams, now, 'filter[_and][0]');
    addVisibleBlogStatusFilter(countParams, now, 'filter[_and][0]');
    itemsParams.set('filter[_and][1][categoria][_eq]', categoria);
    countParams.set('filter[_and][1][categoria][_eq]', categoria);
  } else {
    addVisibleBlogStatusFilter(itemsParams, now);
    addVisibleBlogStatusFilter(countParams, now);
  }

  itemsParams.set('sort', '-fecha_publicacion');
  itemsParams.set('limit', String(offset + limit));
  itemsParams.set('offset', '0');
  itemsParams.set('fields', fields);
  countParams.set('aggregate[count]', 'id');

  try {
    const [itemsRes, countRes] = await Promise.all([
      directusFetch(`${DIRECTUS_URL}/items/blog_posts?${itemsParams.toString()}`),
      directusFetch(`${DIRECTUS_URL}/items/blog_posts?${countParams.toString()}`),
    ]);

    const [itemsData, countData] = await Promise.all([itemsRes.json(), countRes.json()]);
    const contextPosts = ((itemsData.data || []) as EntradaBlog[]).filter((post) => isCanonicalBlogSlug(post.slug));
    const posts = (diversifyBlogPostCovers(contextPosts) as EntradaBlog[]).slice(offset, offset + limit);
    const total = Number(countData.data?.[0]?.count?.id || 0);

    if (posts.length > 0) return { posts, total: Math.max(posts.length, total) };
    throw new Error('empty');
  } catch {
    const publicListing = await fetchPublicBlogListing(page, limit, categoria);
    if (publicListing && publicListing.posts.length > 0) return publicListing;

    const um26Listing = getUm26BlogListing(page, limit, categoria);
    if (um26Listing.posts.length > 0) return um26Listing;

    if (!allowMockBlogFallback()) {
      return { posts: [], total: 0 };
    }

    const filtered = (categoria ? MOCK_POSTS.filter(p => p.categoria === categoria) : MOCK_POSTS)
      .filter((post) => isCanonicalBlogSlug(post.slug));
    const diversified = diversifyBlogPostCovers(filtered) as EntradaBlog[];
    return { posts: diversified.slice(offset, offset + limit), total: filtered.length };
  }
}

export async function fetchBlogPost(slug: string): Promise<EntradaBlog | null> {
  try {
    const params = new URLSearchParams();
    addVisibleBlogStatusFilter(params, new Date(), 'filter[_and][0]');
    params.set('filter[_and][1][slug][_eq]', slug);
    params.set('limit', '1');
    params.set('fields', '*');
    const res = await directusFetch(`${DIRECTUS_URL}/items/blog_posts?${params.toString()}`);
    const data = await res.json();
    const post = (data.data || [])[0] as EntradaBlog | undefined;
    if (post) return attachDiverseCover(post);
    throw new Error('not found');
  } catch {
    const publicPost = await fetchPublicBlogPost(slug);
    if (publicPost) return publicPost;

    const um26Post = UM26_FALLBACK_POSTS.find((p) => p.slug === slug);
    if (um26Post) return (diversifySortedBlogPostCovers(UM26_FALLBACK_POSTS, UM26_FALLBACK_POSTS.length) as EntradaBlog[])
      .find((p) => p.slug === slug) || um26Post;

    if (!allowMockBlogFallback()) return null;
    return MOCK_POSTS.find(p => p.slug === slug) || null;
  }
}

export async function fetchBlogBand(limit = 3): Promise<EntradaBlog[]> {
  try {
    const params = addVisibleBlogStatusFilter(new URLSearchParams());
    params.set('sort', '-fecha_publicacion');
    params.set('limit', String(limit));
    params.set('fields', 'id,slug,titulo,imagen_portada,categoria,fecha_publicacion');
    const res = await directusFetch(`${DIRECTUS_URL}/items/blog_posts?${params.toString()}`);
    const data = await res.json();
    const posts = (data.data || []) as EntradaBlog[];
    if (posts.length > 0) return diversifyBlogPostCovers(posts) as EntradaBlog[];
    throw new Error('empty');
  } catch {
    const publicListing = await fetchPublicBlogListing(1, limit);
    if (publicListing && publicListing.posts.length > 0) return (diversifyBlogPostCovers(publicListing.posts) as EntradaBlog[]).slice(0, limit);

    if (UM26_FALLBACK_POSTS.length > 0) return (diversifyBlogPostCovers(UM26_FALLBACK_POSTS) as EntradaBlog[]).slice(0, limit);

    if (!allowMockBlogFallback()) return [];
    return (diversifyBlogPostCovers(MOCK_POSTS) as EntradaBlog[]).slice(0, limit);
  }
}

/**
 * Notas puntuales por slug (artículos relacionados por cluster), con los mismos
 * campos que el listado y la misma cadena de fuentes. Respeta el orden pedido.
 */
export async function fetchBlogPostsBySlugs(slugs: string[]): Promise<EntradaBlog[]> {
  const wanted = [...new Set(slugs.filter((slug) => slug && isCanonicalBlogSlug(slug)))];
  if (wanted.length === 0) return [];
  // Orden pedido y portadas sin repetir dentro del bloque (misma regla que los listados).
  const order = (posts: EntradaBlog[]) => diversifyBlogPostCovers(wanted
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is EntradaBlog => Boolean(post))) as EntradaBlog[];

  try {
    const params = new URLSearchParams();
    addVisibleBlogStatusFilter(params, new Date(), 'filter[_and][0]');
    params.set('filter[_and][1][slug][_in]', wanted.join(','));
    params.set('limit', String(wanted.length));
    params.set('fields', 'id,slug,titulo,resumen,imagen_portada,imagen_portada_alt,categoria,tags,fecha_publicacion,fecha_modificacion,tiempo_lectura');
    const res = await directusFetch(`${DIRECTUS_URL}/items/blog_posts?${params.toString()}`);
    if (!res.ok) throw new Error(`Directus ${res.status}`);
    const data = await res.json();
    const posts = order((data.data || []) as EntradaBlog[]);
    if (posts.length > 0) return posts;
    throw new Error('empty');
  } catch {
    const fallback = await Promise.all(wanted.map(async (slug) => {
      const publicPost = await fetchPublicBlogPost(slug);
      return publicPost || UM26_FALLBACK_POSTS.find((post) => post.slug === slug) || null;
    }));
    return order(fallback.filter((post): post is EntradaBlog => Boolean(post)));
  }
}

export interface BlogSitemapEntry {
  slug: string;
  titulo: string;
  fecha_publicacion?: string;
  fecha_modificacion?: string;
  imagen_portada?: string | null;
  categoria?: string;
}

/**
 * Entradas para sitemap/índices: la misma cadena de fuentes que el blog
 * renderizado (Directus → sitio público → posts UM26), sin traer cuerpos.
 */
export async function fetchBlogSitemapEntries(limit = 500): Promise<BlogSitemapEntry[]> {
  try {
    const params = addVisibleBlogStatusFilter(new URLSearchParams());
    params.set('sort', '-fecha_publicacion');
    params.set('limit', String(limit));
    params.set('fields', 'slug,titulo,categoria,fecha_publicacion,fecha_modificacion,imagen_portada');
    const res = await directusFetch(`${DIRECTUS_URL}/items/blog_posts?${params.toString()}`);
    if (!res.ok) throw new Error(`Directus ${res.status}`);
    const data = await res.json();
    const posts = ((data.data || []) as BlogSitemapEntry[]).filter((post) => isCanonicalBlogSlug(post.slug));
    if (posts.length > 0) return diversifyBlogPostCovers(posts) as BlogSitemapEntry[];
    throw new Error('empty');
  } catch {
    try {
      const slugs = await fetchPublicBlogSlugs();
      if (slugs.length > 0) return slugs.map((slug) => ({ slug, titulo: slug }));
    } catch {
      // continuar con el fallback estático
    }
    return diversifyBlogPostCovers(UM26_FALLBACK_POSTS
      .filter((post) => isCanonicalBlogSlug(post.slug))
      .map((post) => ({
        slug: post.slug,
        titulo: post.titulo,
        fecha_publicacion: post.fecha_publicacion,
        imagen_portada: post.imagen_portada,
        categoria: post.categoria,
      }))) as BlogSitemapEntry[];
  }
}
