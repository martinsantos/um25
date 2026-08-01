#!/usr/bin/env node

/**
 * Raster proof generated from Fontmake's normalized binary only.
 * It never loads the fast diagnostic OTF, avoiding a repeat of the old
 * browser proof that hid broken source overlap behaviour.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { missingCodepoints } from './ttf_cmap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FONT = path.resolve(ROOT, process.env.UMSANS_REVIEW_FONT || 'type/um-sans-2/build/fontmake/UMSans2ManualAlpha12-DisplayBold.ttf');
const PROOF_ID = process.env.UMSANS_PROOF_ID || 'alpha12';
const REVIEW_LABEL = process.env.UMSANS_REVIEW_LABEL || 'UM SANS 2 MANUAL / ALPHA 12 / FONTMAKE REVIEW';
const OUTPUT_DIR = path.join(ROOT, 'type/um-sans-2/proofs/generated', PROOF_ID);
const OUTPUT = path.join(OUTPUT_DIR, 'fontmake-control-sheet.png');
const REPORT = path.join(OUTPUT_DIR, 'fontmake-control-sheet.json');
const magick = process.env.UMSANS_MAGICK || 'magick';
const proofStrings = ['Fibra certificada, operación continua.', 'e e e   o o o   a a a'];

if (!fs.existsSync(FONT)) {
  throw new Error(`Missing Fontmake review binary: ${path.relative(ROOT, FONT)}. Run fonts:fontmake:um-sans-2-manual first.`);
}
const missing = missingCodepoints(FONT, proofStrings);
if (missing.length > 0) {
  throw new Error(`Visual gate refuses fallback rendering. Missing: ${missing.map(({ character, codepoint }) => `${character} (${codepoint})`).join(', ')}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const operations = [
  ['-size', '1800x1320', 'xc:#0b0c0e'],
  ['-font', 'Arial-Bold', '-fill', '#ffffff', '-pointsize', '38', '-annotate', '+100+105', REVIEW_LABEL],
  ['-font', 'Arial', '-fill', '#aab0b8', '-pointsize', '27', '-annotate', '+100+158', 'Diagnostic raster gate. Not a release specimen.'],
  ['-stroke', '#dc2626', '-strokewidth', '5', '-draw', 'line 100,210 260,210'],
  ['-stroke', 'none'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '54', '-annotate', '+100+320', 'Fibra certificada, operación continua.'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '78', '-annotate', '+100+455', 'Fibra certificada, operación continua.'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '112', '-annotate', '+100+650', 'Fibra certificada,'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '112', '-annotate', '+100+790', 'operación continua.'],
  ['-font', FONT, '-fill', '#dce9ff', '-pointsize', '72', '-annotate', '+100+955', 'e e e   o o o   a a a'],
  ['-font', 'Arial', '-fill', '#aab0b8', '-pointsize', '24', '-annotate', '+100+1120', 'Release is blocked until coverage, spacing, kerning, hinting and independent visual review pass.'],
  OUTPUT,
];

// ImageMagick composes a canvas progressively; running each operation as a
// separate process discards that canvas. Keep the proof in one invocation.
execFileSync(magick, operations.flat(), { cwd: ROOT, stdio: 'inherit' });
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(FONT)).digest('hex');
const report = {
  status: 'GENERATED_FOR_VISUAL_REVIEW',
  source: path.relative(ROOT, FONT),
  sourceSha256: sha256,
  output: path.relative(ROOT, OUTPUT),
  pointSizes: [54, 78, 112, 72],
  strings: proofStrings,
  productionUse: false,
};
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
