import { canonicalizeBlogSlug, canonicalizeInternalBlogLinks } from '../src/utils/blogCanonicalLinks';

describe('blog canonical links', () => {
  test('normalizes encoded accents to the published ASCII slug', () => {
    expect(canonicalizeBlogSlug('exportaci%C3%B3n-monitoreada-cctv-sita-y-prueba-de-planta'))
      .toBe('exportacion-monitoreada-cctv-sita-y-prueba-de-planta');
  });

  test('resolves known duplicate slugs to their canonical article', () => {
    expect(canonicalizeBlogSlug('paperless-ngx-estudio-contable-resma-automatica-v2'))
      .toBe('paperless-ngx-estudio-contable-resma-automatica');
  });

  test('rewrites internal article links directly to canonical paths', () => {
    const html = '<a href="https://www.ultimamilla.com.ar/blog/d%C3%B3lar-tarjeta-a-1-840?ref=nota">Leer</a>';
    expect(canonicalizeInternalBlogLinks(html))
      .toContain('href="/blog/dolar-tarjeta-a-1-840?ref=nota"');
  });

  test('retains the original list on an inline article link and leaves blog topic links intact', () => {
    const source = '<a href="/blog/nota-tecnica?ref=paso#paso-2">Nota</a> <a href="/blog/tema/redes-y-conectividad">Tema</a>';
    const result = canonicalizeInternalBlogLinks(source, '/blog?page=2#nota-original');
    expect(result).toContain('href="/blog/nota-tecnica?lista=%2Fblog%3Fpage%3D2%23nota-original&amp;ref=paso#paso-2"');
    expect(result).toContain('href="/blog/tema/redes-y-conectividad"');
  });
});
