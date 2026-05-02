#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://ultimamilla.com.ar';
const REQUIRED_PATHS = ['/', '/servicios', '/antecedentes', '/blog', '/contacto'];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function textBetween(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function attrsForMeta(html, attr, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]*>`, 'i');
  return html.match(pattern)?.[0] || '';
}

function contentFromTag(tag) {
  return tag.match(/\scontent=["']([^"']+)["']/i)?.[1] || '';
}

async function fetchText(url, failures) {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    assert(response.ok, `${url} returned ${response.status}`, failures);
    return response.text();
  } catch (error) {
    failures.push(`${url} fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}

async function auditPage(baseUrl, path, failures) {
  const url = new URL(path, baseUrl).toString();
  const html = await fetchText(url, failures);
  if (!html) return;

  const title = textBetween(html, /<title>([^<]+)<\/title>/i);
  const description = contentFromTag(attrsForMeta(html, 'name', 'description'));
  const robots = contentFromTag(attrsForMeta(html, 'name', 'robots'));
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  assert(title.length > 0, `${path} missing <title>`, failures);
  assert(title.length <= 75, `${path} title too long (${title.length})`, failures);
  assert(description.length >= 70, `${path} meta description too short (${description.length})`, failures);
  assert(description.length <= 170, `${path} meta description too long (${description.length})`, failures);
  assert(canonical.startsWith(baseUrl), `${path} canonical does not start with ${baseUrl}: ${canonical}`, failures);
  assert(!canonical.includes('://www.'), `${path} canonical leaks www: ${canonical}`, failures);
  assert(robots.includes('index') || path === '/404', `${path} robots meta missing index directive`, failures);
  assert(ogImage.startsWith(baseUrl), `${path} og:image is not absolute canonical URL: ${ogImage}`, failures);
  assert(jsonLdBlocks.length > 0, `${path} missing JSON-LD`, failures);

  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      failures.push(`${path} invalid JSON-LD: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function auditSitemap(baseUrl, failures) {
  const robots = await fetchText(new URL('/robots.txt', baseUrl).toString(), failures);
  assert(robots.includes(`${baseUrl}/sitemap-index.xml`), 'robots.txt does not point to canonical sitemap-index.xml', failures);
  assert(!robots.includes('https://www.'), 'robots.txt leaks www URL', failures);

  const sitemapIndex = await fetchText(new URL('/sitemap-index.xml', baseUrl).toString(), failures);
  assert(sitemapIndex.includes('<sitemapindex'), 'sitemap-index.xml missing sitemapindex root', failures);
  assert(!sitemapIndex.includes('https://www.'), 'sitemap-index.xml leaks www URL', failures);

  const sitemap = await fetchText(new URL('/sitemap.xml', baseUrl).toString(), failures);
  assert(sitemap.includes('<urlset'), 'sitemap.xml missing urlset root', failures);
  assert(sitemap.includes(`${baseUrl}/servicios`), 'sitemap.xml missing /servicios', failures);
  assert(!sitemap.includes('https://www.'), 'sitemap.xml leaks www URL', failures);
}

async function main() {
  const baseUrl = argValue('--base-url', DEFAULT_BASE_URL).replace(/\/$/, '');
  const paths = argValue('--paths', REQUIRED_PATHS.join(',')).split(',').map((p) => p.trim()).filter(Boolean);
  const failures = [];

  await auditSitemap(baseUrl, failures);
  for (const path of paths) {
    await auditPage(baseUrl, path, failures);
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, baseUrl, checked: { paths, sitemaps: 3 } }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
