import { resolveBlogListingRoute } from '../src/lib/blogListingRoute';

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
