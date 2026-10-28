const fs = require('node:fs');
const path = require('node:path');

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
});
