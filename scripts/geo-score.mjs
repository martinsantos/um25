#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.ultimamilla.com.ar';
const DEFAULT_CANONICAL_BASE_URL = 'https://www.ultimamilla.com.ar';
const NON_CANONICAL_APEX_URL = 'https://ultimamilla.com.ar';
const FETCH_TIMEOUT_MS = Number(process.env.UM_GEO_SCORE_TIMEOUT_MS || 20000);

const GEO_SCORE_REFERENCE = 'https://github.com/zubair-trabzada/geo-seo-claude';

const CATEGORY_WEIGHTS = {
  citability: 25,
  brandAuthority: 20,
  contentQuality: 20,
  technicalFoundations: 15,
  structuredData: 10,
  platformOptimization: 10,
};

const CORE_HTML_PATHS = ['/', '/servicios', '/antecedentes', '/blog', '/contacto', '/certificaciones', '/geo'];
const ENGLISH_HTML_PATHS = ['/en', '/en/services', '/en/about', '/en/contacto'];
const GEO_COMMERCIAL_HUB_PATHS = [
  '/servicios-it-empresas-mendoza',
  '/presupuesto-servicios-it-empresas',
  '/proyectos-ingenieria-it-mendoza',
  '/servicios-it-empresas-argentina',
];
const EVIDENCE_HTML_PATHS = [
  '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces',
];
const REQUIRED_HTML_PATHS = [
  ...CORE_HTML_PATHS,
  ...ENGLISH_HTML_PATHS,
  ...GEO_COMMERCIAL_HUB_PATHS,
  ...EVIDENCE_HTML_PATHS,
];

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

const TEXT_RESOURCE_PATHS = [
  '/robots.txt',
  '/llms.txt',
  '/llms-full.txt',
  '/sitemap-index.xml',
  '/sitemap.xml',
  '/sitemap-geo.xml',
  '/sitemap-images.xml',
];

