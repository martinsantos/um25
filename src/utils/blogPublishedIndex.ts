import { getBlogTopicEntry } from './blogTopicMap';
import { fetchBlogPostsBySlugs, fetchBlogSitemapEntries, type BlogSitemapEntry } from './getBlogData';

const INDEX_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; entries: Promise<BlogSitemapEntry[]> } | undefined;

function words(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/\bwi[\s-]?fi\b/g, 'wifi').match(/[\p{L}\p{N}]+/gu) || [];
}

export async function searchPublishedBlogIndex(query: string, page: number, limit: number, category?: string) {
  const entries = await fetchPublishedBlogIndex();
  const terms = words(query);
  const candidates = terms.length ? entries.filter(entry => {
    if (category && entry.categoria && entry.categoria !== category) return false;
    const index = words(entry.titulo + ' ' + entry.slug);
    return terms.every(term => index.some(word => term.length < 3 ? word === term : word.startsWith(term)));
  }) : [];
  // A sitemap fallback may know the slug before the editorial index knows its category.
  const unclassified = category ? candidates.filter(entry => !entry.categoria) : [];
  const details = new Map<string, Awaited<ReturnType<typeof fetchBlogPostsBySlugs>>[number]>();
  for (let i = 0; i < unclassified.length; i += 8) {
    const slugs = unclassified.slice(i, i + 8).map(entry => entry.slug);
    for (const post of await fetchBlogPostsBySlugs(slugs)) details.set(post.slug, post);
  }
  const incompleteCategories = details.size < unclassified.length;
  const matches = category
    ? candidates.filter(entry => (entry.categoria || details.get(entry.slug)?.categoria) === category)
    : candidates;
  const start = (page - 1) * limit;
  const items = matches.slice(start, start + limit);
  const missing = items.filter(entry => !details.has(entry.slug));
  for (const post of await fetchBlogPostsBySlugs(missing.map(entry => entry.slug))) details.set(post.slug, post);
  const posts = items.flatMap(entry => {
    const post = details.get(entry.slug);
    return post ? [post] : [];
  });
  return {
    posts,
    total: matches.length,
    unavailable: entries.length === 0 || incompleteCategories || posts.length < items.length,
  };
}

export function fetchPublishedBlogIndex(): Promise<BlogSitemapEntry[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.entries;

  // El índice de respaldo puede traer sólo slugs. El mapa temático aporta los metadatos de la nota.
  const entries = fetchBlogSitemapEntries(-1).then((posts) => posts.map((post) => {
    const entry = getBlogTopicEntry(post.slug);
    if (!entry) return post;
    return {
      ...post,
      titulo: post.titulo && post.titulo !== post.slug ? post.titulo : entry.title,
      categoria: post.categoria || entry.category,
      fecha_publicacion: post.fecha_publicacion || entry.published || undefined,
      fecha_modificacion: post.fecha_modificacion || entry.modified || undefined,
    };
  }));
  cache = { expiresAt: Date.now() + INDEX_TTL_MS, entries };
  return entries;
}
