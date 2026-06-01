import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import {
  geoCaseResources,
  geoHubRoutes,
  geoResourceNames,
  geoSectorResources,
  geoServiceResources,
} from '../data/geoResources';
import { canonicalUrl, escapeXml, formatSitemapDate } from '../utils/seoUrl';

type GeoSitemapEntry = {
  loc: string;
  priority: string;
  changefreq: string;
};

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
    { loc: canonicalUrl('/llms.txt'), priority: '0.9', changefreq: 'weekly' },
    { loc: canonicalUrl('/llms-full.txt'), priority: '0.9', changefreq: 'weekly' },
    ...geoResourceNames.map((resource) => ({
      loc: canonicalUrl(`/geo/${resource}.json`),
      priority: '0.8',
      changefreq: 'weekly',
    })),
    { loc: canonicalUrl('/servicios'), priority: '0.9', changefreq: 'weekly' },
    { loc: canonicalUrl('/sectores'), priority: '0.8', changefreq: 'weekly' },
    { loc: canonicalUrl('/antecedentes'), priority: '0.8', changefreq: 'weekly' },
    { loc: canonicalUrl('/blog'), priority: '0.7', changefreq: 'daily' },
    { loc: canonicalUrl('/contacto'), priority: '0.8', changefreq: 'monthly' },
    ...geoHubRoutes.map((hub) => ({ loc: hub.url, priority: '0.92', changefreq: 'weekly' })),
    ...geoServiceResources.map((service) => ({ loc: service.url, priority: '0.82', changefreq: 'monthly' })),
    ...geoSectorResources.map((sector) => ({ loc: sector.url, priority: '0.76', changefreq: 'monthly' })),
    ...geoCaseResources.map((item) => ({
      loc: item.url,
      priority: item.priority === 'high' ? '0.72' : '0.58',
      changefreq: 'monthly',
    })),
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
