#!/usr/bin/env node

/**
 * Creates the minimum visual review sheet for a manual display master.
 * The sheet deliberately compares the controlling round letters in words and
 * at reading sizes. It is a review artifact, not a pass/fail release signal.
 */
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
const OUTPUT = path.join(OUTPUT_DIR, 'glyph-review.png');
const REPORT = path.join(OUTPUT_DIR, 'glyph-review.json');
const LABEL = process.env.UMSANS_REVIEW_LABEL || 'UM SANS 2 MANUAL / ALPHA 17';
const magick = process.env.UMSANS_MAGICK || 'magick';
const reviewStrings = [
  'a c e o s',
  'ece ese oeo',
  'referencia operación continuo',
  'Fibra certificada, operación continua.',
  'referencia tecnica, operacion sostenida.',
];

if (!fs.existsSync(FONT)) {
  throw new Error(`Missing Fontmake review binary: ${path.relative(ROOT, FONT)}`);
}
const missing = missingCodepoints(FONT, reviewStrings);
if (missing.length > 0) {
  throw new Error(`Glyph review refuses fallback rendering. Missing: ${missing.map(({ character, codepoint }) => `${character} (${codepoint})`).join(', ')}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const ops = [
  ['-size', '1800x1500', 'xc:#f7f7f5'],
  ['-font', 'Arial-Bold', '-fill', '#121212', '-pointsize', '34', '-annotate', '+100+100', `${LABEL} / GLYPH REVIEW`],
  ['-font', 'Arial', '-fill', '#5d636b', '-pointsize', '24', '-annotate', '+100+148', 'Manual inspection required: proportions, aperture, terminals, spacing and interpolation are not automatable.'],
  ['-stroke', '#dc2626', '-strokewidth', '5', '-draw', 'line 100,196 260,196'],
  ['-stroke', 'none'],
  ['-font', 'Arial-Bold', '-fill', '#121212', '-pointsize', '26', '-annotate', '+100+276', 'ROUND CONTROL / a c e o s'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '176', '-annotate', '+100+455', 'a c e o s'],
  ['-font', 'Arial-Bold', '-fill', '#121212', '-pointsize', '26', '-annotate', '+100+555', 'APERTURE AND RHYTHM / ece  ese  oeo'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '138', '-annotate', '+100+700', 'ece  ese  oeo'],
  ['-font', 'Arial-Bold', '-fill', '#121212', '-pointsize', '26', '-annotate', '+100+800', 'WORD SHAPE / referencia  operación  continuo'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '96', '-annotate', '+100+920', 'referencia  operación  continuo'],
  ['-font', 'Arial-Bold', '-fill', '#121212', '-pointsize', '26', '-annotate', '+100+1030', 'READING SCALE / target UI text, not display'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '42', '-annotate', '+100+1105', 'Fibra certificada, operación continua.'],
  ['-font', FONT, '-fill', '#111827', '-pointsize', '32', '-annotate', '+100+1160', 'referencia tecnica, operacion sostenida.'],
  ['-font', 'Arial', '-fill', '#5d636b', '-pointsize', '22', '-annotate', '+100+1335', 'Reject if a/c/e/o/s do not form a coherent system, if e closes its aperture, or if reading text needs display weight.'],
  OUTPUT,
];

execFileSync(magick, ops.flat(), { cwd: ROOT, stdio: 'inherit' });
const report = {
  status: 'GENERATED_FOR_MANUAL_GLYPH_REVIEW',
  source: path.relative(ROOT, FONT),
  sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(FONT)).digest('hex'),
  output: path.relative(ROOT, OUTPUT),
  reviewSets: ['a c e o s', 'ece ese oeo', 'referencia operación continuo', 'UI reading sizes'],
  verifiedCodepointCoverage: reviewStrings,
  productionUse: false,
};
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
