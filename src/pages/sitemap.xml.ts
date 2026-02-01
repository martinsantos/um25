import type { APIRoute } from 'astro';

const SITE_URL = 'https://www.ultimamilla.com.ar';

function generateSitemapXml(): string {
    // Stable date for static pages — update when content changes are deployed
    const lastDeploy = '2026-02-01';

    // All verified, existing pages (no /blog — does not exist yet)
    const pages = [
        // Core pages
        { loc: '' },
        { loc: '/servicios' },
        { loc: '/antecedentes' },
        { loc: '/sectores' },
        { loc: '/nosotros' },
        { loc: '/contacto' },
        // Sector verticals
        { loc: '/mineria' },
        { loc: '/industria' },
        { loc: '/seguridad-electronica' },
        { loc: '/constructoras' },
        { loc: '/bodegas' },
        { loc: '/aeropuertos' },
        { loc: '/salud' },
        { loc: '/gobiernosectorpublico' },
        { loc: '/software' },
        // Service detail pages
        { loc: '/servicios/101/infraestructura-de-redes' },
        { loc: '/servicios/102/sistemas-de-seguridad-electronica' },
        { loc: '/servicios/103/telecomunicaciones' },
        { loc: '/servicios/104/desarrollo-de-software-a-medida' },
        { loc: '/servicios/105/soporte-tecnico-24-7' },
        { loc: '/servicios/106/consultoria-it-y-transformacion-digital' },
        { loc: '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios' },
        { loc: '/servicios/108/servicios-electricos-para-it' },
    ];

    const urlEntries = pages.map(p => `
    <url>
        <loc>${SITE_URL}${p.loc}</loc>
        <lastmod>${lastDeploy}</lastmod>
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
