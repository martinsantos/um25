const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function cssNumber(source, selector, property) {
  const block = source.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`));
  if (!block) return null;
  const declaration = block[1].match(new RegExp(`${property}\\s*:\\s*([0-9.]+)px`));
  return declaration ? Number(declaration[1]) : null;
}

describe('Information hub visual contracts', () => {
  const sectorAtlas = read('src/components/templates/SectorTemplateAtlas.astro');
  const antecedentesEditorial = read('src/components/templates/AntecedentesTemplateEditorial.astro');

  test('sectores abandons family language in the public hub template', () => {
    expect(sectorAtlas).not.toMatch(/\bfamilia(s)?\b/i);
    expect(sectorAtlas).toContain('Mercados operativos UMSA');
    expect(sectorAtlas).toContain('Mercados operativos, riesgo y evidencia.');
  });

  test('sticky filters keep editorial breathing room below the navigation', () => {
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-ledger__controls', 'top')).toBeGreaterThanOrEqual(72);
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-ledger__controls', 'top')).toBeLessThanOrEqual(88);
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__controls', 'top')).toBeGreaterThanOrEqual(72);
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__controls', 'top')).toBeLessThanOrEqual(88);
    expect(sectorAtlas).toMatch(/\.sector-atlas-exec-ledger__filters-links\s*\{[\s\S]*flex-wrap:\s*nowrap;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-links\s*\{[\s\S]*flex-wrap:\s*nowrap;/);
    expect(sectorAtlas).toMatch(/\.sector-atlas-exec-ledger__controls\s*\{[\s\S]*background:\s*var\(--skin-page, #fff\);/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__controls\s*\{[\s\S]*background:\s*#fff;/);
    expect(sectorAtlas).toMatch(/\.sector-atlas-exec-ledger__controls\s*\{[\s\S]*0 -24px 0 var\(--skin-page, #fff\)/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__controls\s*\{[\s\S]*0 -24px 0 #fff/);
  });

  test('antecedentes filter block stays sticky and opaque while filtering the archive below', () => {
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__controls', 'top')).toBeGreaterThanOrEqual(72);
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__controls', 'top')).toBeLessThanOrEqual(88);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__controls\s*\{[\s\S]*position:\s*sticky;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__controls\s*\{[\s\S]*background:\s*#fff;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__archive\s*\{[\s\S]*scroll-margin-top:\s*136px;/);
  });

  test('row hover treatment stays calm and does not add red rails or layout drift', () => {
    const hoverBlocks = [
      sectorAtlas.match(/\.sector-atlas-exec-row:hover\s*\{[\s\S]*?\}/)?.[0] || '',
      antecedentesEditorial.match(/\.ante-dossier__row:hover\s*\{[\s\S]*?\}/)?.[0] || ''
    ];

    for (const block of hoverBlocks) {
      expect(block).not.toMatch(/padding-left\s*:/);
      expect(block).not.toMatch(/box-shadow:\s*inset/);
    }
  });

  test('sector service tags do not repeat red vertical bars inside the information table', () => {
    const serviceBlocks = sectorAtlas.match(/\.sector-atlas-exec-row__services li\s*\{[\s\S]*?\}/g) || [];
    expect(serviceBlocks.join('\n')).not.toMatch(/border-left:\s*2px solid var\(--um-red\)/);
    expect(serviceBlocks.join('\n')).not.toMatch(/border-right:\s*1px solid var\(--um-red\)/);
    expect(serviceBlocks.some((block) => /background:\s*[^;]+;/.test(block))).toBe(true);
    expect(sectorAtlas).not.toMatch(/\.sector-atlas-exec-row:hover h2/);
  });

  test('sector ledger uses meaningful thumbnails, not collapsed spreadsheet icons', () => {
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-row__sector figure', 'width')).toBeGreaterThanOrEqual(140);
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-row__sector figure', 'height')).toBeGreaterThanOrEqual(112);
    expect(sectorAtlas).toMatch(/grid-template-columns:\s*172px minmax\(0, 1fr\)/);
  });
});
