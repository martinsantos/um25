import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.VISUAL_SNAPSHOT_CDP_PORT || 9342);
const OUT_DIR = process.env.VISUAL_SNAPSHOT_DIR || `/tmp/umsa-visual-snapshots-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const ROUTE_FILTER = process.env.VISUAL_SNAPSHOT_ROUTE_FILTER ? new RegExp(process.env.VISUAL_SNAPSHOT_ROUTE_FILTER) : null;
const VIEWPORT_FILTER = process.env.VISUAL_SNAPSHOT_VIEWPORT_FILTER ? new RegExp(process.env.VISUAL_SNAPSHOT_VIEWPORT_FILTER) : null;
const SCROLL_Y = Number(process.env.VISUAL_SNAPSHOT_SCROLL_Y || 0);
const CDP_TIMEOUT_MS = Number(process.env.VISUAL_SNAPSHOT_CDP_TIMEOUT_MS || 30000);

const routes = [
  { path: '/', label: 'home-default' },
  { path: '/?skin=white', label: 'home' },
  { path: '/servicios', label: 'servicios-default' },
  { path: '/servicios?skin=white', label: 'servicios' },
  { path: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it', label: 'servicio-detalle-default' },
  { path: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it?skin=white', label: 'servicio-detalle' },
  { path: '/antecedentes', label: 'antecedentes-default' },
  { path: '/antecedentes?skin=white', label: 'antecedentes' },
  { path: '/antecedentes?sector=aeropuertos', label: 'antecedentes-filtrado-default' },
  { path: '/antecedentes?sector=aeropuertos&skin=white', label: 'antecedentes-filtrado' },
  { path: '/antecedentes?sector=bodegas', label: 'antecedentes-bodegas-default' },
  { path: '/antecedentes?template=atlas&sector=bodegas', label: 'antecedentes-bodegas-atlas' },
  { path: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza', label: 'antecedente-detalle-default' },
  { path: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza?skin=white', label: 'antecedente-detalle' },
  { path: '/sectores', label: 'sectores-default' },
  { path: '/sectores?skin=white', label: 'sectores' },
  { path: '/sectores?sector=bodegas', label: 'sectores-filtrado-default' },
  { path: '/sectores?sector=bodegas&skin=white', label: 'sectores-filtrado' },
  { path: '/sectores?template=editorial&skin=white', label: 'sectores-editorial' },
  { path: '/sectores?template=atlas&skin=white', label: 'sectores-atlas' },
  { path: '/aeropuertos', label: 'vertical-aeropuertos-default' },
  { path: '/aeropuertos?skin=white', label: 'vertical-aeropuertos' },
  { path: '/bodegas', label: 'vertical-bodegas-default' },
  { path: '/gobiernosectorpublico', label: 'vertical-gobierno-default' },
  { path: '/mineria', label: 'vertical-mineria-default' },
  { path: '/seguridad-electronica', label: 'vertical-seguridad-default' },
  { path: '/seguridad-electronica?skin=white', label: 'vertical-seguridad' },
  { path: '/industria', label: 'vertical-industria-default' },
  { path: '/salud', label: 'vertical-salud-default' },
  { path: '/software', label: 'vertical-software-default' },
  { path: '/constructoras', label: 'vertical-constructoras-default' },
  { path: '/nosotros', label: 'nosotros-default' },
  { path: '/nosotros?skin=white', label: 'nosotros' },
  { path: '/certificaciones', label: 'certificaciones-default' },
  { path: '/certificaciones?skin=white', label: 'certificaciones' },
  { path: '/privacidad', label: 'legal-privacidad' },
  { path: '/terminos', label: 'legal-terminos' },
  { path: '/blog', label: 'blog-default' },
  { path: '/blog?skin=white', label: 'blog' },
  { path: '/blog/categoria/tecnico', label: 'blog-categoria-default' },
  { path: '/blog/categoria/tecnico?skin=white', label: 'blog-categoria' },
  { path: '/blog/restic-y-postgresql-el-backup-que-si-vuelve', label: 'blog-detalle-default' },
  { path: '/blog/restic-y-postgresql-el-backup-que-si-vuelve?skin=white', label: 'blog-detalle' },
  { path: '/contacto', label: 'contacto-default' },
  { path: '/contacto?skin=white', label: 'contacto' },
  { path: '/servicios-it-empresas-mendoza', label: 'geo-mendoza-default' },
  { path: '/servicios-it-empresas-mendoza?skin=white', label: 'geo-mendoza' },
  { path: '/servicios-it-empresas-argentina', label: 'geo-argentina-default' },
  { path: '/servicios-it-empresas-argentina?skin=white', label: 'geo-argentina' },
  { path: '/presupuesto-servicios-it-empresas', label: 'geo-presupuesto-default' },
  { path: '/presupuesto-servicios-it-empresas?skin=white', label: 'geo-presupuesto' },
  { path: '/proyectos-ingenieria-it-mendoza', label: 'geo-proyectos-default' },
  { path: '/proyectos-ingenieria-it-mendoza?skin=white', label: 'geo-proyectos' },
  { path: '/estilo/um-sans', label: 'um-sans-portfolio' },
  { path: '/estilo/um-sans-2-manual?v=alpha-6-visual', label: 'um-sans-2-manual-alpha-6' },
  { path: '/banners', label: 'lab-banners' },
  { path: '/pretext-demo', label: 'lab-pretext' },
  { path: '/plantilla-arca', label: 'utilidad-arca' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'tablet', width: 834, height: 1112, mobile: false },
  { name: 'mobile', width: 390, height: 900, mobile: true },
  { name: 'mobile-small', width: 360, height: 740, mobile: true },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTargets() {
  const maxPolls = Math.max(80, Math.ceil(CDP_TIMEOUT_MS / 100));
  for (let index = 0; index < maxPolls; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) return await response.json();
    } catch {
      // Chrome is still booting.
    }
    await sleep(100);
  }
  throw new Error(`Chrome CDP did not start on port ${PORT} after ${maxPolls * 100}ms.`);
}

let commandId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId;
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      ws.removeEventListener('message', onMessage);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function buildUrl(path) {
  return new URL(path, BASE_URL).toString();
}

async function capture(ws, route, viewport) {
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });

  if (viewport.mobile) {
    await cdp(ws, 'Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
  } else {
    await cdp(ws, 'Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    });
  }

  await cdp(ws, 'Page.navigate', { url: buildUrl(route.path) });
  await sleep(1600);
  if (SCROLL_Y > 0) {
    await cdp(ws, 'Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${SCROLL_Y}, behavior: 'instant' })`,
    });
    await sleep(180);
  }

  const shot = await cdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });

  const filename = `${route.label}-${viewport.name}.png`;
  const filepath = join(OUT_DIR, filename);
  await writeFile(filepath, Buffer.from(shot.data, 'base64'));
  return filepath;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const chromeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=/tmp/umsa-visual-snapshots-${PORT}`,
    'about:blank',
  ];
  const shellQuote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
  const chrome = spawn('/bin/zsh', [
    '-lc',
    `exec ${[CHROME_BIN, ...chromeArgs].map(shellQuote).join(' ')}`,
  ], { stdio: 'ignore' });

  try {
    const targets = await getTargets();
    const pageTarget = targets.find((target) => target.type === 'page');
    if (!pageTarget) throw new Error('No Chrome page target available.');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');

    const selectedViewports = VIEWPORT_FILTER ? viewports.filter((viewport) => VIEWPORT_FILTER.test(viewport.name)) : viewports;
    const selectedRoutes = ROUTE_FILTER ? routes.filter((route) => ROUTE_FILTER.test(route.label) || ROUTE_FILTER.test(route.path)) : routes;

    const files = [];
    for (const viewport of selectedViewports) {
      for (const route of selectedRoutes) {
        files.push(await capture(ws, route, viewport));
      }
    }

    ws.close();
    console.log(JSON.stringify({ baseUrl: BASE_URL, outDir: OUT_DIR, captured: files.length, files }, null, 2));
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
