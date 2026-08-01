#!/usr/bin/env node

/**
 * Builds the only font binary allowed in the browser specimen.
 *
 * The diagnostic opentype.js compiler is useful for fast source inspection,
 * but it does not normalize overlaps. Fontmake does, so its output creates a
 * firm boundary between source diagnostics and a reviewable browser artifact.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UFO = path.resolve(ROOT, process.env.UMSANS_MANUAL_UFO || 'type/um-sans-2/sources/UMSans2Display-Bold.ufo');
const BUILD = path.join(ROOT, 'type/um-sans-2/build/fontmake');
const WEB = path.join(ROOT, 'public/fonts/um-sans-2-manual-alpha');
const OUTPUT_NAME = process.env.UMSANS_MANUAL_OUTPUT || 'UMSans2ManualAlpha12-DisplayBold.ttf';
const REVIEW_FAMILY = process.env.UMSANS_MANUAL_REVIEW_FAMILY || 'UM Sans 2 Manual Alpha 12';
const REVIEW_VERSION = process.env.UMSANS_MANUAL_REVIEW_VERSION || '0.912';
const publishReview = process.env.UMSANS_WEB_PROOF === 'true' || OUTPUT_NAME === 'UMSans2ManualAlpha12-DisplayBold.ttf';
const output = path.join(BUILD, OUTPUT_NAME);
const review = path.join(WEB, OUTPUT_NAME);
const projectFontmake = path.join(ROOT, '.venv-fonts/bin/fontmake');
const executable = process.env.UMSANS_FONTMAKE || (fs.existsSync(projectFontmake) ? projectFontmake : 'fontmake');

if (!fs.existsSync(UFO)) {
  throw new Error(`Missing editable UFO source: ${path.relative(ROOT, UFO)}`);
}

fs.mkdirSync(BUILD, { recursive: true });
fs.mkdirSync(WEB, { recursive: true });

try {
  execFileSync(executable, [
    '-u', UFO,
    '-o', 'ttf',
    '--output-path', output,
  ], { cwd: ROOT, stdio: 'inherit' });
} catch (error) {
  throw new Error(`Fontmake could not build the normalized review output. Set UMSANS_FONTMAKE to its executable. ${error.message}`);
}

if (publishReview) {
  fs.copyFileSync(output, review);
}
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
const manifest = {
  status: 'GENERATED_FOR_REVIEW',
  family: REVIEW_FAMILY,
  version: REVIEW_VERSION,
  source: path.relative(ROOT, UFO),
  producer: 'Fontmake with RemoveOverlapsFilter',
  output: path.relative(ROOT, output),
  browserProof: publishReview ? path.relative(ROOT, review) : null,
  sha256,
  productionUse: false,
  approvedUse: publishReview ? 'noindex specimen and technical review only' : 'isolated local review only',
};
fs.writeFileSync(path.join(BUILD, 'fontmake-review.json'), `${JSON.stringify(manifest, null, 2)}\n`);
if (publishReview) {
  fs.writeFileSync(path.join(WEB, 'fontmake-review.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
