#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = 'work/antecedentes-images';
const LOTES_ROOT = path.join(ROOT, 'lotes');
const RAW_ROOT = path.join(ROOT, 'generadas_crudas');
const MAP_FILE = 'src/data/antecedentes-generated-image-map.json';
const DEFAULT_SOURCE_DIR = '/Users/santosma/.codex/generated_images/019e8d52-3c56-7802-b4fa-d0e39eca274b';
const IMG_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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

function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text) return [];
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function loteNumber(lote) {
  return Number(lote.match(/\d+$/)?.[0] ?? 0);
}

function listLotes() {
  return fs.readdirSync(LOTES_ROOT)
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort((a, b) => loteNumber(a) - loteNumber(b));
}

function readManifest(lote) {
  return readCsv(path.join(LOTES_ROOT, lote, 'manifest.csv'));
}

function readPublishedMap() {
  if (!fs.existsSync(MAP_FILE)) return {};
  return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
}

function nextMissingLote() {
  const map = readPublishedMap();
  for (const lote of listLotes()) {
    const manifest = readManifest(lote);
    const missing = manifest.filter((row) => !map[String(row.antecedente_id || '').trim()]);
    if (missing.length > 0) return { lote, manifest, missing };
  }
  return null;
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => IMG_EXTS.has(path.extname(file).toLowerCase()))
    .map((file) => {
      const full = path.join(dir, file);
      return { file, full, mtimeMs: fs.statSync(full).mtimeMs };
    });
}

function latestRawMtime() {
  if (!fs.existsSync(RAW_ROOT)) return 0;
  let latest = 0;
  for (const lote of fs.readdirSync(RAW_ROOT).filter((entry) => /^lote_\d+$/.test(entry))) {
    for (const image of listImages(path.join(RAW_ROOT, lote))) {
      latest = Math.max(latest, image.mtimeMs);
    }
  }
  return latest;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`);
  }
}

function processLote(lote, sourceDir) {
  run('node', ['scripts/antecedentes_images/cli.mjs', 'ingest-latest', '--lote', lote, '--source-dir', sourceDir]);
  run('node', ['scripts/antecedentes_images/cli.mjs', 'postprocess', '--lote', lote]);
  run('node', ['scripts/antecedentes_images/cli.mjs', 'gallery', '--lote', lote]);
  run('node', ['scripts/antecedentes_images/cli.mjs', 'contact-sheet', '--lote', lote]);
  run('node', ['scripts/publish-antecedentes-generated-images.mjs', '--lote', lote]);
  run('node', ['scripts/antecedentes_images/audit.mjs']);
}

function checkOnce(args) {
  const sourceDir = String(args['source-dir'] || DEFAULT_SOURCE_DIR);
  const next = nextMissingLote();
  if (!next) {
    console.log(JSON.stringify({ status: 'complete', message: 'No missing lotes' }, null, 2));
    return true;
  }

  const checkpoint = latestRawMtime();
  const newImages = listImages(sourceDir)
    .filter((image) => image.mtimeMs > checkpoint)
    .sort((a, b) => a.mtimeMs - b.mtimeMs);

  const required = next.missing.length;
  const payload = {
    status: newImages.length >= required ? 'ready' : 'waiting',
    nextLote: next.lote,
    required,
    newImages: newImages.length,
    sourceDir,
    checkpoint: checkpoint ? new Date(checkpoint).toISOString() : null,
  };
  console.log(JSON.stringify(payload, null, 2));

  if (newImages.length < required) return false;
  processLote(next.lote, sourceDir);
  return true;
}

const args = parseArgs(process.argv.slice(2));
const intervalMinutes = Number(args['interval-minutes'] || 15);

if (args.once) {
  checkOnce(args);
} else {
  checkOnce(args);
  setInterval(() => {
    try {
      checkOnce(args);
    } catch (error) {
      console.error(error);
    }
  }, intervalMinutes * 60 * 1000);
}
