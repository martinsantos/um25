import { spawn } from 'node:child_process';

const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.VISUAL_AUDIT_CDP_PORT || 9341);
const STRICT = process.argv.includes('--strict') || process.env.VISUAL_AUDIT_STRICT === '1';
const CDP_TIMEOUT_MS = Number(process.env.VISUAL_AUDIT_CDP_TIMEOUT_MS || 14000);
const ROUTE_TIMEOUT_MS = Number(process.env.VISUAL_AUDIT_ROUTE_TIMEOUT_MS || 22000);
const ROUTE_FILTER = process.env.VISUAL_AUDIT_ROUTE_FILTER ? new RegExp(process.env.VISUAL_AUDIT_ROUTE_FILTER) : null;
const VIEWPORT_FILTER = process.env.VISUAL_AUDIT_VIEWPORT_FILTER ? new RegExp(process.env.VISUAL_AUDIT_VIEWPORT_FILTER) : null;
const COMMERCIAL_ONLY = process.env.VISUAL_AUDIT_COMMERCIAL_ONLY === '1';
/** Réplica idéntica a prod: H1 largos/CMS y copy legacy son válidos. */
const REPLICA_IDENTICAL_COPY =
  process.env.UMSA_REPLICA_IDENTICAL !== '0' &&
  (process.env.UMSA_REPLICA_IDENTICAL === '1' || process.env.UMSA_LOCAL_REPLICA === '1');
/** Modo aislado: más pausa entre rutas y reintentos de navegación (evita navigation mismatch en batch). */
const LABEL_ONLY = process.env.VISUAL_AUDIT_LABEL_ONLY === '1';
const ISOLATED = process.env.VISUAL_AUDIT_ISOLATED === '1' || LABEL_ONLY;

const routes = [
  { path: '/', label: 'home default', requiresFirstViewportCta: true },
  { path: '/?skin=white', label: 'home', requiresFirstViewportCta: true },
  { path: '/servicios', label: 'servicios default', requiresFirstViewportCta: true },
  { path: '/servicios?skin=white', label: 'servicios', requiresFirstViewportCta: true },
  { path: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it', label: 'servicio detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it?skin=white', label: 'servicio detalle', requiresFirstViewportCta: true },
  { path: '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', label: 'servicio redes detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces?skin=white', label: 'servicio redes detalle', requiresFirstViewportCta: true },
  { path: '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', label: 'servicio seguridad detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/103/telecomunicaciones-datos-voz-video', label: 'servicio telecom detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp', label: 'servicio software detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria', label: 'servicio consultoria detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/108/servicios-electricos-para-it', label: 'servicio electrico detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios', label: 'servicio incendios detalle default', requiresFirstViewportCta: true },
  { path: '/servicios/107/sistemas-de-deteccion-de-incendios', label: 'servicio incendios slug corto default', requiresFirstViewportCta: true },
  { path: '/antecedentes', label: 'antecedentes default' },
  { path: '/antecedentes?skin=white', label: 'antecedentes' },
  { path: '/antecedentes?sector=aeropuertos', label: 'antecedentes filtrado default' },
  { path: '/antecedentes?sector=aeropuertos&skin=white', label: 'antecedentes filtrado' },
  { path: '/antecedentes?template=editorial&skin=white', label: 'antecedentes editorial' },
  { path: '/antecedentes?template=atlas&skin=white', label: 'antecedentes atlas' },
  { path: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza', label: 'antecedente detalle default' },
  { path: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza?skin=white', label: 'antecedente detalle' },
  { path: '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza', label: 'antecedente detalle cctv default' },
  { path: '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza?skin=white', label: 'antecedente detalle cctv' },
  { path: '/sectores', label: 'sectores default' },
  { path: '/sectores?skin=white', label: 'sectores' },
  { path: '/sectores?sector=bodegas', label: 'sectores filtrado default' },
  { path: '/sectores?sector=bodegas&skin=white', label: 'sectores filtrado' },
  { path: '/sectores?template=editorial&skin=white', label: 'sectores editorial' },
  { path: '/sectores?template=atlas&skin=white', label: 'sectores atlas' },
  { path: '/aeropuertos', label: 'vertical sector default', requiresFirstViewportCta: true },
  { path: '/aeropuertos?skin=white', label: 'vertical sector', requiresFirstViewportCta: true },
  { path: '/aeropuertos?template=editorial&skin=white', label: 'vertical editorial', requiresFirstViewportCta: true },
  { path: '/aeropuertos?template=atlas&skin=white', label: 'vertical atlas', requiresFirstViewportCta: true },
  { path: '/bodegas', label: 'vertical bodegas default', requiresFirstViewportCta: true },
  { path: '/gobiernosectorpublico', label: 'vertical gobierno default', requiresFirstViewportCta: true },
  { path: '/mineria', label: 'vertical mineria default', requiresFirstViewportCta: true },
  { path: '/seguridad-electronica', label: 'vertical seguridad default', requiresFirstViewportCta: true },
  { path: '/seguridad-electronica?skin=white', label: 'vertical seguridad white', requiresFirstViewportCta: true },
  { path: '/industria', label: 'vertical industria default', requiresFirstViewportCta: true },
  { path: '/salud', label: 'vertical salud default', requiresFirstViewportCta: true },
  { path: '/software', label: 'vertical software default', requiresFirstViewportCta: true },
  { path: '/constructoras', label: 'vertical constructoras default', requiresFirstViewportCta: true },
  { path: '/nosotros', label: 'nosotros default' },
  { path: '/nosotros?skin=white', label: 'nosotros' },
  { path: '/blog', label: 'blog default' },
  { path: '/blog?skin=white', label: 'blog' },
  { path: '/blog/plantilla-arca-facturacion-electronica-gratis', label: 'blog detalle default' },
  { path: '/blog/plantilla-arca-facturacion-electronica-gratis?skin=white', label: 'blog detalle' },
  { path: '/contacto', label: 'contacto default', requiresFirstViewportCta: true },
  { path: '/contacto?skin=white', label: 'contacto', requiresFirstViewportCta: true },
  { path: '/servicios-it-empresas-mendoza', label: 'geo mendoza default', canonical: 'https://ultimamilla.com.ar/servicios-it-empresas-mendoza', requiresFirstViewportCta: true },
  { path: '/servicios-it-empresas-mendoza?skin=white', label: 'geo mendoza', canonical: 'https://ultimamilla.com.ar/servicios-it-empresas-mendoza', requiresFirstViewportCta: true },
  { path: '/servicios-it-empresas-argentina', label: 'geo argentina default', canonical: 'https://ultimamilla.com.ar/servicios-it-empresas-argentina', requiresFirstViewportCta: true },
  { path: '/servicios-it-empresas-argentina?skin=white', label: 'geo argentina', canonical: 'https://ultimamilla.com.ar/servicios-it-empresas-argentina', requiresFirstViewportCta: true },
  { path: '/presupuesto-servicios-it-empresas', label: 'geo presupuesto default', canonical: 'https://ultimamilla.com.ar/presupuesto-servicios-it-empresas', requiresFirstViewportCta: true },
  { path: '/presupuesto-servicios-it-empresas?skin=white', label: 'geo presupuesto', canonical: 'https://ultimamilla.com.ar/presupuesto-servicios-it-empresas', requiresFirstViewportCta: true },
  { path: '/proyectos-ingenieria-it-mendoza', label: 'geo proyectos default', canonical: 'https://ultimamilla.com.ar/proyectos-ingenieria-it-mendoza', requiresFirstViewportCta: true },
  { path: '/proyectos-ingenieria-it-mendoza?skin=white', label: 'geo proyectos', canonical: 'https://ultimamilla.com.ar/proyectos-ingenieria-it-mendoza', requiresFirstViewportCta: true },
  { path: '/banners', label: 'lab banners' },
  { path: '/pretext-demo', label: 'lab pretext' },
  { path: '/plantilla-arca', label: 'utilidad arca' },
];

const commercialLabels = new Set([
  'home default',
  'home',
  'servicios default',
  'servicios',
  'servicio detalle default',
  'servicio detalle',
  'servicio redes detalle default',
  'servicio redes detalle',
  'servicio seguridad detalle default',
  'servicio telecom detalle default',
  'servicio software detalle default',
  'servicio consultoria detalle default',
  'servicio electrico detalle default',
  'servicio incendios detalle default',
  'servicio incendios slug corto default',
  'antecedentes default',
  'antecedentes',
  'antecedentes filtrado default',
  'antecedentes filtrado',
  'antecedentes editorial',
  'antecedentes atlas',
  'antecedente detalle',
  'antecedente detalle default',
  'sectores default',
  'sectores',
  'sectores filtrado default',
  'sectores filtrado',
  'sectores editorial',
  'sectores atlas',
  'vertical sector default',
  'vertical sector',
  'vertical editorial',
  'vertical atlas',
  'vertical seguridad default',
  'vertical seguridad white',
  'vertical bodegas default',
  'vertical gobierno default',
  'vertical mineria default',
  'vertical industria default',
  'vertical salud default',
  'vertical software default',
  'vertical constructoras default',
  'nosotros default',
  'nosotros',
  'blog default',
  'blog',
  'blog detalle default',
  'blog detalle',
  'contacto default',
  'contacto',
  'geo mendoza default',
  'geo mendoza',
  'geo argentina default',
  'geo argentina',
  'geo presupuesto default',
  'geo presupuesto',
  'geo proyectos default',
  'geo proyectos',
]);

const viewports = STRICT ? [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'narrow-desktop', width: 1173, height: 760, mobile: false },
  { name: 'compact-desktop', width: 590, height: 740, mobile: false },
  { name: 'tablet', width: 834, height: 1112, mobile: false },
  { name: 'mobile', width: 390, height: 900, mobile: true },
  { name: 'mobile-small', width: 360, height: 740, mobile: true },
] : [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 900, mobile: true },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTargets() {
  for (let index = 0; index < 80; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) return await response.json();
    } catch {
      // Chrome is still booting.
    }
    await sleep(100);
  }
  throw new Error('Chrome CDP did not start.');
}

