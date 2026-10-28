const { EventEmitter } = require('node:events');
const { createConnection } = require('node:net');
const { GET } = require('../src/pages/api/monitoring/services.ts');

jest.mock('node:net', () => ({ createConnection: jest.fn() }));

class TestResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

describe('monitoring services runtime port', () => {
  const originalPort = process.env.PORT;
  const originalResponse = global.Response;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.Response = TestResponse;
    global.fetch = jest.fn();
    createConnection.mockImplementation(() => {
      const socket = new EventEmitter();
      socket.setTimeout = jest.fn();
      socket.destroy = jest.fn();
      Promise.resolve().then(() => socket.emit('connect'));
      return socket;
    });
  });

  afterEach(() => {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
  });

  afterAll(() => {
    global.Response = originalResponse;
    global.fetch = originalFetch;
  });

  async function expectHealthyOnPort(port) {
    const frontendUrl = `http://127.0.0.1:${port}/`;
    const available = [frontendUrl, 'http://127.0.0.1:8055/server/health', 'http://127.0.0.1:80/'];
    global.fetch.mockImplementation(async url => {
      if (!available.includes(url)) throw new Error('No listener on this port');
      return { ok: true, status: 200 };
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services).toHaveLength(5);
    expect(body.services.find(service => service.name === 'Astro Frontend').status).toBe('online');
    expect(global.fetch).toHaveBeenCalledWith(frontendUrl, expect.objectContaining({ signal: expect.anything() }));
  }

  test('probes the active release port and reads PORT on each request', async () => {
    process.env.PORT = '4322';
    await expectHealthyOnPort(4322);
    process.env.PORT = '4323';
    await expectHealthyOnPort(4323);
    expect(global.fetch).not.toHaveBeenCalledWith('http://127.0.0.1:4321/', expect.anything());
  });

  test.each(['1', '65535'])('accepts valid TCP port %s', async value => {
    process.env.PORT = value;
    await expectHealthyOnPort(Number(value));
  });

  test.each([undefined, '', '0', '-1', '65536', '4322.5', '4322x', '0x10', '1e3'])('falls back to development port for PORT=%s', async value => {
    if (value === undefined) delete process.env.PORT;
    else process.env.PORT = value;
    await expectHealthyOnPort(4321);
  });
});
