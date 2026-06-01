/**
 * Acorta descripciones boilerplate en snapshots sin inventar hechos.
 * Uso: node scripts/enrich-antecedentes-snapshot.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(root, '../src/data/snapshots/antecedentes.json');

const BOILERPLATE_RE = /^Ejecución integral de\s+/i;
const BOILERPLATE_TAIL_RE = /\s*,?\s*asegurando continuidad operativa.*$/i;

function enrichDescription(item) {
  const desc = String(item.Descripcion || '').trim();
  if (!BOILERPLATE_RE.test(desc)) return desc;

  const title = String(item.Titulo || '').trim();
  const client = String(item.Cliente || '').trim();
  const area = String(item.Area || item.Unidad_de_negocio || '').trim();

  const core = desc
    .replace(BOILERPLATE_RE, '')
    .replace(BOILERPLATE_TAIL_RE, '')
    .replace(/\s+para\s+[^,]+,\s*$/i, '')
    .trim();

  const subject = title || core.replace(/\s+para\s+.+$/i, '').trim() || 'Proyecto documentado';
  const parts = [subject];

  if (client && !subject.toLowerCase().includes(client.toLowerCase())) {
    parts.push(`Cliente: ${client}.`);
  } else if (client) {
    parts.push(`Cliente: ${client}.`);
  }

  if (area) parts.push(`Sector: ${area}.`);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const raw = await readFile(snapshotPath, 'utf8');
const payload = JSON.parse(raw);
let updated = 0;

for (const item of payload.data || []) {
  const next = enrichDescription(item);
  if (next && next !== item.Descripcion) {
    item.Descripcion = next;
    updated += 1;
  }
}

await writeFile(snapshotPath, `${JSON.stringify(payload)}\n`, 'utf8');
console.log(`antecedentes snapshot: ${updated} descripciones actualizadas`);
