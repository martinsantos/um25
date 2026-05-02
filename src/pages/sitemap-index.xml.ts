import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { escapeXml, formatSitemapDate } from '../utils/seoUrl';

function generateSitemapIndexXml(): string {
    const today = formatSitemapDate();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Sitemap principal con páginas estáticas -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap.xml`)}</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
    
    <!-- Sitemap con todos los antecedentes (469 URLs) -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap-antecedentes.xml`)}</loc>
        <lastmod>${today}</lastmod>
    </sitemap>

    <!-- Sitemap del blog (posts + categorías) -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap-blog.xml`)}</loc>
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
