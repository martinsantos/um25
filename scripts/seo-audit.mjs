#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.ultimamilla.com.ar';
const DEFAULT_CANONICAL_BASE_URL = 'https://www.ultimamilla.com.ar';
const NON_CANONICAL_APEX_URL = 'https://ultimamilla.com.ar';

const CORE_HTML_PATHS = ['/', '/servicios', '/antecedentes', '/blog', '/contacto', '/certificaciones'];
const GEO_COMMERCIAL_HUB_PATHS = [
  '/servicios-it-empresas-mendoza',
  '/presupuesto-servicios-it-empresas',
  '/proyectos-ingenieria-it-mendoza',
  '/servicios-it-empresas-argentina',
];
const REQUIRED_PATHS = [...CORE_HTML_PATHS, ...GEO_COMMERCIAL_HUB_PATHS];

const GEO_RESOURCE_PATHS = [
  '/geo/brand-facts.json',
  '/geo/services.json',
  '/geo/sectors.json',
  '/geo/cases.json',
  '/geo/image-evidence.json',
  '/geo/faqs.json',
  '/geo/authority.json',
  '/geo/topics.json',
  '/geo/buyer-intents.json',
  '/geo/blog-index.json',
];

const GEO_DISCOVERY_PATHS = [
  '/llms.txt',
  '/llms-full.txt',
  '/sitemap-geo.xml',
  '/sitemap-images.xml',
  ...GEO_RESOURCE_PATHS,
];

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

