import type { APIRoute } from 'astro';

const SITE_URL = 'https://www.ultimamilla.com.ar';

export const GET: APIRoute = async () => {
    const robotsTxt = `# www.robotstxt.org

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${SITE_URL}/sitemap-index.xml

# Archivos específicos a no indexar
Disallow: /*.json$
Disallow: /*.js$
Disallow: /*.css$

# Permitir principales directorios
Allow: /blog/
Allow: /servicios/
Allow: /nosotros/
Allow: /contacto/

# Crawl-delay
Crawl-delay: 10`;

    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
