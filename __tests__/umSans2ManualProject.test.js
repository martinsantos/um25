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
    expect(read('type/um-sans-2/README.md')).toMatch(/Alpha 7/i);
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
    expect(route).toContain('UMSans2ManualAlpha7-DisplayBold.otf?v=0.800');

    const globalRuntime = [
      'src/styles/v4.css',
      'src/styles/global.css',
      'src/layouts/LayoutV4.astro',
    ].map(read).join('\n');
    expect(globalRuntime).not.toContain('UM Sans 2 Manual Alpha 7');
    expect(globalRuntime).not.toContain('um-sans-2-manual-alpha');
  });

  test('marks generated web artifacts as non-production', () => {
    const marker = read('public/fonts/um-sans-2-manual-alpha/DO-NOT-SHIP.md');
    const report = JSON.parse(read('public/fonts/um-sans-2-manual-alpha/build-report.json'));
    expect(marker).toMatch(/Do not/i);
    expect(report.productionUse).toBe(false);
    expect(report.approvedUse).toBe('noindex specimen only');
  });

  test('requires the human-reviewed raster baseline to pass at every size', () => {
    const report = JSON.parse(read('public/fonts/um-sans-2-manual-alpha/visual-gate-report.json'));
    expect(report.status).toBe('PASS');
    expect(report.baselineReview).toBe('human-reviewed-and-locked');
    expect(report.rasterSizes).toEqual([16, 20, 24, 30, 32, 48, 72]);
    expect(report.sizes).toHaveLength(7);
    for (const size of report.sizes) {
      expect(size.inkComponents).toBe(1);
      expect(size.counterAreas).toHaveLength(1);
      expect(size.apertureOpenRows).toBeGreaterThan(0);
      expect(size.controlRasterSha256).toBe(size.approvedSha256);
    }
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
    const visualGate = read('scripts/fonts/audit_um_sans_2_manual_visual.mjs');
    expect(route).toContain('const rasterSizes = [16, 20, 24, 30, 32, 48, 72]');
    expect(route).toContain('La forma debe sobrevivir a cada escala.');
    expect(route).toContain('release bloqueada');
    expect(visualGate).toContain('export const RASTER_SIZES = [16, 20, 24, 30, 32, 48, 72]');
    expect(visualGate).toContain('Fibra certificada, operación continua.');
    expect(visualGate).toContain('e aperture is too narrow');
    expect(visualGate).toContain('Visual regression');
    expect(visualGate).toContain('pending-human-review');
    expect(audit).toMatch(/RELEASE REJECTED/i);
    expect(audit).toMatch(/FontBakery still reports six intrinsic release failures/i);
  });
});
