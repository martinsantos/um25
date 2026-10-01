// Auditoría tipográfica: textos visibles con tamaño calculado menor a MIN px.
// UM_PLAYWRIGHT_MODULE=… node work/cine/scripts/audit-type.mjs <url> [min=14]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.UM_PLAYWRIGHT_MODULE || 'playwright');
const [url, min = '14'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' });
const rows = await p.evaluate((min) => {
  const out = new Map();
  const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement;
    const text = t.textContent.trim(); if (!text || !el) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || r.width === 0 || el.closest('[aria-hidden="true"] svg, svg, dialog:not([open]), .umc-ar')) continue;
    const size = parseFloat(cs.fontSize);
    if (size < min) {
      const key = `${size.toFixed(1)}px ${cs.fontFamily.split(',')[0]} · ${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
      if (!out.has(key)) out.set(key, text.slice(0, 50));
    }
  }
  return [...out].map(([k, v]) => `${k} — "${v}"`);
}, +min);
console.log(rows.join('\n') || 'OK: nada menor a ' + min + 'px');
await b.close();
