import fs from 'node:fs';
import path from 'node:path';

import {
  caseLinkItems,
  commercialHubLinkItems,
  contactStrategicLinkGroups,
  getLegacyRedirectTarget,
  legacyRedirectEntries,
  sectorLinkItems,
  serviceLinkItems,
} from '../src/data/strategicLinkGraph';

const repoRoot = path.resolve(__dirname, '..');

describe('strategic SEO/GEO interlinking graph', () => {
  test('keeps commercial hubs, services, cases and sectors available as unique graph nodes', () => {
    expect(commercialHubLinkItems).toHaveLength(4);
    expect(serviceLinkItems.length).toBeGreaterThanOrEqual(8);
    expect(caseLinkItems.length).toBeGreaterThanOrEqual(5);
    expect(sectorLinkItems.length).toBeGreaterThanOrEqual(6);

    for (const collection of [commercialHubLinkItems, serviceLinkItems, caseLinkItems, sectorLinkItems]) {
      const hrefs = collection.map((item) => item.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      expect(collection.every((item) => item.href.startsWith('/'))).toBe(true);
      expect(collection.every((item) => item.label.length >= 4)).toBe(true);
      expect(collection.every((item) => item.summary.length >= 28)).toBe(true);
    }
  });

  test('contact page exposes a balanced visible interlinking surface', () => {
    expect(contactStrategicLinkGroups.map((group) => group.title)).toEqual([
      'Rutas comerciales',
      'Capacidades conectadas',
      'Evidencia verificable',
      'Sectores criticos',
    ]);

    const kinds = new Set(contactStrategicLinkGroups.flatMap((group) => group.items.map((item) => item.kind)));

    expect(kinds).toEqual(new Set(['geoHub', 'service', 'case', 'sector']));
  });

  test('legacy commercial URLs resolve to precise canonical destinations', () => {
    expect(legacyRedirectEntries.length).toBeGreaterThanOrEqual(10);
    expect(getLegacyRedirectTarget('about')).toBe('/nosotros');
    expect(getLegacyRedirectTarget('/about/')).toBe('/nosotros');
    expect(getLegacyRedirectTarget('servicios-it-mendoza')).toBe('/servicios-it-empresas-mendoza');
    expect(getLegacyRedirectTarget('presupuesto-it')).toBe('/presupuesto-servicios-it-empresas');
    expect(getLegacyRedirectTarget('index-corporate-restored')).toBe('/');
    expect(getLegacyRedirectTarget('unknown-sector')).toBeUndefined();
  });

  test('routing and visible pages consume the strategic graph', () => {
    const dynamicSectorRoute = fs.readFileSync(path.join(repoRoot, 'src/pages/[sector].astro'), 'utf8');
    const contactPage = fs.readFileSync(path.join(repoRoot, 'src/pages/contacto.astro'), 'utf8');
    const geoHubDossier = fs.readFileSync(path.join(repoRoot, 'src/components/templates/GeoHubDossier.astro'), 'utf8');

    expect(dynamicSectorRoute).toContain('getLegacyRedirectTarget');
    expect(contactPage).toContain('IntentLinkGraph');
    expect(contactPage).toContain('contactStrategicLinkGroups');
    expect(contactPage).toContain('significantLink');
    expect(geoHubDossier).toContain('siblingCommercialHubItems');
    expect(geoHubDossier).toContain('geo-dossier-link-graph');
  });
});
