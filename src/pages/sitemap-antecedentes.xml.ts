import type { APIRoute } from 'astro';

import { generateSlug } from '../utils/slugUtils.js';
import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';
import { getAllAntecedentes, getAntecedenteImageUrl } from '../lib/directus';

function getImageUrl(item: any): string | null {
    const imageUrl = getAntecedenteImageUrl(item);
    if (!imageUrl || imageUrl.includes('default-background')) return null;
    return publicImageUrl(imageUrl);
}

function generateSitemapXml(antecedentes: any[]): string {
    const today = formatSitemapDate();

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${antecedentes.map(item => {
        const slug = generateSlug(item.Titulo || item.titulo || 'antecedente');
        const id = item.id || item.ID || 'unknown';
        const lastmod = item.Fecha ? formatSitemapDate(item.Fecha) : today;
        const imageUrl = getImageUrl(item);
        const imageTag = imageUrl ? `
        <image:image>
            <image:loc>${escapeXml(imageUrl)}</image:loc>
        </image:image>` : '';
        return `
    <url>
        <loc>${escapeXml(canonicalUrl(`/antecedentes/${id}/${slug}`))}</loc>
        <lastmod>${lastmod}</lastmod>${imageTag}
    </url>`;
    }).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    try {
        const antecedentes = await getAllAntecedentes();

        const sitemap = generateSitemapXml(antecedentes);

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400'
            },
        });
    } catch (error) {
        console.error('Error generando sitemap de antecedentes:', error);
        return new Response('Directus unavailable for antecedentes sitemap', {
            status: 503,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store'
            },
        });
    }
}
