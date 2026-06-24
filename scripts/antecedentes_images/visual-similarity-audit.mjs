#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = 'work/antecedentes-images';
const OUTPUT_ROOT = path.join(ROOT, 'salida_web');

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

function loteNumber(lote) {
  return Number(lote.match(/\d+$/)?.[0] ?? 0);
}

function listLotes(args) {
  const all = fs.readdirSync(OUTPUT_ROOT)
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort((a, b) => loteNumber(a) - loteNumber(b));
  if (args.lote) return [String(args.lote)];
  const from = args.from ? loteNumber(String(args.from)) : loteNumber(all[0]);
  const to = args.to ? loteNumber(String(args.to)) : loteNumber(all.at(-1));
  return all.filter((lote) => loteNumber(lote) >= from && loteNumber(lote) <= to);
}

function listImages(lote) {
  const dir = path.join(OUTPUT_ROOT, lote);
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.webp'))
    .sort()
    .map((file) => ({
      id: file.match(/^\d+/)?.[0] || file,
      file,
      path: path.join(dir, file),
    }));
}

async function fingerprint(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(16, 16, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const luminance = [];
  let saturationTotal = 0;
  let blueCableScore = 0;

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    luminance.push(lum);
    saturationTotal += max === 0 ? 0 : (max - min) / max;
    if (b > 0.42 && b > r * 1.22 && b > g * 1.05) blueCableScore += 1;
  }

  const mean = luminance.reduce((sum, value) => sum + value, 0) / luminance.length;
  const binary = luminance.map((value) => value >= mean ? 1 : 0);

  return {
    binary,
    meanBrightness: Number(mean.toFixed(4)),
    meanSaturation: Number((saturationTotal / luminance.length).toFixed(4)),
    blueCableRatio: Number((blueCableScore / luminance.length).toFixed(4)),
  };
}

function hamming(a, b) {
  let diff = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) diff += 1;
  }
  return diff / Math.min(a.length, b.length);
}

async function auditLote(lote, threshold) {
  const images = listImages(lote);
  const items = [];
  for (const image of images) {
    items.push({
      ...image,
      ...(await fingerprint(image.path)),
    });
  }

  const pairs = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const distance = hamming(items[i].binary, items[j].binary);
      if (distance <= threshold) {
        pairs.push({
          a: items[i].id,
          b: items[j].id,
          distance: Number(distance.toFixed(4)),
          aFile: items[i].file,
          bFile: items[j].file,
        });
      }
    }
  }

  const visualProfile = items.map((item) => ({
    id: item.id,
    file: item.file,
    meanBrightness: item.meanBrightness,
    meanSaturation: item.meanSaturation,
    blueCableRatio: item.blueCableRatio,
  }));

  return {
    lote,
    count: items.length,
    possibleRepeats: pairs.sort((a, b) => a.distance - b.distance),
    visualProfile,
  };
}

const args = parseArgs(process.argv.slice(2));
const threshold = Number(args.threshold || 0.18);
const lotes = listLotes(args);
const results = [];

for (const lote of lotes) {
  results.push(await auditLote(lote, threshold));
}

const summary = {
  threshold,
  lotes: results.length,
  images: results.reduce((total, lote) => total + lote.count, 0),
  possibleRepeatPairs: results.reduce((total, lote) => total + lote.possibleRepeats.length, 0),
};

const report = { summary, results };
const outDir = path.join(ROOT, 'audits');
fs.mkdirSync(outDir, { recursive: true });
const suffix = args.lote ? String(args.lote) : `${lotes[0]}-${lotes.at(-1)}`;
const out = path.join(outDir, `visual-similarity-${suffix}.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify({ ...summary, out }, null, 2));
if (args.strict && summary.possibleRepeatPairs > 0) process.exitCode = 1;
