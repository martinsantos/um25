
import fs from 'fs';
import path from 'path';

// CONFIGURATION
const BASE_URL = 'http://localhost:4321';
const DOMAIN = 'ultimamilla.com.ar';
const ANALYTICS_ID = 'G-S2376K1GED';
const OUTPUT_FILE = 'SITE_AUDIT_REPORT.md';

const VISITED = new Set();
const RESULTS = [];
const QUEUE = ['/'];

// HELPER: Normalize URL
function normalizeUrl(link, currentPath) {
    if (!link) return null;
    if (link.startsWith('http')) {
        if (link.includes('localhost:4321') || link.includes(DOMAIN)) {
             return new URL(link).pathname;
        }
        return link; // External
    }
    if (link.startsWith('/')) return link;
    if (link.startsWith('#')) return null;
    if (link.startsWith('mailto:')) return null;
    if (link.startsWith('tel:')) return null;
    
    // Relative path resolution
    const currentDir = path.dirname(currentPath);
    return path.join(currentDir, link);
}

// HELPER: Fetch with Timeout
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

// MAIN AUDIT FUNCTION
async function auditPage(urlPath) {
    if (VISITED.has(urlPath)) return;
    VISITED.add(urlPath);
    
    const fullUrl = `${BASE_URL}${urlPath}`;
    console.log(`Scanning: ${fullUrl}`);

    const result = {
        url: urlPath,
        status: 0,
        seo: { title: false, desc: false, canonical: false, og: false },
        analytics: false,
        images: [],
        brokenLinks: [],
        errors: []
    };

    try {
        const res = await fetchWithTimeout(fullUrl);
        result.status = res.status;
        
        if (res.status !== 200) {
            result.errors.push(`HTTP Status ${res.status}`);
            RESULTS.push(result);
            return;
        }

        const html = await res.text();

        // 1. SEO CHECKS (Regex)
        result.seo.title = /<title[^>]*>([^<]+)<\/title>/i.test(html);
        result.seo.desc = /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i.test(html);
        result.seo.canonical = /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']/i.test(html);
        result.seo.og = /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']/i.test(html);

        // 2. ANALYTICS CHECK
        if (html.includes(ANALYTICS_ID)) result.analytics = true;

        // 3. IMAGE CHECKS
        const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            const src = match[1];
            const hasAlt = /alt=["']([^"']+)["']/i.test(match[0]);
            
            const imgData = { src, hasAlt, status: 0 };
            
            // Verify Image Availability
            try {
                const imgUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
                const imgRes = await fetchWithTimeout(imgUrl, 3000);
                imgData.status = imgRes.status;
            } catch (e) {
                imgData.status = 'ERR';
            }
            
            result.images.push(imgData);
        }

        // 4. LINK DISCOVERY & CHECK (Simple)
        const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
        while ((match = linkRegex.exec(html)) !== null) {
            const href = match[1];
            const normalized = normalizeUrl(href, urlPath);
            
            if (normalized) {
                if (normalized.startsWith('http')) {
                    // External Link - Do not follow, maybe verify? Skipping for speed in this pass.
                } else {
                    // Internal Link
                    if (!VISITED.has(normalized) && !QUEUE.includes(normalized)) {
                        QUEUE.push(normalized);
                    }
                }
            }
        }

    } catch (e) {
        result.errors.push(`Fetch Error: ${e.message}`);
    }

    RESULTS.push(result);
}

// RUNNER
async function run() {
    console.log('Starting Deep Site Audit...');
    
    while (QUEUE.length > 0) {
        const url = QUEUE.shift();
        await auditPage(url);
    }

    // GENERATE REPORT
    console.log('Generating Report...');
    const reportLines = [];
    reportLines.push('# Comprehensive Site Audit Report');
    reportLines.push(`Timestamp: ${new Date().toISOString()}`);
    reportLines.push(`Total Pages Scanned: ${RESULTS.length}`);
    reportLines.push('');

    // Table of Contents
    reportLines.push('## Summary Table');
    reportLines.push('| URL | Status | Title | Desc | Analytics | Images (Broken) |');
    reportLines.push('|---|---|---|---|---|---|');

    for (const r of RESULTS) {
        const brokenImgs = r.images.filter(i => i.status !== 200).length;
        reportLines.push(`| \`${r.url}\` | ${r.status === 200 ? '✅ 200' : '❌ ' + r.status} | ${r.seo.title ? '✅' : '❌'} | ${r.seo.desc ? '✅' : '❌'} | ${r.analytics ? '✅' : '❌'} | ${brokenImgs > 0 ? '❌ ' + brokenImgs : '✅'} |`);
    }

    reportLines.push('');
    reportLines.push('## Detailed Issues');

    for (const r of RESULTS) {
        const issues = [];
        if (r.status !== 200) issues.push(`- Status: ${r.status}`);
        if (!r.seo.title) issues.push(`- Missing <title>`);
        if (!r.seo.desc) issues.push(`- Missing Meta Description`);
        if (!r.seo.canonical) issues.push(`- Missing Canonical URL`);
        if (!r.seo.og) issues.push(`- Missing OG Image`);
        if (!r.analytics) issues.push(`- Missing Analytics Tag (${ANALYTICS_ID})`);
        
        const brokenImgs = r.images.filter(i => i.status !== 200);
        brokenImgs.forEach(img => issues.push(`- Broken Image: ${img.src} (Status: ${img.status})`));
        
        const missingAlts = r.images.filter(i => !i.hasAlt);
        missingAlts.forEach(img => issues.push(`- Missing Alt Text: ${img.src}`));

        if (issues.length > 0) {
            reportLines.push(`### ${r.url}`);
            issues.forEach(i => reportLines.push(i));
            reportLines.push('');
        }
    }

    fs.writeFileSync(OUTPUT_FILE, reportLines.join('\n'));
    console.log(`Report written to ${OUTPUT_FILE}`);
}

run();
