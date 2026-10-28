const { EventEmitter } = require('node:events');
const { STATUS_SERVICES } = require('../src/lib/monitoring/statusCatalog.ts');

jest.mock('node:net', () => ({ createConnection: jest.fn() }));

class TestResponse {
  constructor(text, { status = 200, contentType = 'text/html; charset=utf-8' } = {}) {
    this.status = status;
    this.textBody = text;
    this.headers = { get: name => name.toLowerCase() === 'content-type' ? contentType : null };
    const bytes = Buffer.from(text);
    let read = false;
    this.body = {
      getReader: () => ({
        read: async () => {
          if (read) return { done: true };
          read = true;
          return { done: false, value: bytes };
        },
        cancel: async () => undefined,
      }),
      cancel: async () => undefined,
    };
  }

  async json() { return JSON.parse(this.textBody); }
}

const html = '<!doctype html><html><head><title>Aplicación</title></head><body><main>Estado disponible</main></body></html>';
const directusHtml = '<!doctype html><html><head><title>Directus</title><script type="module" src="./assets/index.entry.js"></script><link rel="stylesheet" href="./assets/index.css"></head><body><div id="app"></div></body></html>';
const json = '{"status":"ok"}';

function setupSockets(createConnection) {
  createConnection.mockImplementation(() => {
    const socket = new EventEmitter();
    socket.setTimeout = jest.fn();
    socket.destroy = jest.fn();
    Promise.resolve().then(() => socket.emit('connect'));
    return socket;
  });
}

