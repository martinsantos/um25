import type { APIRoute } from 'astro';

import { getAntecedentesImageEvidenceEntries } from '../utils/antecedentesImageEvidence';
import { escapeXml, formatSitemapDate } from '../utils/seoUrl';

function generateImageSitemapXml(): string {
  const entries = getAntecedentesImageEvidenceEntries();

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${entries.map((entry) => `
    <url>
      <loc>${escapeXml(entry.pageUrl)}</loc>
      <lastmod>${formatSitemapDate(entry.date)}</lastmod>
      <image:image>
        <image:loc>${escapeXml(entry.imageUrl)}</image:loc>
      </image:image>
    </url>`).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
  return new Response(generateImageSitemapXml(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
