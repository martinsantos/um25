import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com.ar';
const DIRECTUS_URL =
  (typeof process !== 'undefined' ? process.env.DIRECTUS_INTERNAL_URL : undefined) ??
  'http://localhost:8055';
const DIRECTUS_TOKEN =
  (typeof process !== 'undefined' ? process.env.DIRECTUS_ADMIN_TOKEN : undefined) ??
  '1d70b2841dd6365c676ab42e879c5fdfc044ec1adfc146552a99b2d7e23baa5e';

interface BlogPost {
  slug: string;
  fecha_publicacion: string;
  imagen_portada?: string | null;
  titulo: string;
}

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/blog_posts?filter[status][_eq]=published&sort=-fecha_publicacion&limit=200&fields=slug,titulo,fecha_publicacion,imagen_portada`,
      { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
    );
    const data = await res.json();
    return (data.data || []) as BlogPost[];
  } catch {
    return [];
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const posts = await fetchPublishedPosts();
  const today = new Date().toISOString().split('T')[0];

  const urls = posts
    .map(post => {
      const loc = `${SITE_URL}/blog/${escapeXml(post.slug)}`;
      const lastmod = post.fecha_publicacion
        ? post.fecha_publicacion.split('T')[0]
        : today;
      const imageTag = post.imagen_portada && post.imagen_portada.startsWith('http')
        ? `
    <image:image>
      <image:loc>${escapeXml(post.imagen_portada)}</image:loc>
      <image:title>${escapeXml(post.titulo)}</image:title>
    </image:image>`
        : '';
      return `  <url>
    <loc>${loc}</loc>
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
