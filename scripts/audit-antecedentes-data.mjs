#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(repoRoot, 'work', 'antecedentes-audit');
const publicRoot = path.join(repoRoot, 'public');
const snapshotPath = path.join(repoRoot, 'src', 'data', 'snapshots', 'antecedentes.json');
const imageMapPath = path.join(repoRoot, 'src', 'data', 'antecedentes-generated-image-map.json');
const lotesRoot = path.join(repoRoot, 'work', 'antecedentes-images', 'lotes');
const downloadedSitemapAntecedentes = '/private/tmp/um-sitemap-antecedentes.xml';
const downloadedSitemapImages = '/private/tmp/um-sitemap-images.xml';
const downloadedGeoCases = '/private/tmp/um-geo-cases.json';
const downloadedGeoImageEvidence = '/private/tmp/um-geo-image-evidence.json';

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
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

function readCsv(filePath) {
  const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8').trim() : '';
  if (!text) return [];
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function listManifestRows() {
  if (!fs.existsSync(lotesRoot)) return [];

  return fs.readdirSync(lotesRoot)
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort()
    .flatMap((lote) => readCsv(path.join(lotesRoot, lote, 'manifest.csv')).map((row) => ({ ...row, lote })));
}

function clean(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function generateSlug(value) {
  return normalize(value)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'antecedente';
}

function wordCount(value) {
  const words = clean(value).match(/\S+/g);
  return words ? words.length : 0;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(fileName, rows, headers) {
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(path.join(outDir, fileName), `${csv}\n`, 'utf8');
}

function countMatches(text, pattern) {
  if (!fs.existsSync(text)) return 0;
  return (fs.readFileSync(text, 'utf8').match(pattern) || []).length;
}

function fileSha256(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const typoPatterns = [
  [/sistena/i, 'typo:sistena'],
  [/remplazo/i, 'typo:remplazo'],
  [/tecnica/i, 'accent-or-style:tecnica'],
  [/cpamaras/i, 'typo:cpamaras'],
  [/univercidad/i, 'typo:univercidad'],
  [/\bMuncip\b|\bMunicip\b/i, 'truncated:municip'],
  [/\.\.\./, 'ellipsis'],
];

const lowValuePatterns = [
  [/\bmonitor(es)?\b/i, 'minor-supply:monitor'],
  [/\bssd\b|\bmemoria\b|\bram\b|\bdisco duro\b/i, 'minor-supply:storage-memory'],
  [/\bfuente(s)?\b.*telefon/i, 'minor-supply:phone-power-supply'],
  [/\btablet(s)?\b/i, 'minor-supply:tablet'],
  [/\bproyector\b/i, 'minor-supply:projector'],
  [/\bventa de remanente\b/i, 'minor-supply:remanent-sale'],
  [/\bcomodato\b/i, 'commercial-loan:comodato'],
  [/\bprovision\b|\bprovisi[oó]n\b/i, 'generic-provision'],
  [/\balquiler\b/i, 'generic-rental'],
];

const genericWorkPatterns = [
  [/\btrabajos varios\b/i, 'generic:trabajos-varios'],
  [/\bvisita t[eé]cnica\b/i, 'generic:visita-tecnica'],
  [/\basistencia t[eé]cnica\b/i, 'generic:asistencia-tecnica'],
  [/\bservicio por desarrollo\b/i, 'generic:servicio-desarrollo'],
  [/\bnvo plan\b|\bnuevo plan\b/i, 'generic:plan-negocios'],
  [/\bconfig\b/i, 'generic:configuracion'],
];

function classifyItem(item) {
  const title = clean(item.Titulo);
  const description = clean(item.Descripcion);
  const client = clean(item.Cliente);
  const combined = `${title} ${description}`;
  const issues = [];
  const seoIssues = [];
  const titleIssues = [];
  const descriptionIssues = [];
  const contentFlags = [];

  if (!title) titleIssues.push('missing-title');
  if (title.length > 95) titleIssues.push('title-too-long');
  if (title.length < 10) titleIssues.push('title-too-short');
  if (/\(\d+\)\s*$/.test(title)) titleIssues.push('duplicate-sequence-suffix');
  if (/\.\.\./.test(title)) titleIssues.push('title-truncated-ellipsis');
  if (/cliente confidencial/i.test(title)) titleIssues.push('confidential-client-in-title');
  if (!client) titleIssues.push('missing-client');
  if (/cliente confidencial/i.test(client)) titleIssues.push('client-confidential');

  if (!description) descriptionIssues.push('missing-description');
  if (description.length < 70) descriptionIssues.push('description-too-short-for-seo');
  if (wordCount(description) < 10) descriptionIssues.push('description-too-few-words');
  if (description.length > 0 && !/[.!?)]$/.test(description)) descriptionIssues.push('description-no-terminal-punctuation');
  if (description.toLowerCase() === title.toLowerCase()) descriptionIssues.push('description-equals-title');
  if (description.includes(' Cliente: ') && description.includes(' Sector: ') && wordCount(description) < 18) {
    descriptionIssues.push('description-only-template');
  }

  for (const [pattern, label] of typoPatterns) {
    if (pattern.test(combined)) contentFlags.push(label);
  }
  for (const [pattern, label] of lowValuePatterns) {
    if (pattern.test(combined)) contentFlags.push(label);
  }
  for (const [pattern, label] of genericWorkPatterns) {
    if (pattern.test(combined)) contentFlags.push(label);
  }

  if (titleIssues.length) issues.push(...titleIssues);
  if (descriptionIssues.length) issues.push(...descriptionIssues);
  if (contentFlags.length) issues.push(...contentFlags);

  if (description.length < 70 || wordCount(description) < 10) seoIssues.push('weak-meta-source');
  if (!client || /cliente confidencial/i.test(client)) seoIssues.push('weak-named-entity-client');
  if (!item.Area) seoIssues.push('missing-sector');
  if (!item.Fecha) seoIssues.push('missing-date');

  let quality = 'strong-case';
  if (contentFlags.some((flag) => flag.startsWith('minor-supply') || flag.startsWith('commercial-loan'))) {
    quality = 'low-value-candidate';
  } else if (contentFlags.some((flag) => flag.startsWith('generic')) || descriptionIssues.length || titleIssues.length) {
    quality = 'needs-editorial-review';
  }
  if (!title || !description || contentFlags.some((flag) => flag.startsWith('typo') || flag.startsWith('truncated'))) {
    quality = 'data-error-candidate';
  }

  return {
    quality,
    issues,
    titleIssues,
    descriptionIssues,
    contentFlags,
    seoIssues,
  };
}

fs.mkdirSync(outDir, { recursive: true });

const snapshot = readJson(snapshotPath, { data: [] });
const items = Array.isArray(snapshot) ? snapshot : snapshot.data || [];
const imageMap = readJson(imageMapPath, {});
const manifestRows = listManifestRows();
const manifestById = new Map(manifestRows.map((row) => [String(row.antecedente_id), row]));
const imagePathCounts = new Map();
Object.values(imageMap).forEach((imagePath) => imagePathCounts.set(imagePath, (imagePathCounts.get(imagePath) || 0) + 1));
const imageHashByPath = new Map();
const imageHashCounts = new Map();
for (const imagePath of Object.values(imageMap)) {
  const hash = fileSha256(path.join(publicRoot, imagePath));
  if (!hash) continue;
  imageHashByPath.set(imagePath, hash);
  imageHashCounts.set(hash, (imageHashCounts.get(hash) || 0) + 1);
}

const records = items.map((item) => {
  const id = String(item.id);
  const title = clean(item.Titulo);
  const description = clean(item.Descripcion);
  const client = clean(item.Cliente);
  const sector = clean(item.Area);
  const businessUnit = clean(item.Unidad_de_negocio);
  const date = clean(item.Fecha);
  const slug = generateSlug(title);
  const canonicalUrl = `https://www.ultimamilla.com.ar/antecedentes/${id}/${slug}`;
  const imagePath = imageMap[id] || '';
  const imageFile = imagePath ? path.basename(imagePath) : '';
  const imageExists = Boolean(imagePath && fs.existsSync(path.join(publicRoot, imagePath)));
  const imageSha256 = imageHashByPath.get(imagePath) || '';
  const imageContentDuplicateCount = imageSha256 ? imageHashCounts.get(imageSha256) || 0 : 0;
  const manifest = manifestById.get(id);
  const expectedFile = manifest?.expected_filename ? `${manifest.expected_filename}.webp` : '';
  const idPrefixMatches = imageFile.startsWith(`${id}-`);
  const expectedFileMatches = expectedFile ? imageFile === expectedFile : false;
  const imageDuplicateCount = imagePath ? imagePathCounts.get(imagePath) || 0 : 0;
  const classification = classifyItem(item);

  return {
    id,
    title,
    description,
    client,
    sector,
    businessUnit,
    date,
    canonicalUrl,
    imagePath,
    imageExists: imageExists ? 'yes' : 'no',
    imageIdPrefixMatches: idPrefixMatches ? 'yes' : 'no',
    imageExpectedFileMatches: expectedFileMatches ? 'yes' : 'no',
    imageDuplicateCount,
    imageContentDuplicateCount,
    imageSha256,
    manifestLote: manifest?.lote || '',
    manifestExpectedFile: expectedFile,
    titleLength: title.length,
    descriptionLength: description.length,
    descriptionWords: wordCount(description),
    quality: classification.quality,
    issues: classification.issues.join('|'),
    titleIssues: classification.titleIssues.join('|'),
    descriptionIssues: classification.descriptionIssues.join('|'),
    contentFlags: classification.contentFlags.join('|'),
    seoIssues: classification.seoIssues.join('|'),
  };
});

const issueRecords = records.filter((record) => record.issues);
const lowValueRecords = records.filter((record) => record.quality === 'low-value-candidate');
const dataErrorRecords = records.filter((record) => record.quality === 'data-error-candidate');
const needsReviewRecords = records.filter((record) => record.quality === 'needs-editorial-review');
const imageIssueRecords = records.filter((record) => (
  record.imageExists !== 'yes'
  || record.imageIdPrefixMatches !== 'yes'
  || record.imageExpectedFileMatches !== 'yes'
  || Number(record.imageDuplicateCount) !== 1
  || Number(record.imageContentDuplicateCount) !== 1
));

const clients = records.map((record) => record.client).filter(Boolean);
const namedClients = clients.filter((client) => !/cliente confidencial/i.test(client));
const uniqueNamedClients = new Set(namedClients.map((client) => normalize(client)));
const sectors = new Set(records.map((record) => record.sector).filter(Boolean));
const productionGeoCases = readJson(downloadedGeoCases, null);
const productionImageEvidence = readJson(downloadedGeoImageEvidence, null);

const clientGroups = new Map();
for (const record of records) {
  if (!record.client) continue;
  const key = normalize(record.client);
  if (!clientGroups.has(key)) {
    clientGroups.set(key, {
      client: record.client,
      count: 0,
      sectors: new Set(),
      firstDate: record.date || '',
      lastDate: record.date || '',
      urls: [],
      lowValueCandidates: 0,
      dataErrorCandidates: 0,
      weakMetaSource: 0,
    });
  }

  const group = clientGroups.get(key);
  group.count += 1;
  if (record.sector) group.sectors.add(record.sector);
  if (record.date && (!group.firstDate || record.date < group.firstDate)) group.firstDate = record.date;
  if (record.date && (!group.lastDate || record.date > group.lastDate)) group.lastDate = record.date;
  if (group.urls.length < 8) group.urls.push(record.canonicalUrl);
  if (record.quality === 'low-value-candidate') group.lowValueCandidates += 1;
  if (record.quality === 'data-error-candidate') group.dataErrorCandidates += 1;
  if (String(record.seoIssues).includes('weak-meta-source')) group.weakMetaSource += 1;
}

const namedEntityRecords = [...clientGroups.values()]
  .map((group) => ({
    client: group.client,
    caseCount: group.count,
    sectors: [...group.sectors].sort().join('|'),
    firstDate: group.firstDate,
    lastDate: group.lastDate,
    lowValueCandidates: group.lowValueCandidates,
    dataErrorCandidates: group.dataErrorCandidates,
    weakMetaSource: group.weakMetaSource,
    exampleUrls: group.urls.join('|'),
  }))
  .sort((a, b) => Number(b.caseCount) - Number(a.caseCount) || a.client.localeCompare(b.client));

const summary = {
  generatedAt: new Date().toISOString(),
  source: {
    snapshot: path.relative(repoRoot, snapshotPath),
    imageMap: path.relative(repoRoot, imageMapPath),
    manifests: path.relative(repoRoot, lotesRoot),
    productionSitemapAntecedentes: fs.existsSync(downloadedSitemapAntecedentes) ? downloadedSitemapAntecedentes : null,
    productionSitemapImages: fs.existsSync(downloadedSitemapImages) ? downloadedSitemapImages : null,
    productionGeoCases: fs.existsSync(downloadedGeoCases) ? downloadedGeoCases : null,
    productionGeoImageEvidence: fs.existsSync(downloadedGeoImageEvidence) ? downloadedGeoImageEvidence : null,
  },
  counts: {
    antecedentes: records.length,
    imageMapEntries: Object.keys(imageMap).length,
    manifestRows: manifestRows.length,
    imagesOk: records.length - imageIssueRecords.length,
    imageIssues: imageIssueRecords.length,
    duplicateImageContentGroups: [...imageHashCounts.values()].filter((count) => count > 1).length,
    uniqueNamedClients: uniqueNamedClients.size,
    confidentialClientRecords: clients.filter((client) => /cliente confidencial/i.test(client)).length,
    sectors: sectors.size,
    contentIssueRecords: issueRecords.length,
    lowValueCandidates: lowValueRecords.length,
    dataErrorCandidates: dataErrorRecords.length,
    needsEditorialReview: needsReviewRecords.length,
  },
  production: {
    sitemapAntecedentesUrls: countMatches(downloadedSitemapAntecedentes, /<url>/g),
    sitemapAntecedentesImages: countMatches(downloadedSitemapAntecedentes, /<image:image>/g),
    sitemapImagesUrls: countMatches(downloadedSitemapImages, /<url>/g),
    sitemapImagesImages: countMatches(downloadedSitemapImages, /<image:image>/g),
    sitemapImagesTitles: countMatches(downloadedSitemapImages, /<image:title>/g),
    sitemapImagesCaptions: countMatches(downloadedSitemapImages, /<image:caption>/g),
    geoCasesCount: productionGeoCases?.cases?.length ?? null,
    geoImageEvidenceCount: productionImageEvidence?.images?.length ?? null,
    geoImageEvidenceCoverage: productionImageEvidence?.coverage ?? null,
  },
  firstExamples: {
    imageIssues: imageIssueRecords.slice(0, 20),
    lowValueCandidates: lowValueRecords.slice(0, 30),
    dataErrorCandidates: dataErrorRecords.slice(0, 30),
    needsEditorialReview: needsReviewRecords.slice(0, 30),
  },
};

fs.writeFileSync(path.join(outDir, 'antecedentes-data-audit.json'), `${JSON.stringify({ summary, records }, null, 2)}\n`, 'utf8');

const commonHeaders = [
  'id',
  'title',
  'description',
  'client',
  'sector',
  'businessUnit',
  'date',
  'canonicalUrl',
  'imagePath',
  'imageExists',
  'imageIdPrefixMatches',
  'imageExpectedFileMatches',
  'imageDuplicateCount',
  'imageContentDuplicateCount',
  'manifestLote',
  'quality',
  'issues',
  'seoIssues',
];

writeCsv('antecedentes-all.csv', records, commonHeaders);
writeCsv('antecedentes-content-issues.csv', issueRecords, commonHeaders);
writeCsv('antecedentes-low-value-candidates.csv', lowValueRecords, commonHeaders);
writeCsv('antecedentes-data-error-candidates.csv', dataErrorRecords, commonHeaders);
writeCsv('antecedentes-named-entities.csv', namedEntityRecords, [
  'client',
  'caseCount',
  'sectors',
  'firstDate',
  'lastDate',
  'lowValueCandidates',
  'dataErrorCandidates',
  'weakMetaSource',
  'exampleUrls',
]);
writeCsv('antecedentes-image-associations.csv', records, [
  'id',
  'title',
  'client',
  'imagePath',
  'imageExists',
  'imageIdPrefixMatches',
  'imageExpectedFileMatches',
  'imageDuplicateCount',
  'imageContentDuplicateCount',
  'imageSha256',
  'manifestLote',
  'manifestExpectedFile',
  'canonicalUrl',
]);

const issueCounts = new Map();
for (const record of records) {
  for (const issue of String(record.issues || '').split('|').filter(Boolean)) {
    issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
  }
}

const issueLines = [...issueCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([issue, count]) => `- ${issue}: ${count}`);

const report = [
  '# Auditoria antecedentes UMSA',
  '',
  `Generado: ${summary.generatedAt}`,
  '',
  '## Fuentes',
  `- Snapshot: ${summary.source.snapshot}`,
  `- Mapa imagenes: ${summary.source.imageMap}`,
  `- Manifiestos: ${summary.source.manifests}`,
  `- Sitemap antecedentes produccion: ${summary.source.productionSitemapAntecedentes || 'no descargado'}`,
  `- Sitemap imagenes produccion: ${summary.source.productionSitemapImages || 'no descargado'}`,
  '',
  '## Resumen',
  `- Antecedentes auditados: ${summary.counts.antecedentes}`,
  `- Imagenes mapeadas: ${summary.counts.imageMapEntries}`,
  `- Filas de manifiesto: ${summary.counts.manifestRows}`,
  `- Asociaciones de imagen OK: ${summary.counts.imagesOk}`,
  `- Asociaciones con problemas: ${summary.counts.imageIssues}`,
  `- Grupos de imagenes con contenido duplicado exacto: ${summary.counts.duplicateImageContentGroups}`,
  `- Clientes nombrados unicos: ${summary.counts.uniqueNamedClients}`,
  `- Registros con cliente confidencial: ${summary.counts.confidentialClientRecords}`,
  `- Sectores publicados: ${summary.counts.sectors}`,
  `- Registros con issues de contenido: ${summary.counts.contentIssueRecords}`,
  `- Candidatos de bajo valor como antecedente: ${summary.counts.lowValueCandidates}`,
  `- Candidatos a error de dato: ${summary.counts.dataErrorCandidates}`,
  `- Candidatos a revision editorial: ${summary.counts.needsEditorialReview}`,
  '',
  '## Produccion/GEO',
  `- sitemap-antecedentes URLs: ${summary.production.sitemapAntecedentesUrls}`,
  `- sitemap-antecedentes imagenes: ${summary.production.sitemapAntecedentesImages}`,
  `- sitemap-images URLs: ${summary.production.sitemapImagesUrls}`,
  `- sitemap-images imagenes: ${summary.production.sitemapImagesImages}`,
  `- sitemap-images image:title: ${summary.production.sitemapImagesTitles}`,
  `- sitemap-images image:caption: ${summary.production.sitemapImagesCaptions}`,
  `- /geo/cases.json casos: ${summary.production.geoCasesCount ?? 'sin dato'}`,
  `- /geo/image-evidence.json imagenes: ${summary.production.geoImageEvidenceCount ?? 'sin dato'}`,
  '',
  '## Issues por tipo',
  ...issueLines,
  '',
  '## Archivos generados',
  '- antecedentes-all.csv',
  '- antecedentes-content-issues.csv',
  '- antecedentes-low-value-candidates.csv',
  '- antecedentes-data-error-candidates.csv',
  '- antecedentes-named-entities.csv',
  '- antecedentes-image-associations.csv',
  '- antecedentes-data-audit.json',
  '',
  'Nota: este reporte no inventa datos ni corrige contenido. Marca problemas para decision editorial o depuracion CMS.',
];

fs.writeFileSync(path.join(outDir, 'SEO_GEO_ANTECEDENTES_AUDIT.md'), `${report.join('\n')}\n`, 'utf8');

console.log(JSON.stringify(summary, null, 2));
