import { getAllBlogPosts } from '../data/blog';
import type { APIRoute } from 'astro';

const SITE_URL = 'https://ultimamilla.com';

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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

    <!-- Posts del blog -->
    ${posts.map(post => `
    <url>
        <loc>${SITE_URL}/blog/${post.slug}</loc>
        <lastmod>${formatDate(new Date(post.date))}</lastmod>
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
    const posts = getAllPosts();
    const sitemap = generateSitemapXml(posts);

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
