const fs = require('fs');
const path = require('path');

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('antecedentes archive navigation and mobile filters', () => {
  const page = read('src/pages/antecedentes/index.astro');

  test('round-trips sort and visible count without adding a return URL', () => {
    expect(page).toContain("next.set('orden', sortMode)");
    expect(page).toContain("next.set('mostrar', String(limit))");
    expect(page).toContain("params.get('orden')");
    expect(page).toContain("params.get('mostrar')");
    expect(page).toContain("href: `${location.pathname}${location.search}`");
    expect(page).toContain("if (location.pathname !== '/antecedentes') return;");
    expect(page).not.toMatch(/[?&]return=/i);
  });

  test('stores the list scroll before a case navigation and restores it on return', () => {
    expect(page).toContain("sessionStorage.setItem(RETURN_KEY");
    expect(page).toContain('scrollY: window.scrollY');
    expect(page).toContain("window.addEventListener('pageshow', restoreReturnPosition)");
    expect(page).toContain('window.scrollTo(0, Math.max(0, Number(saved.scrollY) || 0))');
  });

  test('keeps each mobile facet visible as a compact select and announces selected filters', () => {
    expect(page).toContain("window.matchMedia('(max-width: 760px)')");
    expect(page).toContain('toggle.hidden = compactFilters');
    expect(page).toContain('data-filter-select={group.type}');
    expect(page).toContain('.ev .ev-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(page).toContain('.ev .ev-panel__chips { display: none; }');
    expect(page).toContain('select.addEventListener(\'change\'');
    expect(page).toContain('data-filter-summary aria-live="polite"');
    expect(page).toContain('Activos: ${activeLabels.join');
  });
});

describe('blog index long-content layout', () => {
  test('keeps titles and excerpts inside the shared shell at narrow widths', () => {
    const index = read('src/pages/blog/index.astro');
    const detail = read('src/pages/blog/[slug].astro');
    expect(index).toContain('.bx-shell { width: min(var(--um-container-wide, 1400px), calc(100% - 2 * var(--x-gutter))); margin-inline: auto; }');
    expect(detail).toContain('.bp-shell { width: min(var(--um-container-wide, 1400px), calc(100% - 2 * var(--x-gutter))); margin-inline: auto; }');
    expect(index).toContain('overflow-wrap: anywhere;');
  });
});
