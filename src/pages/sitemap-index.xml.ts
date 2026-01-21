import type { APIRoute } from 'astro';

// Use environment variable or fallback
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL as string) || (import.meta.env.SITE as string) || 'https://ultimamilla.com.ar';

function formatDate(date: Date): string {
    const isoString = date.toISOString();
    const parts = isoString.split('T');
    return parts[0] || new Date().toISOString().split('T')[0];
}

function generateSitemapIndexXml(): string {
    const today = formatDate(new Date());
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Sitemap principal con páginas estáticas -->
    <sitemap>
        <loc>${SITE_URL}/sitemap.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
    
    <!-- Sitemap con todos los antecedentes (469 URLs) -->
    <sitemap>
        <loc>${SITE_URL}/sitemap-antecedentes.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
</sitemapindex>`;
}

export const GET: APIRoute = async () => {
    const sitemapIndex = generateSitemapIndexXml();

    return new Response(sitemapIndex, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
        },
    });
}
