const fs = require('fs');
const path = require('path');

const root = process.cwd();
const rejectedDir = path.join(root, 'public/fonts/um-sans-2');
const displayDir = path.join(root, 'public/fonts/um-sans-2-display');

describe('UM Sans 2 prototype quarantine', () => {
  test('keeps the full experimental family explicitly rejected', () => {
    const report = JSON.parse(fs.readFileSync(path.join(rejectedDir, 'build-report.json'), 'utf8'));
    const provenance = JSON.parse(fs.readFileSync(path.join(rejectedDir, 'provenance.json'), 'utf8'));

    expect(report.visualStatus).toMatch(/^blocked:/);
    expect(report.variables).toEqual([]);
    expect(report.variableStatus).toMatch(/^blocked:/);
    expect(provenance.status).toBe('rejected-outline prototype');
    expect(provenance.variableExport.status).toBe('blocked');
    expect(fs.existsSync(path.join(rejectedDir, 'UMSans2-2.0-Original-Beta.zip'))).toBe(false);
  });

  test('does not load rejected binaries in the website or specimen', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/v4.css'), 'utf8');
    const page = fs.readFileSync(path.join(root, 'src/pages/estilo/um-sans.astro'), 'utf8');

    expect(css).not.toContain("url('/fonts/um-sans-2/UMSans2-");
    expect(page).not.toContain("url('/fonts/um-sans-2/UMSans2-");
    expect(page).not.toContain('UMSans2-Variable');
    expect(page).not.toContain('fontVariationSettings');
  });
});

