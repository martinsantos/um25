import fs from 'node:fs';
import path from 'node:path';

import {
  buildGeoHubStructuredData,
  geoCommercialHubs,
  geoCommercialHubSlugs,
} from '../src/data/geoCommercialHubs';
import {
  buildGeoResource,
  geoHubRoutes,
  geoResourceNames,
} from '../src/data/geoResources';

const repoRoot = path.resolve(__dirname, '..');
const productionDomain = 'https://www.ultimamilla.com.ar';

const expectedGeoResources = [
  'brand-facts',
  'services',
  'sectors',
  'cases',
  'image-evidence',
  'faqs',
  'authority',
  'topics',
  'buyer-intents',
  'blog-index',
];

const expectedCommercialHubs = [
  'servicios-it-empresas-mendoza',
  'presupuesto-servicios-it-empresas',
  'proyectos-ingenieria-it-mendoza',
  'servicios-it-empresas-argentina',
];

describe('GEO discovery and commercial hub contracts', () => {
  test('exposes the complete GEO JSON resource set with www canonicals', () => {
    expect(geoResourceNames).toEqual(expectedGeoResources);

    for (const resourceName of expectedGeoResources) {
      const payload = buildGeoResource(resourceName) as Record<string, unknown>;

      expect(payload).toBeTruthy();
      expect(payload.canonicalDomain).toBe(productionDomain);
      expect(JSON.stringify(payload)).not.toContain('https://ultimamilla.com.ar');
    }
  });

  test('keeps every commercial GEO hub commercially complete and structured', () => {
    expect(geoCommercialHubSlugs).toEqual(expectedCommercialHubs);
    expect(geoHubRoutes.map((hub) => hub.slug)).toEqual(expectedCommercialHubs);

    for (const slug of expectedCommercialHubs) {
      const hub = geoCommercialHubs[slug];
      const structuredData = buildGeoHubStructuredData(hub);
      const serialized = JSON.stringify(structuredData);

      expect(hub.h1.length).toBeGreaterThanOrEqual(24);
      expect(hub.lead.length).toBeGreaterThanOrEqual(120);
      expect(hub.services).toHaveLength(4);
      expect(hub.sectors).toHaveLength(4);
      expect(hub.cases.length).toBeGreaterThanOrEqual(3);
      expect(hub.faqs.length).toBeGreaterThanOrEqual(3);
      expect(hub.primaryCta.length).toBeGreaterThanOrEqual(12);

      const nodeTypes = structuredData.map((node) => node['@type']);

      expect(nodeTypes).toEqual(expect.arrayContaining([
        'WebPage',
        'Service',
        'ItemList',
        'FAQPage',
        'BreadcrumbList',
      ]));
      expect(nodeTypes.filter((type) => type === 'ItemList')).toHaveLength(2);
      expect(serialized).toContain(`${productionDomain}/${slug}`);
      expect(serialized).toContain('significantLink');
      expect(serialized).toContain('hasPart');
      expect(serialized).toContain(`${productionDomain}/geo`);
      expect(serialized).toContain(`${productionDomain}/contacto`);
      expect(serialized).not.toContain('https://ultimamilla.com.ar');
      expect(serialized).not.toContain('?skin=');
      expect(serialized).not.toContain('?template=');
    }
  });

  test('GEO image evidence publishes visual coverage without invented claims', () => {
    const payload = buildGeoResource('image-evidence') as {
      coverage: { generatedImages: number; totalAntecedentes: number; missingGeneratedImages: number };
      images: Array<{ pageUrl: string; imageUrl: string; client: string | null; sector: string | null }>;
      policy: string[];
    };

    expect(payload.coverage.generatedImages).toBe(518);
    expect(payload.coverage.totalAntecedentes).toBe(518);
    expect(payload.coverage.missingGeneratedImages).toBe(0);
    expect(payload.images[0]?.pageUrl).toMatch(/^https:\/\/www\.ultimamilla\.com\.ar\/antecedentes\//);
    expect(payload.images[0]?.imageUrl).toMatch(/^https:\/\/www\.ultimamilla\.com\.ar\/images\/antecedentes\/generated\//);
    expect(payload.policy.join(' ')).toContain('No inventar nombres de clientes');
  });

  test('GEO topics include natural commercial vocabulary used by scoring', () => {
    const payload = buildGeoResource('topics') as { topics: string[] };

    expect(payload.topics).toEqual(expect.arrayContaining([
      'servicios tecnológicos para empresas',
      'servicios IT para empresas',
      'infraestructura de redes',
      'soporte técnico 24/7',
      'seguridad electrónica',
    ]));
  });

  test('commercial hub pages use the shared dossier, canonical and JSON-LD builder', () => {
    for (const slug of expectedCommercialHubs) {
      const sourcePath = path.join(repoRoot, 'src/pages', `${slug}.astro`);
      const source = fs.readFileSync(sourcePath, 'utf8');

      expect(source).toContain(`getGeoCommercialHub('${slug}')`);
      expect(source).toContain('GeoHubDossier');
      expect(source).toContain('canonical={`https://www.ultimamilla.com.ar/${hub.slug}`}');
      expect(source).toContain('structuredData={buildGeoHubStructuredData(hub)}');
    }
  });

  test('the SEO audit gate covers GEO discovery files, GEO JSON and commercial hubs', () => {
    const auditSource = fs.readFileSync(path.join(repoRoot, 'scripts/seo-audit.mjs'), 'utf8');

    for (const route of [
      '/llms.txt',
      '/llms-full.txt',
      '/sitemap-geo.xml',
      '/sitemap-images.xml',
      ...expectedGeoResources.map((resource) => `/geo/${resource}.json`),
      ...expectedCommercialHubs.map((slug) => `/${slug}`),
    ]) {
      expect(auditSource).toContain(route);
    }
  });

  test('the SEO audit gate enforces locale metadata on public English routes', () => {
    const auditSource = fs.readFileSync(path.join(repoRoot, 'scripts/seo-audit.mjs'), 'utf8');

    for (const route of ['/en', '/en/services', '/en/about', '/en/contacto']) {
      expect(auditSource).toContain(route);
    }

    expect(auditSource).toContain("htmlLang: 'en'");
    expect(auditSource).toContain("metaLanguage: 'en'");
    expect(auditSource).toContain("dcLanguage: 'en'");
    expect(auditSource).toContain("ogLocale: 'en_US'");
    expect(auditSource).toContain("attrsForMeta(html, 'property', 'og:locale')");
    expect(auditSource).toContain("attrsForMeta(html, 'name', 'dc.language')");
    expect(auditSource).toContain("attrsForMeta(html, 'name', 'language')");
  });

  test('llms-full lists the discovery endpoints and core commercial indexes explicitly', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/pages/llms-full.txt.ts'), 'utf8');

    for (const route of [
      '/llms.txt',
      '/llms-full.txt',
      '/sitemap-geo.xml',
      '/sitemap-images.xml',
      '/servicios',
      '/sectores',
      '/antecedentes',
      '/blog',
      '/contacto',
    ]) {
      expect(source).toContain(route);
    }
  });

  test('common antecedentes typo redirects to the canonical evidence archive', () => {
    const typoRedirect = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedntes.astro'), 'utf8');
    const detail = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedentes/[id]/[slug].astro'), 'utf8');
    const directusLib = fs.readFileSync(path.join(repoRoot, 'src/lib/directus.ts'), 'utf8');

    expect(typoRedirect).toContain("Astro.redirect('/antecedentes', 301)");
    expect(detail).toContain('getAntecedenteConServicios');
    expect(detail).not.toContain('loadAntecedenteFromSnapshot');
    expect(directusLib).not.toContain("import('../data/snapshots/antecedentes.json')");
    expect(directusLib).toContain('Token rechazado');
  });

  test('the GEO index and strategic graph link only published machine-readable resources', () => {
    const geoIndex = fs.readFileSync(path.join(repoRoot, 'src/pages/geo/index.astro'), 'utf8');
    const strategicGraph = fs.readFileSync(path.join(repoRoot, 'src/data/strategicLinkGraph.ts'), 'utf8');

    for (const resource of expectedGeoResources) {
      expect(geoIndex).toContain(`/geo/${resource}.json`);
    }

    expect(strategicGraph).not.toContain('/geo/discovery.json');
    expect(strategicGraph).toContain('/geo/brand-facts.json');
    expect(strategicGraph).toContain('/geo/services.json');
  });

  test('image sitemap is discoverable and uses current Google image sitemap fields', () => {
    const sitemapIndex = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap-index.xml.ts'), 'utf8');
    const robots = fs.readFileSync(path.join(repoRoot, 'src/pages/robots.txt.ts'), 'utf8');
    const imageSitemap = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap-images.xml.ts'), 'utf8');
    const antecedentesSitemap = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap-antecedentes.xml.ts'), 'utf8');
    const blogSitemap = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap-blog.xml.ts'), 'utf8');
    const casesGeo = fs.readFileSync(path.join(repoRoot, 'src/pages/geo/cases.json.ts'), 'utf8');
    const imageEvidenceGeo = fs.readFileSync(path.join(repoRoot, 'src/pages/geo/image-evidence.json.ts'), 'utf8');

    expect(sitemapIndex).toContain('/sitemap-images.xml');
    expect(robots).toContain('/sitemap-images.xml');
    expect(imageSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(imageSitemap).toContain('<image:loc>');
    expect(imageSitemap).toContain('getAntecedentesImageEvidenceEntriesFromDirectus');
    expect(antecedentesSitemap).toContain('getAllAntecedentes');
    expect(antecedentesSitemap).not.toContain('snapshots/antecedentes');
    expect(casesGeo).toContain("buildGeoResourceAsync('cases')");
    expect(imageEvidenceGeo).toContain("buildGeoResourceAsync('image-evidence')");
    expect(imageSitemap).not.toContain('<image:title>');
    expect(antecedentesSitemap).not.toContain('<image:title>');
    expect(blogSitemap).not.toContain('<image:title>');
  });

  test('public certification route stays discoverable through sitemap and SEO audit gates', () => {
    const footer = fs.readFileSync(path.join(repoRoot, 'src/components/v4/FooterV4.astro'), 'utf8');
    const sitemap = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap.xml.ts'), 'utf8');
    const seoAudit = fs.readFileSync(path.join(repoRoot, 'scripts/seo-audit.mjs'), 'utf8');

    expect(footer).toContain("href: '/certificaciones'");
    expect(sitemap).toContain("{ loc: '/certificaciones'");
    expect(seoAudit).toContain("'/certificaciones'");
  });

  test('public English pages and ARCA utility stay represented in the main sitemap', () => {
    const sitemap = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap.xml.ts'), 'utf8');

    for (const route of ['/en', '/en/services', '/en/about', '/en/contacto', '/plantilla-arca']) {
      expect(sitemap).toContain(`{ loc: '${route}'`);
    }
  });

  test('global footer exposes GEO hubs as crawlable commercial paths', () => {
    const footer = fs.readFileSync(path.join(repoRoot, 'src/components/v4/FooterV4.astro'), 'utf8');

    expect(footer).toContain('commercialHubLinkItems');
    expect(footer).toContain("title: 'Hubs GEO'");
    expect(footer).toContain("href: '/geo'");
  });
});
