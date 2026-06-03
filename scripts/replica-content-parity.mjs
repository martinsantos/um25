#!/usr/bin/env node
/**
 * Paridad de contenido de la réplica local (solo GET, sin modificar prod).
 *
 * Política post-Fase A (copyPolicy: "editorial-ledger"):
 *   - El H1/title visible YA NO se compara contra el copy legacy/genérico de
 *     producción. La fuente de verdad es el LEDGER EDITORIAL aprobado en
 *     src/data/replica-prod-copy.json (promovido en DESIGN.md / diagnostico-forbes-2026).
 *   - Este check valida que el H1/title que renderiza la réplica local sea
 *     EXACTAMENTE el copy editorial aprobado para esa ruta.
 *   - Se mantiene la paridad HTTP (status prod == status local) y la paridad
 *     estructural (enlaces /servicios/ en home) contra prod, porque rutas/slugs
 *     siguen siendo idénticos a prod por diseño.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = resolve(__dirname, '../src/data/replica-prod-copy.json');
const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
const ledgerPaths = ledger.paths || {};

const PROD = process.env.REPLICA_PROD_URL || 'https://www.ultimamilla.com.ar';
const LOCAL = process.env.REPLICA_LOCAL_URL || 'http://localhost:4321';
const paths = process.argv.length > 2 ? process.argv.slice(2) : E2E_DEFECT_PATHS;

function normalizePath(path) {
  const clean = (path.split('#')[0] || path).trim();
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function normalizeText(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u2026]/g, '…')
    .trim();
}

function extractSignals(html) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const serviceLinks = (html.match(/href="\/servicios\/\d+\//g) || []).length;
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || '').trim();
  return { title, h1, serviceLinks, canonical };
}

async function fetchHtml(base, path) {
  const res = await fetch(new URL(path, base).toString(), { redirect: 'follow' });
  if (!res.ok) return { status: res.status, html: '' };
  return { status: res.status, html: await res.text() };
}

let mismatches = 0;
let ledgerCovered = 0;
console.log(
  `Paridad de contenido (GET only)\n  Prod:  ${PROD}\n  Local: ${LOCAL}\n  Ledger: src/data/replica-prod-copy.json (${ledger.copyPolicy || 'n/a'})\n`,
);

for (const path of paths) {
  const [prod, local] = await Promise.all([fetchHtml(PROD, path), fetchHtml(LOCAL, path)]);

  // Paridad HTTP: rutas/slugs siguen idénticos a prod.
  if (prod.status !== local.status) {
    console.log(`❌ ${path} — status prod:${prod.status} local:${local.status}`);
    mismatches += 1;
    continue;
  }
  if (prod.status < 200 || prod.status >= 400) {
    console.log(`⚠️  ${path} — HTTP ${prod.status}`);
    continue;
  }

  const l = extractSignals(local.html);
  const p = extractSignals(prod.html);
  const ledgerEntry = ledgerPaths[normalizePath(path)];

  const issues = [];
  const notices = [];

  // H1: aserción DURA contra el LEDGER EDITORIAL aprobado (fuente de verdad post-Fase A).
  // El <title> del <head> NO está cableado al ledger en todas las plantillas (mantiene su
  // copy SEO propio), por lo que se reporta como aviso informativo, no como divergencia.
  if (ledgerEntry) {
    ledgerCovered += 1;
    const expectedH1 = normalizeText(ledgerEntry.h1);
    const localH1 = normalizeText(l.h1);
    if (expectedH1 && localH1 !== expectedH1) {
      issues.push(`h1 local distinto del ledger editorial (esperado: "${expectedH1}" vs local: "${localH1}")`);
    }

    // El title del ledger puede venir truncado (…); validamos por prefijo razonable (no bloqueante).
    const expectedTitle = normalizeText(ledgerEntry.title);
    const localTitle = normalizeText(l.title);
    if (expectedTitle && localTitle) {
      const cmpLen = expectedTitle.endsWith('…') ? expectedTitle.length - 1 : expectedTitle.length;
      const expectedCmp = expectedTitle.slice(0, cmpLen).replace(/…$/, '');
      if (!localTitle.startsWith(expectedCmp.slice(0, Math.min(cmpLen, 32)))) {
        notices.push(`title <head> no sigue el ledger (ledger: "${expectedTitle}" vs local: "${localTitle}")`);
      }
    }
  } else if (l.h1 && p.h1 && p.h1.slice(0, 48) !== l.h1.slice(0, 48)) {
    // Sin entrada en el ledger: fallback al comportamiento legacy (comparar con prod).
    issues.push(`h1 sin ledger; difiere de prod (prod: "${p.h1.slice(0, 60)}…" vs local: "${l.h1.slice(0, 60)}…")`);
  }

  // Paridad estructural en home: enlaces a /servicios/<id>/ (contra prod).
  if (path === '/' && Math.abs(p.serviceLinks - l.serviceLinks) > 2) {
    issues.push(`enlaces /servicios/ home prod:${p.serviceLinks} local:${l.serviceLinks}`);
  }

  if (issues.length) {
    console.log(`❌ ${path}`);
    for (const issue of issues) console.log(`     ${issue}`);
    for (const notice of notices) console.log(`     ⓘ ${notice}`);
    mismatches += 1;
  } else if (notices.length) {
    console.log(`✅ ${path}`);
    for (const notice of notices) console.log(`     ⓘ ${notice}`);
  } else {
    console.log(`✅ ${path}`);
  }
}

console.log(
  `\n${paths.length} rutas — ${ledgerCovered} validadas contra ledger editorial — ${mismatches} divergencia(s) de contenido`,
);
if (mismatches > 0) process.exit(1);