describe('UM Sans 2 Display quarantine', () => {
  test('quarantines the rejected 2.1 candidate from all visible runtime roles', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/v4.css'), 'utf8');
    const layout = fs.readFileSync(path.join(root, 'src/layouts/LayoutV4.astro'), 'utf8');
    const page = fs.readFileSync(path.join(root, 'src/pages/estilo/um-sans.astro'), 'utf8');
    const candidate = path.join(root, 'docs/typography/rejected-artifacts/um-sans-2.1-candidate');
    const report = JSON.parse(fs.readFileSync(path.join(candidate, 'candidate-report.json'), 'utf8'));

    expect(layout).not.toContain("Astro.url.searchParams.get('font')");
    expect(layout).not.toContain('data-font-preview');
    expect(css).not.toContain("data-font-preview='um-sans-2'");
    expect(css).not.toContain("font-family: 'UM Sans 2 Candidate'");
    expect(css).not.toContain('/fonts/um-sans-2-candidate/');
    expect(css).toContain('--um-font-impact: var(--um-font-editorial)');
    expect(page).toContain('id="candidata"');
    expect(page).toContain('UM Sans 2.1.<br />No aprobada.');
    expect(page).not.toContain('/?font=um-sans-2');
    expect(page).not.toContain("'UM Sans 2 Candidate'");
    expect(fs.existsSync(path.join(root, 'public/fonts/um-sans-2-candidate'))).toBe(false);
    expect(report).toMatchObject({
      version: '2.1',
      status: 'rejected-after-human-visual-review',
      approvedUse: 'none',
      productionUse: false,
    });
    expect(fs.statSync(path.join(candidate, 'UMSans2Display-ExtraBold.woff2')).size).toBeGreaterThan(5_000);
  });

  test('records the structural pass and visual failure without approving use', () => {
    const build = JSON.parse(fs.readFileSync(path.join(displayDir, 'build-report.json'), 'utf8'));
    const qa = JSON.parse(fs.readFileSync(path.join(displayDir, 'qa-report.json'), 'utf8'));

    expect(build.family).toBe('UM Sans 2 Display');
    expect(build.status).toBe('blocked after visual review');
    expect(build.visualStatus).toMatch(/^failed:/);
    expect(build.approvedUse).toBe('none');
    expect(build.prohibitedUse).toMatch(/all website/);
    expect(qa.status).toBe('structural-pass-visual-fail');
    expect(qa.visualStatus).toMatch(/^blocked:/);
    expect(fs.existsSync(path.join(displayDir, 'BLOCKED.md'))).toBe(true);
  });

  test('documents a complete specimen and separates display from text roles', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/estilo/um-sans.astro'), 'utf8');

    for (const section of [
      'id="familia"', 'id="laboratorio"', 'id="combinaciones"',
      'id="contextos"', 'id="numerales"', 'id="lectura"',
      'id="responsive"', 'id="kerning"',
      'id="opentype"', 'id="repertorio"', 'id="escala"', 'id="entrega"',
    ]) {
      expect(page).toContain(section);
    }
    expect(page).toContain('familia editorial verificada');
    expect(page).toContain('falló ese gate y permanece bloqueado');
    expect(page).toContain('UM Sans Text 1.2');
    expect(page).toContain("font-family: var(--um-font-body, 'UM Sans', Arial, sans-serif)");
    expect(page).not.toContain('/fonts/um-sans-2-display/specimen.html');
  });

  test('uses only the stable editorial family at runtime', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/v4.css'), 'utf8');
    const layout = fs.readFileSync(path.join(root, 'src/layouts/LayoutV4.astro'), 'utf8');

    expect(css).not.toContain("font-family: 'UM Sans 2 Display'");
    expect(css).toContain('--um-font-impact: var(--um-font-editorial)');
    expect(css).toContain('--um-font-display: var(--um-font-editorial)');
    expect(css).toContain('--um-font-body: var(--um-font-editorial)');
    expect(css).toContain('body main :where(h1, .um-heading-xl, .hero-title, .page-title):not(.ums2 *)');
    expect(css).toContain('body main :where(h2, .um-heading-lg, .section-title):not(.ums2 *)');
    expect(css).toMatch(/body main :where\(h2,[\s\S]*?font-family: var\(--um-font-body\) !important;/);
    expect(css).toContain('UMSans-Variable.woff2?v=1.2.0-production');
    expect(layout).not.toContain('UMSans2Display-Bold.woff2');
    expect(layout).toContain('data-font-system="um-sans-editorial-1.2"');
    expect(layout).not.toContain('/fonts/um-sans-2/');
  });

  test('portable prototype page is a noindex quarantine notice with no font loading', () => {
    const portable = fs.readFileSync(path.join(displayDir, 'specimen.html'), 'utf8');

    expect(portable).toContain('noindex, nofollow, noarchive');
    expect(portable).toContain('Este prototipo no es una tipografía aprobada.');
    expect(portable).toContain('structural-pass / visual-fail');
    expect(portable).not.toContain('@font-face');
    expect(portable).not.toContain('UMSans2Display-');
  });

  test('visual gate rejects residual references to the blocked family', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/v4.css'), 'utf8');
    const audit = fs.readFileSync(path.join(root, 'scripts/visual-contrast-audit.mjs'), 'utf8');
    const page = fs.readFileSync(path.join(root, 'src/pages/estilo/um-sans.astro'), 'utf8');

    expect(css).toContain('font-family: var(--um-font-body) !important;');
    expect(audit).toContain("tag === 'h1' ||");
    expect(audit).toContain("measureFont('\"UM Sans\", monospace', 800");
    expect(audit).toContain('/UM Sans 2(?: Display| Candidate)?/i.test(getComputedStyle(element).fontFamily)');
    expect(audit).toContain('Blocked unapproved UM Sans 2 reference');
    expect(page).toContain('.ums2 :is(h2, h3)');
    expect(page).toContain('.ums2-context--marketing h3');
    expect(page).toContain('font-kerning: normal');
  });

  test('builder remains independent from third-party outline sources', () => {
    const builder = fs.readFileSync(path.join(root, 'scripts/fonts/build_um_sans_2.py'), 'utf8');
    const displayBuilder = fs.readFileSync(path.join(root, 'scripts/fonts/build_um_sans_2_display.py'), 'utf8');

    expect(builder).toContain('from independent geometric sources');
    expect(displayBuilder).toContain('blocked UM Sans 2 Display drawing experiment');
    expect(displayBuilder).toContain('"approvedUse": "none"');
    expect(builder).not.toMatch(/TTFont\([^)]*Inter/i);
    expect(displayBuilder).not.toMatch(/TTFont\([^)]*Inter/i);
  });
});
