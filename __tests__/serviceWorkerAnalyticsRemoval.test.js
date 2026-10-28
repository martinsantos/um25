const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const workerPaths = [
  'public/sw.js',
  'public/sw-um25.js',
  'public/status/service-worker.js',
];

describe('delivered service workers', () => {
  test.each(workerPaths)('%s does not submit obsolete analytics events', relativePath => {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    expect(source).not.toMatch(/\/api\/analytics/);
    expect(source).not.toMatch(/event\.tag\s*===?\s*['"]analytics['"]/);
    expect(source).not.toMatch(/syncAnalytics/);
  });

  test('legacy worker keeps contact form background sync and offline fallback', () => {
    const legacyWorker = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
    expect(legacyWorker).toContain("event.tag === 'contact-form'");
    expect(legacyWorker).toContain('syncContactForms()');
    expect(legacyWorker).toContain("fetch('/api/contact'");
    expect(legacyWorker).toContain('getFallbackResponse');
  });

  test('legacy worker activation preserves status and other apps caches', async () => {
    const legacyWorker = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
    const handlers = {};
    const caches = {
      keys: jest.fn(async () => ['um-public-v1.0.0', 'um-dynamic-v1.0.0', 'um-dashboard-v4-runtime-validation', 'other-app-cache']),
      delete: jest.fn(async () => true),
    };
    const self = {
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: {claim: jest.fn(async () => {})},
    };
    vm.runInNewContext(legacyWorker, {self, caches, console: {log: jest.fn()}});

    let activation;
    handlers.activate({waitUntil: promise => { activation = promise; }});
    await activation;

    expect(self.clients.claim).toHaveBeenCalledTimes(1);
    expect(caches.keys).not.toHaveBeenCalled();
    expect(caches.delete).not.toHaveBeenCalled();
  });
});
