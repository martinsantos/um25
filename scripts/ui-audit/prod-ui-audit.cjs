// Auditoría UI de producción: capturas desktop/mobile y métricas por ruta (peso, LCP, CLS, DOM, texto <14px, chips).
// Uso: node scripts/ui-audit/prod-ui-audit.cjs  (escribe results.json y PNG en el directorio actual; correr desde una carpeta temporal)
// Requiere playwright + chromium instalados.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'https://www.ultimamilla.com.ar';
const routes = ['/', '/servicios', '/antecedentes', '/sectores', '/nosotros', '/contacto', '/blog', '/aeropuertos', '/bodegas'];
const vps = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }];
(async () => {
  const browser = await chromium.launch();
  const results = [];
  const ctx0 = await browser.newContext({ viewport: vps[0], ignoreHTTPSErrors: true });
  // discover detail links
  const p0 = await ctx0.newPage();
  const extra = [];
  for (const r of ['/servicios', '/antecedentes']) {
    try {
      await p0.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const hrefs = await p0.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
      const d = hrefs.find(h => h && new RegExp('^' + r + '/\\d+/').test(h));
      if (d) extra.push(d);
    } catch (error) { console.error('discover fail', r, error.message); }
  }
  await ctx0.close();
  const all = routes.concat(extra);
  for (const vp of vps) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, ignoreHTTPSErrors: true, isMobile: vp.name === 'mobile', deviceScaleFactor: 1 });
    for (const r of all) {
      const page = await ctx.newPage();
      const reqs = []; const errors = [];
      page.on('response', async (res) => { try { const h = res.headers(); reqs.push({ url: res.url(), type: res.request().resourceType(), len: Number(h['content-length'] || 0), status: res.status() }); } catch { /* respuesta sin cabeceras */ } });
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
      const t0 = Date.now();
      try {
        await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 60000 });
      } catch (error) { errors.push('nav: ' + error.message.slice(0, 100)); }
      const loadMs = Date.now() - t0;
      await page.waitForTimeout(1500);
      const m = await page.evaluate(() => {
        const vis = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
        const txt = el => (el.innerText || '').trim().replace(/\s+/g, ' ');
        const h1 = [...document.querySelectorAll('h1')].filter(vis).map(e => ({ t: txt(e).slice(0, 140), size: getComputedStyle(e).fontSize, weight: getComputedStyle(e).fontWeight }));
        const h2 = [...document.querySelectorAll('h2')].filter(vis).map(e => txt(e).slice(0, 100));
        const ctas = [...document.querySelectorAll('a,button')].filter(vis).filter(e => /btn|button|cta/i.test(e.className || '')).map(e => txt(e).slice(0, 60));
        const firstVP = [...document.querySelectorAll('h1,h2,h3,p,a,button,span,li,small,em,b,strong')].filter(e => { const r = e.getBoundingClientRect(); return vis(e) && r.top < innerHeight && r.bottom > 0 && e.children.length === 0; }).map(e => ({ tag: e.tagName.toLowerCase(), t: txt(e).slice(0, 90), fs: getComputedStyle(e).fontSize })).filter(x => x.t);
        const small = [...document.querySelectorAll('body *')].filter(e => vis(e) && e.children.length === 0 && txt(e)).filter(e => parseFloat(getComputedStyle(e).fontSize) < 14).map(e => ({ t: txt(e).slice(0, 60), fs: getComputedStyle(e).fontSize, cls: (e.className || '').toString().slice(0, 40) }));
        const chips = [...document.querySelectorAll('body *')].filter(e => vis(e) && /badge|chip|tag|pill|kicker|eyebrow|label/i.test((e.className || '').toString()) && e.children.length <= 1 && txt(e)).map(e => ({ t: txt(e).slice(0, 60), cls: (e.className || '').toString().slice(0, 50) }));
        const imgs = [...document.querySelectorAll('img')].filter(vis).map(i => ({ src: (i.currentSrc || i.src).slice(-70), nw: i.naturalWidth, nh: i.naturalHeight, w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), alt: (i.alt || '').slice(0, 50), lazy: i.loading }));
        const videos = document.querySelectorAll('video').length;
        const fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const nav = [...document.querySelectorAll('header a, nav a')].filter(vis).map(e => txt(e)).filter(Boolean);
        const words = txt(document.body).split(' ').length;
        const nodes = document.querySelectorAll('*').length;
        const links = document.querySelectorAll('a[href]').length;
        const animated = [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); return (s.animationName && s.animationName !== 'none') || (s.transitionDuration && s.transitionDuration !== '0s'); }).length;
        return { h1, h2, ctas: [...new Set(ctas)], firstVP: firstVP.slice(0, 40), small: small.slice(0, 25), smallCount: small.length, chips: chips.slice(0, 30), chipCount: chips.length, imgs: imgs.slice(0, 20), imgCount: imgs.length, videos, fonts: [...new Set(fonts)], overflow, nav, words, nodes, links, animated, title: document.title, metaDesc: (document.querySelector('meta[name=description]') || {}).content, docH: document.documentElement.scrollHeight };
      });
      const lcp = await page.evaluate(() => new Promise(res => { let v = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) v = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch { /* respuesta sin cabeceras */ } setTimeout(() => res(Math.round(v)), 300); }));
      const cls = await page.evaluate(() => new Promise(res => { let v = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch { /* respuesta sin cabeceras */ } setTimeout(() => res(+v.toFixed(3)), 300); }));
      const byType = {}; for (const q of reqs) { byType[q.type] = byType[q.type] || { n: 0, kb: 0 }; byType[q.type].n++; byType[q.type].kb += q.len / 1024; }
      for (const k in byType) byType[k].kb = Math.round(byType[k].kb);
      const bad = reqs.filter(q => q.status >= 400).map(q => q.status + ' ' + q.url.slice(-80));
      const shot = `shot-${vp.name}-${r.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`;
      try { await page.screenshot({ path: shot, fullPage: true }); } catch { /* respuesta sin cabeceras */ }
      const shotVP = `vp-${vp.name}-${r.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`;
      try { await page.screenshot({ path: shotVP, fullPage: false }); } catch { /* respuesta sin cabeceras */ }
      results.push({ vp: vp.name, route: r, loadMs, lcp, cls, reqTotal: reqs.length, byType, bad: bad.slice(0, 10), errors: errors.slice(0, 5), ...m });
      console.log(vp.name, r, 'load', loadMs, 'lcp', lcp, 'cls', cls, 'reqs', reqs.length, 'nodes', m.nodes, 'words', m.words, 'overflow', m.overflow, 'small<14px', m.smallCount, 'chips', m.chipCount);
      await page.close();
    }
    await ctx.close();
  }
  fs.writeFileSync('results.json', JSON.stringify(results, null, 1));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
