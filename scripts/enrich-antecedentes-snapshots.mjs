/**
 * Acorta descripciones boilerplate "Ejecución integral de…" en snapshots
 * usando solo Titulo, Cliente, Area y Unidad_de_negocio (sin inventar hechos).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = join(root, 'src/data/snapshots/antecedentes.json');

const BOILERPLATE_RE =
  /^(?:Ejecución integral de|Realizamos la ejecución integral del?\s+)/i;
const BOILERPLATE_TAIL =
  /,?\s*asegurando continuidad operativa.*$/i;

function enrichDescription(item) {
  const original = String(item.Descripcion || '').trim();
  if (!BOILERPLATE_RE.test(original) && !BOILERPLATE_TAIL.test(original)) return original;
  if (!BOILERPLATE_RE.test(original)) {
    return original.replace(BOILERPLATE_TAIL, '').trim();
  }

  const titulo = String(item.Titulo || '').trim();
  if (!titulo) return original;

  const cliente = String(item.Cliente || '').trim();
  const area = String(item.Area || '').trim();
  const unidad = String(item.Unidad_de_negocio || '').trim();

  const parts = [`${titulo}${cliente ? ` para ${cliente}` : ''}.`];
  if (area) parts.push(`Rubro: ${area}.`);
  if (unidad && unidad !== area) parts.push(`Unidad ${unidad}.`);

  return parts.join(' ');
}

const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
let changed = 0;

snapshot.data = snapshot.data.map((item) => {
  const next = enrichDescription(item);
  if (next !== item.Descripcion) {
    changed += 1;
    return { ...item, Descripcion: next };
  }
  return item;
});

writeFileSync(snapshotPath, `${JSON.stringify(snapshot)}\n`, 'utf8');
console.log(`antecedentes.json: ${changed} descripciones enriquecidas de ${snapshot.data.length} registros.`);
