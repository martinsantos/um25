#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = 'work/antecedentes-images';
const DEFAULT_GENERATED_DIR = '/Users/santosma/.codex/generated_images/019e8d52-3c56-7802-b4fa-d0e39eca274b';
const IMG_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const args = { cmd };
  for (let i = 0; i < rest.length; i += 1) {
    if (!rest[i].startsWith('--')) continue;
    const key = rest[i].slice(2);
    const value = rest[i + 1]?.startsWith('--') ? true : rest[i + 1];
    args[key] = value ?? true;
    if (value !== true) i += 1;
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

function listImages(dir) {
  return fs.readdirSync(dir)
    .filter((file) => IMG_EXTS.has(path.extname(file).toLowerCase()))
    .map((file) => {
      const full = path.join(dir, file);
      return { file, full, stat: fs.statSync(full) };
    })
    .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);
}

function imageForItem(item, images, fallbackIndex) {
  const base = item.expected_filename || `${item.antecedente_id}-${item.slug}-principal`;
  const exact = images.find((image) => path.parse(image.file).name === base);
  return exact || images[fallbackIndex];
}

async function postprocess(lote, inputDirArg) {
  const manifest = readManifest(lote);
  const inputDir = inputDirArg || path.join(ROOT, 'generadas_crudas', lote);
  const outputDir = path.join(ROOT, 'salida_web', lote);
  fs.mkdirSync(outputDir, { recursive: true });
  const images = listImages(inputDir);
  if (images.length < manifest.length) {
    throw new Error(`${lote}: hay ${images.length} imagenes para ${manifest.length} antecedentes`);
  }
  const rows = [];
  for (let i = 0; i < manifest.length; i += 1) {
    const item = manifest[i];
    const base = item.expected_filename || `${item.antecedente_id}-${item.slug}-principal`;
    const image = imageForItem(item, images, i);
    const webp = `${base}.webp`;
    const jpg = `${base}.jpg`;
    await sharp(image.full)
      .resize(1600, 1000, { fit: 'cover', position: 'attention' })
      .webp({ quality: 88, effort: 6 })
      .toFile(path.join(outputDir, webp));
    await sharp(image.full)
      .resize(1600, 1000, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(path.join(outputDir, jpg));
    rows.push([item.antecedente_id, item.slug, item.titulo, webp, jpg].map(csvEscape).join(','));
  }
  fs.writeFileSync(
    path.join(outputDir, 'qa.csv'),
    ['antecedente_id,slug,titulo,webp,jpg', ...rows].join('\n') + '\n',
    'utf8',
  );
  console.log(`Processed ${manifest.length} image(s) to ${outputDir}`);
}

function latestGeneratedImages(sourceDir, count) {
  return fs.readdirSync(sourceDir)
    .filter((file) => IMG_EXTS.has(path.extname(file).toLowerCase()))
    .map((file) => {
      const full = path.join(sourceDir, file);
      return { file, full, stat: fs.statSync(full) };
    })
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(0, count)
    .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);
}

function ingestLatest(lote, sourceDirArg) {
  const manifest = readManifest(lote);
  const sourceDir = sourceDirArg || DEFAULT_GENERATED_DIR;
  const outputDir = path.join(ROOT, 'generadas_crudas', lote);
  fs.mkdirSync(outputDir, { recursive: true });
  const images = latestGeneratedImages(sourceDir, manifest.length);
  if (images.length < manifest.length) {
    throw new Error(`${sourceDir}: hay ${images.length} imagenes recientes para ${manifest.length} antecedentes`);
  }
  for (let i = 0; i < manifest.length; i += 1) {
    const item = manifest[i];
    const base = item.expected_filename || `${item.antecedente_id}-${item.slug}-principal`;
    const dest = path.join(outputDir, `${base}${path.extname(images[i].file).toLowerCase() || '.png'}`);
    fs.copyFileSync(images[i].full, dest);
    console.log(`${images[i].file} -> ${path.relative(process.cwd(), dest)}`);
  }
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function contactSheet(lote) {
  const dir = path.join(ROOT, 'salida_web', lote);
  const outDir = path.join(ROOT, 'galerias');
  const out = path.join(outDir, `${lote}-contact-sheet.png`);
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).sort();
  const W = 520;
  const H = 325;
  const L = 44;
  const gap = 18;
  const cols = 2;
  const rows = Math.ceil(files.length / cols);
  const composites = [];
  for (let i = 0; i < files.length; i += 1) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = gap + c * (W + gap);
    const y = gap + r * (H + L + gap);
    const img = await sharp(path.join(dir, files[i])).resize(W, H, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: img, left: x, top: y });
    const id = files[i].split('-')[0];
    const label = `${String(i + 1).padStart(2, '0')} / ${id}`;
    const svg = `<svg width="${W}" height="${L}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><circle cx="18" cy="22" r="5" fill="#dc2626"/><text x="34" y="28" font-family="Arial" font-size="20" font-weight="700" fill="#fff">${label}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left: x, top: y + H });
  }
  await sharp({
    create: {
      width: cols * W + (cols + 1) * gap,
      height: rows * (H + L) + (rows + 1) * gap,
      channels: 4,
      background: '#f5f5f5',
    },
  }).composite(composites).png().toFile(out);
  console.log(out);
}

function gallery(lote) {
  const manifest = readManifest(lote);
  const outDir = path.join(ROOT, 'galerias');
  const imgDir = path.join('..', 'salida_web', lote);
  fs.mkdirSync(outDir, { recursive: true });
  const cards = manifest.map((item) => {
    const base = item.expected_filename || `${item.antecedente_id}-${item.slug}-principal`;
    return `<article><img src="${imgDir}/${base}.webp" loading="lazy"><h2>${escapeHtml(item.antecedente_id)} · ${escapeHtml(item.titulo)}</h2><p>${escapeHtml(item.cliente)} · ${escapeHtml(item.area)}</p></article>`;
  }).join('\n');
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>${lote}</title><style>body{margin:0;font-family:Arial,sans-serif;background:#f4f4f4;color:#111}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px;padding:18px}article{background:#fff;border:1px solid #ddd}img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}h2{font-size:16px;margin:12px 12px 4px}p{font-size:13px;margin:0 12px 14px;color:#555}</style><main class="grid">${cards}</main></html>`;
  const out = path.join(outDir, `${lote}.html`);
  fs.writeFileSync(out, html, 'utf8');
  console.log(`Gallery written to ${out}`);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

const args = parseArgs(process.argv.slice(2));
if (args.cmd === 'postprocess') await postprocess(args.lote, args['input-dir']);
else if (args.cmd === 'ingest-latest') ingestLatest(args.lote, args['source-dir']);
else if (args.cmd === 'contact-sheet') await contactSheet(args.lote);
else if (args.cmd === 'gallery') gallery(args.lote);
else {
  console.error('Uso: cli.mjs ingest-latest|postprocess|gallery|contact-sheet --lote lote_001');
  process.exit(1);
}
