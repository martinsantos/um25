// Miniaturas de 480 px para las imágenes principales de antecedentes.
// Cada `*-principal.webp` (1600×1000, 100 a 220 KB) recibe un `*-principal-480.webp`
// (480×300, ~20 KB) al lado. El listado /antecedentes usa la miniatura en las tarjetas
// y el mosaico, y deja la imagen completa para la ficha. Idempotente: salta las que existen.
//
// Uso: node scripts/antecedentes_images/make-thumbs.mjs [--force]
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIR = path.join(ROOT, 'public', 'images', 'antecedentes', 'generated');
const WIDTH = 480;
const QUALITY = 72;
const force = process.argv.includes('--force');

sharp.cache(false);
sharp.concurrency(2);

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('-principal.webp')) yield full;
  }
}

const exists = async (file) => fs.access(file).then(() => true, () => false);

let made = 0, skipped = 0, failed = 0;
for await (const source of walk(SOURCE_DIR)) {
  const target = source.replace(/-principal\.webp$/, `-principal-${WIDTH}.webp`);
  if (!force && await exists(target)) { skipped += 1; continue; }
  try {
    await sharp(source).resize(WIDTH, null, { withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(target);
    made += 1;
  } catch (error) {
    failed += 1;
    console.error(`No se pudo generar ${path.relative(ROOT, target)}: ${error.message}`);
  }
}
console.log(`Miniaturas: ${made} generadas, ${skipped} ya existían, ${failed} fallidas.`);
process.exit(failed ? 1 : 0);
