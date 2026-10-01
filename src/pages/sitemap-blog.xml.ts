import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { fetchBlogSitemapEntries } from '../utils/getBlogData';
import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';
import { getBlogTopicEntry, postsForCluster, publishableServiceHubs } from '../utils/blogTopicMap';

const CATEGORIES = ['noticias', 'proyectos', 'tecnico', 'tecnologia', 'empresa'];

interface BlogPost {
  slug: string;
  fecha_publicacion?: string;
  fecha_modificacion?: string;
  imagen_portada?: string | null;
  categoria?: string;
  titulo: string;
}

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  // Misma fuente que el blog renderizado, con timeout y fallback (getBlogData).
  // Si la fuente no trae fechas o categoría (fallback por slugs), se completan con
  // las del mapa temático, que las tomó de cada nota publicada.
  const posts = (await fetchBlogSitemapEntries()) as BlogPost[];
  return posts.map((post) => {
    const entry = getBlogTopicEntry(post.slug);
    if (!entry) return post;
    return {
      ...post,
      titulo: post.titulo && post.titulo !== post.slug ? post.titulo : entry.title,
      categoria: post.categoria || entry.category,
      fecha_publicacion: post.fecha_publicacion || entry.published || undefined,
      fecha_modificacion: post.fecha_modificacion || entry.modified || undefined,
    };
  });
}

const latestDate = (values: Array<string | undefined>): string =>
  values
    .filter((value): value is string => Boolean(value))
    .map((value) => formatSitemapDate(value))
    .sort()
    .at(-1) || '';

const lastmodTag = (value: string): string => (value ? `\n    <lastmod>${value}</lastmod>` : '');

export const GET: APIRoute = async () => {
  const posts = await fetchPublishedPosts();
  const latestPostLastmod = posts
    .map((post) => post.fecha_modificacion || post.fecha_publicacion)
    .filter((value): value is string => Boolean(value))
    .map((value) => formatSitemapDate(value))
    .sort()
    .at(-1) || '';
  const latestTag = lastmodTag(latestPostLastmod);
  // Cada categoría y cada tema cambian cuando cambia su nota más reciente.
  const categoryUrls = CATEGORIES.map((cat) => {
    const lastmod = latestDate(posts
      .filter((post) => post.categoria === cat)
      .map((post) => post.fecha_modificacion || post.fecha_publicacion));
    return `  <url>
    <loc>${SITE_URL}/blog/categoria/${cat}</loc>${lastmodTag(lastmod || latestPostLastmod)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');
  const topicUrls = publishableServiceHubs().map(({ cluster }) => {
    const lastmod = latestDate(postsForCluster('service', cluster.key)
      .map((item) => item.entry.modified || item.entry.published));
    return `  <url>
    <loc>${SITE_URL}/blog/tema/${cluster.hubSlug}</loc>${lastmodTag(lastmod)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  const urls = posts
    .map(post => {
      const loc = canonicalUrl(`/blog/${post.slug}`);
      const lastmodSource = post.fecha_modificacion || post.fecha_publicacion;
      const lastmod = lastmodSource ? formatSitemapDate(lastmodSource) : '';
      const imageUrl = publicImageUrl(post.imagen_portada);
      const imageTag = imageUrl
        ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
    </image:image>`
        : '';
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${imageTag}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/blog</loc>${latestTag}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${categoryUrls}
${topicUrls}
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
