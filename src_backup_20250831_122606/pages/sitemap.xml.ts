import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com.ar';

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Servicios estáticos basados en la estructura actual
const servicios = [
    { id: 1, slug: 'seguridad-informatica' },
    { id: 2, slug: 'redes-y-comunicaciones' },
    { id: 3, slug: 'software-y-servicios' },
    { id: 4, slug: 'telefonia' },
    { id: 5, slug: 'ciberseguridad' },
    { id: 6, slug: 'servicios-web' }
];

// Antecedentes principales
const antecedentes = [
    { id: 10768, slug: 'isi-solutions-redes-y-comunicaciones' },
    { id: 10769, slug: 'ministerio-de-deportes-gobierno-de-mendoza-redes-y' },
    { id: 10770, slug: 'telecombtw-sa-redes-y-comunicaciones' }
];

function generateSitemapXml(): string {
    const today = formatDate(new Date());
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <!-- Página principal -->
    <url>
        <loc>${SITE_URL}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    
    <!-- Páginas principales -->
    <url>
        <loc>${SITE_URL}/servicios</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/antecedentes</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/nosotros</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/contacto</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <!-- Páginas de servicios individuales -->
    ${servicios.map(servicio => `
    <url>
        <loc>${SITE_URL}/servicios/${servicio.id}/${servicio.slug}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`).join('')}

    <!-- Páginas de antecedentes individuales -->
    ${antecedentes.map(antecedente => `
    <url>
        <loc>${SITE_URL}/antecedentes/${antecedente.id}/${antecedente.slug}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.6</priority>
    </url>`).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    const sitemap = generateSitemapXml();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400', // 24 horas
            'X-Robots-Tag': 'noindex'
        },
    });
}
