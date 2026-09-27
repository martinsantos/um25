import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { AI_CRAWLERS } from '../data/geoKnowledge';

/**
 * Cada crawler obedece sólo al grupo más específico que lo nombra: por eso las
 * reglas Disallow se repiten en el grupo de buscadores y asistentes de IA. Sin
 * eso, Googlebot o GPTBot ignoran el grupo "*" y rastrean /admin o /api.
 *
 * Las páginas de laboratorio (/pretext-demo, /banners, /plantilla-arca, /geo,
 * /3dgemelo*) no se bloquean acá: se publican con noindex (SEOHead) y quedan
 * fuera de los sitemaps, así los buscadores pueden leer la directiva.
 *
 * public/robots.txt tiene prioridad sobre esta ruta al servir estáticos:
 * mantener ambos con el mismo contenido.
 */
const disallowRules = `Disallow: /admin/
Disallow: /api/
Disallow: /estilo
Disallow: /_`;

const allowRules = `Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /geo/*.json`;

export const GET: APIRoute = async () => {
  const aiCrawlerGroup = `${AI_CRAWLERS.map((crawler) => `User-agent: ${crawler}`).join('\n')}
${allowRules}
${disallowRules}`;

  const robotsTxt = `# robots.txt — ${SITE_URL}

User-agent: *
${allowRules}
${disallowRules}

# Buscadores y asistentes de IA (mismas reglas, grupo explícito)
${aiCrawlerGroup}

# Resumen para modelos de lenguaje
LLMs: ${SITE_URL}/llms.txt
LLMs-Full: ${SITE_URL}/llms-full.txt
GEO-Knowledge: ${SITE_URL}/geo/brand-facts.json
GEO-Authority: ${SITE_URL}/geo/authority.json

Sitemap: ${SITE_URL}/sitemap-index.xml
Sitemap: ${SITE_URL}/sitemap-images.xml
Sitemap: ${SITE_URL}/sitemap-geo.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
