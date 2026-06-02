#!/usr/bin/env node
/**
 * Exporta H1/title de prod (solo GET) a src/data/replica-prod-copy.json
 * No modifica producción.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const PROD = process.env.REPLICA_PROD_URL || 'https://www.ultimamilla.com.ar';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'replica-prod-copy.json');

function strip(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extract(html) {
  const pathKey = arguments[1];
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
  const h1 = strip(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  return { title, h1 };
}

const paths = {};
const unique = [...new Set(E2E_DEFECT_PATHS.map((p) => p.split('#')[0]))];

for (const path of unique) {
  try {
    const res = await fetch(new URL(path, PROD).toString(), { redirect: 'follow' });
    if (!res.ok) {
      paths[path] = { status: res.status, title: '', h1: '' };
      continue;
    }
    const html = await res.text();
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
    const h1 = strip(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
    paths[path] = { status: res.status, title, h1 };
    console.log(`✅ ${path} → ${h1.slice(0, 70)}${h1.length > 70 ? '…' : ''}`);
  } catch (error) {
    paths[path] = { status: 0, title: '', h1: '', error: String(error) };
    console.log(`❌ ${path}`);
  }
}

const payload = {
  scrapedAt: new Date().toISOString(),
  prodUrl: PROD,
  paths,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`\nGuardado: ${OUT}`);
