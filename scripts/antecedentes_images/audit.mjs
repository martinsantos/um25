#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'work/antecedentes-images';
const LOTES_ROOT = path.join(ROOT, 'lotes');
const OUTPUT_ROOT = path.join(ROOT, 'salida_web');
const MAP_FILE = 'src/data/antecedentes-generated-image-map.json';
const PUBLIC_ROOT = 'public';

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

function listDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort((a, b) => loteNumber(a) - loteNumber(b));
}

function readManifestIndex() {
  const byId = new Map();
  for (const lote of listDirs(LOTES_ROOT)) {
    const manifest = path.join(LOTES_ROOT, lote, 'manifest.csv');
    if (!fs.existsSync(manifest)) continue;
    for (const row of readCsv(manifest)) {
      const id = String(row.antecedente_id || '').trim();
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push({ lote, row });
    }
  }
  return byId;
}

function readProcessedIndex() {
  const byId = new Map();
  for (const lote of listDirs(OUTPUT_ROOT)) {
    const dir = path.join(OUTPUT_ROOT, lote);
    for (const file of fs.readdirSync(dir).filter((entry) => entry.endsWith('.webp'))) {
      const id = file.match(/^\d+/)?.[0];
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push({
        lote,
        file,
        path: `/images/antecedentes/generated/${lote}/${file}`,
      });
    }
  }
  return byId;
}

function readPublishedMap() {
  if (!fs.existsSync(MAP_FILE)) return {};
  return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
}

function repeatedValues(object) {
  const seen = new Map();
  const duplicates = [];
  for (const [key, value] of Object.entries(object)) {
    if (seen.has(value)) {
      duplicates.push({ value, ids: [seen.get(value), key] });
    } else {
      seen.set(value, key);
    }
  }
  return duplicates;
}

const args = parseArgs(process.argv.slice(2));
const manifest = readManifestIndex();
const processed = readProcessedIndex();
const published = readPublishedMap();
const manifestIds = [...manifest.keys()];
const processedIds = [...processed.keys()];
const publishedIds = Object.keys(published);

const duplicateManifestIds = manifestIds.filter((id) => manifest.get(id).length > 1);
const duplicateProcessedIds = processedIds.filter((id) => processed.get(id).length > 1);
const duplicatePublishedPaths = repeatedValues(published);
const missingProcessed = manifestIds.filter((id) => !processed.has(id));
const missingPublished = manifestIds.filter((id) => !published[id]);
const publishedWithoutManifest = publishedIds.filter((id) => !manifest.has(id));
const brokenPublishedAssets = Object.entries(published)
  .filter(([, publicPath]) => !fs.existsSync(path.join(PUBLIC_ROOT, publicPath)))
  .map(([id, publicPath]) => ({ id, publicPath }));

const summary = {
  lotes: listDirs(LOTES_ROOT).length,
  manifestRows: [...manifest.values()].reduce((total, rows) => total + rows.length, 0),
  manifestUnique: manifestIds.length,
  processedUnique: processedIds.length,
  publishedUnique: publishedIds.length,
  duplicateManifestIds: duplicateManifestIds.length,
  duplicateProcessedIds: duplicateProcessedIds.length,
  duplicatePublishedPaths: duplicatePublishedPaths.length,
  missingProcessed: missingProcessed.length,
  missingPublished: missingPublished.length,
  publishedWithoutManifest: publishedWithoutManifest.length,
  brokenPublishedAssets: brokenPublishedAssets.length,
};

const details = {
  firstMissingProcessed: missingProcessed.slice(0, 20),
  firstMissingPublished: missingPublished.slice(0, 20),
  firstDuplicateManifestIds: duplicateManifestIds.slice(0, 20),
  firstDuplicateProcessedIds: duplicateProcessedIds.slice(0, 20),
  firstDuplicatePublishedPaths: duplicatePublishedPaths.slice(0, 20),
  firstPublishedWithoutManifest: publishedWithoutManifest.slice(0, 20),
  firstBrokenPublishedAssets: brokenPublishedAssets.slice(0, 20),
};

console.log(JSON.stringify({ summary, details }, null, 2));

if (args.strict) {
  const hasErrors = [
    duplicateManifestIds.length,
    duplicateProcessedIds.length,
    duplicatePublishedPaths.length,
    publishedWithoutManifest.length,
    brokenPublishedAssets.length,
    missingPublished.length,
  ].some((count) => count > 0);
  if (hasErrors) process.exitCode = 1;
}
