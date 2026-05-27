import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import { geoHubRoutes, geoResourceNames, geoVersion } from '../data/geoResources';

export const GET: APIRoute = async () => {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Version: ${geoVersion}`,
    `Canonical: ${SITE_URL}`,
    `Language: es-AR`,
    '',
    '## Discovery',
    `- ${SITE_URL}/llms-full.txt`,
    `- ${SITE_URL}/sitemap-geo.xml`,
    '',
    '## GEO JSON',
    ...geoResourceNames.map((resource) => `- ${SITE_URL}/geo/${resource}.json`),
    '',
    '## Commercial Hubs',
    ...geoHubRoutes.map((hub) => `- ${hub.url} — ${hub.h1}`),
    '',
    '## Core Pages',
    `- ${SITE_URL}/servicios`,
    `- ${SITE_URL}/sectores`,
    `- ${SITE_URL}/antecedentes`,
    `- ${SITE_URL}/blog`,
    `- ${SITE_URL}/contacto`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
