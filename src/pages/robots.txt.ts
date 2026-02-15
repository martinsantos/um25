import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com.ar';

export const GET: APIRoute = async () => {
    const robotsTxt = `# robots.txt — ultimamilla.com.ar

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Contenido principal
Allow: /servicios/
Allow: /antecedentes/
Allow: /nosotros/
Allow: /contacto/
Allow: /sectores/

# Sitemap
Sitemap: ${SITE_URL}/sitemap-index.xml`;

    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
