import { fetch } from 'undici'; // Using built-in fetch or undici if available in env, assuming node 18+ has fetch
import fs from 'fs';
import path from 'path';

const START_URL = 'https://ultimamilla.com.ar';
const MAX_CONCURRENCY = 5;
const MAX_PAGES = 1000; // Safety limit
const USER_AGENT = 'UltimaMillaHealthCheck/1.0';

const queue = [START_URL];
const visited = new Set();
const brokenLinks = [];
const externalLinksChecked = new Set();
let activeRequests = 0;
let pagesProcessed = 0;

console.log(`[HEALTH] Starting crawl of ${START_URL}...`);

// Simple delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processQueue() {
    if (Date.now() % 5000 < 100) console.log(`[HEALTH] Progress: Visited ${visited.size}, Queue ${queue.length}, Broken ${brokenLinks.length}`);

    while (activeRequests < MAX_CONCURRENCY && queue.length > 0 && visited.size < MAX_PAGES) {
        const url = queue.shift();
        if (visited.has(url)) continue;

        activeRequests++;
        visited.add(url);
        
        crawlPage(url).finally(() => {
            activeRequests--;
            processQueue(); // recurs
        });
    }

    if (activeRequests === 0 && queue.length === 0) {
        console.log('[HEALTH] Crawl complete.');
        report();
    }
}

async function crawlPage(url) {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!res.ok) {
            brokenLinks.push({ url, status: res.status, referrer: 'Crawl Queue' });
            // console.log(`[FAIL] ${res.status} - ${url}`);
            return;
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            return; // Don't parse non-html
        }

        const text = await res.text();
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']/gi;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            let href = match[1];
            try {
                // Resolve relative URLs
                const absoluteUrl = new URL(href, url).href;

                // Remove hash
                const cleanUrl = absoluteUrl.split('#')[0];

                if (cleanUrl.startsWith(START_URL)) {
                    // Internal Link
                    if (!visited.has(cleanUrl) && !queue.includes(cleanUrl)) {
                        queue.push(cleanUrl);
                    }
                } else if (!externalLinksChecked.has(cleanUrl)) {
                    // External Link - just check status head once?
                    // For now, let's skip external deep crawl to focus on site health
                    // Maybe queue for a HEAD check separate?
                }
                
                // Also check for images? 
                // We really want to check image assets too.
            } catch (e) {
                // Invalid URL ignore
            }
        }
        
        // Check Images
        const imgRegex = /<img\s+(?:[^>]*?\s+)?src=["']([^"']*)["']/gi;
        while ((match = imgRegex.exec(text)) !== null) {
             let src = match[1];
             try {
                 const absSrc = new URL(src, url).href;
                 if (absSrc.startsWith(START_URL)) {
                     // Verify image existence (separate simple check)
                     checkAsset(absSrc, url);
                 }
             } catch(e) {}
        }

    } catch (e) {
        brokenLinks.push({ url, status: 'Error: ' + e.message, referrer: 'Crawl Queue' });
    }
}

async function checkAsset(url, referrer) {
    // Optimization: Don't re-check assets we know are good/bad?
    // For this simple script, we might spam a bit, but that's okay for < 1000 items.
    // Better: use a cache.
    if (visited.has(url)) return; 
    
    // We don't verify every single asset in this loop to avoid blocking main thread, 
    // but in a real recursion we would. 
    // Let's do a quick HEAD.
    visited.add(url); // Mark as likely visited/checked
    try {
        const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) {
             brokenLinks.push({ url, status: res.status, referrer });
             console.log(`[IMG 404] ${url} (on ${referrer})`);
        }
    } catch (e) {
        brokenLinks.push({ url, status: 'Net Error', referrer });
    }
}

function report() {
    console.log('\n====== SITE HEALTH REPORT ======');
    console.log(`Total URLs visited: ${visited.size}`);
    console.log(`Broken Links found: ${brokenLinks.length}`);
    
    if (brokenLinks.length > 0) {
        console.table(brokenLinks);
        
        // Write to file
        const reportText = JSON.stringify(brokenLinks, null, 2);
        fs.writeFileSync('health_check_report.json', reportText);
        console.log('Saved detailed report to health_check_report.json');
    } else {
        console.log('✅ No broken links found!');
    }
    process.exit(0);
}

// Kickoff
processQueue();
