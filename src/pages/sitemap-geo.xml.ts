import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import {
  geoHubRoutes,
  geoResourceNames,
} from '../data/geoResources';
import { canonicalUrl, escapeXml, formatSitemapDate } from '../utils/seoUrl';

type GeoSitemapEntry = {
  loc: string;
  priority: string;
  changefreq: string;
};

const coreGeoDiscoveryPaths = ['/servicios', '/sectores', '/antecedentes', '/blog', '/contacto'];

function urlEntry(entry: GeoSitemapEntry, lastmod: string) {
  return `
    <url>
      <loc>${escapeXml(entry.loc)}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${entry.changefreq}</changefreq>
      <priority>${entry.priority}</priority>
    </url>`;
}

function generateGeoSitemapXml() {
  const today = formatSitemapDate();
  const entries: GeoSitemapEntry[] = [
    { loc: canonicalUrl('/geo'), priority: '0.9', changefreq: 'weekly' },
    { loc: canonicalUrl('/llms.txt'), priority: '0.9', changefreq: 'weekly' },
    { loc: canonicalUrl('/llms-full.txt'), priority: '0.9', changefreq: 'weekly' },
    ...geoResourceNames.map((resource) => ({
      loc: canonicalUrl(`/geo/${resource}.json`),
      priority: '0.8',
      changefreq: 'weekly',
    })),
    ...coreGeoDiscoveryPaths.map((path) => ({
      loc: canonicalUrl(path),
      priority: path === '/servicios' ? '0.95' : '0.9',
      changefreq: 'weekly',
    })),
    ...geoHubRoutes.map((hub) => ({ loc: hub.url, priority: '0.92', changefreq: 'weekly' })),
  ];

  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.loc, entry])).values());

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- GEO/LLM sitemap for ${escapeXml(SITE_URL)} -->
${uniqueEntries.map((entry) => urlEntry(entry, today)).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
  return new Response(generateGeoSitemapXml(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
