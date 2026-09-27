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

// Rediseño 2026-09: el índice pasó del experimento UM26 (grilla/lista + modal)
// al archivo oscuro "ev" (tarjetas-enlace, filtros plegables, orden y "ver más").
// Se mantienen las garantías: las 120 fichas en el HTML SSR, el orden editorial
// de cabecera sin perder registros antiguos y controles de orden/filtro reales.
describe('UM26 antecedentes index contracts', () => {
  test('renders the complete 120-item evidence sheet, not only the editorial lead set', () => {
    const ids = idsFromSource(dataSource);

    expect(ids).toHaveLength(120);
    expect(pageSource).toContain('const antecedentes = await getAntecedentes({ limit: 1000 });');
    expect(pageSource).toContain('const cases = [...orderedLead, ...rest].map((item) => {');
    expect(pageSource).toContain('const publishedCount = cases.length;');
    expect(pageSource).toMatch(/<ul class="ev-grid" data-grid role="list">\s*\{cases\.map\(\(item, index\) => \(/);
    expect(pageSource).not.toMatch(/cases\.slice\(|\.slice\(0, 12\)\.map|\.slice\(0, PAGE_SIZE\)/);
    expect(pageSource).not.toContain('const publishedCount = 120;');
    // La paginación "ver más" es sólo del cliente: el HTML trae todas las fichas.
    expect(pageSource).toMatch(/const visible = ok && total <= limit;[\s\S]*card\.hidden = !visible;/);
  });

  test('keeps the demo lead order while retaining older records for sort and list mode', () => {
    expect(pageSource).toContain('const leadOrder = [3043, 3029, 3111, 3013, 3022, 3037, 3066, 3031, 3028, 3067, 3068, 3071];');
    expect(pageSource).toContain('const rest = antecedentes.filter((item) => !leadOrder.includes(item.id));');
    expect(dataSource).toContain('id: 3006');
    expect(dataSource).toContain('Cableado Estructurado en Terminal de Pasajeros - Aeropuerto de Malargüe');
    expect(dataSource).toContain('year: 2021');
    expect(dataSource).toContain('id: 3026');
    expect(dataSource).toContain('Sistema SDI en Sala de Barricas - Bodega Mendel');
  });

  test('exposes the controls required by the visual demo', () => {
    // El toggle grilla/lista se eliminó a propósito; quedan búsqueda, orden,
    // filtros por faceta y "ver más", todos operando sobre las fichas SSR.
    expect(pageSource).toContain('data-sort');
    expect(pageSource).toContain('<option value="recent">Destacados</option>');
    expect(pageSource).toContain('<option value="year-asc">Año, más antiguo</option>');
    expect(pageSource).toContain('<option value="year-desc">Año, más reciente</option>');
    expect(pageSource).toContain('<option value="client">Cliente A–Z</option>');
    expect(pageSource).toContain('define:vars={{ PAGE_SIZE }}');
    expect(pageSource).toMatch(/if \(mode === 'year-asc'\) return num\(a, 'data-year'\) - num\(b, 'data-year'\)/);
    expect(pageSource).toContain("sort?.addEventListener('change', () => { sortCards(); reset(); });");
    expect(pageSource).toContain('data-filter-toggle');
    expect(pageSource).toContain('data-filter-panel');
    expect(pageSource).toContain('data-more');
    expect(pageSource).toContain('data-clear');
    for (const facet of ['sector', 'service', 'year', 'status']) {
      expect(pageSource).toContain(`type: '${facet}'`);
    }
  });
});
