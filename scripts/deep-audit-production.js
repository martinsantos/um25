
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// CONFIGURATION
const BASE_URL = 'https://ultimamilla.com.ar';
const DIRECTUS_URL = 'https://ultimamilla.com.ar/directus';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const OUTPUT_FILE = 'DEEP_AUDIT_REPORT.md';
const MAX_PAGES = 50;

const SCOPE_URLS = [
    '/',
    '/servicios',
    '/antecedentes',
    '/contacto',
    '/blog',
    '/mineria',
    '/industria',
    '/seguridad-electronica',
    '/constructoras',
    '/bodegas',
    '/aeropuertos',
    '/salud',
    '/gobiernosectorpublico',
    '/sitemap-index.xml',
    '/sitemap-antecedentes.xml'
];

const VISITED = new Set();
const QUEUE = [...SCOPE_URLS];

// Initialize Report
fs.writeFileSync(OUTPUT_FILE, `# 🕵️ Reporte de Auditoría Profunda: URLs, Imágenes y Directus\nFecha: ${new Date().toLocaleString()}\n\n`);
fs.appendFileSync(OUTPUT_FILE, `| URL | Estado | Title | Desc | Schema | Imgs Rotas |\n|---|---|---|---|---|---|\n`);

// Helper: Normalize URL
function normalizeUrl(link) {
    if (!link) return null;
    try {
        const url = new URL(link, BASE_URL);
        if (url.hostname !== new URL(BASE_URL).hostname) return null;
        return url.pathname;
    } catch {
        return null;
    }
}

// Helper: Fetch with better error handling
async function fetchWithRetry(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
        const res = await fetch(url, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'UltimaMilla-Audit-Bot/1.0' }
        });
        clearTimeout(timeout);
        return res; // streaming response
    } catch (e) {
        return { status: 'ERR', error: e.message, ok: false };
    }
}

// 1. DIRECTUS CHECK
async function checkDirectus() {
    console.log('🔍 Checking Directus Data...');
    fs.appendFileSync(OUTPUT_FILE, `\n## 1. Integridad de Directus\n\n`);
    
    try {
        const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=50&fields=id,Titulo,Imagen`, {
            headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
        });

        if (!res.ok) {
            fs.appendFileSync(OUTPUT_FILE, `- ❌ API Error: ${res.status}\n`);
            return;
        }

        const data = await res.json();
        const items = data.data || [];
        fs.appendFileSync(OUTPUT_FILE, `- Found ${items.length} antecedents to verify.\n`);

        for (const item of items) {
            if (item.Imagen) {
                 const imgUrl = item.Imagen.startsWith('http') ? item.Imagen : `${DIRECTUS_URL}/assets/${item.Imagen}`;
                 // HEAD request to check without downloading
                 try {
                     const imgRes = await fetch(imgUrl, { method: 'HEAD' });
                     if (imgRes.status !== 200) {
                         fs.appendFileSync(OUTPUT_FILE, `- ❌ Broken Image for "${item.Titulo}": ${imgRes.status}\n`);
                     }
                 } catch (e) {
                     fs.appendFileSync(OUTPUT_FILE, `- ❌ Error checking image for "${item.Titulo}": ${e.message}\n`);
                 }
            } else {
                fs.appendFileSync(OUTPUT_FILE, `- ⚠️ Missing Image for "${item.Titulo}"\n`);
            }
        }
        fs.appendFileSync(OUTPUT_FILE, `- ✅ Directus check completed.\n\n## 2. Análisis del Sitio\n\n`);

    } catch (e) {
        fs.appendFileSync(OUTPUT_FILE, `- ❌ Exception in Directus check: ${e.message}\n\n## 2. Análisis del Sitio\n\n`);
    }
}

// 2. AUDIT PAGE
async function auditPage(urlPath) {
    if (VISITED.has(urlPath)) return;
    VISITED.add(urlPath);

    const fullUrl = `${BASE_URL}${urlPath}`;
    console.log(`Scanning: ${fullUrl}`);

    try {
        const res = await fetchWithRetry(fullUrl);
        
        let status = res.status || 'ERR';
        let seo = { title: false, desc: false, schema: false };
        let brokenImgs = 0;
        let brokenList = [];

        if (status === 200) {
            // Buffer text to avoid Premature Close on stream reading
            const html = await res.text().catch(e => {
                console.error(`Error reading body of ${fullUrl}:`, e.message);
                return "";
            });

            if (urlPath.endsWith('.xml')) {
                 if (urlPath.includes('antecedentes')) {
                     const matches = html.match(/<loc>(.*?)<\/loc>/g);
                     if (matches) {
                         matches.slice(0, 10).forEach(m => {
                             const cleanUrl = m.replace(/<\/?loc>/g, '');
                             const relative = normalizeUrl(cleanUrl);
                             if (relative && !VISITED.has(relative)) QUEUE.push(relative);
                         });
                     }
                 }
            } else {
                // SEO Checks
                seo.title = /<title[^>]*>([^<]+)<\/title>/i.test(html);
                seo.desc = /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i.test(html);
                seo.schema = /application\/ld\+json/.test(html);

                // Image Checks
                const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
                let match;
                while ((match = imgRegex.exec(html)) !== null) {
                    let src = match[1];
                     // Resolve relative
                    if (!src.startsWith('http') && !src.startsWith('//')) {
                        src = `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
                    } else if (src.startsWith('//')) {
                        src = `https:${src}`;
                    }
                    
                    if (src.includes(BASE_URL) || src.includes('directus')) {
                         try {
                             const iRes = await fetch(src, { method: 'HEAD' }); // HEAD is lighter
                             if (iRes.status !== 200) {
                                 brokenImgs++;
                                 brokenList.push(`${src} (${iRes.status})`);
                             }
                         } catch (e) {
                             brokenImgs++;
                             brokenList.push(`${src} (ERR)`);
                         }
                    }
                }
            }
        }

        // WRITE ROW immediately
        const icon = status === 200 ? '✅' : '❌';
        const brokenText = brokenImgs > 0 ? `❌ ${brokenImgs}` : '✅';
        const row = `| \`${urlPath}\` | ${icon} ${status} | ${seo.title?'✅':'❌'} | ${seo.desc?'✅':'❌'} | ${seo.schema?'✅':'❌'} | ${brokenText} |\n`;
        fs.appendFileSync(OUTPUT_FILE, row);

        if (brokenList.length > 0) {
            fs.appendFileSync(OUTPUT_FILE, `<!-- Broken on ${urlPath}: ${brokenList.join(', ')} -->\n`);
        }

    } catch (e) {
        fs.appendFileSync(OUTPUT_FILE, `| \`${urlPath}\` | ❌ ERR | - | - | - | - |\n`);
        console.error(e);
    }
}

async function run() {
    await checkDirectus();
    
    let processed = 0;
    while (QUEUE.length > 0 && processed < MAX_PAGES) {
        const url = QUEUE.shift();
        await auditPage(url);
        processed++;
        await new Promise(r => setTimeout(r, 500)); // Pace requests
    }
    console.log('Done!');
}

run();
