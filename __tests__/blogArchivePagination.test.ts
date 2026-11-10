import { fetchBlogListing } from '../src/utils/getBlogData';
import { resolveCanonicalBlogSlug } from '../src/data/seoRedirects';

test('the CMS paginates the archive before normalizing covers', async () => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.searchParams.has('aggregate[count]')) {
      return { ok: true, json: async () => ({ data: [{ count: { id: 300 } }] }) } as Response;
    }
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('290');
    expect(url.searchParams.get('sort')).toBe('-fecha_publicacion,id');
    return {
      ok: true,
      json: async () => ({ data: [{ slug: 'ultima-pagina', titulo: 'Última página', imagen_portada: '/images/cover.webp' }] }),
    } as Response;
  });

  const { posts, total } = await fetchBlogListing(30, 10);
  expect(total).toBe(300);
  expect(posts).toMatchObject([{ slug: 'ultima-pagina', imagen_portada: 'https://www.ultimamilla.com.ar/images/cover.webp' }]);
});

test.each(['constructor', '__proto__', 'toString'])('does not redirect inherited property %s', slug => {
  expect(resolveCanonicalBlogSlug(slug)).toBe(slug);
});
