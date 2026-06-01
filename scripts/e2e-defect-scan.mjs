/**
 * Supplemental localhost defect scan: fill-black, markdown literals, emojis, product borders.
 * Usage: node scripts/e2e-defect-scan.mjs [path...]
 */
import { spawn, spawnSync } from 'node:child_process';
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.E2E_DEFECT_CDP_PORT || (9343 + Math.floor(Math.random() * 1000)));

const paths = process.argv.slice(2).length ? process.argv.slice(2) : E2E_DEFECT_PATHS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profilePath = `/tmp/umsa-e2e-defect-${PORT}`;

function cleanupDefectChrome() {
  spawnSync('pkill', ['-f', profilePath], { stdio: 'ignore' });
}

async function getTargets() {
  for (let i = 0; i < 160; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        if (targets.some((target) => target.type === 'page')) return targets;
      }
    } catch { /* boot */ }
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

async function scanPath(ws, path) {
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp(ws, 'Page.navigate', { url: new URL(path, BASE_URL).toString() });
  await sleep(1800);

  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const mainEl = document.querySelector('main');
      const proseRoot = (() => {
        if (!mainEl) return null;
        const clone = mainEl.cloneNode(true);
        clone.querySelectorAll('pre, code, script, style').forEach((el) => el.remove());
        return clone;
      })();
      const mainText = proseRoot?.innerText || mainEl?.innerText || '';
      const html = proseRoot?.innerHTML || mainEl?.innerHTML || '';
      const emojiRe = /[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}]/u;
      const markdownLiteral =
        /\\*\\*[^*]+\\*\\*|^#{1,3}\\s/m.test(mainText) ||
        /\\*\\*[^*]+\\*\\*|\\[\\]\\(/.test(html.slice(0, 12000));
      const bulletSlash = Array.from(mainEl?.querySelectorAll('p, li, h2, h3, dd, blockquote') || [])
        .filter((el) => !el.closest('[class*="breadcrumb"], .service-detail-breadcrumb, .bc-sep, nav'))
        .some((el) => /^\\s*\\/\\s+\\S{4,}/.test((el.innerText || '').trim()));
      const h1 = document.querySelector('h1');
      const main = document.querySelector('main');
      const mainRect = main?.getBoundingClientRect();
      const mainStyle = main ? getComputedStyle(main) : null;
      const bg = mainStyle ? getComputedStyle(document.documentElement).backgroundColor : null;
      const visibleTextNodes = Array.from(document.querySelectorAll('main *'))
        .filter((el) => {
          const t = (el.innerText || '').trim();
          const r = el.getBoundingClientRect();
          return t.length > 2 && r.width > 0 && r.height > 0;
        }).length;
      const viewportDarkRatio = (() => {
        const sample = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * 0.45);
        const chain = [];
        let el = sample;
        for (let i = 0; i < 6 && el; i += 1) { chain.push(el); el = el.parentElement; }
        const dark = chain.filter((node) => {
          const s = getComputedStyle(node);
          const m = s.backgroundColor.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
          if (!m) return false;
          const lum = 0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3];
          return lum < 40 && Number.parseFloat(s.opacity || '1') > 0.5;
        }).length;
        return dark >= 3;
      })();
      const fillBlack = viewportDarkRatio && visibleTextNodes < 8 && mainText.length < 400;
      const bodyText = document.body?.innerText || '';
      const productImages = Array.from(document.querySelectorAll('.product-sheet img, [class*="product"] img, .service-detail-main img'))
        .filter((img) => img.getBoundingClientRect().width > 80);
      const productBorderIssues = productImages.map((img) => {
        const style = getComputedStyle(img);
        const parent = img.parentElement;
        const ps = parent ? getComputedStyle(parent) : null;
        const border = ['Top','Right','Bottom','Left'].reduce((s, side) => s + Number.parseFloat(style['border'+side+'Width']||0), 0);
        const pborder = ps ? ['Top','Right','Bottom','Left'].reduce((s, side) => s + Number.parseFloat(ps['border'+side+'Width']||0), 0) : 0;
        const shadow = style.boxShadow !== 'none' || (ps && ps.boxShadow !== 'none');
        if (border > 0 || pborder > 0 || shadow) {
          return { src: (img.currentSrc || img.src).slice(-60), border, pborder, shadow };
        }
        return null;
      }).filter(Boolean);
      return {
        path: location.pathname + location.search + location.hash,
        title: document.title,
        h1: h1?.innerText?.trim() || null,
        h1Count: document.querySelectorAll('h1').length,
        textLen: bodyText.length,
        visibleTextNodes,
        fillBlack,
        markdownLiteral,
        bulletSlash,
        hasEmoji: emojiRe.test(bodyText),
        productBorderIssues,
        frameworkError: /Astro encountered|Internal server error|Unhandled Runtime/i.test(bodyText)
      };
    })()`,
    returnByValue: true,
  });

  return { path, ...(result?.value || { error: 'no value' }) };
}

async function main() {
  cleanupDefectChrome();
  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profilePath}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const findings = [];
  try {
    const targets = await getTargets();
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
    await cdp(ws, 'Page.enable');

    for (const path of paths) {
      const row = await scanPath(ws, path);
      const defects = [];
      if (row.fillBlack) defects.push('FILL_BLACK');
      if (row.markdownLiteral) defects.push('MARKDOWN_LITERAL');
      if (row.bulletSlash) defects.push('BULLET_SLASH');
      if (row.hasEmoji) defects.push('EMOJI');
      if (row.frameworkError) defects.push('FRAMEWORK_ERROR');
      if (row.h1Count !== 1) defects.push(`H1_COUNT_${row.h1Count}`);
      if ((row.productBorderIssues || []).length) defects.push('PRODUCT_IMAGE_BORDER');
      findings.push({ ...row, defects, status: defects.length ? 'DEFECTO' : 'OK' });
    }
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    cleanupDefectChrome();
  }

  console.log(JSON.stringify(findings, null, 2));
  if (findings.some((f) => f.defects?.length)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