let commandId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', onMessage);
      reject(new Error(`CDP timeout after ${CDP_TIMEOUT_MS}ms: ${method}`));
    }, CDP_TIMEOUT_MS);
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

function buildUrl(path) {
  return new URL(path, BASE_URL).toString();
}

/** Accept canonical slug redirects (e.g. servicio 107 slug corto → canónico). */
const PATH_NAV_CHECK_JS = `function pathsMatchNavigation(expectedPath, actualPath, canonicalPath) {
  if (actualPath === expectedPath) return true;
  const expectedService = expectedPath.match(/^\\/servicios\\/(\\d+)\\//);
  const actualService = actualPath.match(/^\\/servicios\\/(\\d+)\\//);
  if (expectedService && actualService && expectedService[1] === actualService[1]) return true;
  if (canonicalPath && actualPath === canonicalPath) return true;
  return false;
}`;

function ctaRequirementApplies(route, viewport) {
  if (!STRICT || !route.requiresFirstViewportCta) return false;
  // Contacto needs the action visible especially on mobile. Desktop can use the anchored CTA and form below.
  if (route.label === 'contacto') return true;
  return viewport.name !== 'mobile-small';
}

async function auditRoute(ws, route, viewport) {
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
  }

  const expectedPath = route.path.split('?')[0].replace(/\/$/, '') || '/';
  const targetUrl = buildUrl(route.path);
  let navigationMismatch = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await cdp(ws, 'Page.navigate', { url: targetUrl });
    try {
      await cdp(ws, 'Runtime.evaluate', {
        expression: `(() => new Promise((resolve) => {
          const finish = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
          if (document.readyState === 'complete') finish();
          else window.addEventListener('load', finish, { once: true });
        }))()`,
        awaitPromise: true,
      });
    } catch {
      await sleep(1200);
    }
    await sleep(ISOLATED ? 650 : 350);

    const pathCheck = await cdp(ws, 'Runtime.evaluate', {
      expression: `(() => {
        ${PATH_NAV_CHECK_JS}
        const expectedPath = ${JSON.stringify(expectedPath)};
        const actualPath = (location.pathname || '/').replace(/\\/$/, '') || '/';
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        const canonicalPath = canonicalEl?.href
          ? new URL(canonicalEl.href, location.origin).pathname.replace(/\\/$/, '') || '/'
          : null;
        return {
          ok: pathsMatchNavigation(expectedPath, actualPath, canonicalPath),
          actualPath,
          canonicalPath,
        };
      })()`,
      returnByValue: true,
    });
    const checkValue = pathCheck?.result?.value;
    if (checkValue?.ok) {
      navigationMismatch = false;
      break;
    }
    navigationMismatch = true;
    if (attempt < 2) {
      await sleep(500);
    }
  }

  if (navigationMismatch) {
    return {
      navigationMismatch: true,
      expectedPath,
      actualPath: 'unknown-after-retry',
      title: null,
      h1Count: 0,
      textCount: 0,
    };
  }

  const expression = `(() => {
    ${PATH_NAV_CHECK_JS}
    const expectedPath = ${JSON.stringify(expectedPath)};
    const actualPath = (location.pathname || '/').replace(/\\/$/, '') || '/';
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonicalPath = canonicalEl?.href
      ? new URL(canonicalEl.href, location.origin).pathname.replace(/\\/$/, '') || '/'
      : null;
    if (!pathsMatchNavigation(expectedPath, actualPath, canonicalPath)) {
      return {
        navigationMismatch: true,
        expectedPath,
        actualPath,
        canonicalPath,
        title: document.title || null,
        h1Count: 0,
        textCount: 0
      };
    }

    const darkSurfaceSelector = [
      '.um-surface-dark',
      '.um-panel-dark',
      '.um-home-hero',
      '.um-connected-section',
      '.um-final-cta',
      '.um-cta',
      '.services-hero',
      '.service-detail-hero',
      '.sectors-hero',
      '.sector-editorial-index-hero',
      '.sector-atlas-index-hero',
      '.sector-detail-hero',
      '.sector-editorial-detail-hero',
      '.sector-atlas-detail-hero',
      '.case-detail-hero',
      '.antecedentes-hero',
      '.ante-hero',
      '.geo-dossier-hero',
      '.um-invert',
      '.wd-invert',
      '.geo-dossier-brief',
      '.geo-final',
      '.ante-dossier__feature',
      '.banner-stage',
      '.bg-gray-950',
      '.contact-quick-card',
      '.service-detail-proof',
      '.service-detail-proof div',
      '.service-detail-hero__panel',
      '.case-detail-hero__panel',
      '.geo-dossier-media figcaption'
    ].join(',');
    const lightSurfaceSelector = [
      '.um-surface-light',
      '.um-panel-light',
      '.ante-dossier__feature-body',
      '.ante-dossier__secondary-item',
      '.ante-dossier__row',
      '.sector-atlas-exec-row',
      '.blog-hero',
      '.blog-archive',
      '.contact-form-card',
      '.geo-dossier-section'
    ].join(',');

    function parseRgb(value) {
      const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] == null ? 1 : Number(match[4])
      };
    }

    function luminance(rgb) {
      const values = [rgb.r, rgb.g, rgb.b].map((value) => {
        value /= 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    }

    function contrast(fg, bg) {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    function isVisibleTextElement(element) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.textContent || '').trim();
      return text.length > 0 && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }

    function clippedViewportArea(rect) {
      const left = Math.max(0, rect.left);
      const top = Math.max(0, rect.top);
      const right = Math.min(window.innerWidth, rect.right);
      const bottom = Math.min(window.innerHeight, rect.bottom);
      return Math.max(0, right - left) * Math.max(0, bottom - top);
    }

    const minFontExclusionSelector = [
      'nav',
      'footer',
      '.ante-dossier__sector-rail',
      '.ante-dossier__sector-links',
      '.sector-atlas-exec-ledger__filters-links',
      '.sector-atlas__filters',
      '.blog-category-tabs',
      '.um-nav-meta',
      '[class*="breadcrumb"]',
      '[class*="chip"]',
      '[class*="filter"]',
      '[class*="meta"]',
      '[class*="label"]',
      '[class*="tag"]',
      '[class*="badge"]'
    ].join(',');

    function countsForMinFont(element) {
      if (element.closest(minFontExclusionSelector)) return false;
      const mediaFrame = element.closest('.evidence-case-row__thumb, .evidence-item__media, .ante-dossier__row figure');
      if (mediaFrame) {
        const rect = mediaFrame.getBoundingClientRect();
        if (rect.width > 0 && rect.width < 128 && rect.height < 120) return false;
      }
      return true;
    }

    const textElements = Array.from(document.body.querySelectorAll('body *'))
      .filter((element) => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(element.tagName))
      .filter(isVisibleTextElement);

    const fontSizes = textElements
      .filter(countsForMinFont)
      .map((element) => Number.parseFloat(getComputedStyle(element).fontSize))
      .filter(Number.isFinite);
    const weights = textElements
      .map((element) => Number.parseFloat(getComputedStyle(element).fontWeight))
      .filter(Number.isFinite);

    const darkTextIssues = [];
    const lightTextIssues = [];
    const redSmallTextIssues = [];
    let redBackgroundArea = 0;

    for (const element of textElements) {
      const surface = element.closest(darkSurfaceSelector);
      const style = getComputedStyle(element);
      const fg = parseRgb(style.color);
      if (!fg) continue;

      const bg = parseRgb(style.backgroundColor);
      const isRedBackground = bg && bg.r >= 180 && bg.g <= 88 && bg.b <= 88 && bg.a > 0.6;
      if (isRedBackground) {
        redBackgroundArea += clippedViewportArea(element.getBoundingClientRect());
      }

      if (!surface) continue;

      const ratio = contrast(fg, { r: 5, g: 5, b: 5 });
      const text = (element.innerText || element.textContent || '').trim().replace(/\\\\s+/g, ' ').slice(0, 90);
      const fontSize = Number.parseFloat(style.fontSize);
      const isLarge = fontSize >= 24;
      const required = isLarge ? 3 : 4.5;

      if (ratio < required) {
        darkTextIssues.push({
          text,
          color: style.color,
          fontSize,
          ratio: Math.round(ratio * 100) / 100,
          selector: element.className ? String(element.className).slice(0, 90) : element.tagName
        });
      }

      const isRed = fg.r >= 180 && fg.g <= 80 && fg.b <= 80;
      const isCta = Boolean(element.closest('.um-btn,.um-btn-primary,.um-nav-cta,button'));
      if (isRed && !isCta && fontSize < 20) {
        redSmallTextIssues.push({
          text,
          color: style.color,
          fontSize,
          selector: element.className ? String(element.className).slice(0, 90) : element.tagName
        });
      }
    }

    for (const element of textElements) {
      const surface = element.closest(lightSurfaceSelector);
      if (!surface || element.closest(darkSurfaceSelector)) continue;
      const style = getComputedStyle(element);
      const fg = parseRgb(style.color);
      if (!fg) continue;
      const ratio = contrast(fg, { r: 255, g: 255, b: 255 });
      const fontSize = Number.parseFloat(style.fontSize);
      const isLarge = fontSize >= 24;
      const required = isLarge ? 3 : 4.5;
      if (ratio < required) {
        lightTextIssues.push({
          text: (element.innerText || element.textContent || '').trim().replace(/\\\\s+/g, ' ').slice(0, 90),
          color: style.color,
          fontSize,
          ratio: Math.round(ratio * 100) / 100,
          selector: element.className ? String(element.className).slice(0, 90) : element.tagName
        });
      }
    }

    const firstViewportCtas = Array.from(document.querySelectorAll('main a, main button'))
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const text = (element.innerText || element.textContent || '').trim();
        const className = String(element.className || '');
        const href = element.getAttribute('href') || '';
        const looksLikeCta = /btn|cta|submit|diagn[oó]stico|contacto|relevamiento|abono|especialista|consulta|cotizar/i.test(className + ' ' + text + ' ' + href);
        return looksLikeCta && text.length > 0 && rect.width >= 40 && rect.height >= 36 && rect.top >= 0 && rect.top < window.innerHeight && style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: (element.innerText || element.textContent || '').trim().replace(/\\\\s+/g, ' ').slice(0, 90),
          top: Math.round(rect.top),
          height: Math.round(rect.height),
          href: element.getAttribute('href') || null
        };
      })
      .slice(0, 8);

    const visibleImages = Array.from(document.images)
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width > 20 && rect.height > 20;
      });

    const brokenImages = visibleImages
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt || ''
      }))
      .slice(0, 8);

    const textContent = document.body.innerText || '';
    const frameworkOverlay = /Astro encountered an error|Internal server error|Vite Error|Unhandled Runtime Error|Cannot find module|Error:\\s/i.test(textContent);
    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const h1Rect = h1 ? h1.getBoundingClientRect() : null;
    const overflowOffenders = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 110),
          text: (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      })
      .filter((item) => item.right > window.innerWidth + 1 || item.left < -1)
      .slice(0, 10);

    function rectsOverlap(a, b) {
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    const navCollisionIssues = (() => {
      const header = document.querySelector('.um-site-nav');
      if (!header) return [];
      const logo = header.querySelector('a[href="/"], .um-logo');
      const desktopMenu = header.querySelector('.um-desktop-menu');
      const mobileToggle = header.querySelector('.um-menu-toggle');
      const issues = [];
      const logoRect = logo?.getBoundingClientRect();
      const menuRect = desktopMenu?.getBoundingClientRect();
      const toggleRect = mobileToggle?.getBoundingClientRect();
      const desktopVisible = desktopMenu && getComputedStyle(desktopMenu).display !== 'none' && menuRect.width > 0 && menuRect.height > 0;
      const toggleVisible = mobileToggle && getComputedStyle(mobileToggle).display !== 'none' && toggleRect.width > 0 && toggleRect.height > 0;
      if (logoRect && desktopVisible && rectsOverlap(logoRect, menuRect)) {
        issues.push({
          type: 'logo-menu-overlap',
          logoRight: Math.round(logoRect.right),
          menuLeft: Math.round(menuRect.left),
          width: window.innerWidth
        });
      }
      if (logoRect && toggleVisible && rectsOverlap(logoRect, toggleRect)) {
        issues.push({
          type: 'logo-toggle-overlap',
          logoRight: Math.round(logoRect.right),
          toggleLeft: Math.round(toggleRect.left),
          width: window.innerWidth
        });
      }
      if (window.innerWidth <= 1040 && desktopVisible) {
        issues.push({ type: 'desktop-menu-visible-below-breakpoint', width: window.innerWidth });
      }
      return issues;
    })();

    const clippingExclusionSelector = [
      '.ante-dossier__sector-rail',
      '.sector-atlas-exec-ledger__filters-links',
      '.blog-category-tabs',
      '.blog-breadcrumb',
      '.mobile-menu-hidden',
      '.um-mobile-menu'
    ].join(',');

    const clippedLeftTolerance = window.innerWidth < 821 ? 12 : 1;

    const clippedTextIssues = Array.from(document.querySelectorAll('header a, header button, main h1, main h2, main h3, main p, main a, main button, main strong, main span'))
      .filter((element) => {
        if (element.closest(clippingExclusionSelector)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const text = (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ');
        return (
          text.length > 0 &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          (rect.left < -clippedLeftTolerance || rect.right > window.innerWidth + clippedLeftTolerance)
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 80),
          text: (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      })
      .slice(0, 10);

    function hasVisibleSurface(element) {
      const style = getComputedStyle(element);
      const bg = parseRgb(style.backgroundColor);
      const borderTotal =
        Number.parseFloat(style.borderTopWidth) +
        Number.parseFloat(style.borderRightWidth) +
        Number.parseFloat(style.borderBottomWidth) +
        Number.parseFloat(style.borderLeftWidth);
      return (bg && bg.a > 0.35) || borderTotal > 0;
    }

    const safeInsetExclusionSelector = [
      'nav',
      'header',
      'footer',
      'form',
      'label',
      'button',
      '.um-kicker',
      '.service-detail-label',
      '.case-detail-label',
      '.service-row__meta',
      '.ante-dossier__sector-rail',
      '.sector-atlas-exec-ledger__filters-links',
      '.blog-category-tabs',
      '.contact-hp',
      '.contact-proofline',
      '.services-dossier__list',
      '[class*="breadcrumb"]',
      '[class*="meta"]',
      '[class*="label"]',
      '[class*="chip"]',
      '[class*="tag"]',
      '[class*="badge"]'
    ].join(',');

    const isLayoutSurface = (surface) => {
      const className = String(surface?.className || '');
      return (
        surface?.tagName === 'SECTION' ||
        /(^|\\s)um-container(\\s|$)|__grid|__list|contact-dossier|service-detail-main__grid|services-dossier__list/i.test(className)
      );
    };

    const safeInsetIssues = Array.from(document.querySelectorAll('main h1, main h2, main h3, main p, main strong, main li'))
      .filter((element) => {
        if (element.closest(safeInsetExclusionSelector)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const text = (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ');
        if (
          text.length === 0 ||
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.bottom <= 0 ||
          rect.top >= window.innerHeight ||
          style.display === 'none' ||
          style.visibility === 'hidden'
        ) return false;

        let surface = element.parentElement;
        while (surface && surface !== document.body && surface !== document.documentElement) {
          if (surface.closest('nav, header, footer')) return false;
          if (isLayoutSurface(surface)) {
            surface = surface.parentElement;
            continue;
          }
          const surfaceRect = surface.getBoundingClientRect();
          if (surfaceRect.width > rect.width + 8 && surfaceRect.height > rect.height + 8 && hasVisibleSurface(surface)) {
            const leftInset = rect.left - surfaceRect.left;
            const rightInset = surfaceRect.right - rect.right;
            const topInset = rect.top - surfaceRect.top;
            const bottomInset = surfaceRect.bottom - rect.bottom;
            const minHorizontal = Math.min(leftInset, rightInset);
            const minVertical = Math.min(topInset, bottomInset);
            const isWideSurface = surfaceRect.width >= 220 && surfaceRect.height >= 80;
            const isPanelText = isWideSurface && surfaceRect.top < window.innerHeight;
            if (isPanelText && (minHorizontal < 14 || minVertical < 10)) {
              return true;
            }
            return false;
          }
          surface = surface.parentElement;
        }
        return false;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        let surface = element.parentElement;
        while (
          surface &&
          surface !== document.body &&
          surface !== document.documentElement &&
          (!hasVisibleSurface(surface) || isLayoutSurface(surface))
        ) {
          surface = surface.parentElement;
        }
        const surfaceRect = surface?.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 80),
          text: (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
          surface: surface ? String(surface.className || surface.tagName).slice(0, 80) : null,
          leftInset: surfaceRect ? Math.round(rect.left - surfaceRect.left) : null,
          rightInset: surfaceRect ? Math.round(surfaceRect.right - rect.right) : null,
          topInset: surfaceRect ? Math.round(rect.top - surfaceRect.top) : null,
          bottomInset: surfaceRect ? Math.round(surfaceRect.bottom - rect.bottom) : null
        };
      })
      .slice(0, 12);

    const imageAnomalies = Array.from(document.images)
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        const inMain = Boolean(image.closest('main'));
        const likelyDecorative = /logo|avatar|icon|favicon/i.test([image.className, image.alt, image.src].join(' '));
        return inMain && !likelyDecorative && rect.width > 20 && rect.height > 0;
      })
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        const isCompactThumb = Boolean(image.closest('.feed-item--compact'));
        const isArchiveLedgerThumb = Boolean(
          image.closest('.ante-dossier__row-main figure, .ante-dossier__ledger, .evidence-item--ledger, .um-world-ledger-row')
        );
        const isEvidenceRowThumb = Boolean(image.closest('.evidence-case-row__thumb'));
        const isSectorLedgerThumb = Boolean(image.closest('.sector-atlas-exec-row__sector figure'));
        if (isArchiveLedgerThumb || isEvidenceRowThumb || isSectorLedgerThumb) {
          if (!image.complete || image.naturalWidth === 0) return false;
          return rect.height < 64 || rect.width < 64;
        }
        const minHeight = isCompactThumb ? 76 : 112;
        return rect.height < minHeight || rect.width < 76;
      })
      .map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          src: image.currentSrc || image.src,
          alt: image.alt || '',
          className: String(image.className || '').slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight
        };
      })
      .slice(0, 10);

    const imageFrameIssues = Array.from(document.images)
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        const inMain = Boolean(image.closest('main'));
        const likelyDecorative = /logo|avatar|icon|favicon/i.test([image.className, image.alt, image.src].join(' '));
        return inMain && !likelyDecorative && rect.width > 70 && rect.height > 70 && rect.bottom > 0 && rect.top < window.innerHeight;
      })
      .map((image) => {
        const rect = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        const parent = image.parentElement;
        const parentStyle = parent ? getComputedStyle(parent) : null;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const imageBorder =
          Number.parseFloat(style.borderTopWidth) +
          Number.parseFloat(style.borderRightWidth) +
          Number.parseFloat(style.borderBottomWidth) +
          Number.parseFloat(style.borderLeftWidth);
        const imageShadow = style.boxShadow && style.boxShadow !== 'none';
        const parentBorder = parentStyle ? (
          Number.parseFloat(parentStyle.borderTopWidth) +
          Number.parseFloat(parentStyle.borderRightWidth) +
          Number.parseFloat(parentStyle.borderBottomWidth) +
          Number.parseFloat(parentStyle.borderLeftWidth)
        ) : 0;
        const parentShadow = parentStyle && parentStyle.boxShadow && parentStyle.boxShadow !== 'none';
        const parentTracksImage = parentRect &&
          Math.abs(parentRect.width - rect.width) < 8 &&
          Math.abs(parentRect.height - rect.height) < 8;
        const parentLooksLikeMedia = parent && /media|image|thumb|visual|figure|photo/i.test(String(parent.className || parent.tagName));
        if (imageBorder <= 0 && !imageShadow && !(parentTracksImage && parentLooksLikeMedia && (parentBorder > 0 || parentShadow))) {
          return null;
        }
        return {
          src: image.currentSrc || image.src,
          alt: image.alt || '',
          className: String(image.className || '').slice(0, 80),
          parentClass: parent ? String(parent.className || parent.tagName).slice(0, 80) : null,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          imageBorder,
          imageShadow,
          parentBorder,
          parentShadow: Boolean(parentShadow)
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    const firstViewportText = Array.from(document.body.querySelectorAll('main h1, main h2, main p, main a, main button'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight && rect.width > 0 && rect.height > 0;
      })
      .map((element) => (element.innerText || element.textContent || '').trim().replace(/\\\\s+/g, ' '))
      .filter(Boolean)
      .join(' ')
      .slice(0, 1200);

    const h1CompositionIssue = (() => {
      if (!h1 || !h1Rect) return null;
      const h1Text = (h1.innerText || h1.textContent || '').trim().replace(/\\s+/g, ' ');
      if (h1Text.length < 52) return null;
      const tooTall = h1Rect.height > Math.min(window.innerHeight * 0.52, 320);
      const tooNarrow = window.innerWidth < 821 && h1Rect.width < window.innerWidth * 0.66;
      const clipped = h1Rect.left < -1 || h1Rect.right > window.innerWidth + 1;
      if (!tooTall && !tooNarrow && !clipped) return null;
      return {
        text: h1Text.slice(0, 110),
        width: Math.round(h1Rect.width),
        height: Math.round(h1Rect.height),
        viewportWidth: window.innerWidth,
        tooTall,
        tooNarrow,
        clipped
      };
    })();

    const h1ContentIssue = (() => {
      if (!h1 || !h1Rect) return null;
      const text = (h1.innerText || h1.textContent || '').trim().replace(/\\s+/g, ' ');
      const hasCmsSeparator = /\\s[|]\\s/.test(text);
      const tooVerbose = text.length > 86;
      const generic = /^(servicios it para empresas|presupuesto de servicios it|proyectos de ingeniería it|archivo técnico umsa)$/i.test(text);
      if (!hasCmsSeparator && !tooVerbose && !generic) return null;
      return {
        text: text.slice(0, 130),
        length: text.length,
        hasCmsSeparator,
        tooVerbose,
        generic
      };
    })();

    const headingIssues = Array.from(document.querySelectorAll('main h1, main h2, main h3'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const text = (element.innerText || element.textContent || '').trim();
        const style = getComputedStyle(element);
        return (
          text.length > 0 &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.top < window.innerHeight * 1.35 &&
          rect.bottom > -80 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const tag = element.tagName.toLowerCase();
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseFloat(style.fontWeight);
        const lineHeight = Number.parseFloat(style.lineHeight);
        const text = (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ');
        const isMobileViewport = window.innerWidth <= 640;
        const maxSize =
          tag === 'h1' ? (isMobileViewport ? 40 : 58) :
          tag === 'h2' ? (isMobileViewport ? 34 : 46) :
          (isMobileViewport ? 28 : 32);
        const minLineHeight = tag === 'h1' ? 1.055 : 1.08;
        const actualLineRatio = Number.isFinite(lineHeight) && Number.isFinite(fontSize) && fontSize > 0
          ? lineHeight / fontSize
          : null;
        const overweight = Number.isFinite(fontWeight) && fontWeight > 600;
        const oversized = Number.isFinite(fontSize) && fontSize > maxSize;
        const cramped = actualLineRatio != null && actualLineRatio < minLineHeight;
        const clipped = rect.left < -1 || rect.right > window.innerWidth + 1;
        const tooTall =
          tag === 'h1' &&
          text.length > 52 &&
          rect.height > Math.min(window.innerHeight * 0.48, isMobileViewport ? 270 : 300);
        if (!overweight && !oversized && !cramped && !clipped && !tooTall) return null;
        return {
          tag,
          className: String(element.className || '').slice(0, 90),
          text: text.slice(0, 120),
          fontSize: Math.round(fontSize * 10) / 10,
          fontWeight,
          lineRatio: actualLineRatio == null ? null : Math.round(actualLineRatio * 100) / 100,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          overweight,
          oversized,
          cramped,
          clipped,
          tooTall
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    const infoHubSelectors = [
      '.sector-atlas-exec-ledger__controls',
      '.ante-dossier__controls'
    ];
    const infoHubQuality = infoHubSelectors
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const top = Number.parseFloat(style.top);
        const paddingTop = Number.parseFloat(style.paddingTop);
        const paddingRight = Number.parseFloat(style.paddingRight);
        const boxShadow = style.boxShadow || '';
        const borderTopWidth = Number.parseFloat(style.borderTopWidth);
        const background = parseRgb(style.backgroundColor);
        return {
          selector,
          display: style.display,
          position: style.position,
          top: Number.isFinite(top) ? top : null,
          height: Math.round(rect.height),
          paddingTop,
          paddingRight,
          borderTopWidth,
          backgroundAlpha: background ? background.a : null,
          hasBackdrop: style.backdropFilter !== 'none' || style.webkitBackdropFilter !== 'none',
          boxShadow,
          hasShadow: boxShadow !== 'none',
          visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        };
      })
      .filter(Boolean);

    const infoHubRows = Array.from(document.querySelectorAll('.sector-atlas-exec-row, .ante-dossier__row'))
      .slice(0, 8)
      .map((row) => {
        const style = getComputedStyle(row);
        const rect = row.getBoundingClientRect();
        const image = row.querySelector('img');
        const imageRect = image ? image.getBoundingClientRect() : null;
        return {
          selector: row.className ? String(row.className).slice(0, 80) : row.tagName,
          height: Math.round(rect.height),
          transition: style.transition || '',
          paddingLeft: Number.parseFloat(style.paddingLeft),
          imageWidth: imageRect ? Math.round(imageRect.width) : null,
          imageHeight: imageRect ? Math.round(imageRect.height) : null
        };
      });

    const editorialRowAuditTargets = [
      {
        selector: '.um-operating-steps article',
        number: 'span',
        title: 'h3',
        text: 'p',
        forbidSideBorders: true
      },
      {
        selector: '.services-package-row',
        number: 'span, .services-package-row__number, [class*="number"]',
        title: 'h3, strong, b',
        text: 'p',
        forbidSideBorders: false
      },
      {
        selector: '.sector-editorial-row',
        number: 'span, [class*="number"]',
        title: 'h3, strong, b',
        text: 'p',
        forbidSideBorders: false
      },
      {
        selector: '.evidence-item--ledger .evidence-item__body',
        number: '.evidence-item__index, span',
        title: 'h3, strong, b',
        text: 'p',
        forbidSideBorders: false
      },
      {
        selector: '.um-world-ledger-row',
        number: 'span, [class*="number"]',
        title: 'h3, strong, b',
        text: 'p',
        forbidSideBorders: false
      }
    ];

    const compositionIssues = editorialRowAuditTargets
      .flatMap((target) => Array.from(document.querySelectorAll(target.selector)).map((row, index) => ({ target, row, index })))
      .map(({ target, row, index }) => {
        const number = row.querySelector(target.number);
        const title = row.querySelector(target.title);
        const text = row.querySelector(target.text);
        if (!number || !title || !text) return null;

        const rowStyle = getComputedStyle(row);
        const titleStyle = getComputedStyle(title);
        const textStyle = getComputedStyle(text);
        const rowRect = row.getBoundingClientRect();
        const numberRect = number.getBoundingClientRect();
        const numberTop = numberRect.top;
        const titleRect = title.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        const titleTop = titleRect.top;
        const textTop = textRect.top;
        const titleNumberDelta = Math.abs(numberTop - titleTop);
        const fullRowDelta = Math.max(
          titleNumberDelta,
          Math.abs(titleTop - textTop),
          Math.abs(numberTop - textTop)
        );
        const maxDelta = window.innerWidth < 821 ? titleNumberDelta : fullRowDelta;
        const horizontalCollision = window.innerWidth >= 821 && titleRect.right > textRect.left - 12;
        const edgePinnedNumber = window.innerWidth >= 821 && numberRect.left - rowRect.left < 18;
        const mobileTextIsAboveTitle = window.innerWidth < 821 && textTop < titleTop - 2;
        const hasUnbalancedColumns =
          window.innerWidth >= 821 &&
          row.getBoundingClientRect().width > 420 &&
          text.getBoundingClientRect().width < 190 &&
          (text.innerText || text.textContent || '').trim().length > 80;
        const hasNativeMargins =
          Number.parseFloat(titleStyle.marginTop) > 1 ||
          Number.parseFloat(titleStyle.marginBottom) > 1 ||
          Number.parseFloat(textStyle.marginTop) > 1 ||
          Number.parseFloat(textStyle.marginBottom) > 1;
        const hasAdministrativeBox =
          target.forbidSideBorders && (
            Number.parseFloat(rowStyle.borderLeftWidth) > 0 ||
            Number.parseFloat(rowStyle.borderRightWidth) > 0
          );

        if (maxDelta <= 10 && !horizontalCollision && !edgePinnedNumber && !mobileTextIsAboveTitle && !hasUnbalancedColumns && !hasNativeMargins && !hasAdministrativeBox) return null;

        return {
          selector: target.selector,
          index,
          maxDelta: Math.round(maxDelta),
          horizontalCollision,
          edgePinnedNumber,
          numberLeft: Math.round(numberRect.left),
          rowLeft: Math.round(rowRect.left),
          titleRight: Math.round(titleRect.right),
          textLeft: Math.round(textRect.left),
          mobileTextIsAboveTitle,
          hasUnbalancedColumns,
          hasNativeMargins,
          hasAdministrativeBox
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    const compactContextSelector = [
      'nav',
      'header',
      'footer',
      'form',
      '.navbar',
      '.um-header',
      '.um-footer',
      '.ante-dossier__sector-rail',
      '.sector-atlas-exec-ledger__filters-links',
      '.blog-category-tabs',
      '.contact-form-card',
      '.um-chip',
      '.tag',
      '.badge',
      '[class*="meta"]',
      '[class*="label"]',
      '[class*="kicker"]'
    ].join(',');

    const narrowTextIssues = Array.from(document.querySelectorAll('main h2, main h3, main p, main li'))
      .filter((element) => {
        if (window.innerWidth >= 821) return false;
        if (element.closest(compactContextSelector)) return false;
        const rect = element.getBoundingClientRect();
        const text = (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ');
        const style = getComputedStyle(element);
        return (
          text.length > 42 &&
          rect.top >= -40 &&
          rect.top < window.innerHeight * 2 &&
          rect.width > 0 &&
          rect.width < 190 &&
          rect.height > 28 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 80),
          text: (element.innerText || element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
          width: Math.round(rect.width),
          top: Math.round(rect.top)
        };
      })
      .slice(0, 10);

    const borderNoise = Array.from(document.querySelectorAll('main *'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top >= window.innerHeight || rect.bottom <= 0 || rect.width < 24 || rect.height < 24) return false;
        const style = getComputedStyle(element);
        const borderTotal =
          Number.parseFloat(style.borderTopWidth) +
          Number.parseFloat(style.borderRightWidth) +
          Number.parseFloat(style.borderBottomWidth) +
          Number.parseFloat(style.borderLeftWidth);
        const area = rect.width * rect.height;
        return borderTotal > 0 && area > 2600;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 80),
          area: Math.round(rect.width * rect.height),
          border:
            Number.parseFloat(style.borderTopWidth) +
            Number.parseFloat(style.borderRightWidth) +
            Number.parseFloat(style.borderBottomWidth) +
            Number.parseFloat(style.borderLeftWidth)
        };
      });

    const ctaGeometryIssues = firstViewportCtas
      .map((cta) => {
        const element = Array.from(document.querySelectorAll('a, button')).find((candidate) => {
          const text = (candidate.innerText || candidate.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90);
          return text === cta.text;
        });
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const lineHeight = Number.parseFloat(style.lineHeight);
        const fontSize = Number.parseFloat(style.fontSize);
        const display = style.display;
        const alignItems = style.alignItems;
        const hasPoorTouchTarget = rect.height < 44 || rect.width < 112;
        const lineHeightTooLoose = Number.isFinite(lineHeight) && Number.isFinite(fontSize) && lineHeight > fontSize * 1.55;
        const notCenteredFlex = display.includes('flex') && !['center', 'normal'].includes(alignItems);
        if (!hasPoorTouchTarget && !lineHeightTooLoose && !notCenteredFlex) return null;
        return {
          text: cta.text,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          lineHeight: Number.isFinite(lineHeight) ? Math.round(lineHeight) : null,
          fontSize: Number.isFinite(fontSize) ? Math.round(fontSize) : null,
          alignItems,
          hasPoorTouchTarget,
          lineHeightTooLoose,
          notCenteredFlex
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    const genericCopyPatterns = [
      /transformaci[oó]n digital/i,
      /soluciones integrales/i,
      /innovaci[oó]n tecnol[oó]gica/i,
      /potenciamos/i
    ];
    const copyWarnings = genericCopyPatterns
      .filter((pattern) => pattern.test(firstViewportText))
      .map((pattern) => pattern.source);

    const unsupportedClaimPatterns = [
      /99[.,]\\d+%/,
      /518\\+/
    ];
    const claimWarnings = unsupportedClaimPatterns
      .filter((pattern) => pattern.test(textContent))
      .map((pattern) => pattern.source);

    const isCyanRgb = (r, g, b) => g > 120 && b > 150 && r < 80 && b > r + 40;
    const saasColorIssues = Array.from(document.querySelectorAll('main a, main button, main p, main span, main h1, main h2, main h3'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) return false;
        const color = getComputedStyle(element).color;
        const m = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (!m) return false;
        return isCyanRgb(Number(m[1]), Number(m[2]), Number(m[3]));
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 60),
        color: getComputedStyle(element).color,
        text: (element.innerText || '').trim().slice(0, 40),
      }))
      .slice(0, 6);

    const heroSel = [
      '.um-home-hero', '.service-detail-hero', '.sector-editorial-detail-hero',
      '.case-detail-hero', '.geo-dossier-hero', '.about-hero', '.blog-header',
    ].join(',');

    let editorialAltBg = 0;
    const editorialAltSamples = [];
    for (const section of document.querySelectorAll('main section, main [class*="section"]')) {
      if (section.closest(heroSel)) continue;
      const rect = section.getBoundingClientRect();
      if (rect.height < 80) continue;
      const bg = getComputedStyle(section).backgroundColor;
      const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (!m) continue;
      const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const isAltGray = r >= 243 && r <= 248 && Math.abs(r - g) <= 3 && Math.abs(g - b) <= 3;
      if (isAltGray) {
        editorialAltBg += 1;
        if (editorialAltSamples.length < 3) {
          editorialAltSamples.push(String(section.className || section.tagName).slice(0, 50));
        }
      }
    }

    const h1FontFamily = h1Style?.fontFamily || null;
    const h1Overweight = h1Style && Number.parseFloat(h1Style.fontWeight) > 600;

    return {
      title: document.title,
      h1: h1?.innerText?.trim() || null,
      h1Count: document.querySelectorAll('h1').length,
      h1FontSize: h1Style ? Number.parseFloat(h1Style.fontSize) : null,
      h1Weight: h1Style ? Number.parseFloat(h1Style.fontWeight) : null,
      h1Top: h1Rect ? Math.round(h1Rect.top) : null,
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      minFont: fontSizes.length ? Math.min(...fontSizes) : null,
      heavyCount: weights.filter((weight) => weight > 700).length,
      maxWeight: weights.length ? Math.max(...weights) : null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      overflowOffenders,
      navCollisionIssues,
      clippedTextIssues,
      safeInsetIssues,
      darkTextIssues: darkTextIssues.slice(0, 12),
      lightTextIssues: lightTextIssues.slice(0, 12),
      redSmallTextIssues: redSmallTextIssues.slice(0, 12),
      firstViewportCtas,
      redBackgroundAreaRatio: Math.round((redBackgroundArea / viewportArea) * 1000) / 1000,
      brokenImages,
      imageAnomalies,
      imageFrameIssues,
      h1CompositionIssue,
      h1ContentIssue,
      headingIssues,
      infoHubQuality,
      infoHubRows,
      compositionIssues,
      narrowTextIssues,
      borderNoiseCount: borderNoise.length,
      borderNoiseSample: borderNoise.slice(0, 8),
      ctaGeometryIssues,
      copyWarnings,
      claimWarnings,
      saasColorIssues,
      editorialAltBg,
      editorialAltSamples,
      h1FontFamily,
      h1Overweight,
      frameworkOverlay,
      textCount: textElements.length
    };
  })()`;

  const result = await cdp(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  const value = result.result?.value;

  return {
    route: route.path,
    label: route.label,
    viewport: viewport.name,
    expectedCanonical: route.canonical || null,
    requiresFirstViewportCta: ctaRequirementApplies(route, viewport),
    ...(value || {
      title: null,
      h1: null,
      h1Count: 0,
      h1FontSize: null,
      h1Weight: null,
      h1Top: null,
      canonical: null,
      minFont: null,
      heavyCount: 0,
      maxWeight: null,
      overflowX: false,
      overflowOffenders: [],
      navCollisionIssues: [],
      clippedTextIssues: [],
      safeInsetIssues: [],
      darkTextIssues: [],
      lightTextIssues: [],
      redSmallTextIssues: [],
      firstViewportCtas: [],
      redBackgroundAreaRatio: 0,
      brokenImages: [],
      imageAnomalies: [],
      imageFrameIssues: [],
      h1CompositionIssue: null,
      h1ContentIssue: null,
      headingIssues: [],
      infoHubQuality: [],
      infoHubRows: [],
      compositionIssues: [],
      narrowTextIssues: [],
      borderNoiseCount: 0,
      borderNoiseSample: [],
      ctaGeometryIssues: [],
      copyWarnings: [],
      claimWarnings: [],
      frameworkOverlay: false,
      textCount: 0,
      evaluationError: result.exceptionDetails?.exception?.description || result.exceptionDetails?.text || 'Runtime evaluation returned no value',
    }),
  };
}

