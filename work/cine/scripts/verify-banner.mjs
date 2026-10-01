// Verificación del banner cine en Chrome headless: reproduce, toma capturas a tiempos
// dados y lista etiquetas AR visibles. Pocas capturas (no secuencias) para cuidar la RAM.
// UM_PLAYWRIGHT_MODULE=… node work/cine/scripts/verify-banner.mjs <url> <salida-prefijo> [anchoxalto] [segundos,…]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.UM_PLAYWRIGHT_MODULE || 'playwright');
const [url, prefix, size = '1440x900', times = '2,6,10'] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const browser = await chromium.launch({ executablePath: process.env.UM_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
const start = Date.now();
for (const t of times.split(',').map(Number)) {
  await page.waitForTimeout(Math.max(0, t * 1000 - (Date.now() - start)));
  const info = await page.evaluate(() => ({
    videos: [...document.querySelectorAll('.umc-video')].map((v) => ({ src: v.getAttribute('src'), t: +v.currentTime.toFixed(2), paused: v.paused, on: v.classList.contains('is-on') })),
    scene: document.querySelector('[data-umc]')?.dataset.scene,
    tags: [...document.querySelectorAll('.umc-tag.is-on')].map((e) => e.querySelector('small').textContent + ' | ' + e.querySelector('strong').textContent),
  }));
  await page.screenshot({ path: `${prefix}-${t}s.jpg`, quality: 80, type: 'jpeg' });
  console.log(`t=${t}s`, JSON.stringify(info));
}
console.log('errors', JSON.stringify(errors.slice(0, 8)));
await browser.close();
