import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/seo';
import { escapeXml } from '../utils/seoUrl';

function generateSitemapIndexXml(): string {
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Sitemap principal con páginas estáticas -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap.xml`)}</loc>
    </sitemap>
    
    <!-- Sitemap con todos los antecedentes publicados -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap-antecedentes.xml`)}</loc>
    </sitemap>

    <!-- Sitemap dedicado a imagenes de antecedentes generadas y aprobadas -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap-images.xml`)}</loc>
    </sitemap>

    <!-- Sitemap del blog (posts + categorías) -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap-blog.xml`)}</loc>
    </sitemap>

    <!-- Sitemap GEO con páginas canónicas y hubs comerciales -->
    <sitemap>
        <loc>${escapeXml(`${SITE_URL}/sitemap-geo.xml`)}</loc>
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
