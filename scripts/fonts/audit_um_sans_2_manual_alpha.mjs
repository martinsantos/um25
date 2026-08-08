#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentypeModule from 'opentype.js';

const opentype = opentypeModule.default ?? opentypeModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPORT = path.join(ROOT, 'type/um-sans-2/build/build-report.json');
const OTF = path.join(ROOT, 'type/um-sans-2/build/UMSans2ManualAlpha7-DisplayBold.otf');
const WEB_OTF = path.join(ROOT, 'public/fonts/um-sans-2-manual-alpha/UMSans2ManualAlpha7-DisplayBold.otf');
const ROUTE = path.join(ROOT, 'src/pages/estilo/um-sans-2-manual.astro');
const OUTPUT = path.join(ROOT, 'type/um-sans-2/build/audit-report.json');

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(fs.existsSync(REPORT), 'Build report is missing');
check(fs.existsSync(OTF), 'Compiled OTF proof is missing');
check(fs.existsSync(WEB_OTF), 'Web OTF proof is missing');

const report = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : { metrics: {} };
const route = fs.readFileSync(ROUTE, 'utf8');
check(report.productionUse === false, 'Manual proof must remain quarantined');
check(report.version === '0.800', 'Expected Alpha 7 version 0.800');
check(report.kerningPairs === 0, 'Alpha 7 must validate spacing without kerning');
check(report.visualGateRequired === true, 'Alpha 7 must require the raster visual gate');
check(route.includes('noindex={true}'), 'Specimen must remain noindex');
check(route.includes('UMSans2ManualAlpha7-DisplayBold.otf?v=0.800'), 'Specimen is not loading Alpha 7 OTF');
check(!/letter-spacing:\s*-/.test(route), 'Specimen uses negative tracking');
check(!route.includes('text-rendering: geometricPrecision'), 'Specimen forces non-default rasterization');

for (const name of ['O', 'o', 'a', 'b', 'd', 'p']) {
  const areas = report.metrics?.[name]?.contourAreas ?? [];
  check(areas.length === 2 && areas[0] * areas[1] < 0, `${name} counter winding is invalid: ${areas.join(', ')}`);
}
{
  const eAreas = report.metrics?.e?.contourAreas ?? [];
  check(eAreas.length === 1 && Math.abs(eAreas[0]) > 100000, `e open contour is invalid: ${eAreas.join(', ')}`);
}
for (const [name, left, right] of [['a', 30, 30], ['e', 30, 40], ['f', 18, 30], ['o', 30, 30], ['r', 40, 20], ['s', 24, 24]]) {
  const metric = report.metrics?.[name] ?? {};
  check(metric.leftSidebearing >= left && metric.rightSidebearing >= right, `${name} sidebearings are too tight`);
}
check(report.metrics?.f?.leftSidebearing <= 70, 'f left sidebearing still creates a false word break');

if (fs.existsSync(OTF)) {
  const font = opentype.loadSync(OTF);
  check(font.unitsPerEm === 1000, 'Unexpected unitsPerEm');
  check(font.ascender === 780 && font.descender === -220, 'Vertical metrics changed');
  check(font.glyphs.length === 24, `Unexpected glyph count: ${font.glyphs.length}`);
  for (const name of ['f', 'r']) {
    const glyph = Object.values(font.glyphs.glyphs).find((item) => item.name === name);
    check(Boolean(glyph), `Missing ${name} in compiled proof`);
    if (glyph) check(glyph.advanceWidth === report.metrics[name].advanceWidth, `${name} compiled advance diverges`);
  }
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  version: report.version,
  glyphCount: report.glyphCount,
  productionUse: false,
  failures,
};
fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (failures.length) process.exit(1);
