import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { BLOG_LISTING_CATEGORIES } from '../lib/blogListingRoute';
import { fetchPublishedBlogIndex } from '../utils/blogPublishedIndex';
import { blogPostImageUrl } from '../utils/blogHelpers';
import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';
import { postsForCluster, publishableServiceHubs } from '../utils/blogTopicMap';

const latestDate = (values: Array<string | undefined>): string =>
  values
    .filter((value): value is string => Boolean(value))
    .map((value) => formatSitemapDate(value))
    .sort()
    .at(-1) || '';

const lastmodTag = (value: string): string => (value ? `\n    <lastmod>${value}</lastmod>` : '');

export const GET: APIRoute = async () => {
  const posts = await fetchPublishedBlogIndex();
  const latestPostLastmod = posts
    .map((post) => post.fecha_modificacion || post.fecha_publicacion)
    .filter((value): value is string => Boolean(value))
    .map((value) => formatSitemapDate(value))
    .sort()
    .at(-1) || '';
  const latestTag = lastmodTag(latestPostLastmod);
  // Cada categoría y cada tema cambian cuando cambia su nota más reciente.
  const categoryUrls = BLOG_LISTING_CATEGORIES.flatMap((cat) => {
    const inCategory = posts.filter((post) => post.categoria === cat);
    if (!inCategory.length) return [];
    const lastmod = latestDate(inCategory.map((post) => post.fecha_modificacion || post.fecha_publicacion));
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
      // El respaldo por enlaces puede carecer de portada: no anunciar una foto genérica como asociada.
      const imageUrl = 'imagen_portada' in post ? publicImageUrl(blogPostImageUrl(post as any)) : '';
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
