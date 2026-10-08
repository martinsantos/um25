import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Read-only edge check: public bytes, cross-origin font access, catalogue routes.
const base = (process.argv[2] || 'https://www.ultimamilla.com.ar').replace(/\/$/, '');
const prefix = '/fonts/um-sans/v2.0.0';
const root = path.resolve('public' + prefix);
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
async function verify(file) {
  const response = await get(`${prefix}/${file}`);
  if (requireCors && /\.(woff2|css)$/.test(file)) {
    assert.equal(response.headers.get('access-control-allow-origin'), '*', `${file}: CORS`);
    assert.match(response.headers.get('cache-control') || '', /max-age=2592000/, `${file}: cache`);
  }
  const actual = Buffer.from(await response.arrayBuffer());
  assert.equal(hash(actual), hash(await fs.readFile(path.join(root, file))), `${file}: changed bytes`);
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
  await Promise.all(files.slice(index, index + 6).map(verify));
}
for (const [route, marker] of [
  ['/estilo/fuente', 'data-font-release="2.0.0"'],
  ['/estilo/fuentes/plantilla', 'Plantillas-UMSans2-2.0.0.zip'],
  ['/estilo/fuente/plantillas', 'Plantillas-UMSans2-2.0.0.zip'],
  ['/estilo/fuente/planillas', 'Plantillas-UMSans2-2.0.0.zip'],
]) {
  const html = await (await get(route)).text();
  assert(html.includes(marker), `${route}: missing ${marker}`);
  assert(html.includes('data-font-system="um-sans-2.0.0"'), `${route}: old runtime`);
}
// Existing clients must still receive the exact 1.2 binary.
const legacy = Buffer.from(await (await get('/fonts/um-sans/UMSans-Variable.woff2')).arrayBuffer());
assert.equal(hash(legacy), hash(await fs.readFile(path.resolve('public/fonts/um-sans/UMSans-Variable.woff2'))));
console.log(JSON.stringify({ base, version: manifest.version, verifiedFiles: files.length, corsChecked: requireCors, legacyUnchanged: true }));
