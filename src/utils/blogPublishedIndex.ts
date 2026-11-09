import { getBlogTopicEntry } from './blogTopicMap';
import { fetchBlogSitemapEntries, type BlogSitemapEntry } from './getBlogData';

const INDEX_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; entries: Promise<BlogSitemapEntry[]> } | undefined;

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
