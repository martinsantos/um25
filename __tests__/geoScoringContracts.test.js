const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

describe('GEO scoring contracts', () => {
  test('publishes a dedicated GEO scoring command', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

    expect(pkg.scripts['geo:score']).toBe('node scripts/geo-score.mjs');
  });

  test('adapts GEO-first scoring categories without adding an external runtime dependency', () => {
    const scorer = fs.readFileSync(path.join(repoRoot, 'scripts/geo-score.mjs'), 'utf8');

    expect(scorer).toContain('https://github.com/zubair-trabzada/geo-seo-claude');
    expect(scorer).toContain('citability: 25');
    expect(scorer).toContain('brandAuthority: 20');
    expect(scorer).toContain('contentQuality: 20');
    expect(scorer).toContain('technicalFoundations: 15');
    expect(scorer).toContain('structuredData: 10');
    expect(scorer).toContain('platformOptimization: 10');
    expect(scorer).toContain('No external runtime dependency');
    expect(scorer).not.toContain('from "geo-seo-claude"');
    expect(scorer).not.toContain("from 'geo-seo-claude'");
  });

  test('scores UMSA GEO surfaces, not generic SEO placeholders', () => {
    const scorer = fs.readFileSync(path.join(repoRoot, 'scripts/geo-score.mjs'), 'utf8');

    for (const route of [
      '/geo/brand-facts.json',
      '/geo/services.json',
      '/geo/cases.json',
      '/geo/image-evidence.json',
      '/geo/buyer-intents.json',
      '/llms.txt',
      '/llms-full.txt',
      '/sitemap-geo.xml',
      '/servicios-it-empresas-mendoza',
      '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces',
    ]) {
      expect(scorer).toContain(route);
    }

    expect(scorer).toContain('generatedImages');
    expect(scorer).toContain('Equipamiento aplicado');
    expect(scorer).toContain('Claude-SearchBot');
    expect(scorer).toContain('OAI-SearchBot');
  });
});
