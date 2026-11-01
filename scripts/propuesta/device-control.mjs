/** Exercise actual exploded equipment, including mobile controls and motion preferences. */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4381';
const out = process.env.QA_OUT || '/private/tmp/umsa-device-review-20261101';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
 const context = await browser.newContext();
 const page = await context.newPage();
 page.on('pageerror', e => errors.push(e.message));
 for (const width of [1440, 834, 390, 360]) {
  await page.setViewportSize({width, height:900});
  for (const code of ['101','102','103','107','108']) {
   await page.goto(base + '/servicios/' + code, {waitUntil:'networkidle'});
   const root = page.locator('[data-device]');
   await root.scrollIntoViewIfNeeded();
   await page.waitForFunction(() => document.querySelector('[data-device]').dataset.playing === 'true');
   await root.locator('[data-device-view="1"]').click();
   assert.equal(await root.getAttribute('data-state'), '1');
   assert.equal(await root.getAttribute('data-playing'), 'false');
   await page.waitForTimeout(1150);
   const lid = root.locator('.device__object .iso-lid');
   assert.notEqual(await lid.evaluate(el => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 0)');
   assert.equal(await root.locator('.iso-internals').evaluate(el => getComputedStyle(el).opacity), '1');
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
   await root.screenshot({path:`${out}/${code}-${width}-despiece.png`});
   await root.locator('[data-device-view="2"]').click();
   assert.ok(await root.locator('[data-device-detail] svg').isVisible());
   await page.waitForTimeout(650);
   await root.screenshot({path:`${out}/${code}-${width}-detalle.png`});
   await root.locator('[data-device-view="2"]').press('Home');
   assert.equal(await root.getAttribute('data-state'), '0');
   assert.ok(await root.locator('[data-device-view="0"]').evaluate(el => document.activeElement === el));
   console.log('PASS',code,width);
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+'/servicios/101',{waitUntil:'networkidle'});
 const root=page.locator('[data-device]');
 await root.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('[data-device]').dataset.state === '2',undefined,{timeout:15000});
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.waitForFunction(()=>document.querySelector('[data-device]').dataset.playing === 'false');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload({waitUntil:'networkidle'});await root.scrollIntoViewIfNeeded();
 assert.equal(await root.getAttribute('data-state'),'1');
 assert.equal(await root.getAttribute('data-playing'),'false');
 assert.equal(await root.locator('.iso-lid').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await root.locator('[data-device-view="2"]').click();
 assert.ok(await root.locator('[data-device-detail]').isVisible());
 assert.deepEqual(errors,[]);
 console.log('PASS: five distinct exploded devices, four widths, detail/keyboard/pause, automatic progression, offscreen suspension and reduced motion.');
} finally {await browser.close();}