describe('monitoring services status API', () => {
  const originalPort = process.env.PORT;
  const originalResponse = global.Response;
  const originalFetch = global.fetch;
  let GET;
  let routeCreateConnection;

  beforeEach(() => {
    jest.resetModules();
    global.Response = TestResponse;
    global.fetch = jest.fn(async url => {
      const target = String(url);
      if (target === 'https://admin.ultimamilla.com.ar/admin/') return new TestResponse(directusHtml);
      if (target.endsWith('.entry.js')) return new TestResponse('', { contentType: 'application/javascript' });
      if (target.endsWith('.css')) return new TestResponse('', { contentType: 'text/css' });
      const isJson = target.includes('/api/health') || target.includes('/server/health');
      return new TestResponse(isJson ? json : html, {
        contentType: isJson ? 'application/json' : 'text/html; charset=utf-8',
      });
    });
    routeCreateConnection = require('node:net').createConnection;
    setupSockets(routeCreateConnection);
    GET = require('../src/pages/api/monitoring/services.ts').GET;
  });

  afterEach(() => {
    process.env.PORT = originalPort || '';
  });

  afterAll(() => {
    global.Response = originalResponse;
    global.fetch = originalFetch;
  });

  test('probes the allowlisted catalog and reports expected resources', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.services).toHaveLength(STATUS_SERVICES.length);
    expect(body.services.map(service => service.id)).toEqual(STATUS_SERVICES.map(service => service.id));
    expect(body.services.every(service => service.status === 'online')).toBe(true);
    expect(body.stats.unknown).toBe(0);
    expect(body.services.find(service => service.id === 'sitrep-api').status).toBe('online');
    expect(body.services.find(service => service.id === 'directus-ui').status).toBe('online');
    expect(global.fetch).toHaveBeenCalledWith('https://sitrep.ultimamilla.com.ar/api/health', expect.objectContaining({
      method: 'GET', redirect: 'manual', cache: 'no-store', signal: expect.anything(),
    }));
    expect(global.fetch).toHaveBeenCalledWith(new URL('https://admin.ultimamilla.com.ar/admin/assets/index.entry.js'), expect.objectContaining({
      method: 'HEAD', redirect: 'manual', cache: 'no-store', signal: expect.anything(),
    }));
    expect(routeCreateConnection).toHaveBeenCalledWith({ host: '179.198.115.115', port: 587 });
    expect(JSON.stringify(body)).not.toMatch(/127\.0\.0\.1|18191|18192|:3001|:3002/);
  });

  test('ignores caller-supplied targets and cannot be used as an SSRF proxy', async () => {
    const request = { url: 'https://www.ultimamilla.com.ar/api/monitoring/services?url=http%3A%2F%2F127.0.0.1%3A1%2Fadmin&target=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data' };
    const response = await GET({ request });
    const body = await response.json();
    const calledUrls = global.fetch.mock.calls.map(([url]) => url);

    expect(response.status).toBe(200);
    expect(body.services.map(service => service.id)).toEqual(STATUS_SERVICES.map(service => service.id));
    expect(calledUrls).toEqual(expect.arrayContaining(STATUS_SERVICES.filter(service => service.probe.kind === 'http').map(service => service.probe.url)));
    expect(calledUrls).not.toContain('http://127.0.0.1:1/admin');
    expect(calledUrls).not.toContain('http://169.254.169.254/latest/meta-data');
  });

  test('uses the runtime port for Astro and refreshes when blue-green PORT changes', async () => {
    process.env.PORT = '4322';
    await GET();
    process.env.PORT = '4323';
    await GET();
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4322/', expect.anything());
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4323/', expect.anything());
    expect(global.fetch).not.toHaveBeenCalledWith('http://127.0.0.1:4321/', expect.anything());
  });

  test.each(['1', '65535'])('accepts valid runtime TCP port %s', async value => {
    process.env.PORT = value;
    await GET();
    expect(global.fetch).toHaveBeenCalledWith(`http://127.0.0.1:${value}/`, expect.anything());
  });

  test.each(['', '0', '-1', '65536', '4322.5', '4322x', '0x10', '1e3'])('falls back to development port for PORT=%s', async value => {
    process.env.PORT = value;
    await GET();
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4321/', expect.anything());
  });

  test.each([404, 401, 500, 503])('does not report HTTP %s as online', async status => {
    global.fetch.mockImplementation(async () => new TestResponse(html, { status, contentType: 'text/html' }));
    const body = await (await GET()).json();
    expect(body.services.find(service => service.id === 'sgi-web').status).toBe('offline');
  });

  test('rejects a Directus HTML shell when its allowlisted main asset is missing', async () => {
    global.fetch.mockImplementation(async url => {
      const target = String(url);
      if (target.endsWith('.css')) return new TestResponse('', { status: 404, contentType: 'text/css' });
      if (target === 'https://admin.ultimamilla.com.ar/admin/') return new TestResponse(directusHtml);
      if (target.endsWith('.entry.js')) return new TestResponse('', { contentType: 'application/javascript' });
      const isJson = target.includes('/api/health') || target.includes('/server/health');
      return new TestResponse(isJson ? json : html, { contentType: isJson ? 'application/json' : 'text/html' });
    });
    const body = await (await GET()).json();
    expect(body.services.find(service => service.id === 'directus-ui').status).toBe('offline');
  });

  test('does not request HTML assets outside the fixed origin and path prefix', async () => {
    global.fetch.mockImplementation(async url => {
      const target = String(url);
      if (target === 'https://admin.ultimamilla.com.ar/admin/') {
        return new TestResponse('<!doctype html><html><head><title>Directus</title><script src="http://169.254.169.254/latest/meta-data"></script><link rel="stylesheet" href="https://admin.ultimamilla.com.ar/outside/app.css"></head><body><main></main></body></html>');
      }
      const isJson = target.includes('/api/health') || target.includes('/server/health');
      return new TestResponse(isJson ? json : html, { contentType: isJson ? 'application/json' : 'text/html' });
    });
    const body = await (await GET()).json();
    const calledUrls = global.fetch.mock.calls.map(([url]) => String(url));
    expect(body.services.find(service => service.id === 'directus-ui').status).toBe('offline');
    expect(calledUrls).not.toContain('http://169.254.169.254/latest/meta-data');
    expect(calledUrls).not.toContain('https://admin.ultimamilla.com.ar/outside/app.css');
  });

  test('requires a positive health status and degrades on any offline service', async () => {
    global.fetch.mockImplementation(async url => {
      const target = String(url);
      if (target === 'https://admin.ultimamilla.com.ar/admin/') return new TestResponse(directusHtml);
      if (target.endsWith('.entry.js')) return new TestResponse('', { contentType: 'application/javascript' });
      if (target.endsWith('.css')) return new TestResponse('', { contentType: 'text/css' });
      if (target.includes('/api/health')) return new TestResponse('{"success":true,"status":"down"}', { contentType: 'application/json' });
      if (target.includes('/plantilla-arca')) return new TestResponse(html, { status: 404 });
      const isJson = target.includes('/server/health');
      return new TestResponse(isJson ? json : html, { contentType: isJson ? 'application/json' : 'text/html' });
    });
    const body = await (await GET()).json();
    expect(body.services.find(service => service.id === 'sitrep-api').status).toBe('offline');
    expect(body.services.find(service => service.id === 'arca-web').status).toBe('offline');
    expect(body.status).toBe('degraded');
  });

  test('does not accept a 200 response with the wrong or empty body', async () => {
    global.fetch.mockImplementation(async () => new TestResponse('<html><title>Not JSON</title></html>', { contentType: 'text/html' }));
    let body = await (await GET()).json();
    expect(body.services.find(service => service.id === 'sitrep-api').status).toBe('offline');

    jest.resetModules();
    GET = require('../src/pages/api/monitoring/services.ts').GET;
    global.fetch.mockImplementation(async () => new TestResponse('', { contentType: 'text/html' }));
    body = await (await GET()).json();
    expect(body.services.find(service => service.id === 'sgi-web').status).toBe('offline');
  });

  test('reuses a recent snapshot and bounds concurrent HTTP probes', async () => {
    let active = 0;
    let peak = 0;
    global.fetch.mockImplementation(async url => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 1));
      active -= 1;
      const isJson = url.includes('/api/health') || url.includes('/server/health');
      return new TestResponse(isJson ? json : html, { contentType: isJson ? 'application/json' : 'text/html' });
    });

    const first = await GET();
    const fetchCount = global.fetch.mock.calls.length;
    const second = await GET();
    expect(await first.json()).toEqual(await second.json());
    expect(global.fetch).toHaveBeenCalledTimes(fetchCount);
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(4);
  });
});
