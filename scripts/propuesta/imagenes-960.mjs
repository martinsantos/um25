/**
 * Variante de 960 px de cada foto principal de antecedente (1600 px, ~220 KB) para teléfonos y
 * columnas angostas: ~60 KB, elegida por srcset. Idempotente: sólo genera lo que falta.
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