async function auditRouteWithTimeout(ws, route, viewport) {
  let timer;
  try {
    return await Promise.race([
      auditRoute(ws, route, viewport),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Route audit timeout after ${ROUTE_TIMEOUT_MS}ms`));
        }, ROUTE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    return {
      route: route.path,
      label: route.label,
      viewport: viewport.name,
      expectedCanonical: route.canonical || null,
      requiresFirstViewportCta: ctaRequirementApplies(route, viewport),
      title: null,
      h1: null,
      h1Count: 0,
      h1FontSize: null,
      h1Weight: null,
      h1Top: null,
      canonical: null,
      minFont: null,
      heavyCount: 0,
      maxWeight: null,
      overflowX: false,
      overflowOffenders: [],
      navCollisionIssues: [],
      clippedTextIssues: [],
      safeInsetIssues: [],
      darkTextIssues: [],
      redSmallTextIssues: [],
      firstViewportCtas: [],
      redBackgroundAreaRatio: 0,
      brokenImages: [],
      imageAnomalies: [],
      imageFrameIssues: [],
      h1CompositionIssue: null,
      h1ContentIssue: null,
      headingIssues: [],
      infoHubQuality: [],
      infoHubRows: [],
      compositionIssues: [],
      narrowTextIssues: [],
      borderNoiseCount: 0,
      borderNoiseSample: [],
      ctaGeometryIssues: [],
      copyWarnings: [],
      claimWarnings: [],
      frameworkOverlay: false,
      textCount: 0,
      evaluationError: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function collectFailures(results) {
  const failures = [];
  for (const result of results) {
    const isCommercial = commercialLabels.has(result.label);
    const isMobile = result.viewport === 'mobile' || result.viewport === 'mobile-small' || result.viewport === 'compact-desktop';
    if (result.navigationMismatch) {
      failures.push(`${result.viewport} ${result.label}: navigation mismatch ${result.actualPath} expected ${result.expectedPath}`);
      continue;
    }
    if (result.minFont != null && result.minFont < 16) {
      failures.push(`${result.viewport} ${result.label}: minFont ${result.minFont}`);
    }
    if (result.heavyCount > 0) {
      failures.push(`${result.viewport} ${result.label}: ${result.heavyCount} text nodes above weight 700`);
    }
    if (result.overflowX) {
      failures.push(`${result.viewport} ${result.label}: horizontal overflow ${JSON.stringify(result.overflowOffenders || [])}`);
    }
    if ((result.navCollisionIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: navigation collision ${JSON.stringify(result.navCollisionIssues)}`);
    }
    if ((result.clippedTextIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: visible text clipped outside viewport ${JSON.stringify(result.clippedTextIssues)}`);
    }
    if (STRICT && (result.safeInsetIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: unsafe panel text inset ${JSON.stringify(result.safeInsetIssues)}`);
    }
    if (result.h1Count !== 1) {
      failures.push(`${result.viewport} ${result.label}: h1 count ${result.h1Count}`);
    }
    if (STRICT && isCommercial && isMobile && result.h1FontSize != null && result.h1FontSize < 32) {
      failures.push(`${result.viewport} ${result.label}: mobile h1 too small (${result.h1FontSize}px)`);
    }
    if (STRICT && isCommercial && !isMobile && result.h1FontSize != null && result.h1FontSize < 40) {
      failures.push(`${result.viewport} ${result.label}: desktop/tablet h1 too small (${result.h1FontSize}px)`);
    }
    if (STRICT && result.h1CompositionIssue && !REPLICA_IDENTICAL_COPY) {
      failures.push(`${result.viewport} ${result.label}: h1 composition issue ${JSON.stringify(result.h1CompositionIssue)}`);
    }
    if (STRICT && result.h1ContentIssue && !REPLICA_IDENTICAL_COPY) {
      failures.push(`${result.viewport} ${result.label}: h1 content issue ${JSON.stringify(result.h1ContentIssue)}`);
    }
    if (STRICT && (result.headingIssues || []).length && !REPLICA_IDENTICAL_COPY) {
      failures.push(`${result.viewport} ${result.label}: heading typography issues ${JSON.stringify(result.headingIssues)}`);
    }
    if (result.evaluationError) {
      failures.push(`${result.viewport} ${result.label}: audit evaluation failed: ${result.evaluationError}`);
    }
    if ((result.darkTextIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: low contrast in dark surface ${JSON.stringify(result.darkTextIssues)}`);
    }
    if ((result.lightTextIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: low contrast in light surface ${JSON.stringify(result.lightTextIssues)}`);
    }
    if ((result.redSmallTextIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: small red text on dark surface ${JSON.stringify(result.redSmallTextIssues)}`);
    }
    if (result.requiresFirstViewportCta && !(result.firstViewportCtas || []).length) {
      failures.push(`${result.viewport} ${result.label}: no primary CTA visible in first viewport`);
    }
    if (result.frameworkOverlay) {
      failures.push(`${result.viewport} ${result.label}: framework/runtime error overlay text detected`);
    }
    if (result.textCount < 12) {
      failures.push(`${result.viewport} ${result.label}: page appears too empty (${result.textCount} visible text nodes)`);
    }
    if ((result.brokenImages || []).length) {
      failures.push(`${result.viewport} ${result.label}: broken visible images ${JSON.stringify(result.brokenImages)}`);
    }
    if ((result.imageAnomalies || []).length) {
      failures.push(`${result.viewport} ${result.label}: visually collapsed content images ${JSON.stringify(result.imageAnomalies)}`);
    }
    if (STRICT && (result.imageFrameIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: framed commercial images ${JSON.stringify(result.imageFrameIssues)}`);
    }
    if (STRICT && (result.compositionIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: editorial row alignment issues ${JSON.stringify(result.compositionIssues)}`);
    }
    if (STRICT && isMobile && (result.narrowTextIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: narrow mobile reading columns ${JSON.stringify(result.narrowTextIssues)}`);
    }
    if (STRICT && (result.ctaGeometryIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: CTA geometry issues ${JSON.stringify(result.ctaGeometryIssues)}`);
    }
    if (STRICT && (result.borderNoiseCount || 0) > 12) {
      failures.push(`${result.viewport} ${result.label}: excessive bordered elements in first viewport (${result.borderNoiseCount}) ${JSON.stringify(result.borderNoiseSample || [])}`);
    }
    if (STRICT && result.redBackgroundAreaRatio > 0.12) {
      failures.push(`${result.viewport} ${result.label}: red background dominates first viewport (${result.redBackgroundAreaRatio})`);
    }
    if (result.expectedCanonical && result.canonical !== result.expectedCanonical) {
      failures.push(`${result.viewport} ${result.label}: canonical ${result.canonical} expected ${result.expectedCanonical}`);
    }
    if (STRICT && (result.claimWarnings || []).length) {
      failures.push(`${result.viewport} ${result.label}: unsupported precision claim (${result.claimWarnings.join(', ')})`);
    }
    if (STRICT && isCommercial && (result.saasColorIssues || []).length) {
      failures.push(`${result.viewport} ${result.label}: cyan/SaaS accent color ${JSON.stringify(result.saasColorIssues)}`);
    }
    if (STRICT && isCommercial && result.h1Overweight) {
      failures.push(`${result.viewport} ${result.label}: h1 weight above 600 (${result.h1Weight})`);
    }
    if (STRICT && isCommercial && (result.copyWarnings || []).length && !REPLICA_IDENTICAL_COPY) {
      failures.push(`${result.viewport} ${result.label}: generic copy in first viewport (${result.copyWarnings.join(', ')})`);
    }
    if (
      STRICT &&
      ['sectores', 'sectores filtrado', 'sectores atlas', 'antecedentes', 'antecedentes filtrado', 'antecedentes editorial'].includes(result.label) &&
      !isMobile
    ) {
      const stickyHeaders = (result.infoHubQuality || []).filter((item) => item.visible);
      for (const item of stickyHeaders) {
        if (item.position !== 'sticky') {
          failures.push(`${result.viewport} ${result.label}: ${item.selector} filter bar is not sticky`);
        }
        const minStickyTop = result.viewport === 'compact-desktop' ? 64 : 72;
        if (item.top == null || item.top < minStickyTop || item.top > 96) {
          failures.push(`${result.viewport} ${result.label}: ${item.selector} filter sticky top does not align with nav (${item.top}px)`);
        }
        if (item.paddingTop < 0 || (item.backgroundAlpha != null && item.backgroundAlpha < 1)) {
          failures.push(`${result.viewport} ${result.label}: ${item.selector} sticky filter lacks stable background`);
        }
        if (!/0px -(?:1[0-9]|2[0-9])px 0px/.test(item.boxShadow || '')) {
          failures.push(`${result.viewport} ${result.label}: ${item.selector} sticky filter does not mask clipped content above it`);
        }
      }
      const rows = result.infoHubRows || [];
      for (const row of rows) {
        if (/padding-left/i.test(row.transition)) {
          failures.push(`${result.viewport} ${result.label}: row hover transitions padding-left and can cause pixel drift`);
        }
        if (/box-shadow/i.test(row.transition)) {
          failures.push(`${result.viewport} ${result.label}: row hover transitions box-shadow and can create heavy red rails`);
        }
        const isArchiveLedgerRow = /ante-dossier__row|evidence-item--ledger|um-world-ledger-row/i.test(row.selector || '');
        const minLedgerImageHeight = isArchiveLedgerRow ? 64 : 112;
        if (row.imageHeight != null && row.imageHeight < minLedgerImageHeight) {
          failures.push(`${result.viewport} ${result.label}: row image too small for information hub (${row.imageWidth}x${row.imageHeight})`);
        }
      }
    }
  }
  return failures;
}

async function main() {
  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=/tmp/umsa-visual-audit-${PORT}`,
    'about:blank',
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
    const selectedRoutes = routes
      .filter((route) => {
        if (!ROUTE_FILTER) return true;
        if (LABEL_ONLY) return ROUTE_FILTER.test(route.label);
        return ROUTE_FILTER.test(route.label) || ROUTE_FILTER.test(route.path);
      })
      .filter((route) => !COMMERCIAL_ONLY || commercialLabels.has(route.label))
      .filter((route) => !COMMERCIAL_ONLY || !route.path.includes('skin=white'))
      .filter((route) => !COMMERCIAL_ONLY || !/^(lab |utilidad )/.test(route.label));

    const results = [];
    for (const viewport of selectedViewports) {
      if (!viewport.mobile) {
        await cdp(ws, 'Emulation.setUserAgentOverride', { userAgent: '' });
      }
      for (const route of selectedRoutes) {
        results.push(await auditRouteWithTimeout(ws, route, viewport));
        await sleep(ISOLATED ? 900 : 180);
      }
    }

    ws.close();

    const failures = collectFailures(results);
    console.log(JSON.stringify({ baseUrl: BASE_URL, strict: STRICT, checked: results.length, failures, results }, null, 2));

    if (failures.length) {
      process.exitCode = 1;
    }
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
