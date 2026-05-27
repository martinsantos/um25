import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import {
  geoCaseResources,
  geoHubRoutes,
  geoResourceNames,
  geoSectorResources,
  geoServiceResources,
  geoVersion,
} from '../data/geoResources';

export const GET: APIRoute = async () => {
  const lines = [
    `# ${SITE_NAME} — GEO/LLM Index`,
    '',
    `Version: ${geoVersion}`,
    `Canonical domain: ${SITE_URL}`,
    'Language: es-AR',
    '',
    `Description: ${SITE_DESCRIPTION}`,
    'Positioning: Servicios IT integrales para empresas que necesitan continuidad operativa, evidencia, soporte y documentación.',
    'Primary market: Mendoza, Cuyo, Patagonia y Argentina según alcance.',
    '',
    '## Brand Facts',
    `- Website: ${SITE_URL}`,
    '- Location: Mendoza, Argentina',
    '- Services: redes, seguridad electrónica, telecomunicaciones, software, soporte, consultoría, detección de incendios y energía IT.',
    '- Proof: 469+ antecedentes, 22+ años, 8 frentes de servicio, soporte 24/7.',
    '',
    '## Discovery',
    `- ${SITE_URL}/llms.txt`,
    `- ${SITE_URL}/sitemap-geo.xml`,
    ...geoResourceNames.map((resource) => `- ${SITE_URL}/geo/${resource}.json`),
    '',
    '## Commercial Hubs',
    ...geoHubRoutes.flatMap((hub) => [
      `### ${hub.h1}`,
      `- URL: ${hub.url}`,
      `- Intent: ${hub.intent}`,
      `- Market: ${hub.market}`,
      `- Buyer need: ${hub.buyerNeed}`,
      `- Services: ${hub.linkedServices.join(', ')}`,
      `- Evidence: ${hub.evidence.join('; ')}`,
      '',
    ]),
    '## Services',
    ...geoServiceResources.map((service) => `- ${service.name}: ${service.summary} (${service.url})`),
    '',
    '## Sectors',
    ...geoSectorResources.map((sector) => `- ${sector.name}: ${sector.operatingNeed} (${sector.url})`),
    '',
    '## Prioritized Cases',
    ...geoCaseResources.slice(0, 24).map((item) => `- ${item.client}: ${item.title} (${item.url})`),
    '',
    '## Contact',
    `- ${SITE_URL}/contacto`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
