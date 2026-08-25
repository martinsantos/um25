const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const criticalPageSources = [
  'src/pages/index.astro',
  'src/pages/servicios/index.astro',
  'src/pages/servicios/[id]/[slug].astro',
  'src/pages/sectores.astro',
  'src/pages/[sector].astro',
  'src/pages/antecedentes/index.astro',
  'src/pages/antecedentes/[id]/[slug].astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/categoria/[cat].astro',
  'src/pages/blog/[slug].astro',
  'src/pages/nosotros.astro',
  'src/pages/certificaciones.astro',
  'src/pages/contacto.astro',
  'src/pages/en/index.astro',
  'src/pages/en/services.astro',
  'src/pages/en/about.astro',
  'src/pages/en/contacto.astro',
  'src/pages/geo/index.astro',
  'src/pages/servicios-it-empresas-mendoza.astro',
  'src/pages/servicios-it-empresas-argentina.astro',
  'src/pages/presupuesto-servicios-it-empresas.astro',
  'src/pages/proyectos-ingenieria-it-mendoza.astro',
];

describe('UM Sans 1.2 global website adoption', () => {
  test('keeps one production font contract in the canonical layout and stylesheet', () => {
    const layout = read('src/layouts/LayoutV4.astro');
    const css = read('src/styles/v4.css');
    const runtime = `${layout}\n${css}`;

    expect(layout).toContain('data-font-system="um-sans-editorial-1.2"');
    expect(layout).toContain('/fonts/um-sans/UMSans-Variable.woff2?v=1.2.0-production');
    expect(css).toContain('/fonts/um-sans/UMSans-VariableItalic.woff2?v=1.2.0-production');
    expect(css).toContain("--um-font-editorial: 'UM Sans', 'UM Sans Fallback', Arial, system-ui, sans-serif");
    expect(css).toContain('--um-font-display: var(--um-font-editorial)');
    expect(css).toContain('--um-font-body: var(--um-font-editorial)');
    expect(css).toContain('--um-font-ui: var(--um-font-editorial)');
    expect(runtime).not.toMatch(/url\(['"]?\/fonts\/um-sans-2/i);
    expect(runtime).not.toMatch(/font-family:\s*['"]UM Sans 2/i);
  });

  test.each(criticalPageSources)('%s inherits the canonical LayoutV4 font system', (relativePath) => {
    const page = read(relativePath);

    expect(page).toMatch(/import\s+LayoutV4\s+from\s+['"][^'"]*LayoutV4\.astro['"]/);
    expect(page).toContain('<LayoutV4');
    expect(page).not.toMatch(/UMSans2|um-sans-2|UM Sans 2(?: Display| Candidate| Manual)/);
  });

  test('keeps the local total-site sample private while the delivery route stays public', () => {
    const sample = read('src/pages/estilo/muestra.astro');
    const delivery = read('src/pages/estilo/fuente.astro');
    const specimen = read('src/pages/estilo/um-sans.astro');
    const seoHead = read('src/components/SEO/SEOHead.astro');
    const layout = read('src/layouts/LayoutV4.astro');

    expect(sample).toContain('noindex={true}');
    expect(sample).toContain('UM Sans 1.2 Production');
    expect(sample).not.toMatch(/UMSans2|um-sans-2|UM Sans 2/);
    expect(layout.match(/<main\b/g)).toHaveLength(1);
    expect(sample).not.toMatch(/<main\b/);
    expect(sample).not.toContain('id="main-content"');
    expect(delivery).toContain('<UMSans publicRoute />');
    expect(specimen).toContain('noindex={!isPublicRoute}');
    expect(specimen).toContain("Astro.url.pathname === '/estilo/fuente'");
    expect(seoHead).toContain("noindex ? 'noindex, nofollow' : 'index, follow");
  });

  test('keeps both review landmarks in the runtime visual matrix', () => {
    const visualAudit = read('scripts/visual-contrast-audit.mjs');

    expect(visualAudit).toContain("path: '/estilo/muestra'");
    expect(visualAudit).toContain("label: 'um sans total site sample'");
    expect(visualAudit).toContain("path: '/estilo/fuente'");
    expect(visualAudit).toContain("label: 'um sans delivery'");
    expect(visualAudit).toContain("document.fonts.check('16px \"UM Sans\"')");
    expect(visualAudit).toContain('document.documentElement.scrollWidth > window.innerWidth + 1');
  });

  test('redirects fictional legacy case URLs into the verified evidence archive', () => {
    const legacyCases = read('src/pages/casos/[slug].astro');

    expect(legacyCases).toContain("'transformacion-digital-retail'");
    expect(legacyCases).toContain("'seguridad-financiera'");
    expect(legacyCases).toContain("'cloud-manufacturing'");
    expect(legacyCases).toContain("Astro.redirect('/antecedentes', 301)");
    expect(legacyCases).toContain("Astro.rewrite('/404')");
  });
});
