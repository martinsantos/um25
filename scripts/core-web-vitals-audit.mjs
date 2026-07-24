import { spawn, spawnSync } from 'node:child_process';

const BASE_URL = process.env.VITALS_BASE_URL || 'http://localhost:4321';
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(new URL(BASE_URL).hostname);
const ENFORCE_SERVER_TIMING = process.env.VITALS_ENFORCE_SERVER_TIMING === '1' || !IS_LOCAL;
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.VITALS_CDP_PORT || (9800 + Math.floor(Math.random() * 120)));
const profilePath = `/tmp/umsa-vitals-${PORT}`;

const routes = [
  '/',
  '/servicios',
  '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces',
  '/antecedentes',
  '/antecedentes/3051/3051-soporte-it-24-7-para-data-center-gubernamental-gobierno-de-mendoza',
  '/sectores',
  '/seguridad-electronica',
  '/blog',
  '/contacto',
  '/servicios-it-empresas-mendoza',
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 900, mobile: true },
];

const limits = {
  lcp: Number(process.env.VITALS_LCP_LIMIT || 2500),
  cls: Number(process.env.VITALS_CLS_LIMIT || 0.1),
  fcp: Number(process.env.VITALS_FCP_LIMIT || 1800),
  ttfb: Number(process.env.VITALS_TTFB_LIMIT || 800),
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanupChrome() {
  spawnSync('pkill', ['-f', profilePath], { stdio: 'ignore' });
}

async function getPageTarget() {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === 'page');
        if (page) return page;
      }
    } catch {
      // Chrome is still starting.
    }
    await sleep(125);
  }
  throw new Error(`Chrome CDP did not become available on ${PORT}`);
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

const observerScript = `(() => {
  window.__umVitals = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) window.__umVitals.lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__umVitals.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
})();`;

async function evaluate(ws, expression) {
  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result?.value;
}

async function auditRoute(ws, route, viewport) {
  // Warm Astro's route compiler and local data adapters before measuring UI work.
  // Production audits still enforce the complete navigation timing below.
  if (IS_LOCAL) await fetch(new URL(route, BASE_URL)).catch(() => null);
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });
  await cdp(ws, 'Page.navigate', { url: new URL(route, BASE_URL).toString() });
  await sleep(1800);
  await evaluate(ws, 'document.fonts.ready.then(() => true)');

  const metrics = await evaluate(ws, `(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const images = [...document.images];
    const missingSizes = images.filter((image) => !image.hasAttribute('width') || !image.hasAttribute('height')).length;
    return {
      title: document.title,
      h1Count: document.querySelectorAll('h1').length,
      lcp: Math.round(window.__umVitals?.lcp || 0),
      cls: Number((window.__umVitals?.cls || 0).toFixed(4)),
      fcp: Math.round(fcp?.startTime || 0),
      ttfb: Math.round(nav ? nav.responseStart - nav.startTime : 0),
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
      load: Math.round(nav?.loadEventEnd || 0),
      images: images.length,
      missingSizes,
      fontReady: document.fonts.check('16px "UM Sans"'),
      bodyFont: getComputedStyle(document.body).fontFamily,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`);

  metrics.renderLcp = Math.max(0, metrics.lcp - metrics.ttfb);
  metrics.renderFcp = Math.max(0, metrics.fcp - metrics.ttfb);
  const measuredLcp = ENFORCE_SERVER_TIMING ? metrics.lcp : metrics.renderLcp;
  const measuredFcp = ENFORCE_SERVER_TIMING ? metrics.fcp : metrics.renderFcp;
  const failures = [];
  if (!metrics.title) failures.push('missing title');
  if (metrics.h1Count !== 1) failures.push(`h1 count ${metrics.h1Count}`);
  if (!metrics.lcp || measuredLcp > limits.lcp) failures.push(`LCP ${metrics.lcp}ms (render ${metrics.renderLcp}ms)`);
  if (metrics.cls > limits.cls) failures.push(`CLS ${metrics.cls}`);
  if (!metrics.fcp || measuredFcp > limits.fcp) failures.push(`FCP ${metrics.fcp}ms (render ${metrics.renderFcp}ms)`);
  if (ENFORCE_SERVER_TIMING && metrics.ttfb > limits.ttfb) failures.push(`TTFB ${metrics.ttfb}ms`);
  if (metrics.missingSizes > 0) failures.push(`${metrics.missingSizes} images without dimensions`);
  if (!metrics.fontReady) failures.push('fonts not ready');
  if (!metrics.bodyFont.includes('UM Sans')) failures.push(`unexpected body font ${metrics.bodyFont}`);
  if (metrics.overflowX) failures.push('horizontal overflow');

  return { route, viewport: viewport.name, ...metrics, failures };
}

async function main() {
  cleanupChrome();
  const chromeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profilePath}`,
    'about:blank',
  ];
  const shellQuote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
  const chrome = spawn('/bin/zsh', [
    '-lc',
    `exec ${[CHROME_BIN, ...chromeArgs].map(shellQuote).join(' ')}`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let chromeError = '';
  chrome.stderr.on('data', (chunk) => {
    chromeError = `${chromeError}${chunk}`.slice(-4000);
  });

  const results = [];
  try {
    let page;
    try {
      page = await getPageTarget();
    } catch (error) {
      throw new Error(`${error.message}\n${chromeError}`);
    }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');
    await cdp(ws, 'Page.addScriptToEvaluateOnNewDocument', { source: observerScript });

    for (const viewport of viewports) {
      for (const route of routes) results.push(await auditRoute(ws, route, viewport));
    }
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    cleanupChrome();
  }

  const failures = results.filter((result) => result.failures.length > 0);
  console.log(JSON.stringify({ baseUrl: BASE_URL, limits, enforceServerTiming: ENFORCE_SERVER_TIMING, checked: results.length, failures, results }, null, 2));
  // CDP/WebSocket implementations can retain an event-loop handle after Chrome
  // has been terminated. This is a CLI gate, so return its verdict explicitly.
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
