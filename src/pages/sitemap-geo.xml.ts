import type { APIRoute } from 'astro';
import { getGeoSitemapUrls } from '../data/geoKnowledge';
import { escapeXml } from '../utils/seoUrl';

function generateGeoSitemap(): string {
  const urlEntries = getGeoSitemapUrls().map((entry) => `
    <url>
        <loc>${escapeXml(entry.loc)}</loc>
        <lastmod>${entry.lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
}

export const GET: APIRoute = async () => {
  return new Response(generateGeoSitemap(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
