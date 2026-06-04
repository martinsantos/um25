import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.HOVER_AUDIT_CDP_PORT || (9450 + Math.floor(Math.random() * 500)));
const profilePath = `/tmp/umsa-hover-audit-${PORT}`;
const SCREENSHOT_DIR = process.env.HOVER_AUDIT_SCREENSHOT_DIR || '';
const SCREENSHOT_LABELS = new Set(
  (process.env.HOVER_AUDIT_SCREENSHOT_LABELS || '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
);

function isLocalAuditTarget(baseUrl) {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

const isDevAuditTarget = isLocalAuditTarget(BASE_URL);

const allChecks = [
  { path: '/', selector: '.um-service-unit', label: 'home service unit' },
  { path: '/', selector: '.um-services-command__links .um-arrow-link', label: 'home arrow link' },
  { path: '/', selector: '.evidence-case-row', label: 'home evidence row' },
  { path: '/', selector: 'nav[aria-label="Sectores con antecedentes"] a', label: 'home sector link' },
  { path: '/', selector: '.um-intent-link-graph__item', label: 'home intent link' },
  { path: '/servicios', selector: '.um-btn-primary', label: 'services primary cta' },
  { path: '/servicios', selector: '.um-btn-secondary', label: 'services secondary cta' },
  { path: '/servicios', selector: '.service-dossier-item', label: 'services dossier item' },
  { path: '/servicios', selector: '.services-intent-card', label: 'services intent card' },
  { path: '/contacto', selector: '.contact-intent', label: 'contact intent card' },
  { path: '/contacto', selector: '.contact-submit', label: 'contact submit button' },
  { path: '/antecedentes', selector: '.ante-dossier__feature, .ante-dossier__secondary-item, .evidence-item', label: 'antecedentes evidence item' },
  { path: '/antecedentes?sector=bodegas', selector: '.ante-dossier__actions a:first-child', label: 'antecedentes hero primary cta' },
  { path: '/antecedentes?sector=bodegas', selector: '.ante-dossier__actions a:nth-child(2)', label: 'antecedentes hero secondary cta' },
  { path: '/antecedentes?sector=bodegas', selector: '.ante-dossier__search input', label: 'antecedentes search input' },
  { path: '/antecedentes?sector=bodegas', selector: '.ante-dossier__search button', label: 'antecedentes search button' },
  { path: '/antecedentes?sector=bodegas', selector: '.ante-dossier__sector-links a:not(.is-active)', label: 'antecedentes sector filter' },
  { path: '/antecedentes?sector=bodegas', selector: '.ante-dossier__clear', label: 'antecedentes clear filter' },
  { path: '/antecedentes?page=2', selector: '.ante-dossier__pagination a:not(.is-active)', label: 'antecedentes pagination' },
  { path: '/antecedentes?template=atlas&sector=bodegas', selector: '.ante-atlas__filters input', label: 'antecedentes atlas search input', devOnly: true },
  { path: '/antecedentes?template=atlas&sector=bodegas', selector: '.ante-atlas__filters nav a:not(.is-active)', label: 'antecedentes atlas sector filter', devOnly: true },
  { path: '/antecedentes?template=atlas&page=2', selector: '.ante-atlas__pagination a:not(.is-active)', label: 'antecedentes atlas pagination', devOnly: true },
  { path: '/sectores', selector: '.sector-editorial-row, .sector-atlas-exec-row, a.um-click-surface', label: 'sectores linked row' },
  { path: '/sectores?sector=bodegas', selector: '.sector-editorial__market-links a:not(.is-active)', label: 'sectores editorial market filter' },
  { path: '/sectores?template=atlas&sector=bodegas', selector: '.sector-atlas-exec-ledger__filters-links a:not(.is-active)', label: 'sectores atlas market filter', devOnly: true },
  { path: '/blog', selector: '.cat-tab:not(.cat-tab--active)', label: 'blog category tab' },
];

const checks = allChecks.filter((check) => isDevAuditTarget || !check.devOnly);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanupChrome() {
  spawnSync('pkill', ['-f', profilePath], { stdio: 'ignore' });
}

async function getTargets() {
  for (let i = 0; i < 160; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        if (targets.some((target) => target.type === 'page')) return targets;
      }
    } catch {
      // Chrome is still booting.
    }
    await sleep(125);
  }
  throw new Error(`CDP not ready on ${PORT}`);
}

let commandId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId;
    const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 20000);
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

