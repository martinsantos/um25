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

      expect(structuredData.map((node) => node['@type'])).toEqual([
        'WebPage',
        'Service',
        'ItemList',
        'FAQPage',
      ]);
      expect(serialized).toContain(`${productionDomain}/${slug}`);
      expect(serialized).not.toContain('https://ultimamilla.com.ar');
      expect(serialized).not.toContain('?skin=');
      expect(serialized).not.toContain('?template=');
    }
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
      ...expectedGeoResources.map((resource) => `/geo/${resource}.json`),
      ...expectedCommercialHubs.map((slug) => `/${slug}`),
    ]) {
      expect(auditSource).toContain(route);
    }
  });

  test('llms-full lists the discovery endpoints and core commercial indexes explicitly', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/pages/llms-full.txt.ts'), 'utf8');

    for (const route of [
      '/llms.txt',
      '/llms-full.txt',
      '/sitemap-geo.xml',
      '/servicios',
      '/sectores',
      '/antecedentes',
      '/blog',
      '/contacto',
    ]) {
      expect(source).toContain(route);
    }
  });

  test('public certification route stays discoverable through sitemap and SEO audit gates', () => {
    const footer = fs.readFileSync(path.join(repoRoot, 'src/components/v4/FooterV4.astro'), 'utf8');
    const sitemap = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap.xml.ts'), 'utf8');
    const seoAudit = fs.readFileSync(path.join(repoRoot, 'scripts/seo-audit.mjs'), 'utf8');

    expect(footer).toContain("href: '/certificaciones'");
    expect(sitemap).toContain("{ loc: '/certificaciones'");
    expect(seoAudit).toContain("'/certificaciones'");
  });
});
