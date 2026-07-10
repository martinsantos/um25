import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('404 SEO contracts', () => {
  test('the dedicated error page emits a real 404 status', () => {
    expect(source('src/pages/404.astro')).toContain('Astro.response.status = 404');
  });

  test('unknown root slugs do not redirect into the sector index', () => {
    const route = source('src/pages/[sector].astro');
    expect(route).toContain("return Astro.rewrite('/404')");
    expect(route).not.toContain("return Astro.redirect('/sectores', 301)");
  });

  test.each([
    'src/pages/servicios/[id]/[slug].astro',
    'src/pages/servicios/[id]/index.astro',
    'src/pages/antecedentes/[id]/[slug].astro',
    'src/pages/antecedentes/[id]/index.astro',
    'src/pages/blog/[slug].astro',
    'src/pages/blog/categoria/[cat].astro',
  ])('%s rewrites missing content to the real 404 page', (relativePath) => {
    const route = source(relativePath);
    expect(route).toContain("Astro.rewrite('/404')");
    expect(route).not.toContain("Astro.redirect('/404')");
  });

  test('service slug normalization is a permanent redirect', () => {
    expect(source('src/pages/servicios/[id]/[slug].astro'))
      .toContain('Astro.redirect(`/servicios/${id}/${expectedSlug}`, 301)');
  });

  test('case H1s carry a stable evidence identifier', () => {
    expect(source('src/pages/antecedentes/[id]/[slug].astro'))
      .toContain('`${baseCaseHeadline}${dateContext} · UM-${id}`');
  });
});
