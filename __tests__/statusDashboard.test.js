const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(process.cwd(), 'public/status/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const worker = fs.readFileSync(path.join(process.cwd(), 'public/status/service-worker.js'), 'utf8');
const names = ['Astro Frontend', 'Directus CMS', 'PostgreSQL Database', 'Redis Cache', 'Nginx Reverse Proxy'];
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const reading = () => ({
  success: true, timestamp: new Date().toISOString(), status: 'online', uptime_seconds: 3720,
  services: names.map(name => ({name, status: 'online', type: 'tcp', responseTime: '12ms', lastCheck: new Date().toISOString()}))
});
let fetchMock;
let listeners;
beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = html.match(/<body>([\s\S]*?)<script>/)[1];
  fetchMock = jest.fn(async () => ({ok: true, json: async () => reading()}));
  global.fetch = fetchMock;
  listeners = [];
  const add = window.addEventListener.bind(window);
  jest.spyOn(window, 'addEventListener').mockImplementation((...args) => { listeners.push(args); add(...args); });
});
afterEach(() => {
  listeners.forEach(args => window.removeEventListener(...args));
  jest.restoreAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});
const text = id => document.getElementById(id).textContent;
const start = async () => { window.eval(script); await flush(); };

test('initial HTML does not assert availability before a reading', () => {
  expect(text('overall-status')).toContain('desconocido');
  expect(text('response-time')).toBe('No disponible');
  expect(html).not.toContain('99.5%');
  expect(html).not.toContain('45ms');
});
test('uses current observations and only read requests', async () => {
  await start();
  expect(text('overall-status')).toBe('Las 5 sondas respondieron');
  expect(text('responding')).toBe('5 de 5');
  expect(text('system-uptime')).toBe('0 d 1 h 2 min');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  for (const [url, options] of fetchMock.mock.calls) {
    expect(['/api/monitoring/services', '/api/monitoring/health']).toContain(url);
    expect(options.cache).toBe('no-store');
    expect(options.method).toBeUndefined();
  }
});
test('a failed refresh clears successful readings instead of retaining green state', async () => {
  await start();
  fetchMock.mockRejectedValue(new Error('Network unavailable'));
  document.getElementById('refresh').click();
  await flush();
  expect(text('overall-status')).toContain('desconocido');
  expect(text('responding')).toBe('Sin comprobar');
  expect(text('system-uptime')).toBe('No disponible');
  expect(document.querySelectorAll('[data-status="online"]')).toHaveLength(0);
});
test('rejects stale API responses even when transport succeeds', async () => {
  fetchMock.mockImplementation(async () => ({ok: true, json: async () => ({...reading(), timestamp: new Date(Date.now() - 180000).toISOString()})}));
  await start();
  expect(text('responding')).toBe('Sin comprobar');
  expect(text('system-uptime')).toBe('No disponible');
});
test('missing services remain unknown and do not imply complete health', async () => {
  fetchMock.mockImplementation(async () => ({ok: true, json: async () => ({...reading(), services: reading().services.slice(1)})}));
  await start();
  expect(text('overall-status')).toContain('incompleta');
  expect(text('responding')).toBe('4 de 5');
  expect(document.querySelectorAll('[data-status="unknown"]')).toHaveLength(1);
});
test('distinguishes a failed probe from an unknown probe', async () => {
  fetchMock.mockImplementation(async () => {
    const data = reading(); data.services[0].status = 'offline';
    return {ok: true, json: async () => data};
  });
  await start();
  expect(text('overall-status')).toBe('Hay sondas sin respuesta');
  expect(text('responding')).toBe('4 de 5');
});
test('expires readings while a tab is hidden', async () => {
  await start();
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  jest.advanceTimersByTime(130000);
  expect(text('overall-status')).toContain('venció');
  expect(text('system-uptime')).toBe('No disponible');
});
test('going offline clears all previous observations immediately', async () => {
  await start();
  window.dispatchEvent(new Event('offline'));
  expect(text('overall-status')).toContain('sin conexión');
  expect(text('response-time')).toBe('No disponible');
});
test('reconnect queues a fresh reading when an old request is still pending', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  fetchMock.mockImplementation(() => pending);
  window.eval(script);
  await flush();
  window.dispatchEvent(new Event('offline'));
  window.dispatchEvent(new Event('online'));
  fetchMock.mockImplementation(async () => ({ok: true, json: async () => reading()}));
  release({ok: true, json: async () => reading()});
  await flush();
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(text('overall-status')).toBe('Las 5 sondas respondieron');
});
function workerContext() {
  const handlers = {};
  const cache = {put: jest.fn()};
  const caches = {open: jest.fn(async () => cache), keys: jest.fn(async () => ['um-dashboard-v1', 'um-dashboard-v2-real-readings', 'um-public-v1.0.0', 'um-dashboard-other-app']), delete: jest.fn(async () => true), match: jest.fn()};
  const self = {location: {origin: 'https://www.ultimamilla.com.ar'}, addEventListener: (name, fn) => { handlers[name] = fn; }, clients: {claim: jest.fn(async () => {}), matchAll: jest.fn(async () => [])}};
  class Response { constructor(body, options) { this.body = body; this.status = options.status; } }
  const fetch = jest.fn();
  vm.runInNewContext(worker, {self, caches, fetch, URL, Response});
  return {handlers, caches, fetch, self};
}
test('worker does not serve a cached API success while offline', async () => {
  const {handlers, caches, fetch} = workerContext();
  fetch.mockRejectedValue(new Error('offline'));
  let response;
  handlers.fetch({request: {method: 'GET', url: 'https://www.ultimamilla.com.ar/api/monitoring/services'}, respondWith: promise => { response = promise; }});
  expect((await response).status).toBe(503);
  expect(caches.match).not.toHaveBeenCalled();
  expect(caches.open).not.toHaveBeenCalled();
});
test('worker migration preserves caches owned by other applications', async () => {
  const {handlers, caches} = workerContext();
  let completed;
  handlers.activate({waitUntil: promise => { completed = promise; }});
  await completed;
  expect(caches.delete.mock.calls).toEqual([['um-dashboard-v1']]);
});
test('activation finishes before reload completes and does not navigate other applications', async () => {
  const {handlers, self} = workerContext();
  const statusClient = {url: 'https://www.ultimamilla.com.ar/status/', navigate: jest.fn(() => new Promise(() => {}))};
  const otherClient = {url: 'https://www.ultimamilla.com.ar/dge/', navigate: jest.fn()};
  self.clients.matchAll.mockResolvedValue([statusClient, otherClient]);
  let completed;
  handlers.activate({waitUntil: promise => { completed = promise; }});
  await completed;
  expect(statusClient.navigate).toHaveBeenCalledWith(statusClient.url);
  expect(otherClient.navigate).not.toHaveBeenCalled();
});
