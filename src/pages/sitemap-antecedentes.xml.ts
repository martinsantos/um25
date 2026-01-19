import type { APIRoute } from 'astro';

// Use environment variable or fallback
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL as string) || (import.meta.env.SITE as string) || 'https://ultimamilla.com.ar';

function formatDate(date: Date): string {
    const isoString = date.toISOString();
    const parts = isoString.split('T');
    return parts[0] ?? new Date().toISOString().split('T')[0];
}

import { generateSlug } from '../utils/slugUtils';
import fallbackData from '../data/directus_fallback_offline.json';

function generateSitemapXml(antecedentes: any[]): string {
    const today = formatDate(new Date());
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${antecedentes.map(item => {
        const slug = generateSlug(item.Titulo || item.titulo || 'antecedente');
        const id = item.id || item.ID || 'unknown';
        return `
    <url>
        <loc>${SITE_URL}/antecedentes/${id}/${slug}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.7</priority>
    </url>`;
    }).join('')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    try {
        // Use internal Directus URL for server-side API calls (has proper auth)
        // Improved fallback chain to include PUBLIC_ variables and the known production URL
        const directusUrl = (import.meta.env.DIRECTUS_URL as string) || 
                          (import.meta.env.PUBLIC_DIRECTUS_URL as string) || 
                          'https://admin.ultimamilla.com.ar' || 
                          'http://localhost:8055';

        const token = (import.meta.env.DIRECTUS_STATIC_TOKEN as string) || 
                     (import.meta.env.DIRECTUS_TOKEN as string) || 
                     (import.meta.env.PUBLIC_DIRECTUS_TOKEN as string) || 
                     'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
        
        console.log(`[SITEMAP] Fetching antecedents from: ${directusUrl}`);

        const response = await fetch(
            `${directusUrl}/items/Antecedentes?limit=1000&fields=id,Titulo,Fecha&status=published`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let antecedentes = [];
        
        if (response.ok) {
            const data = await response.json();
            antecedentes = data.data || [];
            console.log(`[SITEMAP] Successfully fetched ${antecedentes.length} antecedents`);
        } else {
            // Fallback: usar datos sincronizados si Directus no está disponible
            console.error(`[SITEMAP] Directus fetch failed: ${response.status} ${response.statusText}`);
            console.warn('Directus no disponible, usando datos de respaldo sincronizados');
            
            antecedentes = fallbackData.antecedentes || [];
        }

        const sitemap = generateSitemapXml(antecedentes);

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400'
                // REMOVED X-Robots-Tag: noindex to allow indexing
            },
        });
    } catch (error) {
        console.error('Error generando sitemap de antecedentes:', error);
        
        // Retornar sitemap mínimo en caso de error
        const minimalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${SITE_URL}/antecedentes</loc>
        <lastmod>${formatDate(new Date())}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
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
