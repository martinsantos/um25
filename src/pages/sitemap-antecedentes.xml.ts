import type { APIRoute } from 'astro';
import { PUBLIC_CONTENT_REVIEWED } from '../config/publicFacts';

import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';
import { loadStories, type Story } from '../components/proto/isoData';

function generateSitemapXml(antecedentes: Story[]): string {
    const reviewed = formatSitemapDate(PUBLIC_CONTENT_REVIEWED);

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${antecedentes.map(item => {
        const lastmod = reviewed;
        const imageUrl = item.image ? publicImageUrl(item.image) : null;
        const imageTag = imageUrl ? `
        <image:image>
            <image:loc>${escapeXml(imageUrl)}</image:loc>
        </image:image>` : '';
        return `
    <url>
        <loc>${escapeXml(canonicalUrl(item.href))}</loc>
        <lastmod>${lastmod}</lastmod>${imageTag}
    </url>`;
    }).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    try {
        const { stories: antecedentes } = await loadStories();

        const sitemap = generateSitemapXml(antecedentes);

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400'
            },
        });
    } catch (error) {
        console.error('Error generando sitemap de antecedentes:', error);
        return new Response('Sitemap de antecedentes temporalmente no disponible', {
            status: 503,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store'
            },
        });
    }
}
