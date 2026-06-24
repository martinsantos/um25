#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'work/antecedentes-images';
const PUBLIC_ROOT = 'public/images/antecedentes/generated';
const MAP_FILE = 'src/data/antecedentes-generated-image-map.json';
const SITE_URL = 'https://www.ultimamilla.com.ar';
const SITE_NAME = 'ULTIMA MILLA';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (quoted && ch === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  const [headers = [], ...lines] = rows;
  return lines.map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ''])));
}

function readManifest(lote) {
  const file = path.join(ROOT, 'lotes', lote, 'manifest.csv');
  return parseCsv(fs.readFileSync(file, 'utf8')).map((row, index) => ({ ...row, lote, index }));
}

function listLotes() {
  return fs.readdirSync(path.join(ROOT, 'lotes'))
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
}

function cleanSeoText(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function trimAtWordBoundary(value, maxLength = 160) {
  const clean = cleanSeoText(value);
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  const sentenceEnd = Math.max(
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('? '),
    sliced.lastIndexOf('! '),
  );
  if (sentenceEnd > maxLength * 0.55) return sliced.slice(0, sentenceEnd + 1).trim();
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > maxLength * 0.65 ? sliced.slice(0, lastSpace) : sliced;
  return `${cleanCut.replace(/[.,;:!?-]+$/g, '')}…`;
}

function stripExistingBrand(value) {
  return value
    .replace(/\s*[|·-]\s*ULTIMA MILLA\s*$/i, '')
    .replace(/^ULTIMA MILLA\s*[|·-]\s*/i, '')
    .trim();
}

function buildHumanSeoTitle(rawTitle, maxLength = 70) {
  const cleanTitle = stripExistingBrand(cleanSeoText(rawTitle)) || 'Servicios IT para empresas';
  const suffix = ` | ${SITE_NAME}`;
  const available = Math.max(24, maxLength - suffix.length);
  return `${trimAtWordBoundary(cleanTitle, available)}${suffix}`.slice(0, maxLength).trim();
}

function humanizeCaseDescriptionTemplate(value) {
  const match = value.match(/^(.+?)\s+Cliente:\s+(.+?)\.\s+Sector:\s+(.+?)\.?$/i);
  if (!match) return value;
  const [, title, client, sector] = match.map((part) => cleanSeoText(part));
  return `Antecedente de ${title} para ${client}, dentro de ${sector}.`;
}

function buildHumanSeoDescription(primary, fallbackParts = [], maxLength = 160, minLength = 70) {
  const primaryText = cleanSeoText(primary);
  if (primaryText.length >= minLength) return trimAtWordBoundary(primaryText, maxLength);
  const fallbackText = fallbackParts.map((part) => cleanSeoText(part)).filter(Boolean).join('. ');
  const generic = 'Contexto claro, alcance y próximos pasos de ULTIMA MILLA para decisiones tecnológicas empresariales.';
  return trimAtWordBoundary([primaryText, fallbackText, generic].filter(Boolean).join('. '), maxLength);
}

function buildCaseSeoMeta(item) {
  const title = cleanSeoText(item.titulo) || 'Antecedente técnico';
  const area = cleanSeoText(item.area);
  const year = cleanSeoText(item.fecha).match(/\b(20\d{2}|19\d{2})\b/)?.[1] || '';
  const sourceDescription = humanizeCaseDescriptionTemplate(cleanSeoText(item.descripcion));
  return {
    title: buildHumanSeoTitle(title),
    description: buildHumanSeoDescription(sourceDescription, [
      title,
      area ? `Trabajo relacionado con ${area}` : '',
      year ? `Registro del proyecto en ${year}` : '',
    ]),
  };
}

function canonicalUrl(pathOrUrl = '') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl.replace(/\/$/, '');
  const normalized = pathOrUrl ? `/${String(pathOrUrl).replace(/^\/+|\/+$/g, '')}` : '';
  return `${SITE_URL}${normalized}`.replace(/\/$/, '');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const generatedMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
const rawCache = new Map();

function listRawImages(lote) {
  if (rawCache.has(lote)) return rawCache.get(lote);
  const dir = path.join(ROOT, 'generadas_crudas', lote);
  const rows = fs.existsSync(dir)
    ? fs.readdirSync(dir)
      .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
      .map((file) => {
        const full = path.join(dir, file);
        return { file, full, stat: fs.statSync(full) };
      })
      .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs)
    : [];
  rawCache.set(lote, rows);
  return rows;
}

function resolveRawPath(item) {
  const images = listRawImages(item.lote);
  const base = item.expected_filename;
  const exact = images.find((image) => path.parse(image.file).name === base);
  if (exact) return exact.full;
  return images[item.index]?.full || path.join(ROOT, 'generadas_crudas', item.lote, `${base}.png`);
}

const rows = listLotes().flatMap(readManifest).map((item) => {
  const id = String(item.antecedente_id);
  const imagePath = generatedMap[id] || '';
  const imageUrl = imagePath ? canonicalUrl(imagePath) : '';
  const pageUrl = canonicalUrl(`/antecedentes/${id}/${item.slug}`);
  const seo = buildCaseSeoMeta(item);
  const expectedWebp = `${item.expected_filename}.webp`;
  const lote = item.lote;
  const rawPath = resolveRawPath(item);

  return {
    id,
    lote,
    titulo: item.titulo,
    cliente: item.cliente,
    area: item.area,
    fecha: item.fecha,
    slug: item.slug,
    expected_filename: item.expected_filename,
    raw_source_path: rawPath,
    processed_webp_path: path.join(ROOT, 'salida_web', lote, expectedWebp),
    public_webp_path: path.join(PUBLIC_ROOT, lote, expectedWebp),
    public_url_path: imagePath,
    canonical_image_url: imageUrl,
    canonical_page_url: pageUrl,
    prompt_file: path.join(ROOT, 'lotes', lote, 'prompt_chatgpt.md'),
    manifest_file: path.join(ROOT, 'lotes', lote, 'manifest.csv'),
    img_alt: item.titulo,
    og_image: imageUrl,
    og_image_alt: seo.title,
    twitter_image: imageUrl,
    twitter_image_alt: seo.title,
    structured_data_image: imageUrl,
    image_sitemap_loc: imageUrl,
    geo_image_evidence_imageUrl: imageUrl,
    meta_title: seo.title,
    meta_description: seo.description,
    raw_exists: fs.existsSync(rawPath),
    processed_exists: fs.existsSync(path.join(ROOT, 'salida_web', lote, expectedWebp)),
    public_exists: fs.existsSync(path.join(PUBLIC_ROOT, lote, expectedWebp)),
  };
});

const outJson = path.join(ROOT, 'reporte-imagenes-generadas.json');
const outCsv = path.join(ROOT, 'reporte-imagenes-generadas.csv');
const headers = Object.keys(rows[0] || {});

fs.writeFileSync(outJson, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
fs.writeFileSync(outCsv, `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')).join('\n')}\n`, 'utf8');

const missing = rows.filter((row) => !row.raw_exists || !row.processed_exists || !row.public_exists || !row.public_url_path);
console.log(JSON.stringify({
  rows: rows.length,
  missing: missing.length,
  csv: outCsv,
  json: outJson,
}, null, 2));
