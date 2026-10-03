#!/usr/bin/env node
// Importa los medios web del cine v4 (recorrido por escena y servicio) desde la
// rama de render en la nube a public/cine/media y regenera el manifiesto
// src/data/cine/v4-media.json. Nunca copia los masters (-master.mp4).
//
//   node scripts/cine/import-v4-media.mjs --from-ref origin/render/cine-v4-nube
//   node scripts/cine/import-v4-media.mjs --from-dir ../otro-checkout/work/cine/media
//   node scripts/cine/import-v4-media.mjs            # sólo regenera el manifiesto
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const fromRef = opt('--from-ref');
const fromDir = opt('--from-dir');
const OUT = path.join(process.cwd(), 'public', 'cine', 'media');
const MANIFEST = path.join(process.cwd(), 'src', 'data', 'cine', 'v4-media.json');
const SCENES = ['aeropuerto', 'bodega', 'fachada', 'hospital', 'planta'];
const SERVICES = { redes: '101', seguridad: '102', telecom: '103', software: '104', soporte: '105', consultoria: '106', incendios: '107', electricos: '108' };
const WEB_SUFFIXES = ['.mp4', '-sq.mp4', '-poster.jpg', '-ar.json'];
const keyRe = new RegExp(`^cine-(${SCENES.join('|')})-(${Object.keys(SERVICES).join('|')})(-sq\\.mp4|-poster\\.jpg|-ar\\.json|\\.mp4)$`);

fs.mkdirSync(OUT, { recursive: true });
let copied = 0;
if (fromRef) {
  const list = execFileSync('git', ['ls-tree', '-r', '--name-only', fromRef, '--', 'work/cine/media']).toString().split('\n').filter(Boolean);
  for (const file of list) {
    const base = path.basename(file);
    if (!keyRe.test(base)) continue;
    const dest = path.join(OUT, base);
    const blob = execFileSync('git', ['show', `${fromRef}:${file}`], { maxBuffer: 1024 * 1024 * 256 });
    if (fs.existsSync(dest) && fs.readFileSync(dest).equals(blob)) continue;
    fs.writeFileSync(dest, blob);
    copied += 1;
    // Un póster re-renderizado deja viejo su AVIF: se borra para regenerarlo abajo.
    if (base.endsWith('-poster.jpg')) fs.rmSync(path.join(OUT, base.replace(/\.jpg$/, '.avif')), { force: true });
  }
} else if (fromDir) {
  for (const base of fs.readdirSync(fromDir)) {
    if (!keyRe.test(base)) continue;
    fs.copyFileSync(path.join(fromDir, base), path.join(OUT, base));
    copied += 1;
  }
}

// Poster AVIF por clave: el banner lo pide con <picture>; si faltara, el
// navegador no cae al JPEG y el cuadro queda negro.
const present0 = new Set(fs.readdirSync(OUT));
for (const base of present0) {
  const m = base.match(keyRe);
  if (!m || m[3] !== '-poster.jpg') continue;
  const avif = base.replace(/\.jpg$/, '.avif');
  if (present0.has(avif)) continue;
  await sharp(path.join(OUT, base)).avif({ quality: 52, effort: 5 }).toFile(path.join(OUT, avif));
}

// Manifiesto: una entrada por clave escena-servicio con los cuatro archivos presentes.
const present = new Set(fs.readdirSync(OUT));
const manifest = {};
for (const scene of SCENES) {
  for (const [service, code] of Object.entries(SERVICES)) {
    const key = `${scene}-${service}`;
    const files = Object.fromEntries(WEB_SUFFIXES.map((s) => [s, `cine-${key}${s}`]));
    if (!present.has(files['.mp4']) || !present.has(files['-poster.jpg'])) continue;
    manifest[key] = {
      scene,
      service,
      code,
      poster: `/cine/media/${files['-poster.jpg']}`,
      video: `/cine/media/${files['.mp4']}`,
      square: present.has(files['-sq.mp4']) ? `/cine/media/${files['-sq.mp4']}` : null,
      track: present.has(files['-ar.json']) ? `/cine/media/${files['-ar.json']}` : null,
    };
  }
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`copiados ${copied} archivos · manifiesto con ${Object.keys(manifest).length} recorridos escena-servicio`);
