import fs from 'node:fs';
import path from 'node:path';

import generatedImageMap from '../src/data/antecedentes-generated-image-map.json';

const repoRoot = path.resolve(__dirname, '..');
const generatedMap = generatedImageMap as Record<string, string>;

describe('generated antecedentes image integration', () => {
  test('publishes generated image mappings for critical GEO evidence cases', () => {
    for (const id of ['3064', '3065', '3066', '3067', '3069']) {
      expect(generatedMap[id]).toMatch(/^\/images\/antecedentes\/generated\/lote_\d+\//);
    }
  });

  test('publishes the latest approved generated image lots', () => {
    expect(generatedMap['3374']).toContain('/lote_032/');
    expect(generatedMap['3384']).toContain('/lote_033/');
    expect(generatedMap['3393']).toContain('/lote_034/');
    expect(generatedMap['3645']).toContain('/lote_034/');
    expect(generatedMap['3672']).toContain('/lote_047/');
    expect(generatedMap['3544']).toContain('/lote_048/');
  });

  test('generated image map points to public webp assets', () => {
    expect(Object.keys(generatedMap).length).toBeGreaterThanOrEqual(480);

    const imagePaths = Object.values(generatedMap);
    expect(new Set(imagePaths).size).toBe(imagePaths.length);

    for (const imagePath of imagePaths) {
      expect(imagePath.endsWith('.webp')).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, 'public', imagePath))).toBe(true);
    }
  });

  test('public antecedente surfaces use the generated-image resolver', () => {
    const directus = fs.readFileSync(path.join(repoRoot, 'src/lib/directus.ts'), 'utf8');
    const home = fs.readFileSync(path.join(repoRoot, 'src/pages/index.astro'), 'utf8');
    const index = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedentes/index.astro'), 'utf8');
    const detail = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedentes/[id]/[slug].astro'), 'utf8');
    const sectors = fs.readFileSync(path.join(repoRoot, 'src/utils/sectoresHelpers.ts'), 'utf8');

    expect(directus).toContain('getAntecedenteImageUrl');
    expect(home).toContain('getAntecedenteImageUrl(item)');
    expect(index).toContain('getAntecedenteImageUrl(item)');
    expect(detail).toContain('getGeneratedAntecedenteImageUrl(antecedente.id)');
    expect(sectors).toContain('getAntecedenteImageUrl(item)');
  });
});
