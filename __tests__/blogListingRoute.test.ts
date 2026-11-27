import { blogListingHref, resolveBlogListingRoute, resolveBlogReadingReturn } from '../src/lib/blogListingRoute';

describe('blog archive query routing', () => {
  test('keeps the production page parameter and canonical query', () => {
    const route = resolveBlogListingRoute(new URL('https://example.test/blog?categoria=tecnico&page=3'));

    expect(route).toMatchObject({
      page: 3,
      category: 'tecnico',
      invalidCategory: false,
      canonicalPath: '/blog?categoria=tecnico&page=3',
    });
    expect(route.redirectTo).toBeUndefined();
  });

  test('retains search and category during pagination and article return', () => {
    const route = resolveBlogListingRoute(new URL('https://example.test/blog?categoria=tecnico&q=fibra+%C3%B3ptica&page=2'));
    expect(route.search).toBe('fibra óptica');
    expect(route.canonicalPath).toBe('/blog?categoria=tecnico&page=2');
    const listing = blogListingHref(route.page, route.category, route.search);
    expect(resolveBlogReadingReturn(listing + '#nota-fibra')).toEqual({
      href: '/blog?categoria=tecnico&q=fibra+%C3%B3ptica&page=2#nota-fibra',
      search: 'fibra óptica',
      label: 'Volver a los resultados',
    });
  });

  test('retains search while normalizing legacy pagination and empty terms', () => {
    expect(resolveBlogListingRoute(new URL('https://example.test/blog?p=2&q=%20Node-RED%20')).redirectTo)
      .toBe('/blog?q=Node-RED&page=2');
    expect(resolveBlogListingRoute(new URL('https://example.test/blog?categoria=noticias&q=%20')).redirectTo)
      .toBe('/blog?categoria=noticias');
  });

  test('redirects the current p parameter to the canonical production parameter', () => {
    const route = resolveBlogListingRoute(new URL('https://example.test/blog?categoria=empresa&p=2'));

    expect(route.redirectTo).toBe('/blog?categoria=empresa&page=2');
  });

  test.each(['inexistente', '', 'Tecnico'])('rejects unsupported categories (%s)', (category) => {
    const route = resolveBlogListingRoute(new URL(`https://example.test/blog?categoria=${encodeURIComponent(category)}`));

    expect(route.invalidCategory).toBe(true);
    expect(route.redirectTo).toBeUndefined();
  });

  test.each(['', 'abc', '1.5', '0', '-2', '9007199254740992'])('normalizes malformed page values (%s) to page one', (page) => {
    const route = resolveBlogListingRoute(new URL(`https://example.test/blog?page=${encodeURIComponent(page)}`));

    expect(route.page).toBe(1);
    expect(route.canonicalPath).toBe('/blog');
    expect(route.redirectTo).toBe('/blog');
  });
});
