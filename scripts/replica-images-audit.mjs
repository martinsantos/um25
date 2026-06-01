#!/usr/bin/env node
/**
 * Audita imágenes en localhost vs prod: mapa CMS, rutas rotas, placeholders.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const LOCAL = process.env.REPLICA_LOCAL_URL || 'http://localhost:4321';
const PROD = process.env.REPLICA_PROD_URL || 'https://ultimamilla.com.ar';
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const map = JSON.parse(readFileSync(join(ROOT, 'src/data/image-local-map.json'), 'utf-8'));

function countUploadFiles(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) n += countUploadFiles(p);
    else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(e.name)) n += 1;
  }
  return n;
}

function extractUuids() {
  const uuids = new Set();
  for (const file of ['antecedentes.json', 'servicios.json', 'productos.json', 'hero.json']) {
    const data = JSON.parse(readFileSync(join(ROOT, 'src/data/snapshots', file), 'utf-8')).data || [];
    for (const item of data) {
      for (const k of ['Imagen', 'imagen']) {
        let v = item[k];
        if (v && typeof v === 'object') v = v.id;
        if (v && UUID_RE.test(v)) uuids.add(v);
      }
    }
  }
  return uuids;
}

function auditMap() {
  const uuids = extractUuids();
  let missingMap = 0;
  let missingFile = 0;
  for (const u of uuids) {
    if (!map[u]) missingMap += 1;
    else if (!existsSync(join(PUBLIC, map[u]))) missingFile += 1;
  }
  return { uuids: uuids.size, missingMap, missingFile, mapSize: Object.keys(map).length };
}

async function fetchHtml(base, path) {
  const res = await fetch(new URL(path, base).toString(), { redirect: 'follow' });
  return { status: res.status, html: res.ok ? await res.text() : '' };
}

function extractImgSrcs(html) {
  const srcs = [];
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) srcs.push(m[1]);
  return srcs;
}

/** Imágenes comerciales relevantes (excluye iconos/default de sidebar). */
function extractCommercialImgSrcs(html, path) {
  const hero = html.match(
    /<img[^>]*class=["'][^"']*case-detail-hero__image[^"']*["'][^>]*>/i,
  );
  if (hero) {
    const src = hero[0].match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (src) return [src];
  }

  const serviceHero = html.match(
    /<img[^>]*class=["'][^"']*services-hero[^"']*["'][^>]*src=["']([^"']+)["']/i,
  );
  if (serviceHero) return [serviceHero[1]];

  return extractImgSrcs(html).filter(
    (src) =>
      !src.endsWith('/images/default.jpg') &&
      !src.includes('googletagmanager') &&
      !src.startsWith('/_astro/'),
  );
}

async function auditPages() {
  const paths = E2E_DEFECT_PATHS.filter((p) => !p.includes('#'));
  let brokenLocal = 0;
  let placeholderLocal = 0;
  const issues = [];

  for (const path of paths) {
    const local = await fetchHtml(LOCAL, path);
    if (local.status !== 200) {
      issues.push({ path, kind: 'http', detail: `local ${local.status}` });
      brokenLocal += 1;
      continue;
    }
    const srcs = extractCommercialImgSrcs(local.html, path);
    for (const src of srcs) {
      if (src.includes('default-background') || src.includes('ultimamilla.com.ar')) {
        placeholderLocal += 1;
        issues.push({ path, kind: 'placeholder', detail: src });
      }
      if (src.startsWith('/')) {
        const file = join(PUBLIC, src.split('?')[0]);
        if (!existsSync(file) && !src.startsWith('/_astro/') && !src.startsWith('/images/hero/')) {
          // allow remote in src
          if (!src.includes('unsplash') && !src.includes('http')) {
            brokenLocal += 1;
            issues.push({ path, kind: '404', detail: src });
          }
        }
      }
    }
  }

  return { pages: paths.length, brokenLocal, placeholderLocal, issues: issues.slice(0, 15) };
}

async function main() {
  console.log(`\n🔍 Auditoría de imágenes réplica\n  Local: ${LOCAL}\n  Prod:  ${PROD}\n`);

  const mapStats = auditMap();
  console.log('Mapa CMS:');
  console.log(`  UUIDs snapshots: ${mapStats.uuids}`);
  console.log(`  image-local-map: ${mapStats.mapSize}`);
  console.log(`  sin mapa: ${mapStats.missingMap}`);
  console.log(`  mapa sin archivo: ${mapStats.missingFile}`);
  console.log(`  archivos public/uploads/: ${countUploadFiles(join(PUBLIC, 'uploads'))}`);

  const pageStats = await auditPages();
  console.log('\nPáginas comerciales (img src):');
  console.log(`  rutas: ${pageStats.pages}`);
  console.log(`  rutas locales rotas: ${pageStats.brokenLocal}`);
  console.log(`  menciones default-background: ${pageStats.placeholderLocal}`);
  if (pageStats.issues.length) {
    console.log('\n  Muestra de problemas:');
    for (const i of pageStats.issues) console.log(`    ${i.path} — ${i.kind}: ${i.detail}`);
  }

  const fail =
    mapStats.missingMap > 0 ||
    mapStats.missingFile > 0 ||
    pageStats.brokenLocal > 0 ||
    pageStats.placeholderLocal > 0;

  console.log(fail ? '\n❌ Auditoría de imágenes FALLÓ' : '\n✅ Auditoría de imágenes OK');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
