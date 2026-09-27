import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { fetchBlogSitemapEntries } from '../utils/getBlogData';
import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';

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
  return (await fetchBlogSitemapEntries()) as BlogPost[];
}

export const GET: APIRoute = async () => {
  const posts = await fetchPublishedPosts();
  const latestPostLastmod = posts
    .map((post) => post.fecha_modificacion || post.fecha_publicacion)
    .filter((value): value is string => Boolean(value))
    .map((value) => formatSitemapDate(value))
    .sort()
    .at(-1) || '';
  const latestTag = latestPostLastmod ? `\n    <lastmod>${latestPostLastmod}</lastmod>` : '';

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
  <url>
    <loc>${SITE_URL}/blog/categoria/noticias</loc>${latestTag}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/proyectos</loc>${latestTag}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/tecnico</loc>${latestTag}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/tecnologia</loc>${latestTag}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/categoria/empresa</loc>${latestTag}
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