async function readHoverState(ws, selector) {
  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const target = el.querySelector('h2, h3, strong, .um-click-action') || el;
      const style = getComputedStyle(el);
      const targetStyle = getComputedStyle(target);
      const afterStyle = getComputedStyle(el, '::after');
      const rect = el.getBoundingClientRect();
      const childOverflow = Array.from(el.children).map((child) => {
        const childRect = child.getBoundingClientRect();
        if (childRect.width <= 0 || childRect.height <= 0) return null;
        const overflow = {
          left: Math.round(rect.left - childRect.left),
          right: Math.round(childRect.right - rect.right),
          top: Math.round(rect.top - childRect.top),
          bottom: Math.round(childRect.bottom - rect.bottom),
        };
        const worst = Math.max(overflow.left, overflow.right, overflow.top, overflow.bottom);
        if (worst <= 3) return null;
        return {
          tag: child.tagName.toLowerCase(),
          className: child.className || '',
          overflow,
        };
      }).filter(Boolean);
      return {
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        borderRightColor: style.borderRightColor,
        borderBottomColor: style.borderBottomColor,
        borderLeftColor: style.borderLeftColor,
        color: style.color,
        targetColor: targetStyle.color,
        textDecorationColor: style.textDecorationColor,
        textDecorationLine: style.textDecorationLine,
        boxShadow: style.boxShadow,
        outlineColor: style.outlineColor,
        afterBorderBottomColor: afterStyle.borderBottomColor,
        afterBackgroundColor: afterStyle.backgroundColor,
        afterOpacity: afterStyle.opacity,
        afterTransform: afterStyle.transform,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        childOverflow
      };
    })()`,
    returnByValue: true,
  });
  return result?.value || null;
}

function changed(before, after) {
  if (!before || !after) return false;
  return [
    'backgroundColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'color',
    'targetColor',
    'textDecorationColor',
    'textDecorationLine',
    'boxShadow',
    'outlineColor',
    'afterBorderBottomColor',
    'afterBackgroundColor',
    'afterOpacity',
    'afterTransform',
  ].some((key) => before[key] !== after[key]);
}

function hasFrameIssue(state) {
  return (state?.childOverflow || []).length > 0;
}

function screenshotName(label, viewportName = 'desktop') {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${viewportName}.png`;
}

async function maybeCaptureScreenshot(ws, check) {
  if (!SCREENSHOT_DIR || (SCREENSHOT_LABELS.size > 0 && !SCREENSHOT_LABELS.has(check.label))) return null;
  const shot = await cdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const file = join(SCREENSHOT_DIR, screenshotName(check.label));
  await writeFile(file, Buffer.from(shot.data, 'base64'));
  return file;
}

async function runCheck(ws, check) {
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1360,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp(ws, 'Page.navigate', { url: new URL(check.path, BASE_URL).toString() });
  await sleep(1400);

  const before = await readHoverState(ws, check.selector);
  const documentResult = await cdp(ws, 'DOM.getDocument', { depth: 1 });
  const queryResult = await cdp(ws, 'DOM.querySelector', {
    nodeId: documentResult.root.nodeId,
    selector: check.selector,
  });

  if (!queryResult.nodeId) {
    return { ...check, status: 'FAIL', reason: 'selector not found', before, after: null };
  }

  await cdp(ws, 'CSS.forcePseudoState', {
    nodeId: queryResult.nodeId,
    forcedPseudoClasses: ['hover'],
  });
  await sleep(120);
  const after = await readHoverState(ws, check.selector);
  await cdp(ws, 'CSS.forcePseudoState', {
    nodeId: queryResult.nodeId,
    forcedPseudoClasses: [],
  });
  const screenshot = await maybeCaptureScreenshot(ws, check);

  return {
    ...check,
    status: changed(before, after) && !hasFrameIssue(before) && !hasFrameIssue(after) ? 'OK' : 'FAIL',
    reason: !changed(before, after)
      ? 'hover did not change computed style'
      : hasFrameIssue(before) || hasFrameIssue(after)
        ? 'children overflow surface frame'
        : undefined,
    before,
    after,
    screenshot,
  };
}

async function main() {
  cleanupChrome();
  if (SCREENSHOT_DIR) await mkdir(SCREENSHOT_DIR, { recursive: true });
  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profilePath}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const results = [];
  try {
    const targets = await getTargets();
    const page = targets.find((target) => target.type === 'page');
    if (!page) throw new Error('No Chrome page target available.');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');
    await cdp(ws, 'DOM.enable');
    await cdp(ws, 'CSS.enable');

    for (const check of checks) {
      results.push(await runCheck(ws, check));
    }

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    cleanupChrome();
  }

  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    checked: results.length,
    failures: results.filter((result) => result.status !== 'OK'),
    results,
  }, null, 2));

  if (results.some((result) => result.status !== 'OK')) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
