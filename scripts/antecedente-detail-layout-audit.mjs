#!/usr/bin/env node
/**
 * Layout comercial — detalle de antecedente (lo que el strict CDP no cubre):
 * - miniatura del servicio vinculado
 * - proporción tipográfica sección vs cuerpo
 * - lead del servicio sin corte a mitad de palabra
 * - imagen del dossier en hero
 *
 * Uso:
 *   node scripts/antecedente-detail-layout-audit.mjs
 *   VISUAL_AUDIT_BASE_URL=http://localhost:4321 node scripts/antecedente-detail-layout-audit.mjs
 */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const ANTECEDENTE_DETAIL_LAYOUT_PATHS = [
  '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza',
  '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza',
  '/antecedentes/3071/mantenimiento-critico-de-sistemas-de-deteccion-cela-sa-junio-2025',
];

export const SERVICE_PRODUCT_LAYOUT_PATHS = [
  '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios#productos',
];

const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(
  process.env.ANTECEDENTE_LAYOUT_CDP_PORT ||
    9360 + Math.floor(Math.random() * 40),
);
const OUT_FILE = process.env.ANTECEDENTE_LAYOUT_REPORT || 'docs/audits/e2e-visual-latest/antecedente-detail-layout.json';

const defaultPaths = [
  ...ANTECEDENTE_DETAIL_LAYOUT_PATHS,
  ...SERVICE_PRODUCT_LAYOUT_PATHS,
];
const paths = process.argv.slice(2).length ? process.argv.slice(2) : defaultPaths;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAYOUT_PROBE = `(() => {
  const isCaseDetail = /\\/antecedentes\\/\\d+\\//.test(location.pathname);
  const isServiceDetail = /\\/servicios\\/\\d+\\//.test(location.pathname);
  if (!isCaseDetail && !isServiceDetail) {
    return { skipped: true, path: location.pathname };
  }

  const issues = [];
  const sectionH2 = document.querySelector('.case-detail-body .case-section-title h2');
  const bodyCopy = document.querySelector('.case-detail-body__copy');
  const scopeList = document.querySelector('.case-scope-list');
  const scopeItems = Array.from(document.querySelectorAll('.case-scope-list li')).map((li) =>
    (li.innerText || '').replace(/\\s+/g, ' ').trim()
  );
  const bodyText = (bodyCopy?.innerText || '').replace(/\\s+/g, ' ').trim();
  const serviceCards = document.querySelector('.case-service-cards');
  const serviceCard = document.querySelector('.case-service-card');
  const serviceImg = document.querySelector('.case-service-card__media img');
  const serviceLeadEl = document.querySelector('.case-service-card__body p');
  const dossierImg = document.querySelector('.case-detail-dossier__media img');

  if (serviceCards) {
    if (!serviceCard) {
      issues.push({ code: 'missing-service-card' });
    } else {
      if (!serviceImg || serviceImg.naturalWidth < 48 || serviceImg.naturalHeight < 48) {
        issues.push({
          code: 'service-thumb-missing',
          width: serviceImg?.naturalWidth || 0,
          height: serviceImg?.naturalHeight || 0,
          src: (serviceImg?.currentSrc || serviceImg?.src || '').slice(-72),
        });
      }
      const lead = (serviceLeadEl?.innerText || '').replace(/\\s+/g, ' ').trim();
      if (lead.length < 28) {
        issues.push({ code: 'service-lead-too-short', lead });
      }
      if (lead && lead.length < 100 && !/[.!?…]$/.test(lead) && /\\s[a-záéíóúñ]{1,5}$/i.test(lead)) {
        issues.push({ code: 'service-lead-truncated', lead });
      }
    }
  }

  const h2Size = sectionH2 ? Number.parseFloat(getComputedStyle(sectionH2).fontSize) : null;
  const bodySize = bodyCopy ? Number.parseFloat(getComputedStyle(bodyCopy).fontSize) : null;
  const heroH1 = document.querySelector('.case-detail-hero h1');
  const heroExcerpt = document.querySelector('.case-detail-hero__copy p');
  const relatedH2 = document.querySelector('.case-related__head h2');
  const footerH2 = document.querySelector('.case-detail-footer-cta h2');
  const dossierKicker = document.querySelector('.case-detail-dossier__body > span');
  const metaLabel = document.querySelector('.case-detail-meta span');
  const metaValue = document.querySelector('.case-detail-meta strong');
  const infoLabel = document.querySelector('.case-info-label');
  const infoValue = document.querySelector('.case-info-value');

  const heroH1Color = heroH1 ? getComputedStyle(heroH1).color : '';
  if (heroH1Color.includes('255, 255, 255') || heroH1Color === 'rgb(255, 255, 255)') {
    issues.push({ code: 'hero-h1-white-on-light', color: heroH1Color });
  }

  const heroExcerptColor = heroExcerpt ? getComputedStyle(heroExcerpt).color : '';
  if (heroExcerptColor.includes('255, 255, 255')) {
    issues.push({ code: 'hero-excerpt-white-on-light', color: heroExcerptColor });
  }

  if (h2Size && bodySize) {
    const ratio = h2Size / bodySize;
    if (ratio > 1.18) {
      issues.push({ code: 'heading-body-ratio-high', ratio: Math.round(ratio * 100) / 100, h2Size, bodySize });
    }
    if (bodySize < 16) {
      issues.push({ code: 'body-too-small', bodySize });
    }
    if (h2Size > 22) {
      issues.push({ code: 'section-h2-too-large', h2Size });
    }
  }

  for (const [name, el] of [
    ['relatedH2', relatedH2],
    ['footerH2', footerH2],
  ]) {
    if (!el || !bodySize) continue;
    const size = Number.parseFloat(getComputedStyle(el).fontSize);
    const ratio = size / bodySize;
    if (ratio > 1.18) {
      issues.push({ code: 'secondary-h2-ratio-high', name, ratio: Math.round(ratio * 100) / 100, size, bodySize });
    }
    if (size > 22) {
      issues.push({ code: 'secondary-h2-too-large', name, size });
    }
  }

  if (heroH1 && heroExcerpt) {
    const h1Size = Number.parseFloat(getComputedStyle(heroH1).fontSize);
    const exSize = Number.parseFloat(getComputedStyle(heroExcerpt).fontSize);
    if (h1Size / exSize > 2.15) {
      issues.push({
        code: 'hero-h1-excerpt-ratio-high',
        ratio: Math.round((h1Size / exSize) * 100) / 100,
        h1Size,
        exSize,
      });
    }
  }

  if (dossierKicker) {
    const kickerSize = Number.parseFloat(getComputedStyle(dossierKicker).fontSize);
    if (kickerSize > 16.5) {
      issues.push({ code: 'dossier-kicker-too-large', kickerSize });
    }
    if (kickerSize < 16) {
      issues.push({ code: 'dossier-kicker-too-small', kickerSize });
    }
  }

  if (metaLabel && metaValue) {
    const labelSize = Number.parseFloat(getComputedStyle(metaLabel).fontSize);
    const valueSize = Number.parseFloat(getComputedStyle(metaValue).fontSize);
    if (labelSize >= valueSize) {
      issues.push({ code: 'dossier-meta-label-too-large', labelSize, valueSize });
    }
  }

  if (infoLabel && infoValue) {
    const labelSize = Number.parseFloat(getComputedStyle(infoLabel).fontSize);
    const valueSize = Number.parseFloat(getComputedStyle(infoValue).fontSize);
    if (labelSize >= valueSize) {
      issues.push({ code: 'sidebar-meta-label-too-large', labelSize, valueSize });
    }
  }

  if (scopeList && scopeItems.length && bodyText) {
    const dupes = scopeItems.filter((item) => {
      const norm = item.toLowerCase();
      const snippet = norm.slice(0, Math.min(48, norm.length));
      return snippet.length > 18 && bodyText.toLowerCase().includes(snippet);
    });
    if (scopeItems.length >= 2 && dupes.length >= Math.max(1, scopeItems.length - 1)) {
      issues.push({ code: 'scope-duplicates-body', items: dupes.slice(0, 4) });
    }
  }

  if (dossierImg && (dossierImg.naturalWidth < 80 || dossierImg.naturalHeight < 60)) {
    issues.push({
      code: 'dossier-thumb-small',
      width: dossierImg.naturalWidth,
      height: dossierImg.naturalHeight,
    });
  }

  const rectsIntersect = (a, b) => {
    if (!a || !b) return false;
    const pad = 2;
    return !(
      a.right - pad < b.left + pad ||
      a.left + pad > b.right - pad ||
      a.bottom - pad < b.top + pad ||
      a.top + pad > b.bottom - pad
    );
  };

  const evidenceRows = Array.from(document.querySelectorAll('.case-related .evidence-case-row')).slice(0, 4);
  for (const [index, row] of evidenceRows.entries()) {
    const figure = row.querySelector('.evidence-case-row__thumb');
    const title = row.querySelector('.evidence-case-row__copy h3');
    const description = row.querySelector('.evidence-case-row__copy p');
    const rowNumber = row.querySelector('.evidence-case-row__number');
    if (!figure || !title) continue;
    const figureRect = figure.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    if (rectsIntersect(figureRect, titleRect)) {
      issues.push({
        code: 'evidence-row-image-title-overlap',
        index,
        figureRight: Math.round(figureRect.right),
        titleLeft: Math.round(titleRect.left),
      });
    }
    if (description) {
      const descriptionRect = description.getBoundingClientRect();
      if (rectsIntersect(figureRect, descriptionRect)) {
        issues.push({
          code: 'evidence-row-image-description-overlap',
          index,
          figureRight: Math.round(figureRect.right),
          descriptionLeft: Math.round(descriptionRect.left),
        });
      }
    }
    if (rowNumber) {
      const numRect = rowNumber.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      if (numRect.left - rowRect.left > 72) {
        issues.push({
          code: 'evidence-row-index-disconnected',
          index,
          numLeft: Math.round(numRect.left),
          rowLeft: Math.round(rowRect.left),
        });
      }
    }
    const metaCells = Array.from(row.querySelectorAll('.evidence-case-row__meta-group .evidence-case-row__meta'));
    if (metaCells.length >= 2) {
      const sectorRect = metaCells[0].getBoundingClientRect();
      const yearRect = metaCells[1].getBoundingClientRect();
      if (rectsIntersect(sectorRect, yearRect)) {
        issues.push({
          code: 'evidence-meta-sector-year-overlap',
          index,
          sectorRight: Math.round(sectorRect.right),
          yearLeft: Math.round(yearRect.left),
        });
      }
    }
    const metaLabel = row.querySelector('.evidence-case-row__meta span');
    const metaValue = row.querySelector('.evidence-case-row__meta strong');
    if (metaLabel && metaValue) {
      const labelWeight = Number.parseInt(getComputedStyle(metaLabel).fontWeight, 10) || 400;
      const valueWeight = Number.parseInt(getComputedStyle(metaValue).fontWeight, 10) || 400;
      if (labelWeight >= valueWeight) {
        issues.push({
          code: 'evidence-meta-label-too-bold',
          index,
          labelWeight,
          valueWeight,
        });
      }
    }
  }

  const viewportWidth = window.innerWidth;
  const productIndexes = Array.from(document.querySelectorAll('.product-sheet__index'));
  for (const [index, el] of productIndexes.entries()) {
    const rect = el.getBoundingClientRect();
    const centerX = (rect.left + rect.right) / 2;
    const inCenterBand = centerX > viewportWidth * 0.3 && centerX < viewportWidth * 0.7;
    const position = getComputedStyle(el).position;
    if (inCenterBand) {
      issues.push({
        code: 'product-index-viewport-centered',
        index,
        centerX: Math.round(centerX),
        viewportWidth,
        text: (el.textContent || '').trim(),
      });
    }
    if (position === 'absolute' || position === 'fixed') {
      issues.push({
        code: 'product-index-positioned-absolute',
        index,
        position,
        text: (el.textContent || '').trim(),
      });
    }
    const copy = el.closest('.product-sheet__copy');
    const header = el.closest('.product-sheet__header');
    if (copy && header) {
      const copyRect = copy.getBoundingClientRect();
      if (rect.left - copyRect.left > 96) {
        issues.push({
          code: 'product-index-disconnected-from-copy',
          index,
          indexLeft: Math.round(rect.left),
          copyLeft: Math.round(copyRect.left),
        });
      }
    }
  }

  const ctaCard = document.querySelector('.case-detail-side .case-cta-card');
  const firstEvidenceRow = document.querySelector('.case-related .evidence-case-row');
  if (ctaCard && firstEvidenceRow) {
    const ctaRect = ctaCard.getBoundingClientRect();
    const rowRect = firstEvidenceRow.getBoundingClientRect();
    if (rectsIntersect(ctaRect, rowRect)) {
      issues.push({
        code: 'cta-overlaps-evidence-row',
        ctaBottom: Math.round(ctaRect.bottom),
        rowTop: Math.round(rowRect.top),
      });
    }
  }

  return {
    skipped: false,
    path: location.pathname + location.search,
    issues,
    metrics: {
      h2Size,
      bodySize,
      h2BodyRatio: h2Size && bodySize ? Math.round((h2Size / bodySize) * 100) / 100 : null,
      heroH1Size: heroH1 ? Number.parseFloat(getComputedStyle(heroH1).fontSize) : null,
      heroExcerptSize: heroExcerpt ? Number.parseFloat(getComputedStyle(heroExcerpt).fontSize) : null,
      relatedH2Size: relatedH2 ? Number.parseFloat(getComputedStyle(relatedH2).fontSize) : null,
      hasServiceCards: !!serviceCards,
      serviceImgWidth: serviceImg?.naturalWidth || 0,
      serviceLeadLen: (serviceLeadEl?.innerText || '').trim().length,
      scopeCount: scopeItems.length,
      evidenceRowCount: evidenceRows.length,
      productIndexCount: productIndexes.length,
      heroH1Color,
      heroExcerptColor,
    },
  };
})()`;

