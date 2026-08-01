import fs from 'node:fs';
import path from 'node:path';
import opentypeModule from 'opentype.js';

const opentype = opentypeModule.default ?? opentypeModule;

const root = process.cwd();
const routePath = path.join(root, 'src/pages/estilo/um-sans-2-manual.astro');
const source = fs.readFileSync(routePath, 'utf8');
const failures = [];

const requirePattern = (pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

const forbidPattern = (pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

requirePattern(/noindex=\{true\}/, 'The manual specimen must remain noindex.');
requirePattern(/font-synthesis:\s*none/, 'The specimen must disable synthetic font construction.');
requirePattern(/font-display:\s*swap/, 'The specimen font must render with a non-blocking font strategy.');
requirePattern(/\.manual-alpha[^{]*\{[\s\S]*?font-family:/, 'Experimental font scope is missing.');
requirePattern(/overflow-wrap:\s*anywhere/, 'Long inventory samples need a controlled overflow fallback.');
requirePattern(/@media\s*\(max-width:\s*760px\)/, 'Mobile specimen rules are required.');
requirePattern(/font-size:\s*16px/, 'The specimen must keep visible body copy at 16px or larger.');
forbidPattern(/height:\s*100vh/, 'Do not use a fixed 100vh specimen section.');
forbidPattern(/letter-spacing:\s*-/, 'The manual face must not use negative tracking while spacing is under review.');
forbidPattern(/text-transform:\s*uppercase[\s\S]{0,120}manual-alpha/, 'The experimental face must not be forced into all-caps UI labels.');

const glyphFont = path.join(root, 'public/fonts/um-sans-2-manual-alpha/UMSans2ManualAlpha1-DisplayBold.otf');
if (!fs.existsSync(glyphFont)) failures.push('Compiled Alpha 1 font is missing from public/fonts.');

if (fs.existsSync(glyphFont)) {
  const font = opentype.loadSync(glyphFont);
  const proof = 'Fibra certificada, operación continua.';
  const missing = [...proof].filter((character) => {
    const glyph = font.charToGlyph(character);
    return !glyph || glyph.name === '.notdef';
  });
  if (missing.length) failures.push(`Proof phrase falls back for: ${[...new Set(missing)].join(', ')}`);

  // These are the actual line candidates used by the mobile specimen. Keeping
  // them bounded catches accidental font fallback or a broken advance width.
  const mobileLines = [
    ['Fibra certificada,', 362.88],
    ['operación continua.', 403.92],
  ];
  for (const [line, expectedWidth] of mobileLines) {
    const width = font.getAdvanceWidth(line, 40);
    if (Math.abs(width - expectedWidth) > 0.5) {
      failures.push(`${line} advance width changed: ${width.toFixed(2)}px (expected ${expectedWidth.toFixed(2)}px at 40px)`);
    }
  }

  const desktopSecondLine = font.getAdvanceWidth('operación continua.', 78);
  if (desktopSecondLine > 800) {
    failures.push(`Desktop proof line exceeds its specimen measure: ${desktopSecondLine.toFixed(2)}px`);
  }
}

if (failures.length) {
  console.error('Taste UI/UX audit: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Taste UI/UX audit: PASS');
  console.log('- quarantine, font rendering, responsive proof, scope and font artifact verified');
}
