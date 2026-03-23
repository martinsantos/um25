import type { APIRoute } from 'astro';

import { generateSlug } from '../utils/slugUtils.js';

const SITE_URL = 'https://ultimamilla.com.ar';

function formatDate(date: Date): string {
    const isoString = date.toISOString();
    const parts = isoString.split('T');
    return parts[0] || new Date().toISOString().split('T')[0];
}

function getImageUrl(imagen: any): string | null {
    if (!imagen) return null;
    if (typeof imagen === 'string') {
        if (imagen.startsWith('http')) return imagen;
        return `${SITE_URL}/admin/assets/${imagen}`;
    }
    if (typeof imagen === 'object' && imagen.id) {
        return `${SITE_URL}/admin/assets/${imagen.id}`;
    }
    return null;
}

function generateSitemapXml(antecedentes: any[]): string {
    const today = formatDate(new Date());

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${antecedentes.map(item => {
        const slug = generateSlug(item.Titulo || item.titulo || 'antecedente');
        const id = item.id || item.ID || 'unknown';
        const lastmod = item.Fecha ? formatDate(new Date(item.Fecha)) : today;
        const imageUrl = getImageUrl(item.Imagen);
        const imageTag = imageUrl ? `
        <image:image>
            <image:loc>${imageUrl}</image:loc>
            <image:title>${(item.Titulo || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
        </image:image>` : '';
        return `
    <url>
        <loc>${SITE_URL}/antecedentes/${id}/${slug}</loc>
        <lastmod>${lastmod}</lastmod>${imageTag}
    </url>`;
    }).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    try {
        // 1. Intentar obtener datos frescos desde Directus
        const directusUrl = (import.meta.env.PUBLIC_DIRECTUS_URL as string) || 'http://localhost:8055';
        const token = (import.meta.env.PUBLIC_DIRECTUS_TOKEN as string) || '';

        let antecedentes = [];
        let source = 'api';

        try {
            const response = await fetch(
                `${directusUrl}/items/Antecedentes?limit=-1&fields=id,Titulo,Fecha,Imagen`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000) // Timeout de 5s para no colgar el sitemap
                }
            );

            if (response.ok) {
                const data = await response.json();
                antecedentes = data.data || [];
            } else {
                throw new Error(`Main API failed: ${response.status}`);
            }
        } catch (apiError) {
            console.warn('[SITEMAP] API fail/timeout, switching to snapshot fallback:', apiError);
            source = 'snapshot';
        }

        // 2. Fallback Blindado: Si la API falló o trajo 0 resultados, usar snapshot local
        if (antecedentes.length === 0) {
            try {
                // @ts-ignore
                const snapshot = await import('../data/snapshots/antecedentes.json');
                antecedentes = snapshot.data || snapshot.default?.data || [];
                console.log(`[SITEMAP] Served ${antecedentes.length} items from local snapshot.`);
            } catch (snapError) {
                console.error('[SITEMAP] Critical: Snapshot load failed', snapError);
            }
        }

        const sitemap = generateSitemapXml(antecedentes);

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400',
                'X-Sitemap-Source': source
            },
        });
    } catch (error) {
        console.error('Error generando sitemap de antecedentes:', error);
        
        // Retornar sitemap estático de emergencia
        const emergencySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${SITE_URL}/antecedentes</loc></url>
</urlset>`;

        return new Response(emergencySitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'no-cache'
            },
            status: 500
        });
    }
}
