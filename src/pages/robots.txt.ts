import type { APIRoute } from 'astro';
import { AI_CRAWLERS } from '../data/geoKnowledge';
import { SITE_URL } from '../config/seo';

export const GET: APIRoute = async () => {
    const aiCrawlerRules = AI_CRAWLERS.map((crawler) => `User-agent: ${crawler}
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /geo/
Allow: /sitemap-geo.xml`).join('\n\n');

    const robotsTxt = `# robots.txt — ultimamilla.com.ar

User-agent: *
Disallow: /admin/
Disallow: /estilo
Disallow: /estilo/
Disallow: /api/
Disallow: /_index
Disallow: /_nosotros
Disallow: /_contacto
Disallow: /_sectores
Disallow: /_cli-mobile
Disallow: /_test-components-v4

Allow: /llms.txt
Allow: /llms-full.txt
Allow: /geo/
Allow: /sitemap-geo.xml

# AI and LLM discovery resources
${aiCrawlerRules}

LLMs: ${SITE_URL}/llms.txt
LLMs-Full: ${SITE_URL}/llms-full.txt
GEO-Index: ${SITE_URL}/geo
GEO-Knowledge: ${SITE_URL}/geo/brand-facts.json
GEO-Authority: ${SITE_URL}/geo/authority.json

Sitemap: ${SITE_URL}/sitemap-index.xml
Sitemap: ${SITE_URL}/sitemap-geo.xml`;

    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
