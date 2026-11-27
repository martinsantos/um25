import { fetchBlogPostsBySlugs, fetchBlogSitemapEntries } from '../src/utils/getBlogData';
import { searchPublishedBlogIndex } from '../src/utils/blogPublishedIndex';

jest.mock('../src/utils/getBlogData', () => ({
  fetchBlogPostsBySlugs: jest.fn(),
  fetchBlogSitemapEntries: jest.fn(),
}));
jest.mock('../src/utils/blogTopicMap', () => ({ getBlogTopicEntry: () => undefined }));

beforeEach(() => {
  jest.mocked(fetchBlogPostsBySlugs).mockImplementation(async slugs =>
    slugs.map(slug => ({
      slug,
      ...(slug === 'sensores-con-node-red' ? { categoria: 'tecnico' } : {}),
    } as Awaited<ReturnType<typeof fetchBlogPostsBySlugs>>[number])),
  );
  jest.mocked(fetchBlogSitemapEntries).mockResolvedValue([
    { slug: 'fibra-para-hospitales', titulo: 'Fibra óptica para hospitales', categoria: 'proyectos' },
    { slug: 'wifi-fibra', titulo: 'Wi-Fi y fibra óptica', categoria: 'tecnico' },
    { slug: 'diagnostico-fibra', titulo: 'Diagnóstico de fibra óptica', categoria: 'tecnico' },
    { slug: 'sensores-con-node-red', titulo: 'Sensores con Node-RED' },
    { slug: 'camaras-en-fabrica', titulo: 'Cámaras en fábrica', categoria: 'tecnico' },
  ]);
});

test('searches accent-tolerant titles, respects category, and loads only the requested page', async () => {
  const page = await searchPublishedBlogIndex('optica fibra', 2, 1, 'tecnico');

  expect(page).toEqual({ posts: [{ slug: 'diagnostico-fibra' }], total: 2, unavailable: false });
  expect(fetchBlogPostsBySlugs).toHaveBeenLastCalledWith(['diagnostico-fibra']);
  expect(fetchBlogSitemapEntries).toHaveBeenCalledWith(-1);
});

test('accepts Wi-Fi variants and keeps normal empty matches distinct from a failed load', async () => {
  const found = await searchPublishedBlogIndex('wifi', 1, 10);
  const empty = await searchPublishedBlogIndex('wifi', 1, 10, 'proyectos');

  expect(found.posts).toEqual([{ slug: 'wifi-fibra' }]);
  expect(empty).toEqual({ posts: [], total: 0, unavailable: false });
});

test('a new note still matches its category before the sitemap has that metadata', async () => {
  const page = await searchPublishedBlogIndex('Node RED', 1, 10, 'tecnico');

  expect(page).toEqual({
    posts: [{ slug: 'sensores-con-node-red', categoria: 'tecnico' }],
    total: 1,
    unavailable: false,
  });
});
