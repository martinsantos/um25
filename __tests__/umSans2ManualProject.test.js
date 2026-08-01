const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('UM Sans 2 manual project quarantine', () => {
  test('keeps an editable UFO source and explicit drawing documentation', () => {
    expect(fs.existsSync(path.join(root, 'type/um-sans-2/sources/UMSans2Display-Bold.ufo/metainfo.plist'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'type/um-sans-2/UMSans2.designspace'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'type/um-sans-2/proofs/specimen.html'))).toBe(true);
    expect(read('type/um-sans-2/docs/DRAWING-SPEC.md')).toMatch(/manual/i);
    expect(read('type/um-sans-2/README.md')).toMatch(/Alpha 12/i);
  });

  test('does not import or transform third-party outlines', () => {
    const bootstrap = read('scripts/fonts/bootstrap_um_sans_2_manual_alpha.py');
    const compiler = read('scripts/fonts/compile_um_sans_2_manual_alpha.mjs');
    expect(bootstrap).not.toMatch(/fontTools\.subset|instantiateVariableFont|TTFont\(/);
    expect(bootstrap).not.toContain('BooleanGlyph');
    expect(bootstrap).not.toContain('remove_overlaps');
    expect(compiler).not.toMatch(/fontTools\.subset|instantiateVariableFont/);
    expect(bootstrap).toMatch(/def draw_H/);
    expect(bootstrap).toMatch(/def draw_e/);
    expect(bootstrap).toMatch(/def draw_s/);
    expect(bootstrap).toContain('add_glyph(font, "f", 472');
    expect(bootstrap).toContain('add_glyph(font, "r", 492');
    expect(bootstrap).not.toContain('pos f i -22');
    expect(compiler).toContain('leftSidebearing: xMin');
  });

  test('loads the proof only in a noindex specimen', () => {
    const route = read('src/pages/estilo/um-sans-2-manual.astro');
    expect(route).toContain('noindex={true}');
    expect(route).toContain('UMSans2-Bold.woff2?v=2.1-candidate');
    expect(route).toContain('public/fonts/um-sans-2-editorial-candidate/provenance.json');
    expect(route).not.toContain('UMSans2ManualAlpha12-DisplayBold.ttf?v=0.912');

    const globalRuntime = [
      'src/styles/v4.css',
      'src/styles/global.css',
      'src/layouts/LayoutV4.astro',
    ].map(read).join('\n');
    expect(globalRuntime).not.toContain('UM Sans 2 Manual Alpha 12');
    expect(globalRuntime).not.toContain('um-sans-2-manual-alpha');
  });

  test('marks generated web artifacts as non-production', () => {
    const marker = read('public/fonts/um-sans-2-manual-alpha/DO-NOT-SHIP.md');
    const report = JSON.parse(read('public/fonts/um-sans-2-manual-alpha/build-report.json'));
    expect(marker).toMatch(/Do not/i);
    expect(report.productionUse).toBe(false);
    expect(report.approvedUse).toMatch(/diagnostic inspection only/i);
  });

  test('keeps the long proof phrase bounded on narrow screens', () => {
    const route = read('src/pages/estilo/um-sans-2-manual.astro');
    expect(route).toMatch(/\.manual-type__hero-sample\s*\{[\s\S]*?width:\s*100%/);
    expect(route).toMatch(/\.manual-type__hero-sample\s*\{[\s\S]*?text-wrap:\s*pretty/);
    expect(route).toMatch(/font-size:\s*clamp\(30px,\s*8vw,\s*38px\)/);
    expect(route).not.toContain('text-rendering: geometricPrecision');
    expect(route).not.toMatch(/letter-spacing:\s*-/);
  });

  test('exposes a multi-size raster gate before any release claim', () => {
    const route = read('src/pages/estilo/um-sans-2-manual.astro');
    const audit = read('type/um-sans-2/docs/VISUAL-AUDIT.md');
    expect(route).toContain('const rasterSizes = [16, 20, 24, 30, 32, 48, 72]');
    expect(route).toContain('La forma debe sobrevivir a cada escala.');
    expect(route).toContain('producción bloqueada');
    expect(audit).toMatch(/RELEASE REJECTED/i);
    expect(audit).toMatch(/FontBakery release failures/i);
  });

  test('keeps Fontmake normalization separate from the diagnostic compiler', () => {
    const compiler = read('scripts/fonts/compile_um_sans_2_manual_alpha.mjs');
    const fontmake = read('scripts/fonts/fontmake_um_sans_2_manual.mjs');
    expect(compiler).not.toContain('writeUfo(definitions);');
    expect(fontmake).toContain('RemoveOverlapsFilter');
    expect(fontmake).toContain(".venv-fonts/bin/fontmake");
    expect(fontmake).toContain('GENERATED_FOR_REVIEW');
    expect(fontmake).toContain('productionUse: false');
  });

  test('refuses fallback glyphs in each visual proof', () => {
    const glyphReview = read('scripts/fonts/render_um_sans_2_manual_glyph_review.mjs');
    const visualGate = read('scripts/fonts/render_um_sans_2_manual_visual_gate.mjs');
    const multiscale = read('scripts/fonts/render_um_sans_2_manual_multiscale.mjs');
    expect(glyphReview).toContain("import { missingCodepoints } from './ttf_cmap.mjs'");
    expect(glyphReview).toContain('Glyph review refuses fallback rendering');
    expect(visualGate).toContain('Visual gate refuses fallback rendering');
    expect(multiscale).toContain('Multiscale proof refuses fallback rendering');
    expect(multiscale).toContain('390px CSS width at 3x raster');
    expect(multiscale).toContain('A4 portrait at 300 dpi');
    expect(read('type/um-sans-2/docs/CORE-GLYPH-REVIEW.md')).toMatch(/Alpha 14[\s\S]*Rechazada/i);
    expect(read('type/um-sans-2/docs/PRODUCTION-MAP.md')).toMatch(/Latin Extended-A/);
  });
});
