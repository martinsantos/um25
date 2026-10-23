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
    expect(generatedMap['3553']).toContain('/lote_049/');
    expect(generatedMap['3673']).toContain('/lote_050/');
    expect(generatedMap['3573']).toContain('/lote_051/');
    expect(generatedMap['3674']).toContain('/lote_052/');
  });

  test('generated image map points to public webp assets', () => {
    expect(Object.keys(generatedMap).length).toBe(518);

    const imagePaths = Object.values(generatedMap);
    expect(new Set(imagePaths).size).toBe(imagePaths.length);

    for (const imagePath of imagePaths) {
      expect(imagePath.endsWith('.webp')).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, 'public', imagePath))).toBe(true);
    }
  });

  test('public antecedente surfaces use Blender posters, never generated images', () => {
    const directus = fs.readFileSync(path.join(repoRoot, 'src/lib/directus.ts'), 'utf8');
    const home = fs.readFileSync(path.join(repoRoot, 'src/pages/index.astro'), 'utf8');
    const index = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedentes/index.astro'), 'utf8');
    const detail = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedentes/[id]/[slug].astro'), 'utf8');
    const evidence = fs.readFileSync(path.join(repoRoot, 'src/utils/antecedentesImageEvidence.ts'), 'utf8');

    expect(directus).toContain('posterForAntecedente(id)');
    expect(home).toContain('ANTECEDENTES_REALES');
    for (const source of [directus, home, index, detail, evidence]) {
      expect(source).not.toMatch(/antecedentes\/generated\/|antecedentes\/curadas\/|umsa-about-engineering|antecedentes-generated-image-map/);
    }
    // La ficha no muestra la galería de Directus (eran imágenes generadas).
    expect(detail).not.toContain('case-gallery-grid">');
    expect(detail).toContain('const mainImageUrl = generatedMainImageUrl || BASE_POSTER');
  });

  test('every catalog case resolves to an existing poster of its sector and service', async () => {
    const { ANTECEDENTES_REALES } = await import('../src/lib/um26-data/antecedentesReales');
    const { getAntecedenteImage } = await import('../src/lib/um26-data/images');
    const { posterFor } = await import('../src/data/cine/posters');
    expect(ANTECEDENTES_REALES.length).toBeGreaterThanOrEqual(518);
    for (const item of ANTECEDENTES_REALES) {
      const image = getAntecedenteImage(item.sectorSlug, item.serviceCodes, item.id);
      expect(image).toMatch(/^\/cine\/media\/cine-[a-z0-9-]+-poster\.jpg$/);
      expect(image).toBe(posterFor(item.sectorSlug, item.serviceCodes[0]));
      expect(fs.existsSync(path.join(repoRoot, 'public', image))).toBe(true);
    }
  });
});
