#!/usr/bin/env node

/** Render mobile and print proof sheets from a normalized manual review TTF. */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { missingCodepoints } from './ttf_cmap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FONT = path.resolve(ROOT, process.env.UMSANS_REVIEW_FONT || 'type/um-sans-2/build/fontmake/UMSans2ManualAlpha17-DisplayBold.ttf');
const PROOF_ID = process.env.UMSANS_PROOF_ID || 'alpha17';
const OUTPUT_DIR = path.join(ROOT, 'type/um-sans-2/proofs/generated', PROOF_ID);
const LABEL = process.env.UMSANS_REVIEW_LABEL || 'UM SANS 2 MANUAL / ALPHA 17';
const magick = process.env.UMSANS_MAGICK || 'magick';
const samples = ['Fibra certificada,', 'operacion continua.', 'a c e o s', 'ece ese oeo', 'referencia tecnica.'];

if (!fs.existsSync(FONT)) throw new Error(`Missing Fontmake review binary: ${path.relative(ROOT, FONT)}`);
const missing = missingCodepoints(FONT, samples);
if (missing.length > 0) {
  throw new Error(`Multiscale proof refuses fallback rendering. Missing: ${missing.map(({ character, codepoint }) => `${character} (${codepoint})`).join(', ')}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const mobile = path.join(OUTPUT_DIR, 'mobile-review.png');
const print = path.join(OUTPUT_DIR, 'print-review.png');
const reportPath = path.join(OUTPUT_DIR, 'multiscale-review.json');

const mobileOps = [
  ['-size', '1170x2532', 'xc:#0b0c0e'],
  ['-font', 'Arial-Bold', '-fill', '#ffffff', '-pointsize', '38', '-annotate', '+72+112', 'UM SANS 2 / MOBILE REVIEW'],
  ['-font', 'Arial', '-fill', '#aab0b8', '-pointsize', '30', '-annotate', '+72+162', 'Review at a 390 px CSS viewport.'],
  ['-stroke', '#dc2626', '-strokewidth', '6', '-draw', 'line 72,220 180,220'],
  ['-stroke', 'none'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '94', '-annotate', '+72+410', 'Fibra certificada,'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '94', '-annotate', '+72+530', 'operacion continua.'],
  ['-font', 'Arial-Bold', '-fill', '#ffffff', '-pointsize', '30', '-annotate', '+72+770', 'ROUND CONTROL'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '120', '-annotate', '+72+900', 'a c e o s'],
  ['-font', 'Arial-Bold', '-fill', '#ffffff', '-pointsize', '30', '-annotate', '+72+1080', 'APERTURE / WORD RHYTHM'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '90', '-annotate', '+72+1215', 'ece ese oeo'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '68', '-annotate', '+72+1365', 'referencia'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '68', '-annotate', '+72+1455', 'operacion continua.'],
  ['-font', 'Arial', '-fill', '#aab0b8', '-pointsize', '28', '-annotate', '+72+1740', 'Reject if the aperture closes or a terminal blurs.'],
  mobile,
];
const printOps = [
  ['-size', '2480x3508', 'xc:#ffffff'],
  ['-units', 'PixelsPerInch', '-density', '300'],
  ['-font', 'Arial-Bold', '-fill', '#111827', '-pointsize', '12', '-annotate', '+160+180', `${LABEL} / PRINT REVIEW / 300 DPI`],
  ['-font', 'Arial', '-fill', '#5d636b', '-pointsize', '9', '-annotate', '+160+240', 'Review master outlines at practical print sizes before any release decision.'],
  ['-stroke', '#dc2626', '-strokewidth', '8', '-draw', 'line 160,300 360,300'],
  ['-stroke', 'none'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '36', '-annotate', '+160+610', 'Fibra certificada,'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '36', '-annotate', '+160+790', 'operacion continua.'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '25', '-annotate', '+160+1080', 'a c e o s   ece ese oeo'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '16', '-annotate', '+160+1320', 'referencia tecnica. operacion continua.'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '10', '-annotate', '+160+1500', 'Fibra certificada, operacion continua.'],
  ['-font', 'Arial', '-fill', '#5d636b', '-pointsize', '8', '-annotate', '+160+3280', 'Diagnostic only. Approval requires complete coverage, spacing, kerning and independent visual review.'],
  print,
];

execFileSync(magick, mobileOps.flat(), { cwd: ROOT, stdio: 'inherit' });
execFileSync(magick, printOps.flat(), { cwd: ROOT, stdio: 'inherit' });
const report = {
  status: 'GENERATED_FOR_MANUAL_MULTISCALE_REVIEW',
  source: path.relative(ROOT, FONT),
  sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(FONT)).digest('hex'),
  outputs: { mobile: path.relative(ROOT, mobile), print: path.relative(ROOT, print) },
  viewport: '390px CSS width at 3x raster',
  print: 'A4 portrait at 300 dpi',
  verifiedCodepointCoverage: samples,
  productionUse: false,
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
