import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com.ar';

export const GET: APIRoute = async () => {
    const robotsTxt = `# ULTIMA MILLA - Robots.txt
# Última actualización: ${new Date().toISOString().split('T')[0]}

# Permitir indexación general
User-agent: *
Allow: /
Allow: /servicios/
Allow: /antecedentes/
Allow: /nosotros/
Allow: /contacto/

# Bloquear acceso a áreas administrativas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /_astro/
Disallow: /.env

# No indexar archivos estáticos
Disallow: /*.json$
Disallow: /*.js$
Disallow: /*.css$
Disallow: /*.map$

# Permitir acceso a recursos públicos
Allow: /images/
Allow: /fonts/
Allow: /public/

# Configuración de crawl
User-agent: *
Crawl-delay: 1
Request-rate: 30/60

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-antecedentes.xml
Sitemap: ${SITE_URL}/sitemap-index.xml

# Reglas específicas para bots de IA
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /`;

    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
        },
    });
}
