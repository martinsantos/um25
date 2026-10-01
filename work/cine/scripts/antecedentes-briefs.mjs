#!/usr/bin/env node
// Arma fichas de imagen ilustrativa para los antecedentes del snapshot, con la
// dirección de arte "Cine técnico mendocino". El prompt usa sólo el SECTOR y el
// TIPO DE SERVICIO (nunca el nombre del cliente, marcas ni datos del caso): la
// imagen ilustra, no documenta. Salida: work/cine/image-briefs-antecedentes.json
//   node work/cine/scripts/antecedentes-briefs.mjs [--limit 20] [--ids 3064,3065]
//   node work/cine/scripts/openai-images.mjs --briefs work/cine/image-briefs-antecedentes.json --dry
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SNAPSHOT = resolve(ROOT, '../umsa-sitio-alfa/src/data/snapshots/antecedentes.json');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const limit = Number(opt('limit') || 0);
const ids = (opt('ids') || '').split(',').filter(Boolean);

const SETTINGS = [
  [/aeropuert/i, 'an airport terminal and apron in Mendoza, Argentina, the Andes on the horizon'],
  [/bodega|vitivin|vino/i, 'a modern winery in the Mendoza vineyards, stainless tanks and oak barrels'],
  [/salud|hospital|clínic|clinic/i, 'a calm, clean hospital technical corridor'],
  [/miner/i, 'a remote high-Andes mining camp'],
  [/industr|planta|fábrica/i, 'an industrial plant floor with process equipment'],
  [/gobierno|público|municip/i, 'a public administration building office floor in Mendoza'],
  [/construc|edific/i, 'a contemporary office building under construction, services risers and ceiling voids'],
  [/seguridad/i, 'a security monitoring room and building perimeter'],
  [/software|sgi/i, 'an operations office with engineers’ workstations seen from behind'],
];
const SUBJECTS = [
  [/cctv|cámara|camara|video/i, 'discreet IP security cameras (dome and PTZ) neatly installed, cabling concealed'],
  [/incendio|sdi|detección/i, 'addressable smoke detectors, a manual call point and a fire alarm control panel'],
  [/fibra|óptic|optic/i, 'a fiber-optic distribution frame with LC connectors and neatly routed fiber'],
  [/eléctric|electric|ups|tablero|energ/i, 'an IT electrical switchboard and a UPS system in a technical room'],
  [/telecom|radio|enlace|antena/i, 'a telecommunications mast with microwave dishes and a shelter cabinet'],
  [/software|digitaliz|sistema|app|web/i, 'workstations showing abstract dashboards without readable text, seen over the shoulder'],
  [/red|cableado|datos|switch|rack/i, 'a dressed network rack with patch panels, managed cabling and a cable tray above'],
];
const pick = (table, text, fallback) => (table.find(([re]) => re.test(text)) || [null, fallback])[1];

const { data } = JSON.parse(await readFile(SNAPSHOT, 'utf8'));
let items = data.filter((a) => !ids.length || ids.includes(String(a.id)));
if (limit) items = items.slice(0, limit);
const briefs = items.map((a) => {
  const text = `${a.Titulo || ''} ${a.Descripcion || ''} ${a.Area || ''}`;
  const setting = pick(SETTINGS, `${a.Area || ''} ${a.Titulo || ''}`, 'a technical room in Mendoza, Argentina');
  const subject = pick(SUBJECTS, text, 'IT infrastructure installed with care and documented labeling');
  return {
    id: `ant-${a.id}`,
    use: `Antecedente #${a.id} · ${a.Area || 'sin sector'} (imagen ilustrativa, no documental)`,
    size: '1536x1024',
    prompt: `Illustrative photograph for an IT infrastructure case study: ${subject}, in ${setting}. Finished, tidy, professional installation seen at working distance, no people facing camera.`,
  };
});
const base = JSON.parse(await readFile(join(ROOT, 'work/cine/image-briefs.json'), 'utf8'));
const out = join(ROOT, 'work/cine/image-briefs-antecedentes.json');
await writeFile(out, JSON.stringify({ style: base.style, briefs }, null, 2));
console.log(`${briefs.length} fichas → ${out}`);
