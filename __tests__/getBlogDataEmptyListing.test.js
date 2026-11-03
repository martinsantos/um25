describe('fetchBlogListing', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('returns a valid empty Directus listing without consulting fallbacks', async () => {
    process.env.DIRECTUS_INTERNAL_URL = 'https://directus.test';
    process.env.UMSA_LOCAL_REPLICA = '1';
    delete process.env.DIRECTUS_STATIC_TOKEN;
    delete process.env.PUBLIC_DIRECTUS_TOKEN;
    delete process.env.DIRECTUS_ADMIN_TOKEN;

    const jsonResponse = (body) => ({ ok: true, status: 200, json: async () => body });
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ count: { id: 0 } }] }));

    jest.doMock('../src/config/runtime', () => ({
      allowMockBlogFallback: () => false,
      allowPublicBlogFallback: () => true,
      getDirectusInternalUrl: () => 'https://directus.test',
      getDirectusToken: () => '',
      getPublicSiteUrl: () => 'https://www.ultimamilla.com.ar',
    }));
    const { fetchBlogListing } = require('../src/utils/getBlogData');
    await expect(fetchBlogListing(1, 10, 'tecnico')).resolves.toEqual({ posts: [], total: 0 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('public fallback keeps the article cover instead of a cached social thumbnail', async () => {
    jest.doMock('../src/config/runtime', () => ({
      allowMockBlogFallback: () => false,
      allowPublicBlogFallback: () => true,
      getDirectusInternalUrl: () => 'https://directus.test',
      getDirectusToken: () => '',
      getPublicSiteUrl: () => 'https://www.ultimamilla.com.ar',
    }));
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => `<meta property="og:image" content="https://www.ultimamilla.com.ar/blog/og/nota.jpg"><h1 class="article-title">Nota técnica</h1><p class="article-lead">Texto publicado.</p><figure class="bp-cover bp-shell"><img src="https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1200&amp;q=80"></figure>` });
    const { fetchBlogPost } = require('../src/utils/getBlogData');
    const post = await fetchBlogPost('nota-tecnica');
    expect(post.imagen_portada).toBe('https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1200&q=80');
    expect(post.titulo).toBe('Nota técnica');
  });

});
