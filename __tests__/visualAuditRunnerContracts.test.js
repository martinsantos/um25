const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Visual audit runner contracts', () => {
  test('commercial strict runner retries transient CDP navigation failures before reporting empty pages', () => {
    const source = read('scripts/run-commercial-visual-audit.mjs');
    const visualAudit = read('scripts/visual-contrast-audit.mjs');

    expect(source).toContain('MAX_CHUNK_ATTEMPTS');
    expect(source).toContain("VISUAL_AUDIT_CHUNK_ATTEMPTS || 3");
    expect(source).toContain('VISUAL_AUDIT_E2E_LABEL_FILTER');
    expect(source).toContain('COMMERCIAL_E2E_LABELS.filter((label) => LABEL_FILTER.test(label))');
    expect(source).toContain('replicaEnvDefaults');
    expect(source).toContain("UMSA_LOCAL_REPLICA: '1'");
    expect(source).toContain("UMSA_REPLICA_IDENTICAL: '1'");
    expect(source).toContain('CHUNK_TIMEOUT_MS');
    expect(source).toContain('ROUTES_PER_BATCH');
    expect(source).toContain('VISUAL_AUDIT_ROUTES_PER_BATCH || 6');
    expect(source).toContain("VISUAL_AUDIT_CHUNK_TIMEOUT_MS || 180000");
    expect(source).toContain('isTransientAuditFailure');
    expect(source).toContain('runViewportWithRetry');
    expect(source).toContain('buildRouteLabelFilter');
    expect(source).toContain('Emulation\\.setUserAgentOverride');
    expect(source).toMatch(/CDP timeout/);
    expect(source).toMatch(/chunk timeout after/);
    expect(source).toMatch(/child\.kill\('SIGKILL'\)/);
    expect(source).toContain("VISUAL_AUDIT_CDP_TIMEOUT_MS: process.env.VISUAL_AUDIT_CDP_TIMEOUT_MS || '60000'");
    expect(source).toContain("VISUAL_AUDIT_ROUTE_TIMEOUT_MS: process.env.VISUAL_AUDIT_ROUTE_TIMEOUT_MS || '120000'");
    expect(source).toMatch(/page appears too empty/);
    expect(visualAudit).toContain('cleanupAuditChrome');
    expect(visualAudit).toContain('/tmp/umsa-visual-audit-${port}');
    expect(visualAudit).toContain("pkill");
    expect(visualAudit).toContain("targets.some((target) => target.type === 'page')");
    expect(visualAudit).toContain("Network.setCacheDisabled");
    expect(visualAudit).toContain("Storage.clearDataForOrigin");
    expect(visualAudit).toContain("storageTypes: 'service_workers,cache_storage'");

    const finalLoop = source.slice(source.indexOf('for (const viewport of viewports)'));
    expect(finalLoop).toMatch(/for \(let index = 0; index < commercialRoutes\.length; index \+= ROUTES_PER_BATCH\)/);
    expect(finalLoop).toMatch(/const chunk = await runViewportWithRetry\(viewport, labels\);/);
    expect(finalLoop).not.toMatch(/for \(const label of commercialRoutes\)/);
    expect(finalLoop).not.toMatch(/const chunk = await runViewport\(viewport\);/);
  });

  test('commercial visual matrix includes blog category routes in automated gates', () => {
    const labels = read('scripts/e2e-commercial-labels.mjs');
    const visualAudit = read('scripts/visual-contrast-audit.mjs');
    const snapshots = read('scripts/capture-visual-snapshots.mjs');

    expect(labels).toContain("'blog categoria default'");
    expect(labels).toContain("'/blog/categoria/tecnico'");
    expect(visualAudit).toContain("{ path: '/blog/categoria/tecnico', label: 'blog categoria default' }");
    expect(visualAudit).toContain("'blog categoria default'");
    expect(snapshots).toContain("{ path: '/blog/categoria/tecnico', label: 'blog-categoria-default' }");
  });

  test('public certification page is covered by visual gates because it is linked from the commercial footer', () => {
    const labels = read('scripts/e2e-commercial-labels.mjs');
    const visualAudit = read('scripts/visual-contrast-audit.mjs');
    const snapshots = read('scripts/capture-visual-snapshots.mjs');
    const footer = read('src/components/v4/FooterV4.astro');

    expect(footer).toContain("href: '/certificaciones'");
    expect(labels).toContain("'certificaciones default'");
    expect(labels).toContain("'/certificaciones'");
    expect(visualAudit).toContain("{ path: '/certificaciones', label: 'certificaciones default', requiresFirstViewportCta: true }");
    expect(visualAudit).toContain("'certificaciones default'");
    expect(snapshots).toContain("{ path: '/certificaciones', label: 'certificaciones-default' }");
  });

  test('heuristic visual scanner recognizes documentation requests as commercial CTAs', () => {
    const heuristic = read('scripts/heuristic-visual-scan.mjs');

    expect(heuristic).toMatch(/documentaci/);
    expect(heuristic).toContain('cleanupHeuristicChrome');
    expect(heuristic).toContain('HEURISTIC_ROUTE_ATTEMPTS');
    expect(heuristic).toContain('cdpRetry');
    expect(heuristic).toContain('Retrying heuristic probe');
  });

  test('footer legal utility pages are included in broad visual audit and snapshots', () => {
    const visualAudit = read('scripts/visual-contrast-audit.mjs');
    const snapshots = read('scripts/capture-visual-snapshots.mjs');

    expect(visualAudit).toContain("{ path: '/privacidad', label: 'legal privacidad' }");
    expect(visualAudit).toContain("{ path: '/terminos', label: 'legal terminos' }");
    expect(snapshots).toContain("{ path: '/privacidad', label: 'legal-privacidad' }");
    expect(snapshots).toContain("{ path: '/terminos', label: 'legal-terminos' }");
  });

  test('visual audit ignores deliberate horizontal rails when the page itself does not overflow', () => {
    const visualAudit = read('scripts/visual-contrast-audit.mjs');

    expect(visualAudit).toContain('isInsideIntentionalHorizontalScroller');
    expect(visualAudit).toContain('ignoredHorizontalScroller');
    expect(visualAudit).toContain("'.sector-editorial__market-links'");
    expect(visualAudit).toMatch(/node\.scrollWidth > node\.clientWidth \+ 1/);
    expect(visualAudit).toMatch(/!item\.ignoredHorizontalScroller/);
  });

  test('strict visual audit proves sticky information hubs have parseable opaque backgrounds', () => {
    const visualAudit = read('scripts/visual-contrast-audit.mjs');

    expect(visualAudit).toContain('rgba?\\\\(');
    expect(visualAudit).toContain('color\\\\(srgb');
    expect(visualAudit).toContain('Math.round(Number(srgb[1]) * 255)');
    expect(visualAudit).toMatch(/item\.backgroundAlpha == null \|\| item\.backgroundAlpha < 1/);
    expect(visualAudit).toContain("'antecedentes default'");
    expect(visualAudit).toContain("'sectores default'");
    expect(visualAudit).toContain('sticky filter lacks stable background');
  });

  test('audit permits a governed 800 exception while the public H1 token stays at 700', () => {
    const visualAudit = read('scripts/visual-contrast-audit.mjs');
    const home = read('src/pages/index.astro');
    const v4Css = read('src/styles/v4.css');

    expect(home).toContain('class="um-display-emphasis"');
    expect(v4Css).toContain('--um-hero-weight: 700');
    expect(visualAudit).toContain("element.classList.contains('um-display-emphasis')");
    expect(visualAudit).toContain("const maxWeight = tag === 'h1' ? 800 : 700");
    expect(visualAudit).toContain('fontWeight) > 800');
    expect(visualAudit).toContain("measureFont('\"UM Sans\", monospace', 800");
    expect(visualAudit).toContain("tag === 'h1' ||");
  });

  test('the typography specimen may prove extended weights without relaxing public routes', () => {
    const visualAudit = read('scripts/visual-contrast-audit.mjs');

    expect(visualAudit).toContain("label: 'um sans portfolio'");
    expect(visualAudit).toContain('allowSpecimenStructure: true');
    expect(visualAudit).toContain('allowSpecimenStructure: route.allowSpecimenStructure === true');
    expect(visualAudit).toContain('!result.allowSpecimenStructure && result.heavyCount > 0');
    expect(visualAudit).toContain('!result.allowSpecimenStructure && (result.borderNoiseCount || 0) > 12');
  });

  test('core web vitals gate returns a deterministic process verdict after CDP cleanup', () => {
    const vitalsAudit = read('scripts/core-web-vitals-audit.mjs');

    expect(vitalsAudit).toContain("chrome.kill('SIGKILL')");
    expect(vitalsAudit).toContain('cleanupChrome()');
    expect(vitalsAudit).toContain('process.exit(failures.length > 0 ? 1 : 0)');
  });
});
