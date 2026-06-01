#!/usr/bin/env node
/**
 * Réplica — descarga TODAS las imágenes referenciadas (solo GET a prod).
 * No modifica producción. Fuentes:
 * 1. UUIDs en snapshots → /uploads/antecedentes/{uuid}.jpg (y variantes)
 * 2. Rutas /uploads/… encontradas en páginas comerciales + blog de prod
 * 3. Fallback Directus (túnel + token) si está configurado
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SNAPSHOTS_DIR = join(ROOT, 'src', 'data', 'snapshots');
const PUBLIC_DIR = join(ROOT, 'public');

const PROD = process.env.REPLICA_PROD_URL || 'https://ultimamilla.com.ar';
const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN || '';
const CONCURRENCY = Number(process.env.REPLICA_IMAGE_CONCURRENCY || 12);
const TIMEOUT_MS = 20000;

const UUID_REGEX = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const UPLOAD_PATH_RE = /\/uploads\/[a-zA-Z0-9_\-./]+\.(?:jpg|jpeg|png|webp|gif)/gi;
function prodAbsoluteAssetPattern() {
  const host = new URL(PROD).hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`https?:\\/\\/${host}\\/[^"'\\s>]+\\.(?:jpg|jpeg|png|webp|gif)`, 'gi');
}

function loadSnapshot(filename) {
  const filepath = join(SNAPSHOTS_DIR, filename);
  if (!existsSync(filepath)) return [];
  const parsed = JSON.parse(readFileSync(filepath, 'utf-8'));
  return parsed.data || [];
}

function extractSnapshotUuids() {
  const uuids = new Set();
  for (const item of loadSnapshot('antecedentes.json')) {
    if (item.Imagen && UUID_REGEX.test(item.Imagen)) uuids.add(item.Imagen);
  }
  for (const item of loadSnapshot('servicios.json')) {
    if (item.Imagen && UUID_REGEX.test(item.Imagen)) uuids.add(item.Imagen);
  }
  for (const item of loadSnapshot('productos.json')) {
    const img = typeof item.imagen === 'string' ? item.imagen : item.imagen?.id;
    if (img && UUID_REGEX.test(img)) uuids.add(img);
  }
  for (const item of loadSnapshot('hero.json')) {
    if (item.imagen && UUID_REGEX.test(item.imagen)) uuids.add(item.imagen);
  }
  return [...uuids];
}

function prodCandidatesForUuid(uuid) {
  return [
    `/uploads/antecedentes/${uuid}.jpg`,
    `/uploads/antecedentes/${uuid}.jpeg`,
    `/uploads/antecedentes/${uuid}.webp`,
    `/uploads/${uuid}.jpg`,
    `/uploads/hero/${uuid}.jpg`,
  ];
}

async function fetchWithTimeout(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal, headers });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadRelativePath(relativePath) {
  const clean = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const dest = join(PUBLIC_DIR, clean);
  if (existsSync(dest)) return { path: clean, status: 'skipped' };

  const url = new URL(clean, PROD).toString();
  const res = await fetchWithTimeout(url);
  if (!res.ok) return { path: clean, status: 'missing', error: `HTTP ${res.status}` };

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 200) return { path: clean, status: 'error', error: 'too small' };

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buffer);
  return { path: clean, status: 'downloaded', size: buffer.length };
}

async function downloadUuid(uuid) {
  for (const rel of prodCandidatesForUuid(uuid)) {
    const dest = join(PUBLIC_DIR, rel);
    if (existsSync(dest)) return { uuid, status: 'skipped', path: rel };

    const url = new URL(rel, PROD).toString();
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length >= 200) {
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, buffer);
        return { uuid, status: 'downloaded', path: rel, size: buffer.length };
      }
    }
  }

  if (DIRECTUS_TOKEN) {
    try {
      const rel = `/uploads/antecedentes/${uuid}.jpg`;
      const dest = join(PUBLIC_DIR, rel);
      const assetUrl = `${DIRECTUS_URL}/assets/${uuid}?quality=85&width=1200&format=jpg`;
      const res = await fetchWithTimeout(assetUrl, { Authorization: `Bearer ${DIRECTUS_TOKEN}` });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, buffer);
        return { uuid, status: 'downloaded-directus', path: rel, size: buffer.length };
      }
    } catch {
      /* ignore */
    }
  }

  return { uuid, status: 'not_found' };
}

