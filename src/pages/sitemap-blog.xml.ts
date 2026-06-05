import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { blogPosts as fallbackBlogPosts } from '../data/blog-posts';
import { isCanonicalBlogSlug } from '../data/seoRedirects';
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

const spanishMonthNumbers: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

function parseFallbackBlogDate(value: string | undefined): string {
  const clean = String(value || '').trim().toLowerCase();
  const match = clean.match(/^(\d{1,2})\s+([a-záéíóúñ]+)\s+(\d{4})$/i);
  if (!match) return '2024-01-01';

  const day = match[1]?.padStart(2, '0');
  const month = spanishMonthNumbers[match[2]?.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''];
  const year = match[3];

  return day && month && year ? `${year}-${month}-${day}` : '2024-01-01';
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
    return ((data.data || []) as BlogPost[]).filter((post) => isCanonicalBlogSlug(post.slug));
  } catch {
    return fallbackBlogPosts.filter((post) => isCanonicalBlogSlug(post.slug)).map((post) => ({
      slug: post.slug,
      titulo: post.title,
      fecha_publicacion: parseFallbackBlogDate(post.date),
      imagen_portada: post.image,
    }));
  }
}

export const GET: APIRoute = async () => {
  const posts = await fetchPublishedPosts();
  const latestPostLastmod = posts
    .map((post) => formatSitemapDate(post.fecha_publicacion))
    .sort()
    .at(-1) || formatSitemapDate('2024-01-01');

  const urls = posts
    .map(post => {
      const loc = canonicalUrl(`/blog/${post.slug}`);
      const lastmod = formatSitemapDate(post.fecha_publicacion) || latestPostLastmod;
      const imageUrl = publicImageUrl(post.imagen_portada);
      const imageTag = imageUrl
        ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
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
    <lastmod>${latestPostLastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/noticias</loc>
    <lastmod>${latestPostLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/proyectos</loc>
    <lastmod>${latestPostLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/tecnico</loc>
    <lastmod>${latestPostLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/empresa</loc>
    <lastmod>${latestPostLastmod}</lastmod>
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
