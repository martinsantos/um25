/**
 * CSS gap debug probe — heurísticas visuales en localhost (Chrome headless + CDP).
 *
 * Uso:
 *   npm run dev   # en otra terminal, puerto 4321 por defecto
 *   node scripts/css-gap-debug-probe.mjs
 *
 * Variables de entorno:
 *   DEBUG_RUN_ID          Etiqueta del run en logs (default: pre-fix-<timestamp>)
 *   DEBUG_LOG_PATH        NDJSON local (default: ~/.cursor/debug-logs/debug-a0ad57.log)
 *   VISUAL_AUDIT_BASE_URL Base URL (default: http://localhost:4321)
 *   CHROME_BIN            Ruta a Chrome/Chromium
 *   CSS_GAP_CDP_PORT      Puerto CDP (default: 9346)
 *
 * Comprueba: fondos gris editorial, marcos producto, contraste CTA/hero (H8),
 * markdown literal en blog. En rutas /servicios/ hace scroll a .um-cta antes de medir.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawn } from 'node:child_process';

const LOG_PATH = process.env.DEBUG_LOG_PATH || '/Users/santosma/.cursor/debug-logs/debug-a0ad57.log';
const SESSION = 'a0ad57';
const INGEST = 'http://127.0.0.1:7771/ingest/b376acbc-00fc-4eda-b141-dcedfa95c600';
const BASE = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.CSS_GAP_CDP_PORT || 9346);
const RUN_ID = process.env.DEBUG_RUN_ID || `pre-fix-${Date.now()}`;

const SERVICE_ROUTES = [
  '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces',
  '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi',
  '/servicios/103/telecomunicaciones-datos-voz-video',
  '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp',
  '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it',
  '/servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria',
  '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios',
  '/servicios/108/servicios-electricos-para-it',
];

const routes = process.env.CSS_GAP_ROUTES === 'services'
  ? SERVICE_ROUTES
  : [
      '/',
      ...SERVICE_ROUTES,
      '/servicios/107/sistemas-de-deteccion-de-incendios',
      '/servicios/103/telecomunicaciones-datos-voz-video#producto-monitores-de-citofonia-interior',
      '/sectores',
      '/sectores?template=atlas',
      '/aeropuertos?template=atlas',
      '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza',
      '/estilo',
      '/blog/restic-y-postgresql-el-backup-que-si-vuelve',
      '/blog/nueva-normativa-camara-vigilancia-edificios-2024',
    ];

const PROBE = `(() => {
  const skin = document.body.getAttribute('data-skin') || 'none';
  const root = getComputedStyle(document.documentElement);
  const tokens = {
    skinSection: root.getPropertyValue('--skin-section').trim(),
    skinSectionAlt: root.getPropertyValue('--skin-section-alt').trim(),
  };

  const parseRgb = (bg) => {
    const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };

  const isAltGray = (rgb) => {
    if (!rgb) return false;
    const [r, g, b] = rgb;
    return r >= 243 && r <= 248 && g >= 243 && g <= 248 && b >= 243 && b <= 248
      && Math.abs(r - g) <= 3 && Math.abs(g - b) <= 3 && !(r === 255 && g === 255 && b === 255);
  };

  const samples = [];
  const selectors = [
    '.service-products-section',
    '.product-sheet',
    '.product-sheet__frame',
    '.um-service-image',
    '.sector-atlas-exec-row__services li',
    'main',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const s = getComputedStyle(el);
    const rgb = parseRgb(s.backgroundColor);
    samples.push({
      sel,
      bg: s.backgroundColor,
      border: s.borderWidth,
      borderColor: s.borderColor,
      boxShadow: s.boxShadow !== 'none' ? s.boxShadow.slice(0, 80) : 'none',
      isAltGray: isAltGray(rgb),
    });
  }

  const graySections = [];
  for (const section of document.querySelectorAll('main section, .service-products-section, .product-sheet')) {
    const bg = getComputedStyle(section).backgroundColor;
    const rgb = parseRgb(bg);
    if (isAltGray(rgb)) {
      graySections.push({
        cls: (section.className || '').slice(0, 80),
        bg,
      });
    }
  }

  const frameIssues = [...document.querySelectorAll('.product-sheet__frame, .case-gallery-frame')]
    .map((el) => {
      const s = getComputedStyle(el);
      const rgb = parseRgb(s.backgroundColor);
      const opaqueGrayBg = rgb && rgb.every((n) => n >= 243 && n <= 248) && !(rgb[0] === 255 && rgb[1] === 255 && rgb[2] === 255);
      return {
        cls: el.className,
        border: s.borderWidth,
        bg: s.backgroundColor,
        shadow: s.boxShadow !== 'none',
        opaqueGrayBg,
      };
    })
    .filter((f) => {
      const borderBad = f.border !== '0px' && !f.border.startsWith('0px');
      return borderBad || f.shadow || f.opaqueGrayBg;
    });

  const prose = document.querySelector('.article-body .prose, .prose');
  const proseText = prose?.innerText || '';
  const mdLiteral = proseText.length > 0 && /\\*\\*|^#{1,6}\\s/m.test(proseText);
  const ctaFold = [...document.querySelectorAll('main a, main button')].some((el) => {
    const rect = el.getBoundingClientRect();
    const label = (el.innerText || '') + String(el.className || '');
    return rect.top >= 0 && rect.top < window.innerHeight && rect.height >= 36
      && /diagn|contact|relevamiento|cotizar|especialista|abono|pliego|presupuesto|servicios/i.test(label);
  });

  const contrastOnDark = (el) => {
    if (!el) return null;
    const fg = getComputedStyle(el).color;
    const m = fg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!m) return null;
    const lum = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const L1 = 0.2126 * lum(+m[1]) + 0.7152 * lum(+m[2]) + 0.0722 * lum(+m[3]);
    const L2 = lum(8);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return { color: fg, ratio: Math.round(ratio * 100) / 100, sel: el.className || el.tagName };
  };
  const ctaTitle = document.querySelector('.um-cta__title');
  const ctaContrast = contrastOnDark(ctaTitle);
  const heroH1 = document.querySelector('.service-detail-hero h1');
  const heroH1Contrast = contrastOnDark(heroH1);

  const ctaLowContrast = [];
  const cta = document.querySelector('.um-cta');
  if (cta) {
    for (const el of cta.querySelectorAll('h1,h2,h3,p,span,a,strong')) {
      const c = contrastOnDark(el);
      if (c && c.ratio < 4.5) {
        ctaLowContrast.push({
          tag: el.tagName,
          cls: (el.className || '').slice(0, 60),
          text: (el.innerText || '').slice(0, 48),
          ...c,
        });
      }
    }
  }

  const heroLowContrast = [];
  const hero = document.querySelector('.service-detail-hero');
  if (hero) {
    for (const el of hero.querySelectorAll('h1,h2,p,span,a,strong,.service-detail-label')) {
      const c = contrastOnDark(el);
      if (c && c.ratio < 4.5) {
        heroLowContrast.push({
          tag: el.tagName,
          cls: (el.className || '').slice(0, 60),
          text: (el.innerText || '').slice(0, 48),
          ...c,
        });
      }
    }
  }

  return {
    skin,
    tokens,
    samples,
    graySections,
    frameIssues,
    mdLiteral,
    ctaFold,
    ctaContrast,
    heroH1Contrast,
    ctaLowContrast,
    heroLowContrast,
    path: location.pathname + location.hash,
  };
})()`;

function log(hypothesisId, location, message, data) {
  const line = JSON.stringify({
    sessionId: SESSION,
    runId: RUN_ID,
    hypothesisId,
    location,
    message,
    timestamp: Date.now(),
    data,
  });
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  appendFileSync(LOG_PATH, `${line}\n`);
  fetch(INGEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION },
    body: line,
  }).catch(() => {});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  log('H0', 'css-gap-debug-probe.mjs', 'probe_start', { routes, runId: RUN_ID });

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=/tmp/umsa-css-gap-${PORT}`,
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
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const path of routes) {
    const url = new URL(path, BASE).toString();
    await cdp('Page.navigate', { url });
    await sleep(2200);
    if (path === '/') {
      await cdp('Runtime.evaluate', {
        expression: `(() => {
          const t = document.querySelector('.um-service-image, .um-evidence-section, [class*="service"]');
          if (t) t.scrollIntoView({ block: 'center' });
        })()`,
      });
      await sleep(400);
    } else if (path.includes('/servicios/')) {
      await cdp('Runtime.evaluate', {
        expression: `(() => {
          const cta = document.querySelector('.um-cta');
          if (cta) cta.scrollIntoView({ block: 'center' });
        })()`,
      });
      await sleep(400);
    }
    const { result } = await cdp('Runtime.evaluate', { expression: PROBE, returnByValue: true });
    const d = result?.value;
    if (!d) {
      log('H5', path, 'probe_failed', { url });
      continue;
    }

    if (d.graySections?.length) {
      log('H1', path, 'editorial_alt_gray', { url, graySections: d.graySections, skin: d.skin });
    }
    if (d.frameIssues?.length) {
      log('H2', path, 'image_frame_border', { url, frameIssues: d.frameIssues });
    }
    const productSection = d.samples?.find((s) => s.sel === '.service-products-section');
    if (productSection?.isAltGray) {
      log('H1', path, 'product_section_alt_gray', { productSection, skin: d.skin });
    }
    const umImg = d.samples?.find((s) => s.sel === '.um-service-image');
    if (umImg?.isAltGray) {
      log('H4', path, 'home_service_image_gray', { umImg });
    }
    const atlasLi = d.samples?.find((s) => s.sel === '.sector-atlas-exec-row__services li');
    if (atlasLi?.isAltGray) {
      log('H3', path, 'atlas_chip_alt_gray', { atlasLi });
    }
    if (d.skin === 'steel' || d.tokens?.skinSection?.includes('F4F6F8')) {
      log('H5', path, 'wrong_skin_tokens', { skin: d.skin, tokens: d.tokens });
    }
    if (path.startsWith('/blog') && d.mdLiteral) {
      log('H6', path, 'blog_md_literal', { url, mdLiteral: d.mdLiteral });
    }
    if (path.startsWith('/blog') && !d.ctaFold) {
      log('H7', path, 'blog_cta_missing_fold', { url });
    }
    if (d.ctaContrast && d.ctaContrast.ratio < 4.5) {
      log('H8', path, 'cta_title_low_contrast', { url, ctaContrast: d.ctaContrast });
    }
    if (d.heroH1Contrast && d.heroH1Contrast.ratio < 4.5) {
      log('H8', path, 'hero_h1_low_contrast', { url, heroH1Contrast: d.heroH1Contrast });
    }
    if (d.ctaLowContrast?.length) {
      log('H8', path, 'cta_band_low_contrast_nodes', { url, ctaLowContrast: d.ctaLowContrast });
    }
    if (d.heroLowContrast?.length) {
      log('H8', path, 'hero_low_contrast_nodes', { url, heroLowContrast: d.heroLowContrast });
    }

    log('H0', path, 'probe_ok', {
      url,
      skin: d.skin,
      samples: d.samples,
      grayCount: d.graySections?.length || 0,
      mdLiteral: d.mdLiteral,
      ctaFold: d.ctaFold,
      ctaContrast: d.ctaContrast,
      heroH1Contrast: d.heroH1Contrast,
      ctaLowContrastCount: d.ctaLowContrast?.length || 0,
      heroLowContrastCount: d.heroLowContrast?.length || 0,
    });
  }

  ws.close();
  chrome.kill('SIGKILL');
  log('H0', 'css-gap-debug-probe.mjs', 'probe_end', { runId: RUN_ID });
  console.log(`CSS gap probe done → ${LOG_PATH} (runId=${RUN_ID})`);
}

main().catch((e) => {
  log('H0', 'css-gap-debug-probe.mjs', 'probe_error', { error: String(e) });
  console.error(e);
  process.exit(1);
});
