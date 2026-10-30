#!/usr/bin/env node
/**
 * Escribe public/cine/iso/partes.svg (las 31 partes como <symbol>) y una hoja de revisión.
 * Las partes viven en src/lib/iso/partes.mjs; el banco que las compone, en src/lib/iso/banco.mjs.
 *
 * Uso: node scripts/cine/partes.mjs [--hoja ruta.html]
 */
import { writeFileSync } from 'node:fs';
import { PARTES, NOMBRES, spriteSvg } from '../../src/lib/iso/partes.mjs';

const sprite = spriteSvg();
writeFileSync(new URL('../../public/cine/iso/partes.svg', import.meta.url), sprite);
console.log(`partes.svg: ${Object.keys(PARTES).length} partes, ${sprite.length} bytes`);

const i = process.argv.indexOf('--hoja');
if (i > 0) {
  const url = process.env.PARTES_URL || '/cine/iso/partes.svg';
  const hoja = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Partes</title><style>
body{margin:0;background:#0a0b0d;color:#c4c7cc;font:13px/1.4 Arial,sans-serif;padding:24px}
.g{display:grid;grid-template-columns:repeat(6,1fr);gap:20px}
.c{background:#111316;padding:12px;text-align:center}
.c svg{width:192px;height:192px;display:block;margin:0 auto 8px}
</style></head><body><div class="g">${Object.keys(PARTES).map((key) => `<div class="c"><svg class="parte" viewBox="0 0 64 64"><use href="${url}#p-${key}"/></svg>${NOMBRES[key]}</div>`).join('')}</div></body></html>`;
  writeFileSync(process.argv[i + 1], hoja);
}