async function auditPage(baseUrl, canonicalBaseUrl, path, failures) {
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
  assert(canonical.startsWith(canonicalBaseUrl), `${path} canonical does not start with ${canonicalBaseUrl}: ${canonical}`, failures);
  assert(!canonical.startsWith(NON_CANONICAL_APEX_URL), `${path} canonical leaks apex domain: ${canonical}`, failures);
  assert(robots.includes('index') || path === '/404', `${path} robots meta missing index directive`, failures);
  assert(ogImage.startsWith(canonicalBaseUrl), `${path} og:image is not absolute canonical URL: ${ogImage}`, failures);
  assert(jsonLdBlocks.length > 0, `${path} missing JSON-LD`, failures);

  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      failures.push(`${path} invalid JSON-LD: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function auditSitemap(baseUrl, canonicalBaseUrl, failures) {
  const robots = await fetchText(new URL('/robots.txt', baseUrl).toString(), failures);
  assert(robots.includes(`${canonicalBaseUrl}/sitemap-index.xml`), 'robots.txt does not point to canonical sitemap-index.xml', failures);
  assert(robots.includes(`${canonicalBaseUrl}/sitemap-images.xml`), 'robots.txt does not point to canonical sitemap-images.xml', failures);
  assert(!robots.includes(NON_CANONICAL_APEX_URL), 'robots.txt leaks apex URL', failures);

  const sitemapIndex = await fetchText(new URL('/sitemap-index.xml', baseUrl).toString(), failures);
  assert(sitemapIndex.includes('<sitemapindex'), 'sitemap-index.xml missing sitemapindex root', failures);
  assert(sitemapIndex.includes(`${canonicalBaseUrl}/sitemap-images.xml`), 'sitemap-index.xml missing sitemap-images.xml', failures);
  assert(!sitemapIndex.includes(NON_CANONICAL_APEX_URL), 'sitemap-index.xml leaks apex URL', failures);

  const sitemap = await fetchText(new URL('/sitemap.xml', baseUrl).toString(), failures);
  assert(sitemap.includes('<urlset'), 'sitemap.xml missing urlset root', failures);
  assert(sitemap.includes(`${canonicalBaseUrl}/servicios`), 'sitemap.xml missing /servicios', failures);
  assert(!sitemap.includes(NON_CANONICAL_APEX_URL), 'sitemap.xml leaks apex URL', failures);

  const imageSitemap = await fetchText(new URL('/sitemap-images.xml', baseUrl).toString(), failures);
  const imageCount = (imageSitemap.match(/<image:image>/g) || []).length;
  assert(imageSitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'sitemap-images.xml missing image namespace', failures);
  assert(imageSitemap.includes('<image:loc>'), 'sitemap-images.xml missing image loc entries', failures);
  assert(imageSitemap.includes('/images/antecedentes/generated/'), 'sitemap-images.xml missing generated antecedente image paths', failures);
  assert(!imageSitemap.includes('<image:title>'), 'sitemap-images.xml still emits deprecated image:title tags', failures);
  assert(imageCount >= 500, `sitemap-images.xml exposes too few images (${imageCount})`, failures);
  assert(!imageSitemap.includes(NON_CANONICAL_APEX_URL), 'sitemap-images.xml leaks apex URL', failures);
}

async function auditGeoDiscovery(baseUrl, canonicalBaseUrl, failures) {
  const llms = await fetchText(new URL('/llms.txt', baseUrl).toString(), failures);
  const llmsFull = await fetchText(new URL('/llms-full.txt', baseUrl).toString(), failures);
  const sitemapGeo = await fetchText(new URL('/sitemap-geo.xml', baseUrl).toString(), failures);
  const canonicalPaths = [
    ...GEO_DISCOVERY_PATHS,
    ...GEO_COMMERCIAL_HUB_PATHS,
    '/servicios',
    '/sectores',
    '/antecedentes',
    '/blog',
    '/contacto',
  ];

  assert(llms.includes(`${canonicalBaseUrl}/llms-full.txt`), 'llms.txt missing llms-full discovery link', failures);
  assert(llms.includes(`${canonicalBaseUrl}/sitemap-geo.xml`), 'llms.txt missing sitemap-geo discovery link', failures);
  assert(llmsFull.includes(`${canonicalBaseUrl}/llms.txt`), 'llms-full.txt missing llms discovery link', failures);
  assert(llmsFull.includes(`${canonicalBaseUrl}/sitemap-geo.xml`), 'llms-full.txt missing sitemap-geo discovery link', failures);
  assert(sitemapGeo.includes('<urlset'), 'sitemap-geo.xml missing urlset root', failures);

  for (const canonicalPath of canonicalPaths) {
    const canonical = `${canonicalBaseUrl}${canonicalPath}`;
    if (canonicalPath !== '/llms.txt') {
      assert(llmsFull.includes(canonical), `llms-full.txt missing ${canonical}`, failures);
    }
    if (!canonicalPath.endsWith('.json') && canonicalPath !== '/sitemap-geo.xml') {
      assert(llms.includes(canonical) || canonicalPath === '/llms.txt', `llms.txt missing ${canonical}`, failures);
    }
    if (canonicalPath !== '/sitemap-geo.xml') {
      assert(sitemapGeo.includes(canonical), `sitemap-geo.xml missing ${canonical}`, failures);
    }
  }

  assert(!llms.includes(NON_CANONICAL_APEX_URL), 'llms.txt leaks apex URL', failures);
  assert(!llmsFull.includes(NON_CANONICAL_APEX_URL), 'llms-full.txt leaks apex URL', failures);
  assert(!sitemapGeo.includes(NON_CANONICAL_APEX_URL), 'sitemap-geo.xml leaks apex URL', failures);

  for (const resourcePath of GEO_RESOURCE_PATHS) {
    const body = await fetchText(new URL(resourcePath, baseUrl).toString(), failures);
    if (!body) continue;

    try {
      const payload = JSON.parse(body);
      assert(payload.canonicalDomain === canonicalBaseUrl, `${resourcePath} canonicalDomain is not ${canonicalBaseUrl}`, failures);
      assert(payload.language === 'es-AR', `${resourcePath} missing es-AR language marker`, failures);
      assert(JSON.stringify(payload).includes('ULTIMA MILLA'), `${resourcePath} missing brand signal`, failures);
      assert(!JSON.stringify(payload).includes(NON_CANONICAL_APEX_URL), `${resourcePath} leaks apex URL`, failures);
    } catch (error) {
      failures.push(`${resourcePath} invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function main() {
  const baseUrl = argValue('--base-url', DEFAULT_BASE_URL).replace(/\/$/, '');
  const canonicalBaseUrl = argValue('--canonical-base-url', DEFAULT_CANONICAL_BASE_URL).replace(/\/$/, '');
  const paths = argValue('--paths', REQUIRED_PATHS.join(',')).split(',').map((p) => p.trim()).filter(Boolean);
  const failures = [];

  await auditSitemap(baseUrl, canonicalBaseUrl, failures);
  await auditGeoDiscovery(baseUrl, canonicalBaseUrl, failures);
  for (const path of paths) {
    await auditPage(baseUrl, canonicalBaseUrl, path, failures);
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    canonicalBaseUrl,
    checked: {
      paths,
      sitemaps: 5,
      geoDiscovery: GEO_DISCOVERY_PATHS.length,
      geoHubs: GEO_COMMERCIAL_HUB_PATHS.length,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
