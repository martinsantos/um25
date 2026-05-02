import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { blogPosts as fallbackBlogPosts } from '../data/blog-posts';
import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';

const DIRECTUS_URL =
  (typeof process !== 'undefined' ? process.env['DIRECTUS_INTERNAL_URL'] : undefined) ??
  'http://localhost:8055';
const DIRECTUS_TOKEN =
  (typeof process !== 'undefined' ? process.env['DIRECTUS_ADMIN_TOKEN'] : undefined) ?? '';

interface BlogPost {
  slug: string;
  fecha_publicacion: string;
  imagen_portada?: string | null;
  titulo: string;
}

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  try {
    const headers = DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : undefined;
    const res = await fetch(
      `${DIRECTUS_URL}/items/blog_posts?filter[status][_eq]=published&sort=-fecha_publicacion&limit=200&fields=slug,titulo,fecha_publicacion,imagen_portada`,
      { headers }
    );
    if (!res.ok) throw new Error(`Directus blog sitemap returned ${res.status}`);
    const data = await res.json();
    return (data.data || []) as BlogPost[];
  } catch {
    return fallbackBlogPosts.map((post) => ({
      slug: post.slug,
      titulo: post.title,
      fecha_publicacion: new Date().toISOString(),
      imagen_portada: post.image,
    }));
  }
}

export const GET: APIRoute = async () => {
  const posts = await fetchPublishedPosts();
  const today = formatSitemapDate();

  const urls = posts
    .map(post => {
      const loc = canonicalUrl(`/blog/${post.slug}`);
      const lastmod = formatSitemapDate(post.fecha_publicacion) || today;
      const imageUrl = publicImageUrl(post.imagen_portada);
      const imageTag = imageUrl
        ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(post.titulo)}</image:title>
    </image:image>`
        : '';
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${imageTag}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/noticias</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/proyectos</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/tecnico</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/empresa</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
