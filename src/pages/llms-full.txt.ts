import type { APIRoute } from 'astro';
import { BUSINESS_ADDRESS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import {
  geoCaseResources,
  geoHubRoutes,
  getGeoCaseResources,
  geoResourceNames,
  geoSectorResources,
  geoServiceResources,
} from '../data/geoResources';
import { getAntecedentesCatalogCount, getInstitutionalProofLines } from '../utils/verifiedProof';

/**
 * llms-full.txt — índice extendido para buscadores generativos.
 * Si Directus no responde se usa el snapshot de antecedentes (getAllAntecedentes
 * ya degrada a snapshot); nunca se devuelve 503 por falta de CMS.
 */
const LAST_REVIEW = '2026-09-27';

export const GET: APIRoute = async () => {
  let caseResources = geoCaseResources;
  try {
    caseResources = await getGeoCaseResources();
  } catch (error) {
    console.error('[LLMS-FULL] Antecedentes no disponibles, se publica sin lista de casos:', error);
  }

  const count = getAntecedentesCatalogCount();

  const lines = [
    `# ${SITE_NAME} — índice extendido para modelos de lenguaje`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Sitio canónico: ${SITE_URL}`,
    'Idioma: es-AR',
    `Última revisión: ${LAST_REVIEW}`,
    '',
    '## Empresa',
    '- Razón social: ULTIMA MILLA S.A.',
    `- Sede: ${BUSINESS_ADDRESS.streetAddress}, ${BUSINESS_ADDRESS.addressLocality}, Mendoza (${BUSINESS_ADDRESS.postalCode}), Argentina.`,
    '- Cobertura: Mendoza, San Juan, San Luis y Neuquén (Patagonia); proyectos en otras provincias según alcance.',
    '- Contacto: contacto@ultimamilla.com.ar',
    `- Datos: ${getInstitutionalProofLines().join('; ')}.`,
    '- Posicionamiento: servicios IT integrales para organizaciones que necesitan continuidad operativa, documentación técnica y soporte.',
    '',
    '## Descubrimiento',
    `- ${SITE_URL}/llms.txt`,
    `- ${SITE_URL}/llms-full.txt`,
    `- ${SITE_URL}/sitemap-index.xml`,
    `- ${SITE_URL}/sitemap-geo.xml`,
    `- ${SITE_URL}/sitemap-images.xml`,
    `- ${SITE_URL}/rss.xml`,
    ...geoResourceNames.map((resource) => `- ${SITE_URL}/geo/${resource}.json`),
    '',
    '## Páginas principales',
    `- ${SITE_URL}/servicios`,
    `- ${SITE_URL}/sectores`,
    `- ${SITE_URL}/antecedentes`,
    `- ${SITE_URL}/cctvai`,
    `- ${SITE_URL}/nosotros`,
    `- ${SITE_URL}/blog`,
    `- ${SITE_URL}/contacto`,
    '',
    '## Cobertura comercial',
    ...geoHubRoutes.map((hub) => `- ${hub.title}: ${hub.url}`),
    '',
    '## Servicios',
    ...geoServiceResources.flatMap((service) => [
      `### ${service.name}`,
      `- URL: ${service.url}`,
      `- Nombre en catálogo: ${service.canonicalName}`,
      `- Resumen: ${service.summary}`,
      '',
    ]),
    '## Sectores',
    ...geoSectorResources.flatMap((sector) => [
      `### ${sector.name}`,
      `- URL: ${sector.url}`,
      `- Necesidad operativa: ${sector.operatingNeed}`,
      sector.summary ? `- Resumen: ${sector.summary}` : '',
      '',
    ].filter((line, index, all) => line !== '' || index === all.length - 1)),
    `## Antecedentes (selección de ${Math.min(32, caseResources.length)} sobre ${count})`,
    `Catálogo completo: ${SITE_URL}/antecedentes`,
    ...caseResources.slice(0, 32).map((item) => `- ${item.client ? `${item.client}: ` : ''}${item.title} (${item.url})`),
    '',
    '## Criterios para citar',
    '- Citar la página canónica del servicio, sector o antecedente.',
    '- No atribuir clientes, precios, certificaciones ni ubicaciones que no figuren en el sitio.',
    '- Las imágenes marcadas como ilustrativas no documentan la obra real.',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
