import fs from 'fs';
import path from 'path';

import {
  AI_CRAWLERS,
  generateLlmsTxt,
  generateLlmsFullTxt,
  getBrandFacts,
  getGeoCases,
  getGeoServices,
  getGeoSectors,
  getGeoSitemapUrls,
} from '../src/data/geoKnowledge';

const repoRoot = process.cwd();

describe('GEO layer', () => {
  test('generates llms discovery documents with canonical GEO resources', () => {
    const llms = generateLlmsTxt();
    const full = generateLlmsFullTxt();

    expect(llms).toContain('# ULTIMA MILLA');
    expect(llms).toContain('https://ultimamilla.com.ar/llms-full.txt');
    expect(llms).toContain('https://ultimamilla.com.ar/geo/brand-facts.json');
    expect(full).toContain('GEO Knowledge Base');
    expect(full).toContain('Servicios oficiales');
    expect(full).toContain('Evidencia publica');
  });

  test('exposes brand facts, services, sectors and cases as structured data', () => {
    const brandFacts = getBrandFacts();
    const services = getGeoServices();
    const sectors = getGeoSectors();
    const cases = getGeoCases();

    expect(brandFacts.canonicalDomain).toBe('https://ultimamilla.com.ar');
    expect(brandFacts.legalName).toBe('ULTIMA MILLA S.A.');
    expect(services.length).toBeGreaterThanOrEqual(8);
    expect(services[0]?.url).toMatch(/^https:\/\/ultimamilla\.com\.ar\/servicios\/\d+\//);
    expect(sectors.map((sector) => sector.slug)).toEqual(expect.arrayContaining(['bodegas', 'salud', 'software']));
    expect(cases.length).toBeGreaterThan(100);
    expect(cases[0]?.url).toMatch(/^https:\/\/ultimamilla\.com\.ar\/antecedentes\/\d+\//);
  });

  test('adds GEO URLs to sitemap and robots discovery', () => {
    const sitemapIndex = fs.readFileSync(path.join(repoRoot, 'src/pages/sitemap-index.xml.ts'), 'utf8');
    const robots = fs.readFileSync(path.join(repoRoot, 'src/pages/robots.txt.ts'), 'utf8');
    const geoUrls = getGeoSitemapUrls().map((entry) => entry.loc);

    expect(sitemapIndex).toContain('/sitemap-geo.xml');
    expect(robots).toContain('LLMs:');
    expect(robots).toContain('GEO-Knowledge:');
    expect(AI_CRAWLERS).toEqual(expect.arrayContaining(['GPTBot', 'ClaudeBot', 'PerplexityBot']));
    expect(geoUrls).toEqual(expect.arrayContaining([
      'https://ultimamilla.com.ar/llms.txt',
      'https://ultimamilla.com.ar/geo/services.json',
      'https://ultimamilla.com.ar/sitemap-geo.xml',
    ]));
  });

  test('registers GEO resources as Astro routes', () => {
    [
      'src/pages/llms.txt.ts',
      'src/pages/llms-full.txt.ts',
      'src/pages/sitemap-geo.xml.ts',
      'src/pages/geo/brand-facts.json.ts',
      'src/pages/geo/services.json.ts',
      'src/pages/geo/sectors.json.ts',
      'src/pages/geo/cases.json.ts',
      'src/pages/geo/faqs.json.ts',
    ].forEach((relativePath) => {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    });
  });
});
