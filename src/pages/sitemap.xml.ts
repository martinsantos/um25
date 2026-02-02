import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com.ar';

function generateSitemapXml(): string {
    // Stable date for static pages — update when content changes are deployed
    const lastDeploy = '2026-02-02';

    // All verified, existing pages (no /blog — does not exist yet)
    const pages: Array<{ loc: string; priority: string; changefreq: string }> = [
        // Core pages
        { loc: '', priority: '1.0', changefreq: 'weekly' },
        { loc: '/servicios', priority: '0.9', changefreq: 'weekly' },
        { loc: '/antecedentes', priority: '0.8', changefreq: 'weekly' },
        { loc: '/sectores', priority: '0.7', changefreq: 'monthly' },
        { loc: '/nosotros', priority: '0.6', changefreq: 'monthly' },
        { loc: '/contacto', priority: '0.7', changefreq: 'monthly' },
        // Sector verticals
        { loc: '/mineria', priority: '0.7', changefreq: 'monthly' },
        { loc: '/industria', priority: '0.7', changefreq: 'monthly' },
        { loc: '/seguridad-electronica', priority: '0.7', changefreq: 'monthly' },
        { loc: '/constructoras', priority: '0.7', changefreq: 'monthly' },
        { loc: '/bodegas', priority: '0.7', changefreq: 'monthly' },
        { loc: '/aeropuertos', priority: '0.7', changefreq: 'monthly' },
        { loc: '/salud', priority: '0.7', changefreq: 'monthly' },
        { loc: '/gobiernosectorpublico', priority: '0.7', changefreq: 'monthly' },
        { loc: '/software', priority: '0.7', changefreq: 'monthly' },
        // Service detail pages
        { loc: '/servicios/101/infraestructura-de-redes', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/102/sistemas-de-seguridad-electronica', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/103/telecomunicaciones', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/104/desarrollo-de-software-a-medida', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/105/soporte-tecnico-24-7', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/106/consultoria-it-y-transformacion-digital', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios', priority: '0.8', changefreq: 'monthly' },
        { loc: '/servicios/108/servicios-electricos-para-it', priority: '0.8', changefreq: 'monthly' },
    ];

    const urlEntries = pages.map(p => `
    <url>
        <loc>${SITE_URL}${p.loc}</loc>
        <lastmod>${lastDeploy}</lastmod>
        <changefreq>${p.changefreq}</changefreq>
        <priority>${p.priority}</priority>
    </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
}

export const GET: APIRoute = async () => {
    const sitemap = generateSitemapXml();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
