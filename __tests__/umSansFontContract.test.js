const fs = require('fs');
const path = require('path');

const root = process.cwd();
const fontDir = path.join(root, 'public/fonts/um-sans');
const report = JSON.parse(fs.readFileSync(path.join(fontDir, 'build-report.json'), 'utf8'));
const qaReport = JSON.parse(fs.readFileSync(path.join(fontDir, 'qa-report.json'), 'utf8'));
const fontbakeryReport = JSON.parse(fs.readFileSync(path.join(fontDir, 'fontbakery-report.json'), 'utf8'));
const releaseManifest = JSON.parse(fs.readFileSync(path.join(fontDir, 'release-manifest.json'), 'utf8'));

const weights = [
  ['Thin', 'ThinItalic'],
  ['ExtraLight', 'ExtraLightItalic'],
  ['Light', 'LightItalic'],
  ['Regular', 'Italic'],
  ['Medium', 'MediumItalic'],
  ['SemiBold', 'SemiBoldItalic'],
  ['Bold', 'BoldItalic'],
  ['ExtraBold', 'ExtraBoldItalic'],
  ['Black', 'BlackItalic'],
];

describe('UM Sans 1.2 definitive clean family', () => {
  test('ships 18 static styles and two variable fonts', () => {
    for (const [roman, italic] of weights) {
      for (const style of [roman, italic]) {
        for (const format of ['ttf', 'otf', 'woff2']) {
          const file = path.join(fontDir, `UMSans-${style}.${format}`);
          expect(fs.existsSync(file)).toBe(true);
          expect(fs.statSync(file).size).toBeGreaterThan(40_000);
        }
      }
    }

    for (const style of ['Variable', 'VariableItalic']) {
      for (const format of ['ttf', 'woff2']) {
        const file = path.join(fontDir, `UMSans-${style}.${format}`);
        expect(fs.existsSync(file)).toBe(true);
        expect(fs.statSync(file).size).toBeGreaterThan(150_000);
      }
    }

    expect(report).toMatchObject({
      family: 'UM Sans',
      versionLabel: '1.2 Production',
      staticStyles: 18,
      variableStyles: 2,
    });
    expect(report.files).toHaveLength(58);
    expect(report.profiles).toHaveLength(18);
    expect(report.variables).toHaveLength(2);
  });

  test('governs nine weights, genuine italics and optical variables', () => {
    const roman = report.profiles.filter((profile) => !profile.italic);
    const italic = report.profiles.filter((profile) => profile.italic);
    expect(roman.map((profile) => profile.cssWeight)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    expect(italic.map((profile) => profile.cssWeight)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);

    for (const variable of report.variables) {
      expect(variable.axes).toEqual({ opsz: [14, 32], wght: [100, 900] });
      expect(variable.namedInstances).toBe(9);
      expect(variable.customKerningPairs).toBe(0);
      expect(variable.defaultAlternates).toBe(0);
      expect(variable.lowercaseL).toMatchObject({
        glyph: 'l',
        policy: 'upstream contour preserved',
      });
      expect(variable.editorialFeatures).toEqual(expect.arrayContaining([
        'calt', 'frac', 'locl', 'ordn', 'ss01', 'ss08', 'sups', 'tnum', 'zero',
      ]));
    }

    for (const profile of report.profiles) {
      expect(profile.sidebearingGuard.policy).toBe('upstream metrics preserved');
      expect(profile.hinting.instructedGlyphs).toBeGreaterThanOrEqual(1700);
      expect(profile.hinting.tables).toEqual(['cvt ', 'fpgm', 'prep']);
    }
  });

  test('passes the structural, shaping, raster and installation release gate', () => {
    expect(qaReport).toMatchObject({
      family: 'UM Sans',
      version: '1.2 Production',
      status: 'pass',
      checkedFiles: 58,
      staticFiles: 54,
      variableFiles: 4,
      failures: [],
    });
    expect(Object.values(qaReport.buildContract).every(Boolean)).toBe(true);
    expect(qaReport.shaping.passes).toBe(true);
    expect(Object.keys(qaReport.shaping.styles)).toHaveLength(18);
    expect(Object.values(qaReport.shaping.styles).every((style) => style.passes)).toBe(true);
    expect(qaReport.rasterization).toMatchObject({ available: true, passes: true });
    expect(qaReport.rasterization.checks).toHaveLength(54);
    expect(qaReport.desktopInstall).toMatchObject({ available: true, passes: true });
    expect(qaReport.desktopInstall.checks).toHaveLength(36);
    expect(qaReport.marketDelivery).toMatchObject({ passes: true, failed: [] });
    expect(Object.values(qaReport.marketDelivery.checks).every(Boolean)).toBe(true);
    expect(qaReport.archive).toMatchObject({ exists: true, passes: true, missing: [] });

    for (const font of qaReport.files) {
      expect(Object.values(font.checks).every(Boolean)).toBe(true);
    }
    for (const font of qaReport.variables) {
      expect(Object.values(font.checks).every(Boolean)).toBe(true);
      expect(font.cornerChecks).toHaveLength(8);
    }
  });

  test('passes the contour-equivalence and no-fallback optical gate', () => {
    const opticalAudit = JSON.parse(
      fs.readFileSync(path.join(fontDir, 'optical-audit.json'), 'utf8'),
    );
    expect(report.cleanOutlines).toBe(true);
    expect(report.outlinePolicy).toBe('upstream-contour-equivalent');
    expect(opticalAudit).toMatchObject({
      status: 'pass',
      policy: 'upstream-contour-equivalent',
      failures: [],
      details: {
        roman: { shape: 'pass' },
        italic: { shape: 'pass' },
      },
    });
  });

  test('passes FontBakery without fatal, error or fail results', () => {
    expect(fontbakeryReport.result).toMatchObject({
      '(not finished)': 0,
      PASS: expect.any(Number),
    });
    expect(fontbakeryReport.result.PASS).toBeGreaterThan(1500);
    expect(fontbakeryReport.result.ERROR || 0).toBe(0);
    expect(fontbakeryReport.result.FATAL || 0).toBe(0);
    expect(fontbakeryReport.result.FAIL || 0).toBe(0);
  });

  test('ships a reproducible browser PDF embedding gate', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const pdfAudit = fs.readFileSync(path.join(root, 'scripts/fonts/audit_um_sans_pdf.sh'), 'utf8');

    expect(packageJson.scripts['fonts:audit:um-sans:pdf']).toBe('scripts/fonts/audit_um_sans_pdf.sh');
    expect(packageJson.scripts['fonts:release:um-sans']).toContain('fonts:audit:um-sans:pdf');
    expect(pdfAudit).toContain('--print-to-pdf="$OUT"');
    expect(pdfAudit).toContain('public/fonts/um-sans/specimen-audit.pdf');
    expect(pdfAudit).toContain("grep -q 'UMSans-Variable'");
    expect(pdfAudit).toContain("grep -q 'UMSans-VariableItalic'");
    expect(pdfAudit).toContain("grep -Eq 'Poppins|OpenSans|Arial'");
  });

  test('is licensed and reproducible from pinned upstream sources', () => {
    const builder = fs.readFileSync(path.join(root, 'scripts/fonts/build_um_sans.py'), 'utf8');
    const fetcher = fs.readFileSync(path.join(root, 'scripts/fonts/fetch_um_sans_sources.py'), 'utf8');
    const packager = fs.readFileSync(path.join(root, 'scripts/fonts/package_um_sans.py'), 'utf8');
    const spec = fs.readFileSync(path.join(root, 'docs/typography/UM-SANS-SPEC.md'), 'utf8');
    const archive = path.join(fontDir, 'UMSans-1.2-Production.zip');

    expect(fs.existsSync(path.join(fontDir, 'OFL-1.1.txt'))).toBe(true);
    expect(fs.existsSync(archive)).toBe(true);
    expect(fs.statSync(archive).size).toBeGreaterThan(1_000_000);
    expect(builder).toContain('FONT_TIMESTAMP = 3_866_745_600');
    expect(packager).toContain('ZIP_TIMESTAMP = (2026, 7, 13, 0, 0, 0)');
    expect(packager).toContain('zipfile.ZipInfo(arcname, ZIP_TIMESTAMP)');
    expect(fetcher).toContain('googleFontsCommit');
    expect(fetcher).toContain('sha256');
    expect(report.source.googleFontsCommit).toHaveLength(40);
    expect(spec).toContain('Inter 4.001');
    expect(spec).toContain('SIL Open Font License 1.1');
    expect(spec).toContain('nueve pesos en romano y cursiva genuina');
    expect(report.provenance).toMatchObject({
      classification: 'Modified OFL derivative',
      upstream: 'Inter 4.001',
      independentOutlineCopyright: false,
    });
  });

  test('ships a commercial-style package with legal, source and QA evidence', () => {
    const checksums = fs.readFileSync(path.join(fontDir, 'CHECKSUMS.sha256'), 'utf8');
    const packageDocs = [
      'README.md', 'INSTALL.md', 'LICENSE-GUIDE.md', 'EULA-NOTICE.md',
      'OPENTYPE-FEATURES.md', 'LANGUAGES.md', 'SOURCE-AND-BUILD.md',
      'SUPPORT.md', 'TRADEMARK.md', 'MARKET-DELIVERABLES.md',
      'ORIGINALITY-ROADMAP.md', 'QA-NOTES.md', 'COMPATIBILITY-MATRIX.md',
      'RELEASE-CHECKLIST.md', 'FAMILY-NAMING.md', 'DESIGN-QA-PROTOCOL.md',
      'FONT-METRICS.md', 'VERSIONING.md', 'UM-SANS-2.0-ORIGINAL-BRIEF.md',
      'ACCESSIBILITY-READABILITY.md', 'EMBEDDING-AND-CHANNELS.md',
      'PROCUREMENT-DATASHEET.md', 'MIGRATION-GUIDE.md', 'KNOWN-ISSUES.md',
      'PRINT-PDF-GUIDE.md', 'VARIABLE-MODEL.md',
      'SUPPLY-CHAIN-PROVENANCE.md', 'FORMAT-SUPPORT-POLICY.md',
    ];

    expect(releaseManifest).toMatchObject({
      family: 'UM Sans',
      version: '1.2 Production',
      license: 'SIL Open Font License 1.1',
      classification: 'Modified OFL derivative of Inter 4.001',
      staticStyles: 18,
      variableStyles: 2,
      webKits: ['variable', 'static', 'latin-core-variable', 'metric-fallback'],
    });
    expect(releaseManifest.files.length).toBeGreaterThanOrEqual(100);
    expect(checksums).toContain('Desktop/OTF/UMSans-Regular.otf');
    expect(checksums).toContain('Variable/UMSans-Variable.ttf');
    expect(checksums).toContain('QA/fontbakery-report.json');
    expect(checksums).toContain('Web/Subset/UMSans-Variable-LatinCore.woff2');
    expect(checksums).toContain('Metadata/family-metadata.json');
    for (const name of packageDocs) {
      expect(fs.existsSync(path.join(root, 'docs/typography/release', name))).toBe(true);
      expect(releaseManifest.files.some((entry) => entry.path === `Documentation/${name}`)).toBe(true);
    }
  });

  test('ships production web kits, fallback metrics and machine-readable inventories', () => {
    const familyMetadata = JSON.parse(fs.readFileSync(path.join(fontDir, 'family-metadata.json'), 'utf8'));
    const unicodeCoverage = JSON.parse(fs.readFileSync(path.join(fontDir, 'unicode-coverage.json'), 'utf8'));
    const webManifest = JSON.parse(fs.readFileSync(path.join(fontDir, 'webfont-manifest.json'), 'utf8'));
    const binaryInventory = JSON.parse(fs.readFileSync(path.join(fontDir, 'binary-inventory.json'), 'utf8'));
    const variableModel = JSON.parse(fs.readFileSync(path.join(fontDir, 'variable-model.json'), 'utf8'));
    const embeddingRights = JSON.parse(fs.readFileSync(path.join(fontDir, 'embedding-rights.json'), 'utf8'));
    const nameTable = JSON.parse(fs.readFileSync(path.join(fontDir, 'name-table.json'), 'utf8'));
    const releaseProvenance = JSON.parse(fs.readFileSync(path.join(fontDir, 'release-provenance.json'), 'utf8'));
    const sbom = JSON.parse(fs.readFileSync(path.join(fontDir, 'sbom.spdx.json'), 'utf8'));
    const variableCss = fs.readFileSync(path.join(fontDir, 'um-sans-variable.css'), 'utf8');
    const latinCoreCss = fs.readFileSync(path.join(fontDir, 'um-sans-latin-core.css'), 'utf8');

    for (const file of [
      'um-sans.css', 'um-sans-variable.css', 'um-sans-static.css',
      'um-sans-latin-core.css', 'um-sans-fallback.css', 'character-set.txt',
      'glyph-order.txt', 'family-metadata.json', 'unicode-coverage.json',
      'webfont-manifest.json', 'binary-inventory.json', 'variable-model.json',
      'embedding-rights.json', 'name-table.json', 'release-provenance.json',
      'sbom.spdx.json',
    ]) {
      expect(fs.existsSync(path.join(fontDir, file))).toBe(true);
    }
    for (const file of ['UMSans-Variable-LatinCore.woff2', 'UMSans-VariableItalic-LatinCore.woff2']) {
      const subset = path.join(fontDir, 'subset', file);
      expect(fs.existsSync(subset)).toBe(true);
      expect(fs.statSync(subset).size).toBeGreaterThan(80_000);
    }

    expect(variableCss).toContain("url('./UMSans-Variable.woff2')");
    expect(variableCss).not.toContain('./WOFF2/');
    expect(variableCss).toContain('size-adjust: 112.33%');
    expect(variableCss).toContain('ascent-override: 86.24%');
    expect(latinCoreCss).toContain('unicode-range:');
    expect(familyMetadata).toMatchObject({
      family: 'UM Sans',
      version: '1.2 Production',
      classification: 'Modified OFL derivative of Inter 4.001',
      coverage: { characters: 1204, romanGlyphs: 1900, italicGlyphs: 1862 },
      web: { fallbackMetrics: { sizeAdjustPercent: 112.33 } },
    });
    expect(familyMetadata.provenance.independentOutlineCopyright).toBe(false);
    expect(unicodeCoverage.codepoints).toHaveLength(1204);
    expect(webManifest.kits).toMatchObject({
      fullVariable: 'um-sans-variable.css',
      static: 'um-sans-static.css',
      latinCoreVariable: 'um-sans-latin-core.css',
      metricFallback: 'um-sans-fallback.css',
    });
    expect(binaryInventory.files).toHaveLength(58);
    expect(binaryInventory.files.every((file) => file.sha256.length === 64)).toBe(true);
    expect(variableModel.models).toHaveLength(2);
    expect(variableModel.models.every((model) => model.namedInstances.length === 9)).toBe(true);
    expect(variableModel.models.every((model) => model.variationTables.includes('STAT'))).toBe(true);
    expect(embeddingRights).toMatchObject({
      allBinariesInstallable: true,
      technicalSetting: 'fsType 0 — Installable embedding',
    });
    expect(embeddingRights.files).toHaveLength(58);
    expect(nameTable.profiles).toHaveLength(20);
    expect(releaseProvenance.subjects).toHaveLength(58);
    expect(releaseProvenance.source.googleFontsCommit).toHaveLength(40);
    expect(releaseProvenance.attestation).toMatchObject({
      signed: false,
      status: 'Unsigned local build record',
    });
    expect(sbom).toMatchObject({
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
    });
    expect(sbom.packages).toHaveLength(2);
    expect(sbom.relationships).toContainEqual(expect.objectContaining({
      relationshipType: 'GENERATED_FROM',
    }));
  });

  test('keeps the stable editorial family documented while quarantining the malformed display cut', () => {
    const specimen = fs.readFileSync(path.join(root, 'src/pages/estilo/um-sans.astro'), 'utf8');
    const publicRoute = fs.readFileSync(path.join(root, 'src/pages/estilo/fuente.astro'), 'utf8');
    const design = fs.readFileSync(path.join(root, 'DESIGN.md'), 'utf8');
    const index = fs.readFileSync(path.join(root, 'docs/typography/README.md'), 'utf8');

    expect(specimen).toContain('noindex={!isPublicRoute}');
    expect(specimen).toContain("Astro.url.pathname === '/estilo/fuente'");
    expect(publicRoute).toContain("import UMSans from './um-sans.astro';");
    expect(publicRoute).toContain('<UMSans publicRoute />');
    expect(specimen).toContain('UM Sans · sistema tipográfico editorial');
    expect(specimen).toContain('prototipo Display original está retirado');
    expect(specimen).toContain('falló ese gate y permanece bloqueado');
    expect(specimen).toContain('Text verificada');
    expect(specimen).toContain('Probá tamaño y masa.');
    expect(specimen).toContain('Español completo.');
    expect(specimen).toContain('Qué existe. Qué falta.');
    expect(specimen).toContain('La web usa UM Sans Text 1.2 en todos los roles editoriales.');
    expect(specimen).toContain('no permite cursiva sintética');
    expect(specimen).toMatch(/\.ums2-composition--data strong \{[^}]*font-weight: 800;/);
    expect(specimen).not.toMatch(/\.ums2-composition--data strong \{[^}]*font-weight: 900;/);
    expect(specimen).not.toContain('UMSans2Display-Bold.woff2');
    expect(specimen).not.toContain("url('/fonts/um-sans-2/UMSans2-");
    expect(specimen).not.toContain('UMSans2-Variable');
    expect(specimen).not.toContain('fontVariationSettings');
    expect(design).toContain('## 16. Sistema tipografico UM Sans');
    expect(design).toContain('nueve pesos `100–900`');
    expect(index).toContain('18 estilos');
    expect(index).toContain('Variable cursiva');
  });

  test('integrates the variable family without changing the logo font', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/v4.css'), 'utf8');
    const layout = fs.readFileSync(path.join(root, 'src/layouts/LayoutV4.astro'), 'utf8');
    const visualAudit = fs.readFileSync(path.join(root, 'scripts/visual-contrast-audit.mjs'), 'utf8');

    expect(css).toContain('UMSans-Variable.woff2?v=1.2.0-production');
    expect(css).toContain('UMSans-VariableItalic.woff2?v=1.2.0-production');
    expect(css).toContain('font-weight: 100 900');
    expect(css).toContain('font-optical-sizing: auto');
    expect(css).toContain("--um-font-logo: 'Futura PT'");
    expect(css).toContain("font-family: 'UM Sans Fallback'");
    expect(css).toContain('size-adjust: 112.33%');
    expect(css).not.toContain('woff2-variations');
    expect(layout).toContain('UMSans-Variable.woff2?v=1.2.0-production');
    expect(layout).not.toContain('UMSans-SemiBold.woff2?v=1.0.0-rc');
    expect(layout).toContain('data-font-system="um-sans-editorial-1.2"');
    expect(visualAudit).toContain("result.fontSystem !== 'um-sans-editorial-1.2'");
  });
});
