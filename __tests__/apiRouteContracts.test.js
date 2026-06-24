const fs = require('fs');
const path = require('path');

const source = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('API route contracts', () => {
  test('get-articles uses an Astro GET handler and an existing Directus helper', () => {
    const route = source('src/pages/api/get-articles.ts');

    expect(route).toContain('export const GET');
    expect(route).toContain('getBlogPosts');
    expect(route).not.toContain('export async function get');
    expect(route).not.toContain('getItems');
  });

  test('status dashboard registers only its scoped service worker', () => {
    const dashboard = source('public/status/index.html');

    expect(dashboard).toContain("navigator.serviceWorker.register('/status/service-worker.js')");
    expect(dashboard).not.toContain("navigator.serviceWorker.register('/service-worker.js')");
  });

  test('status dashboard service worker does not fabricate demo data or invalid response status', () => {
    const worker = source('public/status/service-worker.js');

    expect(worker).toContain('status: 503');
    expect(worker).not.toContain('status: 0');
    expect(worker).not.toContain('demo: true');
  });

  test('legacy clean antecedente route renders CMS descriptions as escaped text', () => {
    const route = source('src/pages/antecedentes/_[slug].astro');

    expect(route).toContain('plainTextFromHtml');
    expect(route).not.toContain('set:html={antecedente.Descripcion');
    expect(route).not.toContain('set:html={antecedente.descripcion');
  });
});
