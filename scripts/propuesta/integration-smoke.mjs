/** Read-only checks against the built website. Never submits contact forms. */
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:4321';
const request = (path, options = {}) => fetch(new URL(path, base), { signal: AbortSignal.timeout(45000), ...options });
const routes = ['/', '/servicios', ...Array.from({ length: 8 }, (_, i) => `/servicios/${101 + i}`), '/sectores', ...['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud'].map(s => `/sectores/${s}`), '/antecedentes', '/nosotros', '/contacto', '/documentacion', '/privacidad', '/blog', '/en', '/en/services', '/en/about', '/en/contact', '/software', '/seguridad-electronica', '/cctvai', '/certificaciones', '/terminos', '/servicios-it-empresas-mendoza', '/presupuesto-servicios-it-empresas', '/proyectos-ingenieria-it-mendoza', '/servicios-it-empresas-argentina'];
const assets = new Set();
for (const path of routes) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes(`href="https://www.ultimamilla.com.ar${path}"`), `canonical ${path}`);
  assert.ok(!/href="\/propuesta(?:\/|["?#])/.test(html), `internal navigation ${path}`);
  assert.match(html, /<h1\b/, `heading ${path}`);
  assert.match(html, /application\/ld\+json/, `structured data ${path}`);
  if (['/', '/en', '/servicios', '/en/services', '/nosotros', '/en/about', '/contacto', '/en/contact'].includes(path)) {
    assert.match(html, /hreflang="es-AR"/, `Spanish alternate ${path}`);
    assert.match(html, /hreflang="en"/, `English alternate ${path}`);
    assert.ok(!html.includes('hreflang="en" href="https://www.ultimamilla.com.ar/en/contacto"'), `canonical English contact ${path}`);
  }
  for (const match of html.matchAll(/(?:src|poster)="(\/(?:images|cine|_astro)[^"?#]+)"/g)) assets.add(match[1]);
}
for (const [from, to] of [['/propuesta', '/'], ['/propuesta/servicios/101', '/servicios/101'], ['/aeropuertos', '/sectores/aeropuertos'], ['/servicios/101/redes', '/servicios/101'], ['/en/contacto', '/en/contact']]) {
  const response = await request(from + '?origen=control', { redirect: 'manual' });
  assert.equal(response.status, 301, from);
  assert.equal(response.headers.get('location'), to + '?origen=control', from);
}
const catalogue = await (await request('/antecedentes/datos.json')).json();
assert.ok(catalogue.fichas.length >= 500, 'complete catalogue');
const sitemapResponse = await request('/sitemap-antecedentes.xml');
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
for (const item of catalogue.fichas) {
  assert.ok(item.foto, `image ${item.id}`);
  assert.ok(sitemap.includes(`/antecedentes/${item.id}/${item.slug}`), `indexed ${item.id}`);
  assets.add(item.foto.startsWith('/') ? item.foto : catalogue.prefijo + item.foto);
}
for (const item of catalogue.fichas.filter((_, i) => i % 60 === 0)) {
  const path = `/antecedentes/${item.id}/${item.slug}`;
  const response = await request(path, { redirect: 'manual' });
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), /<img\b/, `detail image ${path}`);
}
for (const path of ['/estilo/fuentes/plantilla', '/status/', '/sitemap.xml', '/sitemap-index.xml', '/robots.txt']) {
  assert.equal((await request(path)).status, 200, `retained ${path}`);
}
const queue = [...assets];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const path = queue.pop();
    const response = await request(path, { method: 'HEAD' });
    assert.equal(response.status, 200, `asset ${path}`);
    assert.ok(!response.headers.get('content-type')?.includes('text/html'), `asset content ${path}`);
  }
}));
console.log(`PASS: ${routes.length} public routes, redirects, ${catalogue.fichas.length} indexed stories, ${assets.size} assets, preserved auxiliary routes.`);
