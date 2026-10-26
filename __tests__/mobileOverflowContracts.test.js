const fs = require('fs');
const path = require('path');

function source(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function block(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, 'm'));
  return match?.[1] || '';
}

describe('mobile overflow production contracts', () => {
  test('global buttons can shrink inside one-column mobile layouts', () => {
    const css = source('src/styles/v4.css');

    expect(block(css, '.um-btn-primary')).toContain('box-sizing: border-box');
    expect(block(css, '.um-btn-primary')).toContain('max-width: 100%');
    expect(block(css, '.um-btn-secondary')).toContain('box-sizing: border-box');
    expect(block(css, '.um-btn-secondary')).toContain('max-width: 100%');
  });

  test('blog index mobile proofline does not use max-content tracks', () => {
    // Rediseño 2026-09: la proofline del índice se eliminó; se exige lo mismo a las
    // grillas actuales (índice, categoría y destacado): sin pistas max-content y
    // con columnas minmax(0, …) que permiten encoger en móvil.
    const index = source('src/pages/blog/index.astro');
    const category = source('src/pages/blog/categoria/[cat].astro');
    const hero = source('src/components/blog/BlogHero.astro');

    for (const css of [index, category, hero]) {
      expect(css).not.toContain('max-content');
    }
    expect(index).toContain('.bx-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; }');
    expect(category).toContain('.bx-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; }');
    expect(hero).toContain('.bfeat { grid-template-columns: minmax(0, 1fr); }');
  });

  test('services mobile proofline permits long evidence text to wrap', () => {
    const css = source('src/pages/servicios/index.astro');

    expect(css).toContain('class="services-demo"');
    expect(css).toMatch(/\.services-demo-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.02fr\) minmax\(0,\s*1fr\);/);
    expect(css).toMatch(/@media \(max-width:\s*980px\)\s*\{[\s\S]*\.services-demo-row,[\s\S]*\.services-demo-row:nth-child\(even\)\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    // Rediseño 2026-09: miniatura móvil 84px/24vw (antes 92px/27vw); la columna de
    // texto sigue siendo minmax(0, 1fr) y la miniatura queda acotada por vw.
    const mobileRow = css.match(/@media \(max-width:\s*640px\)\s*\{[\s\S]*?\.services-demo-row,\s*\.services-demo-row:nth-child\(even\)\s*\{[^}]*grid-template-columns:\s*minmax\((\d+)px,\s*(\d+)vw\) minmax\(0,\s*1fr\);/);
    expect(mobileRow).not.toBeNull();
    expect(Number(mobileRow[2])).toBeLessThanOrEqual(30);
    expect(css).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-demo-body > p\s*\{[\s\S]*display:\s*none;/);
    expect(css).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-demo-body ul\s*\{[\s\S]*display:\s*none;/);
    expect(css).toMatch(/@media \(max-width:\s*980px\)\s*\{[\s\S]*\.services-demo-body ul\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(css).not.toContain('grid-template-columns: minmax(96px, max-content) minmax(0, 1fr)');
    expect(css).toMatch(/\.services-demo-body h2\s*\{[\s\S]*overflow-wrap:\s*normal;/);
  });

  test('article and contact mobile headings use container-relative sizing', () => {
    // Rediseño 2026-09: los H1 usan el token --x-fs-h1 (mínimo 48 px). En móvil se
    // exige un tamaño relativo al ancho para que ninguna palabra desborde a 320 px.
    const article = source('src/pages/blog/[slug].astro');
    const contact = source('src/pages/contacto.astro');

    expect(article).toMatch(/@media \(max-width: 680px\) \{[\s\S]*?\.bp-title \{ font-size: clamp\(2rem, 9\.4vw, 3rem\) !important; \}/);
    expect(contact).toMatch(/@media \(max-width: 640px\) \{[\s\S]*?\.ctc-intro h1 \{ font-size: clamp\(2\.25rem, 11vw, 3rem\) !important; \}/);
    expect(contact).toMatch(/@media \(max-width: 960px\) \{[\s\S]*?\.ctc-hero__grid \{ grid-template-columns: minmax\(0, 1fr\);/);
  });

  test('blog singles without table-of-contents headings use the full editorial column', () => {
    const article = source('src/pages/blog/[slug].astro');
    const toc = source('src/components/blog/BlogTOC.astro');

    // Rediseño 2026-09: layout .bp-layout; sin índice (menos de 2 títulos) la
    // columna lateral desaparece y el texto usa la medida editorial completa.
    expect(article).toContain("headings.length < 2 && 'bp-layout--single'");
    expect(toc).toContain('{items.length > 1 && (');
    expect(article).toMatch(/\.bp-layout--single \{ grid-template-columns: minmax\(0, 68ch\); \}/);
    expect(article).toMatch(/\.bp-layout--single \.bp-aside \{ display: none; \}/);
  });

  test('sector and antecedentes rails are deliberately contained on mobile', () => {
    const sectores = source('src/components/templates/SectorTemplateEditorial.astro');
    const antecedentes = source('src/components/templates/AntecedentesTemplateEditorial.astro');

    expect(sectores).toContain('max-width: 100%');
    expect(sectores).toContain('scrollbar-width: none');
    expect(antecedentes).toContain('max-width: 100%');
    expect(antecedentes).toContain('scrollbar-width: none');
  });
});
