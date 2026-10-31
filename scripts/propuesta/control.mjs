/**
 * Control visual de la propuesta (fase 0). Recorre las páginas del sistema a tres anchos, saca
 * capturas en el estado inicial (con el puntero sobre el dibujo) y al final de la apertura, y
 * verifica cuatro cosas que ya fallaron una vez: ningún <title> dentro de un SVG (sale como
 * tooltip), ningún desborde horizontal, el dibujo entero dentro de la pantalla, y la altura de
 * cada página dentro de su presupuesto. Escribe las capturas y un informe en --out y sale con 1
 * si algo no se cumple.
 *
 *   node scripts/propuesta/control.mjs --base http://127.0.0.1:4321 --out control-propuesta
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = arg('--out', 'control-propuesta');
// En el runner, PLAYWRIGHT_MODULE apunta al módulo instalado aparte; localmente vale el playwright global.
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');

// Presupuesto de altura en pantallas (alto de la ventana), por página y por ancho.
const ANCHOS = [{ w: 1440, h: 900, k: 'escritorio' }, { w: 1310, h: 680, k: 'portatil' }, { w: 390, h: 844, k: 'telefono' }];
const PAGINAS = [
  { id: 'portada', path: '/propuesta', max: { escritorio: 7, portatil: 8.5, telefono: 11 } },
  { id: 'sectores', path: '/propuesta/sectores', max: { escritorio: 5, portatil: 6, telefono: 9 } },
  { id: 'sector', path: '/propuesta/sectores/aeropuertos', max: { escritorio: 10, portatil: 12, telefono: 16 } },
  { id: 'servicio', from: 'a[href^="/propuesta/servicios/"][href!="/propuesta/servicios"]', max: { escritorio: 10, portatil: 12, telefono: 16 } },
  { id: 'proyectos', path: '/propuesta/antecedentes', max: { escritorio: 14, portatil: 16, telefono: 20 } },
  { id: 'ficha', from: 'a[href^="/propuesta/antecedentes/"]', filtro: /\/propuesta\/antecedentes\/\d+\//, max: { escritorio: 8, portatil: 9.5, telefono: 14 } },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const fallos = [], filas = [];
const home = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await home.goto(`${BASE}/propuesta`, { waitUntil: 'networkidle', timeout: 90000 });
const enlaces = await home.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
await home.close();
const resolver = (p) => p.path || enlaces.find((h) => h && h.startsWith(p.from.match(/\^="([^"]+)"/)[1]) && (!p.filtro || p.filtro.test(h)) && h !== p.from.match(/!="([^"]+)"/)?.[1]);

for (const pag of PAGINAS) {
  const path = resolver(pag);
  if (!path) { fallos.push(`${pag.id}: no se encontró un enlace en la portada`); continue; }
  for (const v of ANCHOS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
    const nombre = `${pag.id}-${v.k}`;
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(1200);
      const iso = await page.$('.xray__iso svg, .fiso__lugar svg');
      if (iso) { const b = await iso.boundingBox(); if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(600); }
      await page.screenshot({ path: join(OUT, `${nombre}-1-inicio.png`) });
      const m = await page.evaluate(() => {
        const titles = [...document.querySelectorAll('svg title')].map((t) => t.textContent.trim()).filter(Boolean);
        const fuera = [...document.querySelectorAll('.iso svg, .xray__iso svg, .fiso__lugar svg, figure img')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && (r.left < -1 || r.right > innerWidth + 1)).length;
        return { titles, fuera, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, alto: document.documentElement.scrollHeight, innerH: innerHeight };
      });
      await page.evaluate(() => window.scrollTo(0, Math.round(innerHeight * 1.3))); await page.waitForTimeout(2800);
      await page.screenshot({ path: join(OUT, `${nombre}-2-apertura.png`) });
      for (let y = 0; y < m.alto; y += v.h) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80); }
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
      await page.screenshot({ path: join(OUT, `${nombre}-3-completa.png`), fullPage: true });
      const pantallas = +(m.alto / v.h).toFixed(1), max = pag.max[v.k];
      const problemas = [];
      if (m.titles.length) problemas.push(`SVG con <title>: ${m.titles.slice(0, 3).join(', ')}`);
      if (m.scrollW > m.innerW + 1) problemas.push(`desborde horizontal: ${m.scrollW} > ${m.innerW}`);
      if (m.fuera) problemas.push(`${m.fuera} figura(s) fuera de la pantalla`);
      if (pantallas > max) problemas.push(`${pantallas} pantallas, presupuesto ${max}`);
      filas.push(`| ${pag.id} | ${v.k} | ${pantallas} / ${max} | ${problemas.length ? '✗ ' + problemas.join('; ') : '✓'} |`);
      problemas.forEach((p) => fallos.push(`${nombre}: ${p}`));
    } catch (e) { fallos.push(`${nombre}: ${e.message.split('\n')[0]}`); filas.push(`| ${pag.id} | ${v.k} | — | ✗ ${e.message.split('\n')[0]} |`); }
    await page.close();
  }
}
await browser.close();
const informe = `# Control visual de la propuesta\n\nBase: ${BASE}\n\n| Página | Ancho | Pantallas / máx. | Resultado |\n|---|---|---|---|\n${filas.join('\n')}\n\n${fallos.length ? `## Falló\n\n${fallos.map((f) => `- ${f}`).join('\n')}` : 'Todo en orden.'}\n`;
writeFileSync(join(OUT, 'informe.md'), informe);
console.log(informe);
process.exit(fallos.length ? 1 : 0);
