#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = 'work/antecedentes-images';
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

function requiredArg(args, key) {
  const value = args[key];
  if (!value || value === true) throw new Error(`Missing required --${key}`);
  return String(value);
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

function readManifest(lote) {
  const file = path.join(ROOT, 'lotes', lote, 'manifest.csv');
  const text = fs.readFileSync(file, 'utf8').trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function applySingle({ lote, id }) {
  const item = readManifest(lote).find((row) => String(row.antecedente_id) === id);
  if (!item) throw new Error(`${lote}: id ${id} not found in manifest`);

  const base = item.expected_filename || `${item.antecedente_id}-${item.slug}-principal`;
  const raw = path.join(ROOT, 'generadas_crudas', lote, `${base}.png`);
  if (!fs.existsSync(raw)) throw new Error(`Missing exact raw image: ${raw}`);

  const outputDir = path.join(ROOT, 'salida_web', lote);
  const publicDir = path.join(PUBLIC_ROOT, lote);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const webpName = `${base}.webp`;
  const jpgName = `${base}.jpg`;
  const webp = path.join(outputDir, webpName);
  const jpg = path.join(outputDir, jpgName);
  const publicWebp = path.join(publicDir, webpName);

  await sharp(raw)
    .resize(1600, 1000, { fit: 'cover', position: 'attention' })
    .webp({ quality: 88, effort: 6 })
    .toFile(webp);
  await sharp(raw)
    .resize(1600, 1000, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(jpg);

  fs.copyFileSync(webp, publicWebp);

  const map = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};
  map[id] = `/images/antecedentes/generated/${lote}/${webpName}`;
  fs.writeFileSync(MAP_FILE, `${JSON.stringify(map, null, 2)}\n`, 'utf8');

  return {
    lote,
    id,
    raw,
    webp,
    jpg,
    publicWebp,
    webpSha256: sha256(webp),
    publicSha256: sha256(publicWebp),
    mapped: Object.keys(map).length,
  };
}

const args = parseArgs(process.argv.slice(2));
const lote = requiredArg(args, 'lote');
const id = requiredArg(args, 'id');
console.log(JSON.stringify(await applySingle({ lote, id }), null, 2));
