import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import {
  geoCaseResources,
  geoHubRoutes,
  getGeoCaseResources,
  geoResourceNames,
  geoSectorResources,
  geoServiceResources,
  geoVersion,
} from '../data/geoResources';
import { getInstitutionalProofLines } from '../utils/verifiedProof';

export const GET: APIRoute = async () => {
  let directusCaseResources = geoCaseResources;
  try {
    directusCaseResources = await getGeoCaseResources();
  } catch (error) {
    console.error('[LLMS-FULL] Content source unavailable for cases:', error);
    return new Response('Indice LLM temporalmente no disponible', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

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
    `- Proof: ${getInstitutionalProofLines().join('; ')}.`,
    '',
    '## Discovery',
    `- ${SITE_URL}/llms.txt`,
    `- ${SITE_URL}/llms-full.txt`,
    `- ${SITE_URL}/sitemap-geo.xml`,
    `- ${SITE_URL}/sitemap-images.xml`,
    ...geoResourceNames.map((resource) => `- ${SITE_URL}/geo/${resource}.json`),
    '',
    '## Core Pages',
    `- ${SITE_URL}/servicios`,
    `- ${SITE_URL}/sectores`,
    `- ${SITE_URL}/antecedentes`,
    `- ${SITE_URL}/blog`,
    `- ${SITE_URL}/contacto`,
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
    ...directusCaseResources.slice(0, 32).map((item) => `- ${item.client ? `${item.client}: ` : ''}${item.title} (${item.url})`),
    '',
    '## Contact',
    `- ${SITE_URL}/contacto`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
