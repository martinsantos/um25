/**
 * Variantes de las fotos. De cada foto principal de antecedente (1600 px, ~220 KB): 960 px para
 * teléfonos y columnas angostas (~60 KB, elegida por srcset). De cada foto editorial (1672 px,
 * ~340 KB): 480 px para cuando hace de miniatura de ficha (~20 KB), y AVIF a 960 y 1672 px para
 * la apertura, donde es el elemento LCP (la mitad del peso del WebP). Idempotente: sólo genera lo
 * que falta.
 *
 *   node scripts/propuesta/imagenes-960.mjs
 */
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const raiz = 'public/images/antecedentes/generated';
let hechas = 0, bytes = 0;
for (const lote of readdirSync(raiz)) {
  const dir = join(raiz, lote); if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('-principal.webp')) continue;
    const out = join(dir, f.replace(/-principal\.webp$/, '-principal-960.webp'));
    if (existsSync(out)) continue;
    await sharp(join(dir, f)).resize({ width: 960 }).webp({ quality: 76 }).toFile(out);
    hechas++; bytes += statSync(out).size;
  }
}
console.log(`960 px: ${hechas} generadas, ${(bytes / 1024 / 1024).toFixed(1)} MB en total`);

const editorial = 'public/images/editorial';
let chicas = 0;
for (const f of readdirSync(editorial)) {
  if (!/^umsa-[a-z0-9-]+\.webp$/.test(f) || /-(480|960)\.webp$/.test(f)) continue;
  const out = join(editorial, f.replace(/\.webp$/, '-480.webp'));
  if (existsSync(out)) continue;
  await sharp(join(editorial, f)).resize({ width: 480 }).webp({ quality: 76 }).toFile(out);
  chicas++;
}
console.log(`480 px editoriales: ${chicas} generadas`);

let avif = 0, avifBytes = 0;
for (const f of readdirSync(editorial)) {
  if (!/^umsa-[a-z0-9-]+\.webp$/.test(f) || /-(480|960)\.webp$/.test(f)) continue;
  for (const [sufijo, ancho] of [['-960.avif', 960], ['.avif', null]]) {
    const out = join(editorial, f.replace(/\.webp$/, sufijo));
    if (existsSync(out)) continue;
    let img = sharp(join(editorial, f)); if (ancho) img = img.resize({ width: ancho });
    await img.avif({ quality: 52, effort: 5 }).toFile(out);
    avif++; avifBytes += statSync(out).size;
  }
}
console.log(`AVIF editoriales: ${avif} generadas, ${(avifBytes / 1024).toFixed(0)} KB en total`);
