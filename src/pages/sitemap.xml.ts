import type { APIRoute } from 'astro';
import { generateSlug } from '../utils/slugUtils.js';
import { canonicalUrl, escapeXml, formatSitemapDate } from '../utils/seoUrl';
import serviciosSnapshot from '../data/snapshots/servicios.json';

type SitemapPage = { loc: string; priority: string; changefreq: string; lastmod?: string };

const STATIC_CONTENT_LASTMOD = '2026-07-10';

function getSnapshotServices(): Array<{ id: number; Titulo: string; slug?: string }> {
    const snapshot = serviciosSnapshot as { data?: Array<{ id: number; Titulo: string; slug?: string }> };
    return snapshot.data || [];
}

function generateSitemapXml(): string {
    const staticLastmod = formatSitemapDate(STATIC_CONTENT_LASTMOD);

    const staticPages: SitemapPage[] = [
        // Core pages
        { loc: '', priority: '1.0', changefreq: 'weekly' },
        { loc: '/servicios', priority: '0.9', changefreq: 'weekly' },
        { loc: '/cctvai', priority: '0.9', changefreq: 'weekly' },
        { loc: '/antecedentes', priority: '0.8', changefreq: 'weekly' },
        { loc: '/blog', priority: '0.8', changefreq: 'daily' },
        { loc: '/sectores', priority: '0.7', changefreq: 'monthly' },
        { loc: '/nosotros', priority: '0.6', changefreq: 'monthly' },
        { loc: '/contacto', priority: '0.7', changefreq: 'monthly' },
        { loc: '/certificaciones', priority: '0.6', changefreq: 'monthly' },
        { loc: '/plantilla-arca', priority: '0.5', changefreq: 'monthly' },
        // Sector verticals
        { loc: '/aeropuertos', priority: '0.7', changefreq: 'monthly' },
        { loc: '/bodegas', priority: '0.7', changefreq: 'monthly' },
        { loc: '/constructoras', priority: '0.7', changefreq: 'monthly' },
        { loc: '/salud', priority: '0.7', changefreq: 'monthly' },
        { loc: '/gobiernosectorpublico', priority: '0.7', changefreq: 'monthly' },
        { loc: '/software', priority: '0.7', changefreq: 'monthly' },
        { loc: '/mineria', priority: '0.7', changefreq: 'monthly' },
        { loc: '/industria', priority: '0.7', changefreq: 'monthly' },
        { loc: '/seguridad-electronica', priority: '0.7', changefreq: 'monthly' },
        // English public pages
        { loc: '/en', priority: '0.7', changefreq: 'monthly' },
        { loc: '/en/services', priority: '0.7', changefreq: 'monthly' },
        { loc: '/en/about', priority: '0.6', changefreq: 'monthly' },
        { loc: '/en/contacto', priority: '0.6', changefreq: 'monthly' },
    ];

    const servicePages: SitemapPage[] = getSnapshotServices().map((service) => ({
        loc: `/servicios/${service.id}/${service.slug || generateSlug(service.Titulo)}`,
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: staticLastmod,
    }));

    const pages = [...staticPages, ...servicePages];

    const urlEntries = pages.map(p => `
    <url>
        <loc>${escapeXml(canonicalUrl(p.loc))}</loc>
        <lastmod>${p.lastmod || staticLastmod}</lastmod>
        <changefreq>${p.changefreq}</changefreq>
        <priority>${p.priority}</priority>
    </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
}

export const GET: APIRoute = async () => {
    const sitemap = generateSitemapXml();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        },
    });
}
