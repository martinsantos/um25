import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const BASE = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.HEURISTIC_CDP_PORT || 9345);
const OUT = process.env.HEURISTIC_OUT || 'docs/audits/consistency-pass-2026-05-29/heuristic-matrix.json';

const routes = E2E_DEFECT_PATHS;

const viewports = [
  { name: 'desktop 1440x900', width: 1440, height: 900, mobile: false },
  { name: 'mobile 390x900', width: 390, height: 900, mobile: true },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const needsCta = (path) => {
  const base = path.split('?')[0];
  return ['/', '/servicios', '/contacto'].includes(base)
    || base.startsWith('/servicios/')
    || base.startsWith('/servicios-it')
    || base.startsWith('/presupuesto')
    || base.startsWith('/proyectos-ingenieria')
    || !['/nosotros', '/blog', '/antecedentes', '/sectores'].includes(base);
};

const PAGE_PROBE = `(() => {
  const body = document.body;
  const text = body?.innerText || '';
  const h1s = [...document.querySelectorAll('h1')];
  const main = document.querySelector('main') || body;
  const r = main.getBoundingClientRect();
  const pts = [
    [r.left + r.width * 0.5, r.top + r.height * 0.35],
    [r.left + r.width * 0.25, r.top + r.height * 0.5],
    [r.left + r.width * 0.75, r.top + r.height * 0.5],
  ];
  let darkHits = 0;
  for (const [x, y] of pts) {
    const el = document.elementFromPoint(
      Math.min(window.innerWidth - 1, Math.max(0, x)),
      Math.min(window.innerHeight - 1, Math.max(0, y)),
    );
    if (!el) continue;
    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (m && Number(m[1]) < 30 && Number(m[2]) < 30 && Number(m[3]) < 30) darkHits += 1;
  }

  const isAltGray = (rgb) => {
    const [r, g, b] = rgb;
    return (r >= 243 && r <= 248 && g >= 243 && g <= 248 && b >= 243 && b <= 248)
      && Math.abs(r - g) <= 3 && Math.abs(g - b) <= 3;
  };

  const heroSel = [
    '.um-home-hero', '.services-hero', '.service-detail-hero', '.sectors-hero',
    '.sector-detail-hero', '.case-detail-hero', '.antecedentes-hero', '.ante-hero',
    '.geo-dossier-hero', '.geo-final', '.blog-hero', '.about-hero', 'footer',
  ].join(',');

  let editorialAltBg = 0;
  const altSamples = [];
  for (const section of main.querySelectorAll('section, [class*="section"], .services-operating-model, .case-related, .contact-intents, .um-final-cta, .geo-dossier-section')) {
    if (section.closest(heroSel)) continue;
    const rect = section.getBoundingClientRect();
    if (rect.height < 80 || rect.bottom < 0 || rect.top > window.innerHeight * 1.5) continue;
    const bg = getComputedStyle(section).backgroundColor;
    const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!m) continue;
    const rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (isAltGray(rgb)) {
      editorialAltBg += 1;
      if (altSamples.length < 3) {
        altSamples.push(section.className?.slice?.(0, 60) || section.tagName);
      }
    }
  }

  const emoji = /[\\u{1F300}-\\u{1FAFF}]/u.test(text);
  const article = document.querySelector('.article-body, main article, [class*="article"]');
  const articleText = article?.innerText || text;
  const crumbBlocks = [...document.querySelectorAll(
    '[aria-label="Breadcrumb"], [aria-label="Navegación"], nav[aria-label], [class*="breadcrumb"], [class*="crumb"], .blog-breadcrumb',
  )];
  const breadcrumbText = crumbBlocks.map((el) => el.innerText || el.textContent || '').join('\\n');
  const stripCrumbs = (value) => String(value || '')
    .replace(breadcrumbText, '')
    .replace(/^\\s*\\/\\s*$/gm, '');
  const prose = document.querySelector('.article-body .prose, .editorial-body, .prose, .blog-article, .case-detail-body');
  let proseText = '';
  if (prose) {
    const clone = prose.cloneNode(true);
    clone.querySelectorAll('pre, code').forEach((el) => el.remove());
    proseText = stripCrumbs(clone.innerText || '');
  }
  const mdLiteral = proseText.length > 0 && /\\*\\*|^#{1,6}\\s/m.test(proseText);
  const bulletSource = proseText;
  const bulletSlash = bulletSource.length > 0 && /^\\s*\\/\\s+[\\p{L}\\p{N}]/mu.test(bulletSource);
  const productFrameBorders = [...document.querySelectorAll('.product-sheet__frame, .case-gallery-frame')]
    .filter((frame) => {
      const s = getComputedStyle(frame);
      return s.borderWidth && s.borderWidth !== '0px';
    }).length;
  const broken = [...document.images]
    .filter((img) => img.complete && img.naturalWidth === 0 && img.getBoundingClientRect().width > 20)
    .map((img) => img.currentSrc || img.src)
    .slice(0, 3);

  let minBodyFont = 99;
  for (const el of main.querySelectorAll('p, li, dd, label, span, a, button')) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (!Number.isNaN(fs) && fs < minBodyFont) minBodyFont = fs;
  }

  const canonical = document.querySelector('link[rel="canonical"]')?.href || null;
  const ctaFold = [...document.querySelectorAll('main a, main button')].some((el) => {
    const rect = el.getBoundingClientRect();
    const label = (el.innerText || '').trim() + String(el.className || '');
    return rect.top >= 0
      && rect.top < window.innerHeight
      && rect.height >= 36
      && /diagn|contact|relevamiento|cotizar|especialista|abono|pliego|presupuesto/i.test(label);
  });

  return {
    h1: h1s.length,
    h1Text: h1s[0]?.innerText?.slice(0, 90) || null,
    textLen: text.trim().length,
    blackFill: darkHits >= 3,
    editorialAltBg,
    altSamples,
    emoji,
    mdLiteral,
    bulletSlash,
    productFrameBorders,
    broken,
    minBodyFont: minBodyFont === 99 ? null : Math.round(minBodyFont * 10) / 10,
    canonical,
    ctaFold,
    title: document.title,
  };
})()`;

function evaluate(path, d) {
  if (!d || typeof d !== 'object') {
    return { status: 'DEFECTO', defects: ['probe falló'] };
  }
  const defects = [];
  let status = 'OK';

  if (d.h1 !== 1) {
    defects.push('H1 ausente o duplicado');
    status = 'DEFECTO';
  }
  if (d.textLen < 200) {
    defects.push('contenido vacío');
    status = 'DEFECTO';
  }
  if (d.blackFill && d.textLen < 500) {
    defects.push('fill negro sin texto');
    status = 'DEFECTO';
  }
  if (d.editorialAltBg > 0) {
    defects.push(`fondo alt editorial (${d.editorialAltBg}: ${d.altSamples.join(', ')})`);
    status = 'DEFECTO';
  }
  if (d.emoji) {
    defects.push('emoji visible');
    status = 'DEFECTO';
  }
  if (d.mdLiteral) {
    defects.push('markdown literal');
    if (status === 'OK') status = 'MEJORABLE';
  }
  if (d.bulletSlash) {
    defects.push('viñeta /');
    status = 'DEFECTO';
  }
  if (d.productFrameBorders > 0) {
    defects.push('borde product-sheet/galería');
    status = 'DEFECTO';
  }
  if (d.broken.length) {
    defects.push('imagen rota');
    status = 'DEFECTO';
  }
  if (d.minBodyFont !== null && d.minBodyFont < 16) {
    defects.push(`body ${d.minBodyFont}px`);
    status = 'DEFECTO';
  }
  if (needsCta(path) && !d.ctaFold) {
    defects.push('CTA ausente fold');
    if (status === 'OK') status = 'MEJORABLE';
  }

  return { status, defects };
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=/tmp/umsa-heuristic-${PORT}`,
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(900);
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const pageTarget = targets.find((t) => t.type === 'page');
  if (!pageTarget) throw new Error('No Chrome page target');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let commandId = 0;
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 25000);
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

  await cdp('Page.enable');
  const matrix = [];

  for (const path of routes) {
    for (const viewport of viewports) {
      await cdp('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      });
      if (viewport.mobile) {
        await cdp('Emulation.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        });
      }
      await cdp('Page.navigate', { url: new URL(path, BASE).toString() });
      await sleep(viewport.mobile ? 2200 : 1800);

      let d;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { result } = await cdp('Runtime.evaluate', {
          expression: PAGE_PROBE,
          returnByValue: true,
        });
        d = result?.value;
        if (d) break;
        await sleep(1200);
      }
      if (!d || typeof d !== 'object') {
        matrix.push({ path, viewport: viewport.name, status: 'DEFECTO', defects: ['probe falló'], probeError: true });
        console.log(`${'DEFECTO'.padEnd(9)} ${viewport.name.padEnd(18)} ${path} probe falló`);
        continue;
      }
      const { status, defects } = evaluate(path, d);
      matrix.push({ path, viewport: viewport.name, status, defects, ...d });
      console.log(`${status.padEnd(9)} ${viewport.name.padEnd(18)} ${path} ${defects.join('; ') || '-'}`);
    }
  }

  ws.close();
  chrome.kill('SIGKILL');

  await mkdir(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
  await writeFile(OUT, JSON.stringify(matrix, null, 2));

  const summary = {
    total: matrix.length,
    ok: matrix.filter((r) => r.status === 'OK').length,
    mejorable: matrix.filter((r) => r.status === 'MEJORABLE').length,
    defecto: matrix.filter((r) => r.status === 'DEFECTO').length,
    pass: matrix.filter((r) => r.status !== 'DEFECTO').length,
    pctOk: Math.round((matrix.filter((r) => r.status === 'OK').length / matrix.length) * 1000) / 10,
    pctPass: Math.round((matrix.filter((r) => r.status !== 'DEFECTO').length / matrix.length) * 1000) / 10,
  };
  await writeFile(OUT.replace(/\.json$/, '-summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nSummary:', JSON.stringify(summary));

  process.exit(summary.defecto ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
