#!/usr/bin/env node
/**
 * Escribe las isometrías de sitio dibujadas con el kit (src/lib/iso/sitio.mjs) en
 * public/cine/iso/site-<sitio>-v3.svg. Las v2 quedan intactas para producción.
 *
 * Uso: node scripts/cine/sitios.mjs [building …]
 */
import { writeFileSync } from 'node:fs';
import { sitioSvg } from '../../src/lib/iso/sitio.mjs';

const sitios = process.argv.slice(2).length ? process.argv.slice(2) : ['building'];
for (const s of sitios) {
  const svg = sitioSvg(s);
  if (!svg) { console.log(`${s}: sin programa`); continue; }
  writeFileSync(new URL(`../../public/cine/iso/site-${s}-v3.svg`, import.meta.url), svg);
  console.log(`site-${s}-v3.svg ${svg.length} bytes`);
}
