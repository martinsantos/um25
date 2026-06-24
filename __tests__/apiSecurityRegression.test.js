const commentsData = require('../src/data/comments');

jest.mock('../src/data/comments', () => ({
  approveComment: jest.fn().mockResolvedValue(undefined),
  deleteComment: jest.fn().mockResolvedValue(undefined),
  addComment: jest.fn().mockImplementation(async comment => ({ id: 'new-comment', ...comment })),
  addReply: jest.fn().mockImplementation(async (_id, reply) => ({ id: 'new-reply', ...reply })),
}));

function makeRequest(url, options = {}) {
  const normalized = new Map(
    Object.entries(options.headers || {}).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );

  return {
    url,
    headers: {
      get(name) {
        return normalized.get(String(name).toLowerCase()) || null;
      },
    },
    json: jest.fn().mockImplementation(async () => {
      if (typeof options.body === 'string') return JSON.parse(options.body);
      return options.body || {};
    }),
  };
}

class TestResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || {};
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return String(this.body);
  }
}

describe('API security regressions', () => {
  const originalEnv = { ...process.env };
  const originalResponse = global.Response;

  beforeEach(() => {
    process.env = { ...originalEnv };
    global.Response = TestResponse;
    global.fetch = jest.fn();
    commentsData.approveComment.mockClear();
    commentsData.deleteComment.mockClear();
    commentsData.addComment.mockClear();
    commentsData.addReply.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.Response = originalResponse;
  });

  test('comment moderation fails closed when no moderation secret is configured', async () => {
    delete process.env.COMMENTS_ADMIN_SECRET;
    delete process.env.COMMENT_MODERATION_SECRET;
    const { POST } = require('../src/pages/api/comments/[id]/[action].ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/comments/abc/approve'),
      params: { id: 'abc', action: 'approve' },
    });

    expect(response.status).toBe(503);
    expect(commentsData.approveComment).not.toHaveBeenCalled();
  });

  test('comment moderation rejects missing auth before changing comments', async () => {
    process.env.COMMENTS_ADMIN_SECRET = 'moderation-secret';
    const { POST } = require('../src/pages/api/comments/[id]/[action].ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/comments/abc/approve'),
      params: { id: 'abc', action: 'approve' },
    });

    expect(response.status).toBe(401);
    expect(commentsData.approveComment).not.toHaveBeenCalled();
  });

  test('comment moderation accepts the configured bearer secret', async () => {
    process.env.COMMENTS_ADMIN_SECRET = 'moderation-secret';
    const { POST } = require('../src/pages/api/comments/[id]/[action].ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/comments/abc/approve', {
        headers: { Authorization: 'Bearer moderation-secret' },
      }),
      params: { id: 'abc', action: 'approve' },
    });

    expect(response.status).toBe(200);
    expect(commentsData.approveComment).toHaveBeenCalledWith('abc');
  });

  test('asset proxy rejects non-uuid asset ids before calling Directus', async () => {
    process.env.DIRECTUS_STATIC_TOKEN = 'directus-token';
    const { GET } = require('../src/pages/api/asset/[id].ts');

    const response = await GET({
      request: makeRequest('http://localhost/api/asset/not-a-uuid'),
      params: { id: 'not-a-uuid' },
    });

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('asset proxy rejects unsupported query parameters before calling Directus', async () => {
    process.env.DIRECTUS_STATIC_TOKEN = 'directus-token';
    const { GET } = require('../src/pages/api/asset/[id].ts');

    const response = await GET({
      request: makeRequest('http://localhost/api/asset/371dc1b5-48d4-4b19-b60d-d884ad178c77?access_token=leak'),
      params: { id: '371dc1b5-48d4-4b19-b60d-d884ad178c77' },
    });

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('asset proxy does not leak upstream exception details', async () => {
    process.env.DIRECTUS_STATIC_TOKEN = 'directus-token';
    global.fetch.mockRejectedValueOnce(new Error('internal directus secret detail'));
    const { GET } = require('../src/pages/api/asset/[id].ts');

    const response = await GET({
      request: makeRequest('http://localhost/api/asset/371dc1b5-48d4-4b19-b60d-d884ad178c77'),
      params: { id: '371dc1b5-48d4-4b19-b60d-d884ad178c77' },
    });

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('Error proxying asset');
  });

  test('rebuild webhook rejects malformed JSON as a client error', async () => {
    const { POST } = require('../src/pages/api/rebuild.ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/rebuild', {
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid JSON',
    });
  });

  test('blog publishing malformed basic auth returns unauthorized instead of throwing', async () => {
    process.env.DIRECTUS_ADMIN_TOKEN = 'directus-admin-token';
    process.env.BLOG_API_USER = 'writer';
    process.env.BLOG_API_PASS = 'secret';
    const { POST } = require('../src/pages/api/blog.ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/blog', {
        headers: { Authorization: 'Basic not-valid-for-this-api' },
        body: JSON.stringify({ titulo: 'A', resumen: 'B', contenido: 'C' }),
      }),
    });

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('public comments reject invalid email before writing', async () => {
    const { POST } = require('../src/pages/api/comments.ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/comments', {
        body: JSON.stringify({
          author: 'Martin',
          email: 'invalid-email',
          content: 'Comentario pendiente',
          postSlug: 'nota-operativa',
        }),
      }),
    });

    expect(response.status).toBe(400);
    expect(commentsData.addComment).not.toHaveBeenCalled();
  });

  test('public comments reject malformed JSON before writing', async () => {
    const { POST } = require('../src/pages/api/comments.ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/comments', {
        body: '{not-json',
      }),
    });

    expect(response.status).toBe(400);
    expect(commentsData.addComment).not.toHaveBeenCalled();
  });

  test('public comment replies reject invalid post slugs before writing', async () => {
    const { POST } = require('../src/pages/api/comments/[id]/reply.ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/comments/parent/reply', {
        body: JSON.stringify({
          author: 'Martin',
          email: 'martin@example.com',
          content: 'Respuesta pendiente',
          postSlug: '../not-a-slug',
        }),
      }),
      params: { id: 'parent' },
    });

    expect(response.status).toBe(400);
    expect(commentsData.addReply).not.toHaveBeenCalled();
  });

  test('contact API rejects malformed JSON as a client error', async () => {
    const { POST } = require('../src/pages/api/contact.ts');

    const response = await POST({
      request: makeRequest('http://localhost/api/contact', {
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }),
      clientAddress: '127.0.0.1',
    });

    expect(response.status).toBe(400);
  });

  test.each([
    '../src/pages/api/cli/query.ts',
    '../src/pages/api/cli/query-real-only.ts',
    '../src/pages/api/cli/query-directus.ts',
    '../src/pages/api/cli/query-simple.ts',
  ])('CLI endpoint %s rejects non-string queries before calling Directus', async modulePath => {
    const { POST } = require(modulePath);

    const response = await POST({
      request: makeRequest('http://localhost/api/cli/query', {
        body: JSON.stringify({ query: 12345 }),
      }),
    });

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
