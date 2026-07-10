const fs = require('fs');
const path = require('path');

const pageSource = fs.readFileSync(
  path.join(process.cwd(), 'src/pages/antecedentes/index.astro'),
  'utf8'
);
const dataSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/um26-data/antecedentes.ts'),
  'utf8'
);

function idsFromSource(source) {
  return Array.from(source.matchAll(/\bid:\s*(\d+),/g), (match) => Number(match[1]));
}

describe('UM26 antecedentes index contracts', () => {
  test('renders the complete 120-item evidence sheet, not only the editorial lead set', () => {
    const ids = idsFromSource(dataSource);

    expect(ids).toHaveLength(120);
    expect(pageSource).toContain('const initialResultCount = antecedentes.length;');
    expect(pageSource).toContain('const cases = [...orderedLeadCases, ...fallbackCases].map((item, index) => {');
    expect(pageSource).not.toContain('.slice(0, 12).map');
    expect(pageSource).not.toContain("const initialResultCount = 120;");
  });

  test('keeps the demo lead order while retaining older records for sort and list mode', () => {
    expect(pageSource).toContain('const demoLeadOrder = [3043, 3029, 3111, 3013, 3022, 3037, 3066, 3031, 3028, 3067, 3068, 3071];');
    expect(dataSource).toContain('id: 3006');
    expect(dataSource).toContain('Cableado Estructurado en Terminal de Pasajeros - Aeropuerto de Malargüe');
    expect(dataSource).toContain('year: 2021');
    expect(dataSource).toContain('id: 3026');
    expect(dataSource).toContain('Sistema SDI en Sala de Barricas - Bodega Mendel');
  });

  test('exposes the controls required by the visual demo', () => {
    expect(pageSource).toContain('data-view-toggle="grid"');
    expect(pageSource).toContain('data-view-toggle="list"');
    expect(pageSource).toContain('data-sort-select');
    expect(pageSource).toContain('<option value="oldest">Más antiguos</option>');
    expect(pageSource).toContain('define:vars={{ initialResultCount }}');
    expect(pageSource).toMatch(/grid\?\.classList\.toggle\('um26-case-grid--list', activeView === 'list'\)/);
  });
});