async function scrapeUploadPathsFromProd() {
  const paths = new Set();
  const pages = [...new Set([...E2E_DEFECT_PATHS, '/blog', '/blog?page=2', '/blog?page=3'])];

  for (const page of pages) {
    try {
      const res = await fetchWithTimeout(new URL(page, PROD).toString());
      if (!res.ok) continue;
      const html = await res.text();
      for (const match of html.matchAll(UPLOAD_PATH_RE)) paths.add(match[0]);
      for (const match of html.matchAll(prodAbsoluteAssetPattern())) {
        try {
          const pathname = new URL(match[0]).pathname;
          paths.add(pathname);
        } catch {
          /* ignore */
        }
      }
      for (const match of html.matchAll(/href=["']\/blog\/(?!categoria\/)([^"'?#/]+)/gi)) {
        const slug = decodeURIComponent(match[1] || '').trim();
        if (!slug || slug === 'page') continue;
        try {
          const postRes = await fetchWithTimeout(new URL(`/blog/${slug}`, PROD).toString());
          if (!postRes.ok) continue;
          const postHtml = await postRes.text();
          for (const m of postHtml.matchAll(UPLOAD_PATH_RE)) paths.add(m[0]);
          const og = postHtml.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
          if (og) {
            try {
              const ogUrl = new URL(og, PROD);
              if (ogUrl.pathname.startsWith('/uploads/')) paths.add(ogUrl.pathname);
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore single post */
        }
      }
    } catch {
      console.warn(`  ⚠️  No se pudo scrapear ${page}`);
    }
  }

  return [...paths];
}

async function downloadBatch(items, worker) {
  const results = { downloaded: 0, skipped: 0, missing: 0, errors: 0 };
  let idx = 0;

  async function runWorker() {
    while (idx < items.length) {
      const i = idx++;
      const result = await worker(items[i], i);
      if (result.status === 'downloaded' || result.status === 'downloaded-directus') results.downloaded++;
      else if (result.status === 'skipped') results.skipped++;
      else if (result.status === 'missing' || result.status === 'not_found') results.missing++;
      else results.errors++;
      if ((i + 1) % 25 === 0 || i + 1 === items.length) {
        process.stdout.write(`\r  Progreso: ${i + 1}/${items.length} (↓${results.downloaded} omit ${results.skipped} falta ${results.missing})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => runWorker()));
  console.log('');
  return results;
}

function rebuildImageLocalMap() {
  const productos = JSON.parse(readFileSync(join(SNAPSHOTS_DIR, 'productos.json'), 'utf-8'));
  const servicios = JSON.parse(readFileSync(join(SNAPSHOTS_DIR, 'servicios.json'), 'utf-8'));
  const antecedentes = JSON.parse(readFileSync(join(SNAPSHOTS_DIR, 'antecedentes.json'), 'utf-8'));

  const serviceNames = {
    101: 'infraestructura',
    102: 'seguridad',
    103: 'telecomunicaciones',
    104: 'software',
    105: 'soporte',
    106: 'consultoria',
    107: 'incendios',
    108: 'electricos',
  };
  const serviceNums = { 101: 1, 102: 2, 103: 3, 104: 4, 105: 5, 106: 6, 107: 7, 108: 8 };

  const map = {};

  for (const p of productos.data) {
    const sId = p.servicio_id;
    const sNum = serviceNums[sId];
    const orden = (p.orden || 0) + 1;
    const uuid = typeof p.imagen === 'string' ? p.imagen : p.imagen?.id || '';
    if (uuid && sNum) {
      const staticPath = `/images/services/productos/${serviceNames[sId]}/${sNum}.${orden}.png`;
      if (existsSync(join(PUBLIC_DIR, staticPath))) {
        map[uuid] = staticPath;
      }
    }
  }

  for (const s of servicios.data) {
    if (s.Imagen && serviceNames[s.id]) {
      const staticPath = `/images/services/productos/${serviceNames[s.id]}/${serviceNums[s.id]}.png`;
      if (existsSync(join(PUBLIC_DIR, staticPath))) map[s.Imagen] = staticPath;
    }
  }

  for (const a of antecedentes.data) {
    const uuid = a.Imagen;
    if (!uuid || !UUID_REGEX.test(uuid)) continue;
    const rel = `/uploads/antecedentes/${uuid}.jpg`;
    if (existsSync(join(PUBLIC_DIR, rel))) map[uuid] = rel;
  }

  const hero = loadSnapshot('hero.json');
  const heroOrderToServiceId = { 1: 101, 2: 102, 3: 103, 4: 104, 5: 108, 6: 106, 7: 107, 8: 108 };
  for (const h of hero) {
    const heroUuid = h.imagen;
    const serviceId = heroOrderToServiceId[Number(h.orden)] || Number(h.id);
    if (!heroUuid || !UUID_REGEX.test(heroUuid) || map[heroUuid]) continue;
    const service = servicios.data.find((s) => Number(s.id) === serviceId);
    if (service?.Imagen && map[service.Imagen]) {
      map[heroUuid] = map[service.Imagen];
      continue;
    }
    const name = serviceNames[serviceId];
    const num = serviceNums[serviceId];
    if (name && num) {
      const staticPath = `/images/services/productos/${name}/${num}.png`;
      if (existsSync(join(PUBLIC_DIR, staticPath))) map[heroUuid] = staticPath;
    }
  }

  const mapPath = join(ROOT, 'src', 'data', 'image-local-map.json');
  writeFileSync(mapPath, JSON.stringify(map, null, 2));

  const manifest = {};
  for (const [uuid, rel] of Object.entries(map)) {
    if (rel.startsWith('/uploads/')) manifest[uuid] = rel;
  }
  writeFileSync(join(SNAPSHOTS_DIR, 'image-manifest.json'), JSON.stringify(manifest, null, 0));

  return { mapEntries: Object.keys(map).length, uploadFiles: countFiles(join(PUBLIC_DIR, 'uploads')) };
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(p);
    else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)) n += 1;
  }
  return n;
}

async function main() {
  console.log(`\n🖼️  Réplica — descarga de imágenes desde ${PROD} (solo GET)\n`);

  const uuids = extractSnapshotUuids();
  console.log(`  UUIDs en snapshots: ${uuids.length}`);

  console.log('\n  Fase 1: UUIDs CMS…');
  const uuidResults = await downloadBatch(uuids, (uuid) => downloadUuid(uuid));

  console.log('\n  Fase 2: rutas /uploads/ en páginas de prod…');
  const scraped = await scrapeUploadPathsFromProd();
  console.log(`  Rutas encontradas: ${scraped.length}`);
  const pathResults = await downloadBatch(scraped, (rel) => downloadRelativePath(rel));

  console.log('\n  Fase 3: mapa local image-local-map.json…');
  const mapStats = rebuildImageLocalMap();

  console.log('\n  Resumen:');
  console.log(`    UUIDs — descargadas: ${uuidResults.downloaded}, omitidas: ${uuidResults.skipped}, no en prod: ${uuidResults.missing}`);
  console.log(`    Rutas scrape — descargadas: ${pathResults.downloaded}, omitidas: ${pathResults.skipped}, faltantes: ${pathResults.missing}`);
  console.log(`    Archivos en public/uploads/: ${mapStats.uploadFiles}`);
  console.log(`    Entradas image-local-map: ${mapStats.mapEntries}`);
  console.log('\n✅ Imágenes de réplica actualizadas.\n');
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
