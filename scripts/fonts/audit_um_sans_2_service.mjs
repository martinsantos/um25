import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Read-only edge check: public bytes, cross-origin font access, catalogue routes.
const base = (process.argv[2] || 'https://www.ultimamilla.com.ar').replace(/\/$/, '');
const prefix = '/fonts/um-sans/v2.0.0';
const root = path.resolve('public' + prefix);
const resourceVersion = '2026.10.10-r4';
const resourcePrefix = `/downloads/plantillas-um-sans/${resourceVersion}`;
const resourceRoot = path.resolve('public' + resourcePrefix);
const resourcePackage = `Plantillas-UMSans2-${resourceVersion}.zip`;
const requireCors = !process.argv.includes('--local');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function get(url) {
  const response = await fetch(base + url, {
    headers: { Origin: 'https://sgi.ultimamilla.com.ar' },
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response;
}
async function verify(file, urlPrefix = prefix, localRoot = root) {
  const response = await get(`${urlPrefix}/${file}`);
  if (requireCors && /\.(woff2|css)$/.test(file)) {
    assert.equal(response.headers.get('access-control-allow-origin'), '*', `${file}: CORS`);
    assert.match(response.headers.get('cache-control') || '', /max-age=2592000/, `${file}: cache`);
  }
  const actual = Buffer.from(await response.arrayBuffer());
  assert.equal(hash(actual), hash(await fs.readFile(path.join(localRoot, file))), `${file}: changed bytes`);
}
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const templates = JSON.parse(await fs.readFile(path.join(root, 'plantillas/manifest.json'), 'utf8'));
const files = [
  'manifest.json', 'um-sans.css', 'LICENSE.txt', 'UMSans2-2.0.0.zip',
  'compat/UMSans-Variable.woff2', 'compat/UMSans-VariableItalic.woff2', 'compat/OFL.txt',
  ...manifest.files.map(file => file.file),
  'plantillas/manifest.json', 'plantillas/Plantillas-UMSans2-2.0.0.zip',
  ...templates.files.map(file => `plantillas/${file.file}`),
];
for (let index = 0; index < files.length; index += 6) {
  await Promise.all(files.slice(index, index + 6).map(file => verify(file)));
}
// The font release and earlier template downloads remain immutable. The
// catalogue now serves the separately versioned, corrected document package.
const resources = JSON.parse(await fs.readFile(path.join(resourceRoot, 'manifest.json'), 'utf8'));
assert.equal(resources.version, resourceVersion, 'resource manifest: version');
assert.equal(resources.fontVersion, manifest.version, 'resource manifest: font version');
for (const file of resources.files) {
  assert.match(file.path, /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.[a-zA-Z0-9]+$/, 'resource manifest: path');
  const bytes = await fs.readFile(path.join(resourceRoot, file.path));
  assert.equal(bytes.length, file.bytes, `${file.path}: manifest size`);
  assert.equal(hash(bytes), file.sha256, `${file.path}: manifest hash`);
}
for (const file of ['oferta-completa.docx', 'resumen-comercial.docx', 'membrete.docx',
  'oferta-economica.xlsx', 'presupuesto-interno.xlsx', 'presupuesto-interno.pdf']) {
  assert(resources.files.some(entry => entry.path === file), `${file}: missing from resource manifest`);
}
const resourceFiles = ['manifest.json', resourcePackage, ...resources.files.map(file => file.path)];
for (let index = 0; index < resourceFiles.length; index += 6) {
  await Promise.all(resourceFiles.slice(index, index + 6).map(file => verify(file, resourcePrefix, resourceRoot)));
}
for (const [route, marker] of [
  ['/estilo/fuente', 'data-font-release="2.0.0"'],
  ['/estilo/fuentes/plantilla', `${resourcePrefix}/${resourcePackage}`],
  ['/estilo/fuente/plantillas', `${resourcePrefix}/${resourcePackage}`],
  ['/estilo/fuente/planillas', `${resourcePrefix}/${resourcePackage}`],
  ['/estilo/fuente/planilla', `${resourcePrefix}/${resourcePackage}`],
  ['/planilla', `${resourcePrefix}/${resourcePackage}`],
  ['/fuente', 'data-font-release="2.0.0"'],
  ['/estilos/fuente', 'data-font-release="2.0.0"'],
  ['/estilos/fuente/plantilla', `${resourcePrefix}/${resourcePackage}`],
  ['/estilo/fuente/plantilla', `${resourcePrefix}/${resourcePackage}`],
]) {
  const html = await (await get(route)).text();
  assert(html.includes(marker), `${route}: missing ${marker}`);
  assert(html.includes('data-font-system="um-sans-2.0.0"'), `${route}: old runtime`);
}
for (const [route, destination] of [
  ['/fuente', '/estilo/fuente'],
  ['/estilos/fuente', '/estilo/fuente'],
  ['/estilos', '/estilo'],
  ...['/planilla', '/estilo/fuente/plantilla', '/estilo/fuente/plantillas',
    '/estilo/fuente/planilla', '/estilo/fuente/planillas', '/estilos/fuente/plantilla']
    .map(route => [route, '/estilo/fuentes/plantilla']),
]) {
  const response = await fetch(base + route, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 301, `${route}: permanent redirect`);
  assert.equal(new URL(response.headers.get('location'), base).pathname, destination, `${route}: destination`);
}
// Existing clients must still receive the exact 1.2 binary.
const legacy = Buffer.from(await (await get('/fonts/um-sans/UMSans-Variable.woff2')).arrayBuffer());
assert.equal(hash(legacy), hash(await fs.readFile(path.resolve('public/fonts/um-sans/UMSans-Variable.woff2'))));
console.log(JSON.stringify({ base, version: manifest.version, resourceVersion, verifiedFiles: files.length + resourceFiles.length, corsChecked: requireCors, legacyUnchanged: true }));
