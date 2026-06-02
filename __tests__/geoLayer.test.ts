import fs from 'fs';
import path from 'path';

import {
  AI_CRAWLERS,
  generateLlmsTxt,
  generateLlmsFullTxt,
  getAuthorityHubs,
  getBrandFacts,
  getBuyerIntents,
  getGeoCases,
  getGeoServices,
  getGeoSectors,
  getGeoSitemapUrls,
  getGeoTopics,
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
    const staticRobots = fs.readFileSync(path.join(repoRoot, 'public/robots.txt'), 'utf8');
    const geoUrls = getGeoSitemapUrls().map((entry) => entry.loc);

    expect(sitemapIndex).toContain('/sitemap-geo.xml');
    expect(robots).toContain('LLMs:');
    expect(robots).toContain('GEO-Knowledge:');
    expect(robots).toContain('GEO-Authority:');
    expect(staticRobots).toContain('LLMs:');
    expect(staticRobots).toContain('GEO-Knowledge:');
    expect(staticRobots).toContain('GEO-Authority:');
    expect(staticRobots).toContain('Sitemap: https://ultimamilla.com.ar/sitemap-geo.xml');
    expect(AI_CRAWLERS).toEqual(expect.arrayContaining(['GPTBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot']));
    expect(staticRobots).toContain('Claude-SearchBot');
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
      'src/pages/geo/authority.json.ts',
      'src/pages/geo/topics.json.ts',
      'src/pages/geo/buyer-intents.json.ts',
      'src/pages/geo/blog-index.json.ts',
      'src/pages/geo/services.json.ts',
      'src/pages/geo/sectors.json.ts',
      'src/pages/geo/cases.json.ts',
      'src/pages/geo/faqs.json.ts',
      'src/pages/geo/index.astro',
      'src/pages/servicios-it-empresas-mendoza.astro',
      'src/pages/presupuesto-servicios-it-empresas.astro',
      'src/pages/proyectos-ingenieria-it-mendoza.astro',
      'src/pages/servicios-it-empresas-argentina.astro',
    ].forEach((relativePath) => {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    });
  });

  test('models authority hubs, buyer intents and topic clusters for enterprise IT searches', () => {
    const hubs = getAuthorityHubs();
    const intents = getBuyerIntents();
    const topics = getGeoTopics();
    const full = generateLlmsFullTxt();
    const allHubQueries = hubs.flatMap((hub) => hub.primaryQueries);

    expect(hubs.map((hub) => hub.slug)).toEqual(expect.arrayContaining([
      'servicios-it-empresas-mendoza',
      'presupuesto-servicios-it-empresas',
      'proyectos-ingenieria-it-mendoza',
      'servicios-it-empresas-argentina',
    ]));
    expect(intents.map((intent) => intent.slug)).toEqual(expect.arrayContaining([
      'presupuestos-proyectos-it',
      'servicios-it-empresas',
      'verticales-sectoriales',
    ]));
    expect(topics.map((topic) => topic.slug)).toEqual(expect.arrayContaining([
      'servicios-it-empresariales',
      'ingenieria-tecnologica',
      'presupuestos-it',
    ]));
    expect(hubs[0]?.budgetPolicy.currency).toBe('USD/ARS');
    expect(hubs[0]?.evidenceMode).toContain('casos publicos');
    expect(full).toContain('GEO Authority Layer');
    expect(full).toContain('presupuestos orientativos');
    expect(full).toContain('Mendoza -> Argentina -> Latinoamerica');
    expect(full).toContain('IT = tecnologia informatica empresarial');
    expect(full).toContain('servicios informaticos para empresas');
    expect(full).toContain('empresa de sistemas');
    expect(allHubQueries).toEqual(expect.arrayContaining([
      'servicios informaticos para empresas Mendoza',
      'empresa de sistemas Mendoza',
      'presupuesto tecnologia para empresas',
      'proveedor de soporte tecnico empresarial Argentina',
    ]));
  });

  test('includes authority resources and hubs in GEO discovery surfaces', () => {
    const brandFacts = getBrandFacts();
    const geoUrls = getGeoSitemapUrls().map((entry) => entry.loc);

    expect(brandFacts.discoveryResources).toEqual(expect.arrayContaining([
      'https://ultimamilla.com.ar/geo/authority.json',
      'https://ultimamilla.com.ar/geo/topics.json',
      'https://ultimamilla.com.ar/geo/buyer-intents.json',
      'https://ultimamilla.com.ar/geo/blog-index.json',
    ]));
    expect(geoUrls).toEqual(expect.arrayContaining([
      'https://ultimamilla.com.ar/servicios-it-empresas-mendoza',
      'https://ultimamilla.com.ar/presupuesto-servicios-it-empresas',
      'https://ultimamilla.com.ar/proyectos-ingenieria-it-mendoza',
      'https://ultimamilla.com.ar/servicios-it-empresas-argentina',
      'https://ultimamilla.com.ar/geo',
      'https://ultimamilla.com.ar/geo/authority.json',
    ]));
  });

  test('desambiguates IT with natural business search vocabulary', () => {
    const brandFacts = getBrandFacts();

    expect(brandFacts.authority.searchVocabulary.primaryTerms).toEqual(expect.arrayContaining([
      'servicios tecnologicos para empresas',
      'servicios informaticos para empresas',
      'servicios IT para empresas',
      'empresa de sistemas',
      'soporte tecnico empresarial',
      'proveedor tecnologico empresarial',
    ]));
    expect(generateLlmsTxt()).toContain('servicios IT para empresas');
    expect(brandFacts.authority.searchVocabulary.disambiguation).toContain('IT = tecnologia informatica empresarial');
    expect(brandFacts.authority.searchVocabulary.technicalTerms).toEqual(expect.arrayContaining([
      'infraestructura IT',
      'consultoria IT',
    ]));
  });

  test('publishes a human-readable GEO landing page for AI search crawlers', () => {
    const geoPage = fs.readFileSync(path.join(repoRoot, 'src/pages/geo/index.astro'), 'utf8');

    expect(geoPage).toContain('Centro GEO para asistentes y buscadores IA');
    expect(geoPage).toContain('/llms.txt');
    expect(geoPage).toContain('/llms-full.txt');
    expect(geoPage).toContain('/geo/authority.json');
    expect(geoPage).toContain('/geo/brand-facts.json');
    expect(geoPage).toContain('/servicios-it-empresas-mendoza');
    expect(geoPage).toContain('OAI-SearchBot');
    expect(geoPage).toContain('Claude-SearchBot');
    expect(geoPage).toContain('servicios informaticos para empresas');
  });

  test('keeps the shared footer crawler-friendly on GEO pages', () => {
    const footer = fs.readFileSync(path.join(repoRoot, 'src/components/v4/FooterV4.astro'), 'utf8');

    expect(footer).toContain('href="/contacto"');
    expect(footer).not.toContain('href="mailto:contacto@ultimamilla.com.ar"');
  });
});
