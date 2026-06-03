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
    const css = source('src/pages/blog/index.astro');

    expect(css).toContain('grid-template-columns: minmax(0, 124px) minmax(0, 1fr)');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).not.toContain('grid-template-columns: minmax(124px, max-content) minmax(0, 1fr)');
  });

  test('services mobile proofline permits long evidence text to wrap', () => {
    const css = source('src/pages/servicios/index.astro');

    expect(css).toContain('grid-template-columns: minmax(0, 96px) minmax(0, 1fr)');
    expect(css).not.toContain('grid-template-columns: minmax(96px, max-content) minmax(0, 1fr)');
    expect(css).not.toContain('overflow-wrap: normal;');
  });

  test('article and contact mobile headings use container-relative sizing', () => {
    const article = source('src/pages/blog/[slug].astro');
    const contact = source('src/pages/contacto.astro');

    expect(article).toContain('font-size: clamp(2.125rem, 8.2vw, 2.32rem)');
    expect(contact).toContain('font-size: clamp(1.78rem, 8vw, 2.08rem)');
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
