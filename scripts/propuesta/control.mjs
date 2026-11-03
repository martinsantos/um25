/**
 * Control visual de la propuesta (fase 0). Recorre las páginas del sistema a tres anchos, saca
 * capturas en el estado inicial (con el puntero sobre el dibujo) y al final de la apertura, y
 * verifica cuatro cosas que ya fallaron una vez: ningún <title> dentro de un SVG (sale como
 * tooltip), ningún desborde horizontal, el dibujo entero dentro de la pantalla, y la altura de
 * cada página dentro de su presupuesto. Escribe las capturas y un informe en --out y sale con 1
 * si algo no se cumple.
 *
 *   node scripts/control.mjs --base http://127.0.0.1:4321 --out control-propuesta
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = arg('--out', 'control-propuesta');
// En el runner, PLAYWRIGHT_MODULE apunta al módulo instalado aparte; localmente vale el playwright global.
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');
// axe (WCAG 2.1 AA y buenas prácticas) cuando está instalado: AXE_MODULE apunta a @axe-core/playwright. Sin él, el control sigue sin esa prueba y lo anota.
let AxeBuilder = null;
if (process.env.AXE_MODULE) { try { const m = await import(process.env.AXE_MODULE); AxeBuilder = m.AxeBuilder || m.default?.AxeBuilder || null; } catch (e) { console.error('axe no disponible:', e.message); } }
const axe = async (page) => { if (!AxeBuilder) return null; try { const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('astro-dev-toolbar').analyze(); return r.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length})`); } catch (e) { return [`axe falló: ${e.message.slice(0, 80)}`]; } };

// Presupuesto de altura en pantallas (alto de la ventana), por página y por ancho.
// GO 3/11: Servicios añade 54 prestaciones ilustradas; Sectores, 47 integraciones.
// Alturas aprobadas máximas: 10,69 pantallas a 1440 y 17,11 a 390; se conserva
// un margen acotado y todos los controles de overflow, estabilidad, peso y accesibilidad.
const ANCHOS = [{ w: 1440, h: 900, k: 'escritorio' }, { w: 1310, h: 680, k: 'portatil' }, { w: 1024, h: 768, k: 'tablet' }, { w: 390, h: 844, k: 'telefono' }];
const PAGINAS = [
  { id: 'portada', path: '/', max: { escritorio: 7, portatil: 8.5, telefono: 11 } },
  { id: 'sectores', path: '/sectores', max: { escritorio: 5, portatil: 6, telefono: 9 } },
  { id: 'sector', path: '/sectores/aeropuertos', max: { escritorio: 11.5, portatil: 14, telefono: 17 } },
  { id: 'servicio', from: 'a[href^="/servicios/"][href!="/servicios"]', max: { escritorio: 11.5, portatil: 14, telefono: 18 } },
  { id: 'proyectos', path: '/antecedentes', max: { escritorio: 14, portatil: 16, telefono: 20 } },
  { id: 'proyectos-filtro', path: '/antecedentes?sector=bodegas&service=107', max: { escritorio: 6, portatil: 7, telefono: 10 } },
  { id: 'ficha', from: 'a[href^="/antecedentes/"]', filtro: /\/antecedentes\/\d+\//, max: { escritorio: 8, portatil: 9.5, telefono: 14 } },
  // Secundarias: el mismo sistema, el mismo control.
  { id: 'servicios', path: '/servicios', max: { escritorio: 6, portatil: 7, telefono: 11 } },
  { id: 'nosotros', path: '/nosotros', max: { escritorio: 6, portatil: 7, telefono: 11 } },
  { id: 'documentacion', path: '/documentacion', max: { escritorio: 4, portatil: 5, telefono: 8 } },
  { id: 'blog', path: '/blog', max: { escritorio: 4, portatil: 5, telefono: 8 } },
  { id: 'contacto', path: '/contacto', max: { escritorio: 3, portatil: 3.5, telefono: 6 } },
  { id: 'en', path: '/en', max: { escritorio: 5, portatil: 6, telefono: 9 } },
  { id: 'en-about', path: '/en/about', max: { escritorio: 4, portatil: 5, telefono: 8 } },
  { id: 'en-contact', path: '/en/contact', max: { escritorio: 3, portatil: 3.5, telefono: 6 } },
  { id: 'privacidad', path: '/privacidad', max: { escritorio: 4, portatil: 5, telefono: 9 } },
  // La nota conserva el cuerpo completo de producción: la referencia histórica de altura se midió
  // con un lector recortado. Para esta ruta se informa el alto completo como advertencia y se
  // comprueba cuerpo/índice; no se traslada esta excepción al resto de páginas.
  { id: 'entrada', from: 'a[href^="/blog/"]', filtro: /^\/blog\/[a-z0-9-]+$/, max: { escritorio: 7, portatil: 8.5, telefono: 14 } },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const fallos = [], filas = [];
const home = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await home.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
const enlaces = await home.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
await home.close();
const blogPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await blogPage.goto(`${BASE}/blog`, { waitUntil: 'networkidle', timeout: 90000 });
enlaces.push(...(await blogPage.$$eval('a[href^="/blog/"]', (as) => as.map((a) => a.getAttribute('href')))));
await blogPage.close();
const resolver = (p) => p.path || enlaces.find((h) => h && h.startsWith(p.from.match(/\^="([^"]+)"/)[1]) && (!p.filtro || p.filtro.test(h)) && h !== p.from.match(/!="([^"]+)"/)?.[1]);

for (const pag of PAGINAS) {
  const path = resolver(pag);
  if (!path) {
    // El blog viene del CMS: en un entorno sin CMS ni copia no hay entradas, y eso no es un defecto del sitio.
    if (pag.id === 'entrada') { filas.push('| entrada | — | — | – sin entradas de blog en este entorno |'); continue; }
    fallos.push(`${pag.id}: no se encontró un enlace en la portada`); continue;
  }
  for (const v of ANCHOS) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const nombre = `${pag.id}-${v.k}`;
    const problemasExtra = [];
    // Errores de consola y de página: cualquiera que no sea del CMS o del favicon es un defecto.
    const errores = [];
    const ignorar = (t) => /favicon|Directus|ECONNREFUSED|fetch failed|net::ERR_|Failed to load resource/i.test(t);
    page.on('console', (msg) => { if (msg.type() === 'error' && !ignorar(msg.text())) errores.push(msg.text().slice(0, 140)); });
    page.on('pageerror', (e) => { if (!ignorar(String(e))) errores.push(String(e).slice(0, 140)); });
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(1200);
      const iso = await page.$('.xray__iso svg, .fiso__lugar svg');
      if (iso) { const b = await iso.boundingBox(); if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(600); }
      await page.screenshot({ path: join(OUT, `${nombre}-1-inicio.png`) });
      const m = await page.evaluate(() => {
        const titles = [...document.querySelectorAll('svg title')].map((t) => t.textContent.trim()).filter(Boolean);
        const fuera = [...document.querySelectorAll('.iso svg, .xray__iso svg, .fiso__lugar svg, figure img')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && (r.left < -1 || r.right > innerWidth + 1)).length;
        const fondo = document.querySelector('.lugar--hero .lugar__fondo'), dib = document.querySelector('.lugar--hero .xray__iso');
        const op = (e) => (e ? +getComputedStyle(e).opacity : null);
        const poster = document.querySelector('.lugar__fondo video')?.getAttribute('poster') || null;
        return { titles, fuera, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, alto: document.documentElement.scrollHeight, innerH: innerHeight, fondo0: op(fondo), dib0: op(dib), poster };
      });
      const lectura = pag.id === 'entrada' ? await page.evaluate(() => {
        const cuerpo = document.querySelector('.bp-main .prose');
        const texto = (cuerpo?.textContent || '').replace(/\s+/g, ' ').trim();
        const headings = [...(cuerpo?.querySelectorAll('h2, h3') || [])].filter((heading) => heading.id);
        const toc = document.querySelector(innerWidth <= 1100 ? '.bp-mobile-toc .btoc' : '.bp-aside .btoc');
        const enlacesToc = [...(toc?.querySelectorAll('a[href^="#"]') || [])];
        const tocIds = enlacesToc.map((link) => decodeURIComponent(link.getAttribute('href').slice(1)));
        const portada = document.querySelector('.bp-cover img');
        return {
          palabras: texto ? texto.split(/\s+/).length : 0,
          encabezados: headings.length,
          enlacesToc: enlacesToc.length,
          tocCompleto: enlacesToc.length === headings.length && tocIds.every((id) => headings.some((heading) => heading.id === id)),
          portadaCargada: !portada || (portada.complete && portada.naturalWidth > 0),
        };
      }) : null;
      // Fin de la apertura: el último punto del pin del hero (o 1,3 pantallas si la página no tiene hero).
      await page.evaluate(() => { const h = document.querySelector('.lugar--hero'); window.scrollTo(0, h ? h.offsetTop + h.offsetHeight - innerHeight : Math.round(innerHeight * 1.3)); }); await page.waitForTimeout(3200);
      await page.screenshot({ path: join(OUT, `${nombre}-2-apertura.png`) });
      const fin = await page.evaluate(() => { const op = (q) => { const e = document.querySelector(q); return e ? +getComputedStyle(e).opacity : null; }; return { fondo: op('.lugar--hero .lugar__fondo'), dib: op('.lugar--hero .xray__iso') }; });
      const posterOk = m.poster ? (await page.evaluate(async (u) => (await fetch(u, { method: 'HEAD' })).ok, m.poster)) : true;
      // El lugar por dentro (sector, ficha) cambia de sistema solo: en seis segundos a la vista tiene que haber pasado de uno a otro.
      await page.mouse.move(2, 2);
      const dentroOk = await page.evaluate(async () => {
        const st = document.querySelector('[data-diagram-stage]'); if (!st) return true;
        st.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 700));
        const vistos = new Set(); for (let i = 0; i < 60; i++) { if (st.dataset.svc) vistos.add(st.dataset.svc); if (vistos.size > 1) return true; await new Promise((r) => setTimeout(r, 100)); }
        const root = st.closest('[data-dentro], [data-fiso]');
        const controls = [...(root?.querySelectorAll('[data-diagram-code]') || [])];
        const codes = [...new Set(controls.length ? controls.map(button => button.dataset.diagramCode) : (st.dataset.svcs || '').split(' ').filter(Boolean))];
        return codes.length <= 1 && vistos.size >= 1 && Boolean(st.querySelector('svg'));
      });
      // En pantalla ancha la película de fondo tiene que estar reproduciéndose al volver arriba.
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
      const filmOk = v.w < 900 ? true : await page.evaluate(async () => { const f = document.querySelector('.lugar__fondo video'); if (!f) return true; for (let i = 0; i < 40; i++) { if (!f.paused && f.currentTime > 0) return true; await new Promise((r) => setTimeout(r, 100)); } return false; });
      for (let y = 0; y < m.alto; y += v.h) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80); }
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
      // La página no cambia de alto al recorrerla: si lo hace, algo se pinta tarde y el contenido salta.
      const altoFinal = await page.evaluate(() => document.documentElement.scrollHeight);
      if (Math.abs(altoFinal - m.alto) > v.h * .15) problemasExtra.push(`la página cambia de alto al recorrerla (${m.alto} → ${altoFinal})`);
      await page.screenshot({ path: join(OUT, `${nombre}-3-completa.png`), fullPage: true });
      const pantallas = +(m.alto / v.h).toFixed(1), max = pag.max[v.k] ?? Math.round(pag.max.portatil * 1.25 * 2) / 2;
      const problemas = [...problemasExtra];
      if (m.titles.length) problemas.push(`SVG con <title>: ${m.titles.slice(0, 3).join(', ')}`);
      if (m.scrollW > m.innerW + 1) problemas.push(`desborde horizontal: ${m.scrollW} > ${m.innerW}`);
      if (m.fuera) problemas.push(`${m.fuera} figura(s) fuera de la pantalla`);
      if (pag.id !== 'entrada' && pantallas > max) problemas.push(`${pantallas} pantallas, presupuesto ${max}`);
      if (lectura) {
        if (!lectura.palabras) problemas.push('el cuerpo de lectura está vacío');
        if (lectura.encabezados > 1 && !lectura.tocCompleto) problemas.push(`índice incompleto (${lectura.enlacesToc}/${lectura.encabezados} encabezados)`);
        if (!lectura.portadaCargada) problemas.push('la imagen de portada del artículo no carga');
      }
      if (m.fondo0 !== null && m.fondo0 < .99) problemas.push(`el fondo real no cubre al inicio (opacidad ${m.fondo0})`);
      if (m.dib0 !== null && m.dib0 > .01) problemas.push(`el dibujo asoma sobre el fondo al inicio (opacidad ${m.dib0})`);
      if (fin.fondo !== null && fin.fondo > .01) problemas.push(`el fondo real sigue al final de la apertura (opacidad ${fin.fondo})`);
      if (fin.dib !== null && fin.dib < .99) problemas.push(`el dibujo no llega a opacidad plena (${fin.dib})`);
      if (!posterOk) problemas.push(`el póster del video no responde: ${m.poster}`);
      if (!filmOk) problemas.push('la película de fondo no arranca');
      if (!dentroOk) problemas.push('el lugar por dentro no recorre sus sistemas solo');
      if (errores.length) problemas.push(`error de consola: ${errores[0]}`);
      const viol = await axe(page); if (viol && viol.length) problemas.push(`axe: ${viol.join('; ')}`);
      // En el muro, con puntero fino, la primera ficha muestra su sistema al pasar.
      if (v.w >= 900 && pag.id === 'proyectos') {
        const ok = await page.evaluate(async () => { const li = document.querySelector('[data-ficha][data-site]'); if (!li) return false; li.scrollIntoView({ block: 'center' }); return true; });
        if (ok) { const li = await page.$('[data-ficha][data-site]'); await li.hover(); const sistema = await page.evaluate(async () => { for (let i = 0; i < 40; i++) { if (document.querySelector('[data-ficha].on .ficha__sistema svg')) return true; await new Promise((r) => setTimeout(r, 100)); } return false; }); if (!sistema) problemas.push('la ficha del muro no muestra su sistema al pasar el puntero'); else { await page.waitForTimeout(600); await page.screenshot({ path: join(OUT, `${nombre}-4-sistema.png`) }); } await page.mouse.move(2, 2); }
      }
      const medidaAltura = pag.id === 'entrada'
        ? `${pantallas} (texto completo; referencia lectora previa ${max})`
        : `${pantallas} / ${max}`;
      const advertenciaAltura = pag.id === 'entrada' && pantallas > max
        ? ` · aviso: altura del artículo completo ${pantallas} pantallas (referencia previa ${max})`
        : '';
      const medidaLectura = lectura ? ` · cuerpo ${lectura.palabras} palabras; índice ${lectura.enlacesToc}/${lectura.encabezados}` : '';
      filas.push(`| ${pag.id} | ${v.k} | ${medidaAltura} | ${problemas.length ? '✗ ' + problemas.join('; ') : '✓'}${advertenciaAltura}${medidaLectura} |`);
      problemas.forEach((p) => fallos.push(`${nombre}: ${p}`));
    } catch (e) { fallos.push(`${nombre}: ${e.message.split('\n')[0]}`); filas.push(`| ${pag.id} | ${v.k} | — | ✗ ${e.message.split('\n')[0]} |`); }
    await ctx.close();
  }
}
// Todos los servicios y todos los sectores, a escritorio y teléfono: errores, desborde, tooltips, alto y peso de recursos.
{
  const idx = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const lista = async (path, pref) => { await idx.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 }); return [...new Set(await idx.$$eval(`a[href^="${pref}"]`, (as, p) => as.map((a) => a.getAttribute('href')).filter((h) => h && h !== p && !h.includes('?')).map(h => h.replace(/^\/servicios\/(10[1-8])\/(?!ficha$)[^/]+$/, '/servicios/$1')), pref))]; };
  const todas = [...(await lista('/servicios', '/servicios/')).map((h) => ['servicio', h]), ...(await lista('/sectores', '/sectores/')).map((h) => ['sector', h])];
  await idx.close();
  for (const [tipo, href] of todas) {
    for (const v of ANCHOS.filter((x) => x.k === 'escritorio' || x.k === 'telefono')) {
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } }); const page = await ctx.newPage();
      const nombre = `${tipo}-${href.split('/').pop()}-${v.k}`;
      const errores = []; page.on('pageerror', (e) => errores.push(String(e).slice(0, 120))); page.on('console', (msg) => { if (msg.type() === 'error' && !/favicon|Directus|ECONNREFUSED|fetch failed|net::ERR_|Failed to load resource/i.test(msg.text())) errores.push(msg.text().slice(0, 120)); });
      let bytes = 0; const req = {}; const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable'); cdp.on('Network.responseReceived', (e) => { req[e.requestId] = e.response.url; }); cdp.on('Network.loadingFinished', (e) => { const u = req[e.requestId] || ''; if (/\/(images|cine|fonts)\//.test(u)) bytes += e.encodedDataLength; });
      try {
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 90000 }); await page.waitForTimeout(800);
        const m = await page.evaluate(() => ({ titles: document.querySelectorAll('svg title').length, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, alto: document.documentElement.scrollHeight, h1: !!document.querySelector('h1'), basura: /\b(undefined|NaN|null)\b/.test(document.body.innerText) }));
        for (let y = 0; y < m.alto; y += v.h) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
        await page.waitForTimeout(600);
        const altoFinal = await page.evaluate(() => document.documentElement.scrollHeight);
        const kb = Math.round(bytes / 1024), max = v.k === 'telefono' ? (tipo === 'servicio' ? 18 : 17) : 11.5;
        const problemas = [];
        if (!m.h1) problemas.push('sin título'); if (m.titles) problemas.push('SVG con <title>'); if (m.scrollW > m.innerW + 1) problemas.push('desborde horizontal'); if (m.basura) problemas.push('texto con undefined/NaN/null');
        if (Math.abs(altoFinal - m.alto) > v.h * .15) problemas.push(`cambia de alto al recorrerla (${m.alto} → ${altoFinal})`);
        if (m.alto / v.h > max) problemas.push(`${(m.alto / v.h).toFixed(1)} pantallas, presupuesto ${max}`);
        if (v.k === 'telefono' && kb > 1800) problemas.push(`${kb} KB de imágenes, dibujos y fuentes en teléfono (máx. 1800)`);
        if (errores.length) problemas.push(`error: ${errores[0]}`);
        filas.push(`| ${tipo} ${href.split('/').pop()} | ${v.k} | ${(m.alto / v.h).toFixed(1)} / ${max} · ${kb} KB | ${problemas.length ? '✗ ' + problemas.join('; ') : '✓'} |`);
        problemas.forEach((p) => fallos.push(`${nombre}: ${p}`));
      } catch (e) { fallos.push(`${nombre}: ${e.message.split('\n')[0]}`); filas.push(`| ${tipo} ${href.split('/').pop()} | ${v.k} | — | ✗ ${e.message.split('\n')[0]} |`); }
      await ctx.close();
    }
  }
}

// Rastreo: ningún enlace interno, imagen ni medio de las páginas del sistema devuelve error.
{
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const enlaces = new Set(), medios = new Set();
  const semillas = ['/', '/sectores', '/sectores/aeropuertos', '/servicios', '/servicios/101', '/antecedentes', '/nosotros', '/documentacion', '/blog', '/contacto', '/en', '/en/services', '/privacidad'];
  for (const u of semillas) {
    try { await pg.goto(`${BASE}${u}`, { waitUntil: 'networkidle', timeout: 90000 }); } catch { continue; }
    const r = await pg.evaluate(() => ({ a: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')), m: [...document.querySelectorAll('img')].flatMap((i) => [i.getAttribute('src'), ...(i.getAttribute('srcset') || '').split(',').map((x) => x.trim().split(' ')[0])]).concat([...document.querySelectorAll('source[srcset], link[rel="preload"][imagesrcset]')].flatMap((e) => (e.getAttribute('srcset') || e.getAttribute('imagesrcset') || '').split(',').map((x) => x.trim().split(' ')[0]))).concat([...document.querySelectorAll('video[data-film], [data-src], link[rel="preload"][href]')].map((e) => e.getAttribute('data-film') || e.getAttribute('data-src') || e.getAttribute('href'))).filter(Boolean) }));
    r.a.forEach((h) => { if (h.startsWith('/') && !h.startsWith('//')) enlaces.add(h.split('#')[0]); }); r.m.forEach((h) => { if (h.startsWith('/')) medios.add(h); });
  }
  await pg.close();
  const probar = async (set, nombre) => { const rotos = []; const arr = [...set]; for (let i = 0; i < arr.length; i += 12) await Promise.all(arr.slice(i, i + 12).map(async (h) => { try { const r = await fetch(`${BASE}${h}`, { redirect: 'manual' }); if (r.status >= 400) rotos.push(`${h} → ${r.status}`); } catch (e) { rotos.push(`${h} → ${e.message}`); } })); filas.push(`| ${nombre} | — | ${arr.length} probados | ${rotos.length ? '✗ ' + rotos.slice(0, 5).join('; ') : '✓'} |`); rotos.forEach((x) => fallos.push(`${nombre}: ${x}`)); };
  await probar(enlaces, 'enlaces internos'); await probar(medios, 'imágenes y medios');
}

// Auditoría de los antecedentes y muestra de fichas: las cuatro con más señales y cuatro limpias, a dos anchos.
let auditoria = '';
try {
  const res = await (await browser.newPage()).goto(`${BASE}/propuesta/auditoria.json`, { timeout: 90000 });
  const a = await res.json();
  const conFlags = a.filas.filter((f) => f.flags.length).sort((x, y) => y.flags.length - x.flags.length);
  const limpias = a.filas.filter((f) => !f.flags.length);
  const muestra = [...conFlags.slice(0, 4), ...limpias.filter((_, i) => i % Math.max(1, Math.floor(limpias.length / 4)) === 0).slice(0, 4)];
  const sgi = a.sgi ? `\n### Cruce con SGI\n\nSGI tiene ${a.sgi.total} proyectos; ${a.sgi.conFichaWeb} tienen ficha web. Sin ficha web: ${a.sgi.sinFichaWeb} (el detalle queda en SGI, no en este informe). Fichas web sin proyecto en SGI: ${a.sgi.fichasSinSgi}.\n` : '';
  auditoria = `\n## Auditoría de antecedentes\n\n${a.fichas} fichas servidas de ${a.total} en el catálogo. Fichas limpias: ${limpias.length}. Señales:\n\n| Señal | Fichas |\n|---|---|\n${Object.entries(a.resumen).sort((x, y) => y[1] - x[1]).map(([k, n]) => `| ${k} | ${n} |`).join('\n')}\n${sgi}\n### Las 40 fichas con más señales\n\n| Ficha | Cliente | Título | Señales |\n|---|---|---|---|\n${conFlags.slice(0, 40).map((f) => `| [${f.id}](${BASE}${f.href}) | ${f.client} | ${f.title} | ${f.flags.join(', ')} |`).join('\n')}\n`;
  for (const f of muestra) {
    for (const v of ANCHOS.filter((x) => x.k !== 'portatil')) {
      const page = await browser.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
      const nombre = `ficha-${f.id}-${v.k}`;
      try {
        await page.goto(`${BASE}${f.href}`, { waitUntil: 'networkidle', timeout: 90000 }); await page.waitForTimeout(800);
        const m = await page.evaluate(() => {
          const txt = document.body.innerText;
          const img = document.querySelector('main figure img');
          return { h1: (document.querySelector('h1')?.textContent || '').trim(), img: !img || (img.complete && img.naturalWidth > 0), filas: document.querySelectorAll('[data-partes] li').length, sinAlcance: !!document.querySelector('[data-sin-alcance]'), basura: /\b(undefined|NaN|null|\[object Object\])\b/.test(txt), scrollW: document.documentElement.scrollWidth, innerW: innerWidth, titles: document.querySelectorAll('svg title').length };
        });
        await page.evaluate(() => document.querySelector('.fiso__lugar')?.scrollIntoView({ block: 'center' })); await page.waitForTimeout(2500);
        const iso = await page.evaluate(() => {
          const lugar = document.querySelector('.fiso__lugar[data-src]');
          return { requerido: Boolean(lugar), cargado: Boolean(lugar?.querySelector('svg')) };
        });
        await page.screenshot({ path: join(OUT, `${nombre}.png`) });
        const problemas = [];
        if (!m.h1) problemas.push('sin título');
        if (!m.img) problemas.push('la foto no carga');
        if (m.basura) problemas.push('texto con undefined/NaN/null');
        if (m.scrollW > m.innerW + 1) problemas.push('desborde horizontal');
        if (m.titles) problemas.push('SVG con <title>');
        if (iso.requerido && !iso.cargado) problemas.push('el lugar por dentro no carga');
        filas.push(`| ficha ${f.id} | ${v.k} | — | ${problemas.length ? '✗ ' + problemas.join('; ') : '✓'} |`);
        problemas.forEach((p) => fallos.push(`${nombre}: ${p}`));
      } catch (e) { fallos.push(`${nombre}: ${e.message.split('\n')[0]}`); filas.push(`| ficha ${f.id} | ${v.k} | — | ✗ ${e.message.split('\n')[0]} |`); }
      await page.close();
    }
  }
} catch (e) { fallos.push(`auditoria: ${e.message.split('\n')[0]}`); }
// Narrow phones: long service names must not expand the nested case-study grid.
{
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  for (const path of ['/', '/antecedentes', ...Array.from({ length: 8 }, (_, i) => `/servicios/${101 + i}`)]) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      filas.push(`| ${path} | 360 px | — | ${overflow ? '✗ desborde horizontal' : '✓'} |`);
      if (overflow) fallos.push(`${path} 360px: desborde horizontal`);
    } catch (e) { fallos.push(`${path} 360px: ${e.message.split('\n')[0]}`); }
  }
  await page.close();
}
await browser.close();
const informe = `# Control visual de la propuesta\n\nBase: ${BASE}${AxeBuilder ? ' · con axe (WCAG 2.1 AA)' : ' · sin axe (AXE_MODULE no definido)'}\n\n| Página | Ancho | Pantallas / máx. | Resultado |\n|---|---|---|---|\n${filas.join('\n')}\n\n${fallos.length ? `## Falló\n\n${fallos.map((f) => `- ${f}`).join('\n')}` : 'Todo en orden.'}\n${auditoria}`;
writeFileSync(join(OUT, 'informe.md'), informe);
console.log(informe);
process.exit(fallos.length ? 1 : 0);
