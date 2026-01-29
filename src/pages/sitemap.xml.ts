import { getAllBlogPosts } from '../data/blog';
import type { APIRoute } from 'astro';

const SITE_URL = 'https://www.ultimamilla.com.ar';

function formatDate(date: Date): string {
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0] || '';
    return date.toISOString().split('T')[0] || '';
}

function generateSitemapXml(posts: any[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <!-- Páginas estáticas principales -->
    <url>
        <loc>${SITE_URL}</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${SITE_URL}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/nosotros</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/contacto</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    
    <!-- Nuevos Verticales y Sectores -->
    <url>
        <loc>${SITE_URL}/mineria</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/industria</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/seguridad-electronica</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/constructoras</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/bodegas</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/aeropuertos</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/salud</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/gobiernosectorpublico</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/software</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${SITE_URL}/antecedentes</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Servicios detalle -->
    <url>
        <loc>${SITE_URL}/servicios/101/infraestructura-de-redes</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/102/sistemas-de-seguridad-electronica</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/103/telecomunicaciones</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/104/desarrollo-de-software-a-medida</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/105/soporte-tecnico-24-7</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/106/consultoria-it-y-transformacion-digital</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${SITE_URL}/servicios/108/servicios-electricos-para-it</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <!-- Posts del blog -->
    ${posts.map(post => `
    <url>
        <loc>${SITE_URL}/blog/${post.slug}</loc>
        <lastmod>${formatDate(new Date(post.date || new Date()))}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        ${post.image ? `
        <image:image>
            <image:loc>${SITE_URL}${post.image}</image:loc>
            <image:title>${post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</image:title>
        </image:image>` : ''}
    </url>`).join('\n    ')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    const posts = await getAllBlogPosts();
    const sitemap = generateSitemapXml(posts);

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
