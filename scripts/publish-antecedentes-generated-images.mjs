#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = 'work/antecedentes-images/salida_web';
const PUBLIC_ROOT = 'public/images/antecedentes/generated';
const MAP_FILE = 'src/data/antecedentes-generated-image-map.json';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
    if (args[key] !== true) i += 1;
  }
  return args;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function readQaRows(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text) return [];
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function readRowsFromFilenames(dir) {
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.webp'))
    .map((webp) => ({
      antecedente_id: webp.match(/^\d+/)?.[0] || '',
      webp,
    }))
    .filter((row) => row.antecedente_id);
}

function listLotes(selectedLote) {
  const lotes = fs.readdirSync(SOURCE_ROOT)
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
  return selectedLote ? lotes.filter((lote) => lote === selectedLote) : lotes;
}

const args = parseArgs(process.argv.slice(2));
const selectedLote = args.lote ? String(args.lote) : '';
const resetMap = args.reset === true;
const map = !resetMap && fs.existsSync(MAP_FILE)
  ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'))
  : {};
let copied = 0;

for (const lote of listLotes(selectedLote)) {
  const sourceDir = path.join(SOURCE_ROOT, lote);
  const qaFile = path.join(sourceDir, 'qa.csv');
  const rows = fs.existsSync(qaFile) ? readQaRows(qaFile) : readRowsFromFilenames(sourceDir);
  if (rows.length === 0) continue;

  const publicDir = path.join(PUBLIC_ROOT, lote);
  fs.mkdirSync(publicDir, { recursive: true });

  for (const row of rows) {
    const id = String(row.antecedente_id || '').trim();
    const webp = path.basename(String(row.webp || row.output_webp || '').trim());
    if (!id || !webp) continue;

    const source = path.join(sourceDir, webp);
    const dest = path.join(publicDir, webp);
    if (!fs.existsSync(source)) {
      console.warn(`[publish-antecedentes] missing ${source}`);
      continue;
    }

    fs.copyFileSync(source, dest);
    map[id] = `/images/antecedentes/generated/${lote}/${webp}`;
    copied += 1;
  }
}

fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
fs.writeFileSync(MAP_FILE, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ copied, mapped: Object.keys(map).length, selectedLote: selectedLote || null, mapFile: MAP_FILE }, null, 2));
