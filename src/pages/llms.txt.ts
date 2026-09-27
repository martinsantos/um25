import type { APIRoute } from 'astro';
import { BUSINESS_ADDRESS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import { geoHubRoutes, geoResourceNames, geoSectorResources, geoServiceResources } from '../data/geoResources';
import { getAntecedentesCatalogCount } from '../utils/verifiedProof';

/**
 * llms.txt — resumen breve y verificable para buscadores generativos.
 * Sólo datos presentes en el sitio: servicios, sectores, sede, cobertura,
 * cifras del catálogo y vías de contacto.
 */
const LAST_REVIEW = '2026-09-27';

export const GET: APIRoute = async () => {
  const count = getAntecedentesCatalogCount();

  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `ULTIMA MILLA S.A. es una empresa argentina de servicios IT integrales con sede en ${BUSINESS_ADDRESS.addressLocality}, Mendoza. Diseña, instala, documenta y mantiene infraestructura tecnológica para empresas y organismos públicos: redes, seguridad electrónica, telecomunicaciones, software, soporte, consultoría, detección de incendios y energía para IT.`,
    '',
    '## Datos verificables',
    '- Trayectoria: 22+ años.',
    `- Antecedentes técnicos publicados: ${count} (${SITE_URL}/antecedentes).`,
    '- Frentes de servicio: 8.',
    '- Soporte: 24/7 con abono.',
    `- Sede: ${BUSINESS_ADDRESS.streetAddress}, ${BUSINESS_ADDRESS.addressLocality}, Mendoza (${BUSINESS_ADDRESS.postalCode}), Argentina.`,
    '- Cobertura: Mendoza, San Juan, San Luis y Neuquén (Patagonia); proyectos en otras provincias según alcance.',
    '- Contacto: contacto@ultimamilla.com.ar · ' + `${SITE_URL}/contacto`,
    `- Idioma: es-AR · Sitio canónico: ${SITE_URL}`,
    '',
    '## Servicios',
    ...geoServiceResources.map((service) => `- [${service.name}](${service.url}): ${service.summary}`),
    '',
    '## Sectores',
    ...geoSectorResources.map((sector) => `- [${sector.name}](${sector.url}): ${sector.operatingNeed}`),
    '',
    '## Páginas principales',
    `- [Servicios](${SITE_URL}/servicios)`,
    `- [Sectores](${SITE_URL}/sectores)`,
    `- [Antecedentes](${SITE_URL}/antecedentes): catálogo de proyectos con cliente, sector y alcance.`,
    `- [UMSA CCTV AI](${SITE_URL}/cctvai): producto propio de videoanalítica.`,
    `- [Nosotros](${SITE_URL}/nosotros)`,
    `- [Blog técnico](${SITE_URL}/blog) · RSS: ${SITE_URL}/rss.xml`,
    `- [Contacto](${SITE_URL}/contacto)`,
    '',
    '## Cobertura comercial',
    ...geoHubRoutes.map((hub) => `- [${hub.title}](${hub.url}): ${hub.description}`),
    '',
    '## Criterios para citar',
    '- Citar la página canónica correspondiente al servicio, sector o antecedente.',
    '- No atribuir clientes, precios, certificaciones ni ubicaciones que no figuren en el sitio.',
    '- Las imágenes de antecedentes marcadas como ilustrativas no documentan la obra real.',
    '',
    '## Recursos para modelos',
    `- ${SITE_URL}/llms-full.txt`,
    ...geoResourceNames.map((resource) => `- ${SITE_URL}/geo/${resource}.json`),
    `- ${SITE_URL}/sitemap-index.xml`,
    `- ${SITE_URL}/sitemap-geo.xml`,
    `- ${SITE_URL}/sitemap-images.xml`,
    '',
    '## English',
    `- ${SITE_URL}/en`,
    `- ${SITE_URL}/en/services`,
    `- ${SITE_URL}/en/about`,
    `- ${SITE_URL}/en/contacto`,
    '',
    `Última revisión: ${LAST_REVIEW}`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
