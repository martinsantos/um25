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

  test('case pages keep the stable evidence identifier outside the editorial H1', () => {
    const route = source('src/pages/antecedentes/[id]/[slug].astro');
    expect(route).toContain('const caseHeadline = baseCaseHeadline');
    expect(route).toContain('const caseReference = `UM-${id}`');
    expect(route).toContain('<span class="case-detail-label__reference">{caseReference}</span>');
  });

  test('public case records win over colliding local archive ids', () => {
    const detailRoute = source('src/pages/antecedentes/[id]/[slug].astro');
    const indexRoute = source('src/pages/antecedentes/[id]/index.astro');

    expect(detailRoute.indexOf('antecedente = await getAntecedenteConServicios(id)'))
      .toBeLessThan(detailRoute.indexOf('antecedente = await getUm26AntecedenteFallback(id)'));
    expect(indexRoute.indexOf('const item = await getAntecedenteConServicios(id)'))
      .toBeLessThan(indexRoute.indexOf('const um26Item = await getUm26AntecedenteById(Number(id))'));
  });

  test('case related rows import their year formatter', () => {
    const route = source('src/pages/antecedentes/[id]/[slug].astro');
    expect(route).toMatch(/formatAntecedenteDate,\s+formatAntecedenteYear,/);
    expect(route).toContain('year={formatAntecedenteYear(ant.Fecha)}');
  });
});
