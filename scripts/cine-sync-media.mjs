// Copia las movies v4 (escena × servicio) de work/cine/media a public/cine/v4 y escribe
// src/data/cine/films.generated.json con las que existen. Sólo entra lo que sirve la web:
// 1080p, recorte cuadrado para teléfonos, póster, pista de etiquetas y vista previa liviana
// (el máster queda afuera).
// Corre en prebuild; public/cine/v4 no se versiona (la fuente es work/cine/media).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'work/cine/media');
const dst = path.join(root, 'public/cine/v4');
const out = path.join(root, 'src/data/cine/films.generated.json');
const SUFFIX = ['.mp4', '-sq.mp4', '-poster.jpg', '-ar.json'];
const OPTIONAL = ['-preview.mp4']; // vista previa liviana para las grillas (scripts/cine-previews.sh)

fs.mkdirSync(dst, { recursive: true });
const ids = fs.existsSync(src)
  ? [...new Set(fs.readdirSync(src).map((f) => f.match(/^cine-([a-z]+-[a-z]+)(?:-master|-sq|-poster|-ar)?\.(?:mp4|jpg|json)$/)?.[1]).filter(Boolean))]
  : [];
const films = [];
let copied = 0;
for (const id of ids.sort()) {
  const files = SUFFIX.map((s) => `cine-${id}${s}`);
  if (!files.every((f) => fs.existsSync(path.join(src, f)))) continue;
  for (const f of [...files, ...OPTIONAL.map((s) => `cine-${id}${s}`).filter((f) => fs.existsSync(path.join(src, f)))]) {
    const a = path.join(src, f), b = path.join(dst, f);
    const sa = fs.statSync(a);
    if (fs.existsSync(b)) {
      const sb = fs.statSync(b);
      if (sb.size === sa.size && sb.mtimeMs >= sa.mtimeMs) continue;
    }
    fs.copyFileSync(a, b);
    copied++;
  }
  films.push(id);
}
const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
const next = `${JSON.stringify(films, null, 1)}\n`;
if (prev !== next) fs.writeFileSync(out, next);
console.log(`cine-sync: ${films.length} movies, ${copied} archivos copiados a public/cine/v4`);
