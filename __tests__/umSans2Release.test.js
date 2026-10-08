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
