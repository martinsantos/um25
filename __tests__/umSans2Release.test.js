const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const opentype = require('opentype.js');

const root = path.join(process.cwd(), 'public/fonts/um-sans/v2.0.0');
const read = name => fs.readFileSync(path.join(root, name));
const manifest = JSON.parse(read('manifest.json'));

describe('UM Sans 2 production distribution', () => {
  test('matches every published binary to the release manifest', () => {
    expect(manifest.files).toHaveLength(58);
    for (const file of manifest.files) {
      const bytes = read(file.file);
      expect(bytes.length).toBe(file.bytes);
      expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
      expect(file.drawingAndLayoutUnchanged).toBe(true);
    }
  });

  test('all static office fonts have the stated version, repertoire and embedding rights', () => {
    const faces = manifest.files.filter(file => file.file.endsWith('.ttf') && !file.file.includes('Variable'));
    expect(faces).toHaveLength(18);
    const weights = [];
    for (const face of faces) {
      const bytes = read(face.file);
      const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      expect(font.names.version.en).toMatch(/2\.000/);
      expect(font.names.postScriptName.en).toMatch(/^UMSans2-/);
      expect(font.tables.os2.fsType).toBe(4);
      expect(font.glyphs.length).toBe(150);
      for (const character of 'Última Ñandú conexión ¿¡€$%0123456789') {
        expect(font.charToGlyphIndex(character)).toBeGreaterThan(0);
      }
      weights.push(font.tables.os2.usWeightClass);
    }
    expect(weights.sort((a, b) => a - b)).toEqual(manifest.weights.flatMap(weight => [weight, weight]));
  });

  test('ships separate licensed fallback and complete, checksummed document formats', () => {
    expect(read('compat/OFL.txt').toString()).toContain('SIL OPEN FONT LICENSE');
    for (const file of ['UMSans-Variable.woff2', 'UMSans-VariableItalic.woff2']) {
      expect(read(`compat/${file}`).equals(fs.readFileSync(path.join(root, '..', file)))).toBe(true);
    }
    const templates = JSON.parse(read('plantillas/manifest.json'));
    for (const file of templates.files) {
      const bytes = read(`plantillas/${file.file}`);
      expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
      expect(bytes.length).toBe(file.bytes);
    }
    for (const name of ['oferta-completa', 'resumen-comercial', 'membrete']) {
      for (const format of ['html', 'pdf', 'docx', 'dotx', 'odt']) {
        expect(templates.files.some(file => file.file === `${name}.${format}`)).toBe(true);
      }
    }
    expect(templates.files.some(file => file.file === 'oferta-economica.xlsx')).toBe(true);
  });
});


describe('UM Sans 2 public edge audit', () => {
  const http = require('http');
  const { spawn } = require('child_process');
  const packagePath = '/downloads/plantillas-um-sans/2026.10.10-r4/Plantillas-UMSans2-2026.10.10-r4.zip';
  const fontRoutes = ['/estilo/fuente', '/fuente', '/estilos/fuente'];
  const redirects = new Map([
    ['/fuente', '/estilo/fuente'], ['/estilos/fuente', '/estilo/fuente'], ['/estilos', '/estilo'],
    ...['/planilla', '/estilo/fuente/plantilla', '/estilo/fuente/plantillas',
      '/estilo/fuente/planilla', '/estilo/fuente/planillas', '/estilos/fuente/plantilla']
      .map(route => [route, '/estilo/fuentes/plantilla']),
  ]);

  async function audit({ staleCatalogue = false, corruptPackage = false } = {}) {
    const server = http.createServer((request, response) => {
      const url = request.url;
      if (redirects.has(url)) {
        response.writeHead(301, { Location: redirects.get(url) }).end();
      } else if (url.startsWith('/fonts/') || url.startsWith('/downloads/')) {
        const file = path.join(process.cwd(), 'public', url);
        const bytes = corruptPackage && url === packagePath ? Buffer.from('broken archive') : fs.readFileSync(file);
        response.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=2592000' }).end(bytes);
      } else {
        const marker = fontRoutes.includes(url) ? 'data-font-release="2.0.0"'
          : staleCatalogue ? 'Plantillas-UMSans2-2.0.0.zip' : packagePath;
        response.writeHead(200).end(`<html data-font-system="um-sans-2.0.0">${marker}</html>`);
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      return await new Promise((resolve, reject) => {
        const process = spawn(global.process.execPath, ['scripts/fonts/audit_um_sans_2_service.mjs',
          `http://127.0.0.1:${server.address().port}`]);
        let output = '';
        process.stdout.on('data', bytes => { output += bytes; });
        process.stderr.on('data', bytes => { output += bytes; });
        process.on('error', reject);
        process.on('close', code => resolve({ code, output }));
      });
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  }

  test('accepts corrected catalogue and verifies both immutable font and document releases', async () => {
    const result = await audit();
    expect(result.code).toBe(0);
    expect(JSON.parse(result.output)).toMatchObject({ version: '2.0.0', resourceVersion: '2026.10.10-r4',
      corsChecked: true, legacyUnchanged: true });
  }, 30000);

  test('rejects a catalogue still pointing to the superseded package', async () => {
    const result = await audit({ staleCatalogue: true });
    expect(result.code).not.toBe(0);
    expect(result.output).toContain(`/estilo/fuentes/plantilla: missing ${packagePath}`);
  }, 30000);

  test('rejects altered bytes in the served corrected ZIP', async () => {
    const result = await audit({ corruptPackage: true });
    expect(result.code).not.toBe(0);
    expect(result.output).toContain('Plantillas-UMSans2-2026.10.10-r4.zip: changed bytes');
  }, 30000);
});
