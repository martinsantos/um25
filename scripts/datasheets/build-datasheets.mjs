#!/usr/bin/env node
// Genera public/datasheets/<slug>.pdf a partir de /servicios/<id>/ficha
// (la versión imprimible A4). Requiere un servidor local del sitio y
// playwright-core (npx -y playwright-core no instala navegador: se usa
// CHROME_BIN o el Chromium de Playwright ya presente en la máquina).
//
//   npm run build && (HOST=127.0.0.1 PORT=4399 node dist/server/entry.mjs &)
//   DATASHEET_BASE=http://127.0.0.1:4399 node scripts/datasheets/build-datasheets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const BASE = process.env.DATASHEET_BASE || 'http://127.0.0.1:4321';
const OUT = path.join(process.cwd(), 'public', 'datasheets');
const files = JSON.parse(fs.readFileSync(new URL('../../src/data/serviceDatasheetFiles.json', import.meta.url), 'utf8'));
const SERVICES = Object.entries(files);

const requireFrom = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM || path.join(process.cwd(), 'package.json'));
let chromium;
try {
  ({ chromium } = requireFrom('playwright-core'));
} catch {
  console.error('playwright-core no está disponible. Instalalo (npm i -D playwright-core) o definí PLAYWRIGHT_REQUIRE_FROM.');
  process.exit(1);
}

const executablePath = process.env.CHROME_BIN || undefined;
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
fs.mkdirSync(OUT, { recursive: true });
for (const [id, slug] of SERVICES) {
  const url = `${BASE}/servicios/${id}/ficha`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(OUT, `${slug}.pdf`);
  await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`✓ ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
}
await browser.close();
