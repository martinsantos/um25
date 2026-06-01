import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com.ar';

export const GET: APIRoute = async () => {
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

Sitemap: ${SITE_URL}/sitemap-index.xml
Sitemap: ${SITE_URL}/sitemap-geo.xml`;

    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
