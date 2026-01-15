import type { APIRoute } from 'astro';

// Use environment variable or fallback
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL as string) || (import.meta.env.SITE as string) || 'https://ultimamilla.com.ar';

function formatDate(date: Date): string {
    const isoString = date.toISOString();
    const parts = isoString.split('T');
    return parts[0] ?? new Date().toISOString().split('T')[0];
}

// Función para generar slug desde nombre
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100); // Increased from 75 to 100 chars for better SEO
}

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
        const directusUrl = (import.meta.env.DIRECTUS_URL as string) || 'http://localhost:8055';
        const token = (import.meta.env as any)['DIRECTUS_STATIC_TOKEN'] || (import.meta.env as any)['DIRECTUS_TOKEN'] || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
        
        const response = await fetch(
            `${directusUrl}/items/Antecedentes?limit=600&fields=id,Titulo`,
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
        } else {
            // Fallback: usar datos estáticos si Directus no está disponible
            console.error(`[SITEMAP] Directus fetch failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text().catch(() => 'no body');
            console.error(`[SITEMAP] Error body:`, errorText);
            console.warn('Directus no disponible, usando datos estáticos');
            antecedentes = [
                { id: 10768, Titulo: 'ISI Solutions - Redes y Comunicaciones' },
                { id: 10769, Titulo: 'Ministerio de Deportes Gobierno de Mendoza - Redes y' },
                { id: 10770, Titulo: 'TelecombTW SA - Redes y Comunicaciones' }
            ];
        }

        const sitemap = generateSitemapXml(antecedentes);

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400',
                'X-Robots-Tag': 'noindex'
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