const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'];
const TARGET_TERMS = [
  'servicios it',
  'servicios informaticos',
  'servicios tecnologicos',
  'infraestructura',
  'soporte tecnico',
  'seguridad electronica',
  'mendoza',
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeBase(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function makeUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextResource(baseUrl, path) {
  const url = makeUrl(baseUrl, path);
  try {
    const response = await fetchWithTimeout(url);
    const text = await response.text().catch(() => '');
    return {
      path,
      url,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      text,
    };
  } catch (error) {
    return {
      path,
      url,
      ok: false,
      status: 0,
      contentType: '',
      text: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchJsonResource(baseUrl, path) {
  const resource = await fetchTextResource(baseUrl, path);
  if (!resource.text) return { ...resource, json: null, parseError: 'empty response' };
  try {
    return { ...resource, json: JSON.parse(resource.text), parseError: null };
  } catch (error) {
    return {
      ...resource,
      json: null,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function getAttr(tag, attr) {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return tag.match(new RegExp(`\\s${escaped}=(["'])([\\s\\S]*?)\\1`, 'i'))?.[2]?.trim() || '';
}

function textBetween(html, regex) {
  return html.match(regex)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function metaContent(html, key, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = html.match(new RegExp(`<meta[^>]+${key}=(["'])${escaped}\\1[^>]*>`, 'i'))?.[0] || '';
  return getAttr(tag, 'content');
}

function linkHref(html, rel) {
  const tag = html.match(new RegExp(`<link[^>]+rel=(["'])${rel}\\1[^>]*>`, 'i'))?.[0] || '';
  return getAttr(tag, 'href');
}

function h1s(html) {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[2].trim())
    .filter(Boolean);
}

function collectTypes(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, out);
    return out;
  }
  if (value['@type']) out.push(value['@type']);
  if (value['@graph']) collectTypes(value['@graph'], out);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') collectTypes(nested, out);
  }
  return out.flat().filter(Boolean);
}

function inspectPage(resource) {
  const html = resource.text || '';
  const parsedJsonLd = [];
  const jsonLdErrors = [];

  for (const raw of jsonLdBlocks(html)) {
    try {
      parsedJsonLd.push(JSON.parse(raw));
    } catch (error) {
      jsonLdErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    ...resource,
    title: textBetween(html, /<title>([\s\S]*?)<\/title>/i),
    description: metaContent(html, 'name', 'description'),
    language: metaContent(html, 'name', 'language'),
    dcLanguage: metaContent(html, 'name', 'dc.language'),
    robots: metaContent(html, 'name', 'robots'),
    canonical: linkHref(html, 'canonical'),
    ogImage: metaContent(html, 'property', 'og:image'),
    ogLocale: metaContent(html, 'property', 'og:locale'),
    htmlLang: html.match(/<html[^>]+lang=(["'])([^"']+)\1/i)?.[2] || '',
    h1s: h1s(html),
    bodyText: html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    jsonLdErrors,
    jsonLdTypes: collectTypes(parsedJsonLd),
  };
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function foldText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function stringifyJsonResources(snapshot) {
  return Object.values(snapshot.json).map((entry) => JSON.stringify(entry.json || {})).join('\n');
}

function addCheck(checks, points, ok, label, details = {}) {
  checks.push({
    label,
    points,
    earned: ok ? points : 0,
    ok: Boolean(ok),
    ...details,
  });
}

function buildCategory(name, checks) {
  const max = CATEGORY_WEIGHTS[name];
  const raw = checks.reduce((sum, check) => sum + check.earned, 0);
  const score = Number(clamp(raw, 0, max).toFixed(2));
  return {
    score,
    max,
    percent: Number(((score / max) * 100).toFixed(1)),
    checks,
  };
}

function scoreTechnicalFoundations(snapshot, canonicalBaseUrl) {
  const checks = [];
  const textOk = TEXT_RESOURCE_PATHS.every((path) => snapshot.text[path]?.ok);
  const noDiscoveryLeaks = [...Object.values(snapshot.text), ...Object.values(snapshot.json), ...Object.values(snapshot.pages)]
    .every((entry) => !(entry.text || '').includes(NON_CANONICAL_APEX_URL));
  const pagesOk = REQUIRED_HTML_PATHS.every((path) => snapshot.pages[path]?.ok);
  const metadataOk = REQUIRED_HTML_PATHS.every((path) => {
    const page = snapshot.pages[path];
    return page?.title && page.description.length >= 70 && page.description.length <= 170 &&
      page.canonical.startsWith(canonicalBaseUrl) && page.robots.includes('index');
  });
  const ogImagesOk = REQUIRED_HTML_PATHS.every((path) => snapshot.pages[path]?.ogImage?.startsWith(canonicalBaseUrl));
  const imageEntries = countMatches(snapshot.text['/sitemap-images.xml']?.text || '', /<image:image>/g);
  const imageSitemapOk = imageEntries >= 518 && !(snapshot.text['/sitemap-images.xml']?.text || '').includes('<image:title>');

  addCheck(checks, 3, textOk, 'Discovery resources return HTTP 2xx', { required: TEXT_RESOURCE_PATHS.length });
  addCheck(checks, 3, noDiscoveryLeaks, 'No apex/non-canonical URL leaks in discovery surfaces');
  addCheck(checks, 3, pagesOk, 'Required HTML routes return HTTP 2xx', { required: REQUIRED_HTML_PATHS.length });
  addCheck(checks, 3, metadataOk, 'Required pages expose title, description, canonical and index robots');
  addCheck(checks, 3, ogImagesOk && imageSitemapOk, 'OG images and image sitemap are canonical and complete', { imageEntries });

  return buildCategory('technicalFoundations', checks);
}

function scoreStructuredData(snapshot, canonicalBaseUrl) {
  const checks = [];
  const pageJsonOk = REQUIRED_HTML_PATHS.every((path) => {
    const page = snapshot.pages[path];
    return page && page.jsonLdErrors.length === 0 && page.jsonLdTypes.length > 0;
  });
  const hubExpectedTypes = ['WebPage', 'Service', 'FAQPage', 'ItemList', 'BreadcrumbList'];
  const hubsStructured = GEO_COMMERCIAL_HUB_PATHS.every((path) => {
    const types = snapshot.pages[path]?.jsonLdTypes || [];
    return hubExpectedTypes.every((type) => types.includes(type));
  });
  const orgStructured = CORE_HTML_PATHS.slice(0, 6).every((path) => {
    const types = snapshot.pages[path]?.jsonLdTypes || [];
    return types.includes('Organization') && types.includes('LocalBusiness');
  });
  const geoJsonContract = GEO_RESOURCE_PATHS.every((path) => {
    const json = snapshot.json[path]?.json || {};
    return json.canonicalDomain === canonicalBaseUrl && json.language === 'es-AR' && JSON.stringify(json).includes('ULTIMA MILLA');
  });
  const faqs = snapshot.json['/geo/faqs.json']?.json?.faqs || [];
  const intents = snapshot.json['/geo/buyer-intents.json']?.json?.intents || [];

  addCheck(checks, 3, pageJsonOk, 'Every scored page has parseable JSON-LD');
  addCheck(checks, 2, hubsStructured, 'Commercial GEO hubs expose WebPage, Service, FAQ, ItemList and Breadcrumb schema');
  addCheck(checks, 2, orgStructured, 'Core pages carry Organization and LocalBusiness schema');
  addCheck(checks, 2, geoJsonContract, 'GEO JSON resources carry canonicalDomain, language and brand markers');
  addCheck(checks, 1, faqs.length >= 12 && intents.length >= 3, 'FAQ and buyer-intent structured resources are populated', { faqs: faqs.length, intents: intents.length });

  return buildCategory('structuredData', checks);
}

function scorePlatformOptimization(snapshot, canonicalBaseUrl) {
  const checks = [];
  const robots = snapshot.text['/robots.txt']?.text || '';
  const llms = snapshot.text['/llms.txt']?.text || '';
  const llmsFull = snapshot.text['/llms-full.txt']?.text || '';
  const sitemapGeo = snapshot.text['/sitemap-geo.xml']?.text || '';
  const geoPage = snapshot.pages['/geo']?.text || '';

  const llmsCrossLinks = llms.includes(`${canonicalBaseUrl}/llms-full.txt`) &&
    llms.includes(`${canonicalBaseUrl}/sitemap-geo.xml`) &&
    llmsFull.includes(`${canonicalBaseUrl}/llms.txt`) &&
    llmsFull.includes(`${canonicalBaseUrl}/sitemap-geo.xml`);
  const sitemapGeoComplete = [...GEO_RESOURCE_PATHS, ...GEO_COMMERCIAL_HUB_PATHS]
    .every((path) => sitemapGeo.includes(`${canonicalBaseUrl}${path}`));
  const aiCrawlerAllow = AI_CRAWLERS.every((crawler) => {
    const section = robots.split(new RegExp(`User-agent:\\s*${crawler}`, 'i'))[1] || '';
    return robots.includes(`User-agent: ${crawler}`) && section.includes('Allow: /llms.txt') && section.includes('Allow: /geo/');
  });
  const geoIndexLinked = ['/llms.txt', '/llms-full.txt', '/geo/authority.json', '/geo/brand-facts.json']
    .every((path) => geoPage.includes(path));
  const llmsCorePages = ['/servicios', '/sectores', '/antecedentes', '/blog', '/contacto']
    .every((path) => llmsFull.includes(`${canonicalBaseUrl}${path}`));

  addCheck(checks, 2, llmsCrossLinks, 'llms.txt and llms-full.txt cross-link discovery resources');
  addCheck(checks, 2, sitemapGeoComplete, 'sitemap-geo.xml lists GEO resources and commercial hubs');
  addCheck(checks, 2, aiCrawlerAllow, 'robots.txt explicitly allows AI crawler access to GEO resources', { crawlers: AI_CRAWLERS });
  addCheck(checks, 2, geoIndexLinked, '/geo human index links machine-readable resources');
  addCheck(checks, 2, llmsCorePages, 'llms-full.txt lists core commercial/navigation pages');

  return buildCategory('platformOptimization', checks);
}

function scoreCitability(snapshot, canonicalBaseUrl) {
  const checks = [];
  const llmsFull = snapshot.text['/llms-full.txt']?.text || '';
  const cases = snapshot.json['/geo/cases.json']?.json?.cases || [];
  const imageEvidence = snapshot.json['/geo/image-evidence.json']?.json || {};
  const coverage = imageEvidence.coverage || {};
  const faqs = snapshot.json['/geo/faqs.json']?.json?.faqs || [];
  const intents = snapshot.json['/geo/buyer-intents.json']?.json?.intents || [];
  const authority = snapshot.json['/geo/authority.json']?.json || {};
  const service101 = snapshot.pages['/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces']?.text || '';

  const llmsSections = ['Brand Facts', 'Discovery', 'Commercial Hubs', 'Services', 'Sectors', 'Prioritized Cases']
    .every((section) => llmsFull.includes(section));
  const strongCaseCorpus = cases.length >= 100 && cases.every((item) => String(item.url || '').startsWith(canonicalBaseUrl));
  const imageCoverage = Number(coverage.generatedImages || 0) >= 518 &&
    Number(coverage.generatedImages || 0) === Number(coverage.totalAntecedentes || 0) &&
    Number(coverage.missingGeneratedImages || 0) === 0;
  const faqAnswers = faqs.length >= 12 && faqs.every((faq) => String(faq.answer || '').length >= 55 && String(faq.source || '').startsWith(canonicalBaseUrl));
  const buyerIntentQueries = intents.length >= 3 && intents.every((intent) => (intent.queryFamilies || []).length >= 3 && String(intent.page || '').startsWith(canonicalBaseUrl));
  const hubEvidence = (authority.canonicalHubs || []).length >= 4 &&
    (authority.canonicalHubs || []).every((hub) => (hub.evidence || []).length >= 3 && (hub.linkedServices || []).length >= 4);
  const serviceEvidence = service101.includes('Equipamiento aplicado') && countMatches(service101, /product-sheet|producto|Producto/gi) >= 8;

  addCheck(checks, 4, llmsSections, 'llms-full exposes citation-ready sections');
  addCheck(checks, 5, strongCaseCorpus, 'GEO cases expose a large canonical evidence corpus', { cases: cases.length });
  addCheck(checks, 4, imageCoverage, 'Image evidence coverage is complete and canonical', { coverage });
  addCheck(checks, 4, faqAnswers, 'FAQ answers are source-linked and self-contained', { faqs: faqs.length });
  addCheck(checks, 3, buyerIntentQueries, 'Buyer intents include query families and canonical answer pages', { intents: intents.length });
  addCheck(checks, 3, hubEvidence, 'Authority hubs link services and evidence cases');
  addCheck(checks, 2, serviceEvidence, 'Service 101 exposes applied equipment evidence');

  return buildCategory('citability', checks);
}

function scoreBrandAuthority(snapshot, canonicalBaseUrl) {
  const checks = [];
  const brandFacts = snapshot.json['/geo/brand-facts.json']?.json || {};
  const authority = snapshot.json['/geo/authority.json']?.json || {};
  const allGeoText = stringifyJsonResources(snapshot);
  const allPageText = Object.values(snapshot.pages).map((page) => page.text || '').join('\n');
  const contactPage = snapshot.pages['/contacto']?.text || '';
  const jsonLdTypes = unique(Object.values(snapshot.pages).flatMap((page) => page.jsonLdTypes || []));

  const brandFactsComplete = brandFacts.name === 'ULTIMA MILLA' &&
    brandFacts.website === canonicalBaseUrl &&
    String(brandFacts.location || '').includes('Mendoza') &&
    String(brandFacts.publicContact || '').startsWith(canonicalBaseUrl);
  const proof = brandFacts.proof || [];
  const proofSignals = Array.isArray(proof) && proof.length >= 3 && proof.join(' ').length >= 90;
  const trustSignals = (authority.trustSignals || []).length >= 5 && (authority.canonicalHubs || []).length >= 4;
  const brandConsistency = countMatches(allGeoText + allPageText, /ULTIMA MILLA/g) >= 25;
  const contactSignals = contactPage.includes('contacto') && contactPage.includes('ULTIMA MILLA') && jsonLdTypes.includes('ContactPoint');
  const noAuthorityLeaks = !allGeoText.includes(NON_CANONICAL_APEX_URL);

  addCheck(checks, 4, brandFactsComplete, 'Brand facts identify name, website, location and contact');
  addCheck(checks, 4, proofSignals, 'Institutional proof lines are present and usable');
  addCheck(checks, 4, trustSignals, 'Authority resource exposes trust signals and canonical hubs');
  addCheck(checks, 3, brandConsistency, 'Brand name is consistent across GEO and page surfaces');
  addCheck(checks, 3, contactSignals, 'Contact and ContactPoint signals are present');
  addCheck(checks, 2, noAuthorityLeaks, 'Authority resources avoid non-canonical domain leaks');

  return buildCategory('brandAuthority', checks);
}

function scoreContentQuality(snapshot) {
  const checks = [];
  const authority = snapshot.json['/geo/authority.json']?.json || {};
  const topics = snapshot.json['/geo/topics.json']?.json?.topics || [];
  const blog = snapshot.json['/geo/blog-index.json']?.json?.blog || {};
  const intents = snapshot.json['/geo/buyer-intents.json']?.json?.intents || [];
  const hubPages = GEO_COMMERCIAL_HUB_PATHS.map((path) => snapshot.pages[path]).filter(Boolean);

  const hubsComplete = (authority.canonicalHubs || []).length >= 4 &&
    (authority.canonicalHubs || []).every((hub) => (
      String(hub.buyerNeed || '').length >= 90 &&
      (hub.linkedServices || []).length >= 4 &&
      (hub.linkedSectors || []).length >= 4 &&
      (hub.evidence || []).length >= 3
    ));
  const metaReadable = REQUIRED_HTML_PATHS.every((path) => {
    const page = snapshot.pages[path];
    return page?.title.length >= 18 && page.title.length <= 75 && page.description.length >= 70 && page.description.length <= 170;
  });
  const hubBodyDepth = hubPages.length === GEO_COMMERCIAL_HUB_PATHS.length &&
    hubPages.every((page) => page.h1s.length === 1 && page.bodyText.length >= 3500);
  const vocabularyText = foldText(`${JSON.stringify(topics)} ${JSON.stringify(intents)}`);
  const targetVocabulary = TARGET_TERMS.every((term) => vocabularyText.includes(foldText(term)));
  const editorialRole = String(blog.role || '').length >= 80 && (blog.recommendedTopics || []).length >= 5;
  const decisionFrames = intents.length >= 3 && intents.every((intent) => String(intent.buyerNeed || '').length >= 80 && String(intent.decisionFrame || '').length >= 80);

  addCheck(checks, 5, hubsComplete, 'Commercial hubs include buyer need, services, sectors and evidence');
  addCheck(checks, 4, metaReadable, 'Page titles and descriptions are concise and readable');
  addCheck(checks, 3, hubBodyDepth, 'Commercial hub pages have one H1 and substantial answer content');
  addCheck(checks, 3, targetVocabulary, 'Topic and intent resources cover target business vocabulary');
  addCheck(checks, 2, editorialRole, 'Blog index defines an editorial role and recommended topics');
  addCheck(checks, 3, decisionFrames, 'Buyer intents include decision frames and buyer needs');

  return buildCategory('contentQuality', checks);
}

async function buildSnapshot(baseUrl) {
  const [textResources, jsonResources, pageResources] = await Promise.all([
    Promise.all(TEXT_RESOURCE_PATHS.map((path) => fetchTextResource(baseUrl, path))),
    Promise.all(GEO_RESOURCE_PATHS.map((path) => fetchJsonResource(baseUrl, path))),
    Promise.all(REQUIRED_HTML_PATHS.map((path) => fetchTextResource(baseUrl, path))),
  ]);

  return {
    text: Object.fromEntries(textResources.map((resource) => [resource.path, resource])),
    json: Object.fromEntries(jsonResources.map((resource) => [resource.path, resource])),
    pages: Object.fromEntries(pageResources.map((resource) => [resource.path, inspectPage(resource)])),
  };
}

function scoreSnapshot(snapshot, options = {}) {
  const canonicalBaseUrl = normalizeBase(options.canonicalBaseUrl || DEFAULT_CANONICAL_BASE_URL);
  const categories = {
    citability: scoreCitability(snapshot, canonicalBaseUrl),
    brandAuthority: scoreBrandAuthority(snapshot, canonicalBaseUrl),
    contentQuality: scoreContentQuality(snapshot, canonicalBaseUrl),
    technicalFoundations: scoreTechnicalFoundations(snapshot, canonicalBaseUrl),
    structuredData: scoreStructuredData(snapshot, canonicalBaseUrl),
    platformOptimization: scorePlatformOptimization(snapshot, canonicalBaseUrl),
  };
  const score = Number(Object.values(categories).reduce((sum, category) => sum + category.score, 0).toFixed(2));
  const failedChecks = Object.entries(categories)
    .flatMap(([category, result]) => result.checks
      .filter((check) => !check.ok)
      .map((check) => ({
        category,
        points: check.points,
        label: check.label,
        details: Object.fromEntries(Object.entries(check).filter(([key]) => !['label', 'points', 'earned', 'ok'].includes(key))),
      })))
    .sort((a, b) => b.points - a.points);

  return {
    score,
    grade: score >= 95 ? 'A' : score >= 88 ? 'B' : score >= 78 ? 'C' : score >= 65 ? 'D' : 'F',
    weights: CATEGORY_WEIGHTS,
    categories,
    failedChecks,
    stats: {
      htmlPages: Object.values(snapshot.pages).filter((page) => page.ok).length,
      geoJsonResources: Object.values(snapshot.json).filter((resource) => resource.ok && !resource.parseError).length,
      imageSitemapEntries: countMatches(snapshot.text['/sitemap-images.xml']?.text || '', /<image:image>/g),
      geoCases: snapshot.json['/geo/cases.json']?.json?.cases?.length || 0,
      geoImages: snapshot.json['/geo/image-evidence.json']?.json?.images?.length || 0,
      commercialHubs: GEO_COMMERCIAL_HUB_PATHS.length,
    },
  };
}

async function main() {
  const baseUrl = normalizeBase(argValue('--base-url', DEFAULT_BASE_URL));
  const canonicalBaseUrl = normalizeBase(argValue('--canonical-base-url', DEFAULT_CANONICAL_BASE_URL));
  const minScoreRaw = argValue('--min-score', '');
  const minScore = minScoreRaw === '' ? null : Number(minScoreRaw);
  const jsonOnly = hasFlag('--json');

  const snapshot = await buildSnapshot(baseUrl);
  const result = scoreSnapshot(snapshot, { canonicalBaseUrl });
  const payload = {
    ok: minScore === null ? true : result.score >= minScore,
    baseUrl,
    canonicalBaseUrl,
    minScore,
    methodology: {
      adaptedFrom: GEO_SCORE_REFERENCE,
      note: 'Local UMSA implementation. No external runtime dependency.',
    },
    ...result,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }

  if (minScore !== null && result.score < minScore) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
