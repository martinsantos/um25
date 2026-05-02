import type { APIRoute } from 'astro';

import { generateSlug } from '../utils/slugUtils.js';
import { SITE_URL } from '../config/seo';
import { canonicalUrl, escapeXml, formatSitemapDate, publicImageUrl } from '../utils/seoUrl';
import antecedentesSnapshot from '../data/snapshots/antecedentes.json';
import imageLocalMap from '../data/image-local-map.json';

function getImageUrl(imagen: any): string | null {
    if (!imagen) return null;
    if (typeof imagen === 'string') {
        if (imagen.startsWith('http')) return publicImageUrl(imagen);
        const localPath = (imageLocalMap as Record<string, string>)[imagen];
        return publicImageUrl(localPath || `/assets/${imagen}`);
    }
    if (typeof imagen === 'object' && imagen.id) {
        const localPath = (imageLocalMap as Record<string, string>)[imagen.id];
        return publicImageUrl(localPath || `/assets/${imagen.id}`);
    }
    return null;
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
        const imageUrl = getImageUrl(item.Imagen);
        const imageTag = imageUrl ? `
        <image:image>
            <image:loc>${escapeXml(imageUrl)}</image:loc>
            <image:title>${escapeXml(item.Titulo || '')}</image:title>
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
        // Obtener todos los antecedentes desde Directus
        const directusUrl = (typeof process !== 'undefined' ? process.env['DIRECTUS_INTERNAL_URL'] : undefined) ?? import.meta.env['DIRECTUS_INTERNAL_URL'] ?? 'http://localhost:8055';
        const token = (typeof process !== 'undefined' ? process.env['DIRECTUS_ADMIN_TOKEN'] : undefined) ?? import.meta.env['DIRECTUS_ADMIN_TOKEN'] ?? '';
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${directusUrl}/items/Antecedentes?limit=-1&fields=id,Titulo,Fecha,Imagen`,
            { headers }
        );

        let antecedentes = [];
        
        if (response.ok) {
            const data = await response.json();
            antecedentes = data.data || [];
        } else {
            // Fallback: usar datos estáticos si Directus no está disponible
            const errorText = await response.text().catch(() => 'unknown');
            console.error(`[SITEMAP-ANTECEDENTES] Directus returned ${response.status}: ${errorText.slice(0, 300)}`);
            antecedentes = (antecedentesSnapshot as any).data || [];
        }

        const sitemap = generateSitemapXml(antecedentes);

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400'
            },
        });
    } catch (error) {
        console.error('Error generando sitemap de antecedentes:', error);
        
        // Retornar sitemap mínimo en caso de error
        const minimalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${SITE_URL}/antecedentes</loc>
        <lastmod>${formatSitemapDate()}</lastmod>
    </url>
</urlset>`;

        return new Response(minimalSitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            },
        });
    }
}
