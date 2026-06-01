#!/usr/bin/env node
/**
 * Preflight réplica local = producción (Directus + snapshots + dev server).
 */
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS = join(__dirname, '..', 'src', 'data', 'snapshots');
const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const LOCAL = process.env.REPLICA_LOCAL_URL || 'http://localhost:4321';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN || '';

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`❌ ${msg}`);
  errors += 1;
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
  warnings += 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

async function checkDirectus() {
  try {
    const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
    const res = await fetch(`${DIRECTUS_URL}/server/health`, { headers });
    if (!res.ok) {
      warn(`Directus ${DIRECTUS_URL} respondió ${res.status} — se usarán snapshots JSON`);
      return;
    }
    ok(`Directus accesible en ${DIRECTUS_URL}`);
    if (!TOKEN) warn('Sin DIRECTUS_STATIC_TOKEN: las lecturas pueden fallar; corré replica:sync con túnel SSH');
  } catch {
    warn(`Directus no alcanzable en ${DIRECTUS_URL} — snapshots JSON como en incidente prod`);
  }
}

function checkSnapshots() {
  const required = ['servicios.json', 'productos.json', 'antecedentes.json'];
  for (const file of required) {
    const path = join(SNAPSHOTS, file);
    try {
      const st = statSync(path);
      const ageDays = (Date.now() - st.mtimeMs) / 86400000;
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      const count = (raw.data || raw).length;
      if (ageDays > 14) warn(`${file} tiene ${Math.round(ageDays)} días — considerá npm run replica:sync`);
      ok(`${file}: ${count} registros`);
    } catch {
      fail(`Falta snapshot ${file} — ejecutá npm run replica:sync`);
    }
  }
}

async function checkLocalDev() {
  try {
    const res = await fetch(LOCAL, { redirect: 'follow' });
    if (res.ok) ok(`Astro réplica respondiendo en ${LOCAL}`);
    else warn(`${LOCAL} HTTP ${res.status} — iniciá: npm run dev:replica`);
  } catch {
    warn(`Sin servidor en ${LOCAL} — ejecutá: npm run dev:replica`);
  }
}

console.log('UMSA — Preflight réplica local (prod-like)\n');
console.log('Modo: UMSA_LOCAL_REPLICA=1 | Skin: hybrid (como www)\n');

await checkDirectus();
checkSnapshots();
await checkLocalDev();

console.log(`\nResumen: ${errors} error(es), ${warnings} advertencia(s)`);
if (errors > 0) process.exit(1);
