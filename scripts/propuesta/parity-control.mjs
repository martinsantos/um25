/** Interaction regression gate: production capabilities must survive the redesign. */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const base = process.env.BASE_URL || 'http://127.0.0.1:4381';
const out = process.env.QA_OUT || '/private/tmp/umsa-parity-20261101';
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  const go = async path => { const r = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 }); assert.equal(r.status(), 200, path); assert.ok(await page.locator('h1').innerText(), path); assert.equal(await page.locator('astro-error-overlay').count(), 0); };
  const overflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${page.url()}`);
  await go('/');
  assert.match(await page.title(), /ULTIMA MILLA/);
  const services = page.getByRole('button', { name: 'Abrir servicios', exact: true });
  await services.click();
  assert.equal(await services.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#um-mega-servicios .um-ops-mega__grid a:visible').count(), 8);
  await page.screenshot({ path: out + '/desktop-servicios.png' });
  await services.press('Escape');
  await page.mouse.move(0, 800);
  assert.equal(await services.getAttribute('aria-expanded'), 'false');
  await page.getByRole('button', { name: 'Abrir sectores', exact: true }).click();
  assert.equal(await page.locator('#um-mega-sectores .um-ops-mega__grid a:visible').count(), 9);
  const productionLinks = ['/software', '/seguridad-electronica', '/certificaciones', '/terminos', '/servicios-it-empresas-mendoza', '/presupuesto-servicios-it-empresas', '/proyectos-ingenieria-it-mendoza', '/servicios-it-empresas-argentina', '/cctvai'];
  for (const href of productionLinks) assert.ok(await page.locator(`a[href="${href}"]`).count(), `Missing navigation ${href}`);
  await overflow();
  // The production quick-contact flow must survive the shell integration.
  await go('/');
  await page.locator('.cierre .btn').click();
  assert.ok(await page.locator('[data-contact-modal]').isVisible());
  await page.getByRole('button', { name: 'Mensaje guiado', exact: true }).click();
  assert.ok(await page.locator('[data-contact-guides]').isVisible());
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('[data-contact-modal]').isHidden());
  assert.ok(await page.locator('.cierre .btn').evaluate(el => el === document.activeElement), 'Modal restores focus');
  for (const path of ['/en', '/en/services']) {
    await go(path);
    assert.equal(await page.locator('.um-trust-strip__client').count(), 6);
    assert.equal(await page.locator('.um-trust-strip__docs article').count(), 3);
    assert.ok(await page.getByRole('link', { name: 'Request assessment', exact: true }).isVisible());
  }
  for (const code of Array.from({length: 8}, (_, i) => String(101 + i))) {
    await go('/servicios/' + code);
    assert.equal(await page.locator('[data-caps] h3').count(), 6, 'Full production service scope: ' + code);
    assert.equal(await page.locator('[data-caps] p').count(), 6);
  }
  await go('/antecedentes');
  const total = Number(await page.locator('[data-count]').innerText());
  assert.ok(total >= 518);
  await page.locator('input[data-search]').fill('Aeropuertos');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('q') === 'Aeropuertos');
  const filtered = Number(await page.locator('[data-count]').innerText());
  assert.ok(filtered > 0 && filtered < total);
  assert.ok(await page.locator('[data-grid] [data-ficha] img').count());
  await page.locator('[data-sort]').selectOption('year-asc');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('orden') === 'year-asc');
  const years = await page.locator('[data-grid] [data-ficha]').evaluateAll(els => els.map(e => Number(e.dataset.year)));
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
  await page.mouse.move(0, 800);
  await page.screenshot({ path: out + '/catalogo-filtrado.png' });
  const countBefore = await page.locator('[data-count]').innerText();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-count]').innerText(), countBefore, 'SSR and browser search must agree');
  await page.locator('[data-clear]').click();
  await page.waitForFunction(total => Number(document.querySelector('[data-count]').textContent) === total, total);
  assert.equal(await page.locator('input[data-search]').inputValue(), '');
  await page.locator('[data-field="periodo"]').selectOption('2020');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('periodo') === '2020');
  assert.ok((await page.locator('[data-grid] [data-ficha]').evaluateAll(els => els.map(e => Number(e.dataset.year)))).every(y => y >= 2020 && y <= 2023));
  await go('/antecedentes?servicio=107&anio=2024');
  await page.locator('[data-sort]').selectOption('client');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('orden') === 'client');
  assert.ok((await page.locator('[data-grid] [data-ficha]').evaluateAll(els => els.map(e => ({ year: e.dataset.year, services: e.dataset.services.split(' ') })))).every(c => c.year === '2024' && c.services.includes('107')));
  for (const path of ['/software', '/seguridad-electronica', '/sectores', '/servicios/101', '/blog', '/contacto']) { await go(path); await overflow(); }
  await go('/blog');
  for (const category of ['noticias', 'proyectos', 'tecnico', 'tecnologia', 'empresa']) {
    assert.equal(await page.locator(`nav[aria-label="Categorías"] a[href="/blog?categoria=${category}"]`).count(), 1, 'Preserved blog category: ' + category);
  }
  await go('/antecedentes?cliente=Jose%20Nucete%20e%20Hijos%20SA');
  assert.ok(Number(await page.locator('[data-count]').innerText()) > 0, 'Original client links survive name formatting');
  await go('/software');
  await page.locator('[data-umc-motion]').click();
  await page.waitForFunction(() => [...document.querySelectorAll('video')].some(v => v.readyState >= 2), { timeout: 30000 });
  assert.ok(await page.locator('.umc-poster').getAttribute('src'));
  await page.screenshot({ path: out + '/software-recuperado.png' });
  await go('/servicios/104');
  await page.waitForFunction(() => document.querySelector('video[data-service-film]')?.readyState >= 2);
  assert.equal(await page.locator('[data-lugar], [data-equipo]').count(), 0, 'Software must not turn into a building or device diagram');
  await page.getByRole('button', { name: 'Pausar película', exact: true }).click();
  assert.ok(await page.locator('video[data-service-film]').evaluate(v => v.paused));
  await page.screenshot({ path: out + '/software-servicio.png' });
  await page.getByRole('heading', { name: 'Qué cubre.' }).scrollIntoViewIfNeeded();
  assert.equal(await page.locator('[data-equipo]').count(), 0);
  await page.screenshot({ path: out + '/software-alcance.png' });
  await page.getByRole('button', { name: 'Reproducir película', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('video[data-service-film]').paused);
  for (const code of ['105', '106']) {
    await go('/servicios/' + code);
    assert.equal(await page.locator('[data-lugar], [data-equipo]').count(), 0);
    assert.ok(await page.locator('.service-editorial__visual img').evaluate(img => img.complete && img.naturalWidth > 0));
  }
  await go('/servicios/101');
  assert.equal(await page.locator('[data-lugar]').count(), 0, 'Service openings do not force a building reveal');
  assert.equal(await page.locator('[data-equipo]').count(), 1, 'Physical installations retain their own equipment diagram');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await go('/servicios/104');
  assert.ok(await page.locator('video[data-service-film]').evaluate(v => v.paused && !v.getAttribute('src')));
  await page.getByRole('button', { name: 'Reproducir película', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('video[data-service-film]').readyState >= 2);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await go('/sectores/bodegas');
  const scheme = page.locator('[data-dentro]');
  await scheme.scrollIntoViewIfNeeded();
  assert.equal(await scheme.locator('[data-diagram-code="104"], [data-diagram-code="105"], [data-diagram-code="106"]').count(), 0, 'Professional services must not activate a fictitious physical circuit');
  await scheme.locator('[data-diagram-code="101"]').hover();
  await page.waitForFunction(() => document.querySelector('[data-diagram-stage]').dataset.svc === '101');
  assert.equal(await scheme.locator('.ahora').innerText(), 'Redes');
  assert.equal(await scheme.locator('[data-integration-service="101"] a[href="/servicios/101#provision"]').count(), 1, 'Sector integration links to the full offering');


  await go('/contacto');
  // Invalid contact forms stay in the browser; no email is sent.
  await page.route('**/api/contact', route => { throw new Error('Invalid form attempted a network submission'); });
  await page.getByRole('button', { name: 'Enviar consulta' }).click();
  assert.ok(await page.locator('main [data-error-for="name"]').innerText());
  assert.ok(await page.locator('main select[name="topic"]').count());
  await page.screenshot({ path: out + '/contacto.png' });
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await go('/');
    assert.ok(await page.locator('.um-tabbar').isVisible(), 'Production mobile navigation');
    const toggle = page.locator('#menuToggle');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.ok(await page.locator('#mobileMenu').isVisible());
    assert.ok(await page.locator('.um-tabbar').isHidden(), 'Tab bar must not overlap the expanded menu');
    assert.equal(await page.locator('main').getAttribute('inert'), '');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#mobileMenu')).opacity === '1');
    await page.screenshot({ path: `${out}/mobile-${width}-menu.png` });
    await toggle.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('main').getAttribute('inert'), null);
    await overflow();
    await go('/antecedentes');
    await page.locator('[data-toggle]').click();
    assert.equal(await page.locator('[data-toggle]').getAttribute('aria-expanded'), 'true');
    await overflow();
    await go('/en/services');
    await overflow();
    await go('/contacto');
    await overflow();
  }
  const layouts = [...Array.from({length: 8}, (_, i) => `/servicios/${101 + i}`), ...['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud'].map(s => `/sectores/${s}`), '/software', '/seguridad-electronica', '/blog'];
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 900});
    for (const path of layouts) {
      await go(path); await overflow();
      const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i => i.complete && !i.naturalWidth).map(i => i.src));
      assert.deepEqual(broken, [], `Broken images: ${path}`);
    }
  }
  assert.deepEqual(errors, [], 'Browser exceptions');
  console.log('PASS: desktop dropdowns, 9 sectors, mobile menu/escape/inert, catalog search/sort/URL aliases/SSR, contact validation, responsive 1440/390/360.');
} finally { await browser.close(); }