async function getTargets() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        const list = await res.json();
        if (list.some((t) => t.type === 'page')) return list;
      }
    } catch { /* boot */ }
    await sleep(150);
  }
  throw new Error('CDP not ready');
}

let commandId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId;
    const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 22000);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timer);
      ws.removeEventListener('message', onMessage);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function auditPath(ws, path) {
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp(ws, 'Page.navigate', { url: new URL(path, BASE_URL).toString() });
  await sleep(2200);

  await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => Promise.all(
      Array.from(document.querySelectorAll('.case-service-card__media img, .case-detail-dossier__media img'))
        .map((img) => (img.complete && img.naturalWidth > 48 ? Promise.resolve() : new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 4500);
        })))
    ))()`,
    awaitPromise: true,
  }).catch(() => {});

  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression: LAYOUT_PROBE,
    returnByValue: true,
  });

  return result?.value || { issues: [{ code: 'evaluation-empty' }] };
}

function formatFailures(rows) {
  const failures = [];
  for (const row of rows) {
    if (row.skipped) continue;
    for (const issue of row.issues || []) {
      failures.push(`${row.path}: ${issue.code}${issue.lead ? ` (${String(issue.lead).slice(0, 60)})` : ''}`);
    }
  }
  return failures;
}

async function main() {
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`Servidor no responde en ${BASE_URL}`);
    process.exit(1);
  }

  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=/tmp/umsa-antecedente-layout-${PORT}`,
    'about:blank',
  ], { stdio: 'ignore' });
  await sleep(2200);

  const targets = await getTargets();
  const page = targets.find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('No CDP page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  await cdp(ws, 'Page.enable');

  const rows = [];
  for (const path of paths) {
    const probe = await auditPath(ws, path);
    rows.push({ path, ...probe });
  }

  ws.close();
  chrome.kill('SIGKILL');

  const failures = formatFailures(rows);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    paths,
    rows,
    failureCount: failures.length,
    failures,
  };

  await writeFile(OUT_FILE, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({ failureCount: failures.length, failures, outFile: OUT_FILE }, null, 2));
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
