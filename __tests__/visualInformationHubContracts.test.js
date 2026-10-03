const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function cssNumber(source, selector, property) {
  const block = source.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`));
  if (!block) return null;
  const declaration = block[1].match(new RegExp(`${property}\\s*:\\s*([0-9.]+)px`));
  return declaration ? Number(declaration[1]) : null;
}

function cssBlock(source, selector) {
  const block = source.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`));
  return block ? block[1] : '';
}

describe('Information hub visual contracts', () => {
  const sectorAtlas = read('src/components/templates/SectorTemplateAtlas.astro');
  const antecedentesEditorial = read('src/components/templates/AntecedentesTemplateEditorial.astro');
  const sectorUM26 = read('src/components/templates/SectorTemplateUM26.astro');
  const v4Css = read('src/styles/v4.css');

  test('global provider shell, typography and dark contrast remain canonical', () => {
    const layout = read('src/layouts/LayoutV4.astro');
    const navbar = read('src/components/v4/NavbarV4.astro');

    expect(v4Css).toContain('--um-container-wide: 1400px');
    expect(v4Css).toContain('--um-font-body: var(--um-font-editorial)');
    expect(v4Css).toContain('--um-hero-weight: 700');
    expect(v4Css).toContain('.um-page-shell');
    expect(v4Css).toMatch(/\.services-demo,[\s\S]*\.um26-evidence,[\s\S]*\.sectors-demo,[\s\S]*--skin-muted:\s*#c4c7cc;/i);
    expect(layout).not.toContain('fonts.googleapis.com');
    // Rediseño 2026-09: las etiquetas técnicas usan UM Sans (una sola familia en la UI);
    // la garantía es que el token mono siga resolviendo a la familia editorial canónica.
    expect(v4Css).toContain('--um-font-mono: var(--um-font-editorial)');
    expect(layout).not.toContain('family=Open+Sans');
    expect(layout).toMatch(/main :where\(h1, h2, h3, h4\)[\s\S]*overflow-wrap:\s*normal !important;/);
    expect(navbar).toMatch(/\.um-ops-container\s*\{[\s\S]*var\(--um-container-wide\)/);
    expect(navbar).toMatch(/\.um-ops-ticker\s*\{[\s\S]*display:\s*none;/);
    expect(navbar).not.toContain('class="um-ops-tag"');
    expect(navbar).not.toContain('class="um-ops-ticker"');
    expect(navbar).toContain('<a href="/contacto" class="um-ops-cta">');
    expect(navbar).toContain("document.addEventListener('astro:page-load', initOpsNavigation)");
    expect(navbar).toContain("menuToggle.dataset.bound = 'true'");
    // Rediseño 2026-09: el rótulo del menú móvil es un kicker de 13 px (mínimo del
    // sistema) y los enlaces del menú quedan en >= 17 px.
    expect(navbar).toContain('<p class="um-ops-mobile__label">');
    expect(navbar).toMatch(/\.um-ops-mobile__label\s*\{[^}]*font-size:\s*var\(--x-fs-kicker\);/);
    expect(navbar).toMatch(/\.um-ops-mobile__primary a\s*\{[^}]*font-size:\s*1\.625rem;/);
    expect(navbar).toMatch(/\.um-ops-mobile__secondary a\s*\{[^}]*font-size:\s*1\.0625rem;/);
    // Rediseño 2026-09: el menú móvil es una capa fija entre la cabecera y el
    // borde inferior (inset), con scroll propio: nunca excede el viewport.
    expect(navbar).toMatch(/\.um-ops-mobile\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*var\(--um-ops-header-h, 63px\) 0 0 0;[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/);
  });

  test('core commercial surfaces use the global provider density contract', () => {
    const home = read('src/pages/index.astro');
    const servicesIndex = read('src/pages/servicios/index.astro');
    const sectoresIndex = read('src/components/templates/SectorIndexUM26.astro');

    expect(home).toContain('Servicios IT para operaciones que no pueden detenerse.');
    expect(home).not.toContain('class="um26-hero__metric"');
    expect(home).not.toContain('class="um26-hero__shuffle"');
    expect(servicesIndex).toMatch(/\.services-demo-row\s*\{[\s\S]*min-height:\s*360px;/);
    expect(servicesIndex).toMatch(/\.services-demo-hero h1\s*\{[\s\S]*font-weight:\s*700;/);
    expect(servicesIndex).toMatch(/\.services-demo-body h2\s*\{[\s\S]*2\.375rem/);
    expect(servicesIndex).toMatch(/\.services-demo-body h2\s*\{[\s\S]*line-height:\s*1\.12;[\s\S]*overflow-wrap:\s*normal;/);
    expect(sectoresIndex).toMatch(/@media \(max-width:\s*980px\)[\s\S]*\.sectors-demo-hero h1\s*\{[\s\S]*overflow-wrap:\s*normal;/);
  });

  test('sectores abandons family language in the public hub template', () => {
    expect(sectorAtlas).not.toMatch(/\bfamilia(s)?\b/i);
    expect(sectorAtlas).toContain('Mercados operativos UMSA');
    expect(sectorAtlas).toContain('Mercados operativos, riesgo y evidencia.');
  });

  test('sector editorial index exposes a compact market filter without switching back to a table', () => {
    const sectorEditorial = read('src/components/templates/SectorTemplateEditorial.astro');
    const sectoresPage = read('src/pages/sectores.astro');

    expect(sectoresPage).toContain('sectorFilter={sectorFilter}');
    expect(sectoresPage).toContain('sectorFilterOptions={sectorFilterOptions}');
    expect(sectoresPage).toContain("gobiernosectorpublico: 'Gobierno'");
    expect(sectoresPage).toContain("'seguridad-electronica': 'Seguridad'");
    expect(sectorEditorial).toContain('sector-editorial__market-rail');
    expect(sectorEditorial).toContain('aria-label="Filtrar sectores por mercado operativo"');
    expect(sectorEditorial).toMatch(/visibleSectors = mode === 'index' && sectorFilter/);
    expect(sectorEditorial).toMatch(/\.sector-editorial__market-rail\s*\{[\s\S]*position:\s*sticky;/);
    expect(sectorEditorial).toMatch(/\.sector-editorial__market-links\s*\{[\s\S]*flex-wrap:\s*nowrap;/);
    expect(sectorEditorial).toMatch(/\.sector-editorial__market-rail\s*\{[\s\S]*mask-image:\s*linear-gradient\(90deg,\s*#000 0,\s*#000 calc\(100% - 42px\),\s*transparent 100%\)/);
    expect(sectorEditorial).toMatch(/\.sector-editorial__market-links\s*\{[\s\S]*padding-right:\s*clamp\(32px,\s*5vw,\s*72px\);/);
    expect(sectorEditorial).toMatch(/window\.matchMedia\('\(max-width: 720px\)'\)\.matches \? 'start' : 'nearest'/);
    expect(sectorEditorial).not.toMatch(/Sector\s+Necesidad operativa\s+Servicios aplicados\s+Archivo/);
  });

  test('sector filtered index presents a market dossier instead of isolated cards', () => {
    const sectorEditorial = read('src/components/templates/SectorTemplateEditorial.astro');

    expect(sectorEditorial).toContain('sector-editorial--filtered');
    expect(sectorEditorial).toContain('sector-editorial-feature__services');
    expect(sectorEditorial).toContain('Abrir dossier del sector');
    expect(sectorEditorial).toMatch(/\.sector-editorial--filtered \.sector-editorial__features\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(sectorEditorial).toMatch(/\.sector-editorial--filtered \.sector-editorial-feature\s*\{[\s\S]*grid-template-columns:\s*minmax\(320px,\s*0\.46fr\) minmax\(0,\s*0\.54fr\);/);
    expect(sectorEditorial).toMatch(/\.sector-editorial--filtered \.sector-editorial__actions\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  });

  test('sticky filters stay compact and editorial below the navigation', () => {
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-ledger__controls', 'top')).toBeGreaterThanOrEqual(72);
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-ledger__controls', 'top')).toBeLessThanOrEqual(88);
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__sector-rail', 'top')).toBeGreaterThanOrEqual(72);
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__sector-rail', 'top')).toBeLessThanOrEqual(88);
    expect(sectorAtlas).toMatch(/\.sector-atlas-exec-ledger__filters-links\s*\{[\s\S]*flex-wrap:\s*nowrap;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-links\s*\{[\s\S]*flex-wrap:\s*nowrap;/);
    expect(sectorAtlas).toMatch(/\.sector-atlas-exec-ledger__controls\s*\{[\s\S]*background:\s*var\(--skin-page, #fff\);/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__controls\s*\{[\s\S]*background:\s*var\(--ante-page\);/);
    expect(sectorAtlas).toMatch(/\.sector-atlas-exec-ledger__controls\s*\{[\s\S]*0 -1[02]px 0 var\(--skin-page, #fff\)/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-rail\s*\{[\s\S]*position:\s*sticky;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-rail\s*\{[\s\S]*background:\s*#fff;/);
  });

  test('antecedentes sector rail stays sticky and compact while filtering the archive below', () => {
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__sector-rail', 'top')).toBeGreaterThanOrEqual(72);
    expect(cssNumber(antecedentesEditorial, '.ante-dossier__sector-rail', 'top')).toBeLessThanOrEqual(88);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-rail\s*\{[\s\S]*position:\s*sticky;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__controls\s*\{[\s\S]*background:\s*var\(--ante-page\);/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__archive\s*\{[\s\S]*scroll-margin-top:\s*136px;/);
    expect(antecedentesEditorial).toContain('placeholder="Cliente o alcance"');
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-rail\s*\{[\s\S]*overflow:\s*hidden;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-rail\s*\{[\s\S]*mask-image:\s*linear-gradient\(90deg,\s*#000 0,\s*#000 calc\(100% - 42px\),\s*transparent 100%\)/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-links\s*\{[\s\S]*padding-right:\s*clamp\(32px,\s*5vw,\s*72px\);/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-links\s*\{[\s\S]*overscroll-behavior-inline:\s*contain;/);
    expect(antecedentesEditorial).toMatch(/rail\.scrollLeft\s*=\s*Math\.max\(0,\s*targetLeft\);/);
  });

  test('UM26 antecedentes filters become compact horizontal controls on mobile', () => {
    // Rediseño 2026-09: los filtros por faceta viven en un panel plegable (botón
    // "Filtros") en lugar de filas horizontales. Garantías equivalentes: control
    // compacto con estado accesible, objetivos táctiles de 44 px, inputs de 16 px
    // en móvil (sin zoom de iOS), recuento en vivo y carga paginada de fichas.
    const antecedentesIndex = read('src/pages/antecedentes/index.astro');
    const mobile = (antecedentesIndex.match(/@media \(max-width: 639px\) \{([\s\S]*?)\n    \}\n\n    @media/) || [])[1] || '';

    expect(antecedentesIndex).toContain('aria-label="Buscar y filtrar antecedentes"');
    expect(antecedentesIndex).toMatch(/<button class="ev-toggle" type="button" data-filter-toggle aria-expanded="false" aria-controls="evidence-filter-panel" hidden>/);
    expect(antecedentesIndex).toContain('<div class="ev-panel" id="evidence-filter-panel" data-filter-panel>');
    expect(antecedentesIndex).toMatch(/\.ev\.is-enhanced \.ev-panel:not\(\.is-open\)\s*\{\s*display:\s*none;/);
    expect(antecedentesIndex).toContain("panel?.classList.toggle('is-open', open);");
    expect(antecedentesIndex).toContain("toggle.setAttribute('aria-expanded', String(open));");
    expect(antecedentesIndex).toContain('aria-pressed="false"');
    expect(mobile).toMatch(/\.ev-search input,\s*\.ev-sort select,\s*\.ev-toggle\s*\{\s*font-size:\s*16px;/);
    expect(mobile).toMatch(/\.ev-chip\s*\{\s*min-height:\s*44px;/);
    expect(mobile).toMatch(/\.ev-panel__row\s*\{\s*grid-template-columns:\s*1fr;/);
    expect(antecedentesIndex).toContain('aria-live="polite" aria-atomic="true"');
    expect(antecedentesIndex).toContain('const PAGE_SIZE = 24;');
  });

  test('final mobile information hubs trade tall cards for documentary density', () => {
    // Rediseño 2026-09: mismas garantías de densidad con los valores nuevos:
    // antecedentes pasa a fila miniatura + texto (132 px), servicios a miniatura
    // acotada por vw y descripción oculta, sectores conserva su resumen 2x.
    const antecedentes = read('src/pages/antecedentes/index.astro');
    const services = read('src/pages/servicios/index.astro');
    const sectores = read('src/components/templates/SectorIndexUM26.astro');

    expect(antecedentes).toMatch(/@media \(max-width: 639px\)[\s\S]*\.ev-card\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*132px minmax\(0, 1fr\);/);
    expect(antecedentes).toMatch(/@media \(max-width: 639px\)[\s\S]*\.ev-card__media\s*\{\s*aspect-ratio:\s*auto;\s*min-height:\s*132px;/);
    expect(services).toMatch(/@media \(max-width:\s*640px\)[\s\S]*grid-template-columns:\s*minmax\(84px, 24vw\) minmax\(0, 1fr\)/);
    expect(services).toMatch(/@media \(max-width:\s*640px\)[\s\S]*\.services-demo-body > p\s*\{\s*display:\s*none;/);
    expect(sectores).toMatch(/\.sectors-demo-stats\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
    expect(sectores).toMatch(/@media \(max-width:\s*620px\)[\s\S]*\.sectors-demo-filters > div\s*\{[\s\S]*flex-wrap:\s*nowrap;[\s\S]*overflow-x:\s*auto;/);
  });

  test('row hover treatment stays calm and does not add red rails or layout drift', () => {
    const hoverBlocks = [
      sectorAtlas.match(/\.sector-atlas-exec-row:hover\s*\{[\s\S]*?\}/)?.[0] || '',
      antecedentesEditorial.match(/\.ante-dossier__row:hover\s*\{[\s\S]*?\}/)?.[0] || ''
    ];

    for (const block of hoverBlocks) {
      expect(block).not.toMatch(/padding-left\s*:/);
      expect(block).not.toMatch(/box-shadow:\s*inset/);
    }
  });

  test('sector service tags do not repeat red vertical bars inside the information table', () => {
    const serviceBlocks = sectorAtlas.match(/\.sector-atlas-exec-row__services li\s*\{[\s\S]*?\}/g) || [];
    expect(serviceBlocks.join('\n')).not.toMatch(/border-left:\s*2px solid var\(--um-red\)/);
    expect(serviceBlocks.join('\n')).not.toMatch(/border-right:\s*1px solid var\(--um-red\)/);
    expect(serviceBlocks.some((block) => /background:\s*[^;]+;/.test(block))).toBe(true);
    expect(sectorAtlas).not.toMatch(/\.sector-atlas-exec-row:hover h2/);
  });

  test('sector ledger uses meaningful thumbnails, not collapsed spreadsheet icons', () => {
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-row__sector figure', 'width')).toBeGreaterThanOrEqual(140);
    expect(cssNumber(sectorAtlas, '.sector-atlas-exec-row__sector figure', 'height')).toBeGreaterThanOrEqual(112);
    expect(sectorAtlas).toMatch(/grid-template-columns:\s*172px minmax\(0, 1fr\)/);
  });

  test('sector detail hero shows the action before secondary proof', () => {
    const sectorEditorial = read('src/components/templates/SectorTemplateEditorial.astro');
    const leadIndex = sectorEditorial.indexOf('sector-editorial-detail-hero__lead');
    const actionsIndex = sectorEditorial.indexOf('sector-editorial-detail-hero__actions');
    const prooflineIndex = sectorEditorial.indexOf('sector-editorial-detail-hero__proofline');

    expect(leadIndex).toBeGreaterThan(-1);
    expect(actionsIndex).toBeGreaterThan(leadIndex);
    expect(prooflineIndex).toBeGreaterThan(actionsIndex);
  });

  test('sector detail mobile uses compact proof labels and documentary rows', () => {
    const sectorEditorial = read('src/components/templates/SectorTemplateEditorial.astro');
    const detailHeroSource = sectorEditorial.slice(
      sectorEditorial.indexOf('sector-editorial-detail-hero__proofline'),
      sectorEditorial.indexOf('<dl class="sector-editorial-detail-hero__proofline"') + 900
    );

    expect(detailHeroSource).toContain('<dt>Años</dt>');
    expect(detailHeroSource).toContain('<dt>Soporte</dt>');
    expect(detailHeroSource).not.toContain('<dt>Trayectoria</dt>');
    expect(detailHeroSource).not.toContain('<dt>Operación</dt>');
    expect(sectorEditorial).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.sector-editorial-detail-hero__actions\s*\{[\s\S]*grid-template-columns:\s*1fr 1fr;/);
    expect(sectorEditorial).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.sector-editorial-service-list a,[\s\S]*min-height:\s*0;/);
    expect(sectorEditorial).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.sector-editorial-service-list a,[\s\S]*background:\s*transparent;/);
  });

  test('case detail dossier media cannot expand beyond its mobile container', () => {
    const caseDetail = read('src/pages/antecedentes/[id]/[slug].astro');

    expect(caseDetail).toMatch(/\.case-detail-dossier__media\s*\{[\s\S]*width:\s*100%;/);
    expect(caseDetail).toMatch(/\.case-detail-dossier__media\s*\{[\s\S]*max-width:\s*100%;/);
    expect(caseDetail).toMatch(/@media \(max-width:\s*720px\)\s*\{[\s\S]*\.case-detail-dossier__media\s*\{[\s\S]*min-height:\s*0;/);
  });

  test('home trust evidence avoids narrow proof columns on desktop and mobile', () => {
    const trustStrip = read('src/components/um/TrustStrip.astro');
    const proofParagraph = cssBlock(trustStrip, '.um-trust-strip__proof p');

    expect(trustStrip).not.toMatch(/border-block\s*:/);
    expect(cssBlock(trustStrip, '.um-trust-strip h2')).toMatch(/grid-column:\s*1;/);
    expect(cssBlock(trustStrip, '.um-trust-strip__head > p:last-child')).toMatch(/grid-column:\s*2;/);
    expect(cssBlock(trustStrip, '.um-trust-strip__ledger')).toMatch(/grid-column:\s*2;/);
    expect(cssBlock(trustStrip, '.um-trust-strip__proof')).toMatch(/grid-column:\s*1;/);
    expect(cssBlock(trustStrip, '.um-trust-strip__proof')).not.toMatch(/background:\s*#050505;/);
    expect(cssBlock(trustStrip, '.um-trust-strip__proof')).toMatch(/background:\s*transparent;/);
    expect(trustStrip).toContain('<strong>{catalogCount}</strong>');
    expect(trustStrip).not.toContain('<strong>{catalogShort}</strong>');
    expect(trustStrip).toMatch(/\.um-trust-strip__client\s*\{[\s\S]*background:\s*transparent;/);
    expect(cssBlock(trustStrip, '.um-trust-strip__docs')).toMatch(/border-top:\s*1px solid rgba\(17,\s*17,\s*17,\s*0\.14\);/);
    expect(cssBlock(trustStrip, '.um-trust-strip__docs article')).toMatch(/background:\s*transparent;/);
    expect(proofParagraph).not.toMatch(/max-width:\s*2[0-4]ch/);
    expect(trustStrip).toMatch(/@media \(max-width:\s*760px\)\s*\{[\s\S]*\.um-trust-strip__proof p\s*\{[\s\S]*max-width:\s*none;/);
    expect(trustStrip).toMatch(/\.um-trust-strip__client:nth-of-type\(n\+4\)\s*\{[\s\S]*display:\s*none;/);
  });

  test('home service index avoids floating red dash markers in each service unit', () => {
    // Rediseño 2026-09: el índice de servicios de la home es ServicesStory. Se
    // mantiene: ningún servicio lleva un guion rojo flotante propio; el acento de
    // cada unidad es su color de sistema y un único enlace real al servicio.
    const home = read('src/pages/index.astro');
    const story = read('src/components/cine/ServicesStory.astro');
    const itemTemplate = story.slice(story.indexOf('<ol class="svc-story__list">'), story.indexOf('</ol>'));

    expect(home).toContain("import ServicesStory from '../components/cine/ServicesStory.astro'");
    expect(home).toContain('<ServicesStory services={services} />');
    expect(home).not.toContain('<i aria-hidden="true"></i>');
    expect(home).not.toMatch(/\.um-service-unit__head i\s*\{/);
    expect(itemTemplate).not.toMatch(/<i\b/);
    expect(itemTemplate).toContain('<a class="svc-story__link" href={s.href}>');
    expect(home).toContain('class="um26-card-bar" aria-hidden="true"');
    expect(home).toMatch(/\.um26-card-bar\s*\{[\s\S]*background:\s*#dc2626;/);
  });

  test('home numeric summary is actionable instead of dead dashboard text', () => {
    const home = read('src/pages/index.astro');

    expect(home).toContain("href: '/nosotros'");
    expect(home).toContain("href: '/antecedentes'");
    expect(home).toContain("href: '/sectores'");
    expect(home).toContain("href: '/servicios-it-empresas-argentina'");
    expect(home).toContain("href: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it'");
    expect(home).toContain('{stats.map(({ value, label, href, aria }) => (');
    expect(home).toContain('<a href={href} aria-label={aria}>');
    expect(home).toMatch(/\.um26-stats__grid a:hover,[\s\S]*\.um26-stats__grid a:focus-visible\s*\{/);
    expect(home).toMatch(/\.um26-stats__grid a:focus-visible\s*\{[\s\S]*outline:\s*3px solid rgba\(220,\s*38,\s*38,\s*0\.5\);/);
    expect(home).toMatch(/\.um26-stats__inner\s*\{[\s\S]*padding-block:\s*0;/);
    expect(home).toMatch(/\.um26-stats__grid a\s*\{[\s\S]*display:\s*flex;[\s\S]*min-height:\s*138px;/);
    expect(home).toMatch(/\.um26-stats__grid a:hover,[\s\S]*box-shadow:\s*inset 0 -3px 0 #dc2626;/);
    expect(home).not.toMatch(/\.um26-stats__grid div\s*\{/);
  });

  test('home GEO hub cards are full-cell links with visible action states', () => {
    // Rediseño 2026-09: los hubs GEO de la home viven en CoverageMap (lista + mapa).
    // Cada hub sigue siendo una fila-enlace completa con estados hover/focus.
    const home = read('src/pages/index.astro');
    const coverage = read('src/components/cine/CoverageMap.astro');

    expect(home).toContain("href: '/servicios-it-empresas-mendoza'");
    expect(home).toContain("href: '/servicios-it-empresas-argentina'");
    expect(home).toContain('<CoverageMap hubs={hubs} />');
    expect(coverage).toContain('{hubs.map((h, i) => {');
    expect(coverage).toMatch(/<a href=\{h\.href\} aria-label=\{h\.aria\}/);
    expect(coverage).toContain('<span class="umc-map__go" aria-hidden="true">↗</span>');
    expect(cssBlock(coverage, '.umc-map__list a')).toMatch(/display:\s*grid;/);
    expect(coverage).toMatch(/\.umc-map__list a:hover, \.umc-map__list a:focus-visible[^{]*\{[^}]*color:\s*#fff;/);
    expect(coverage).not.toMatch(/outline:\s*(none|0)/);
  });

  test('sector service cards expose real link interaction states', () => {
    expect(sectorUM26).toContain('class="um-click-surface sector26-service-card"');
    expect(sectorUM26).toContain('class="um-click-action">Ver detalle</em>');
    expect(sectorUM26).toMatch(/\.sector26-service-card,[\s\S]*--um-click-hover-bg:[\s\S]*#171719;/);
    expect(sectorUM26).toMatch(/a\.sector26-service-card:hover,[\s\S]*a\.sector26-service-card:focus-visible\s*\{[\s\S]*border-color:\s*rgba\(255,255,255,0\.22\);/);
    expect(sectorUM26).toMatch(/a\.sector26-service-card:focus-visible\s*\{[\s\S]*outline:\s*3px solid rgba\(220,\s*38,\s*38,\s*0\.42\);/);
    expect(sectorUM26).toMatch(/a\.sector26-service-card:hover strong,[\s\S]*a\.sector26-service-card:focus-visible strong\s*\{[\s\S]*color:\s*#fff !important;/);
    expect(sectorUM26).toMatch(/\.sector26-service-card em\s*\{[\s\S]*text-decoration:\s*underline;/);
    expect(sectorUM26).toMatch(/a\.sector26-service-card:hover em::after,[\s\S]*a\.sector26-service-card:focus-visible em::after\s*\{[\s\S]*transform:\s*translateX\(4px\);/);
  });

  test('sector evidence links expose active hover and focus states', () => {
    expect(sectorUM26).toContain('class="um-click-surface sector26-feature-case"');
    expect(sectorUM26).toContain('class="um-click-action">Ver detalle</strong>');
    expect(sectorUM26).toContain('class="um-click-surface sector26-case-row"');
    expect(sectorUM26).toContain('class="um-click-action">Ver detalle</b>');
    expect(sectorUM26).toMatch(/\.sector26-feature-case:hover,[\s\S]*\.sector26-feature-case:focus-visible\s*\{[\s\S]*border-color:\s*rgba\(255,255,255,0\.26\);/);
    expect(sectorUM26).toMatch(/\.sector26-feature-case:focus-visible\s*\{[\s\S]*outline:\s*3px solid rgba\(220,\s*38,\s*38,\s*0\.42\);/);
    expect(sectorUM26).toMatch(/\.sector26-feature-case:hover strong::after,[\s\S]*\.sector26-feature-case:focus-visible strong::after\s*\{[\s\S]*transform:\s*translateX\(4px\);/);
    expect(sectorUM26).toMatch(/\.sector26-case-row\s*\{[\s\S]*--um-click-hover-bg:[\s\S]*#171719;/);
    expect(sectorUM26).toMatch(/\.sector26-case-row:hover,[\s\S]*\.sector26-case-row:focus-visible\s*\{[\s\S]*border-color:\s*rgba\(255,255,255,0\.24\);/);
    expect(sectorUM26).toMatch(/\.sector26-case-row:focus-visible\s*\{[\s\S]*outline:\s*3px solid rgba\(220,\s*38,\s*38,\s*0\.42\);/);
    expect(sectorUM26).toMatch(/\.sector26-case-row:hover b::after,[\s\S]*\.sector26-case-row:focus-visible b::after\s*\{[\s\S]*transform:\s*translateX\(4px\);/);
  });

  test('sector dark surfaces keep body text readable over images and black panels', () => {
    expect(sectorUM26).toMatch(/\.sector26-hero-frame > img\s*\{[\s\S]*filter:\s*contrast\(1\.1\) saturate\(0\.9\) brightness\(0\.54\);/);
    expect(sectorUM26).toMatch(/\.sector26-hero-frame__body > p:not\(\.sector26-kicker\)\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.88\);/);
    expect(sectorUM26).toMatch(/\.sector26-hero__copy > p:not\(\.sector26-kicker\)\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.86\);/);
    expect(sectorUM26).toMatch(/\.sector26-service-card p,[\s\S]*\.sector26-criteria-grid p\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.76\);/);
    expect(sectorUM26).toMatch(/\.sector26-feature-case p:not\(:first-child\)\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.86\);/);
    expect(sectorUM26).toMatch(/\.sector26-case-row em\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.74\);/);
    expect(sectorUM26).not.toMatch(/\.sector26-hero-frame__body > p:not\(\.sector26-kicker\)\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.72\);/);
    expect(sectorUM26).not.toMatch(/\.sector26-service-card p,[\s\S]*\.sector26-criteria-grid p\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.62\);/);
    expect(sectorUM26).not.toMatch(/\.sector26-case-row em\s*\{[\s\S]*color:\s*rgba\(255,255,255,0\.58\);/);
  });

  test('global skin overrides cannot flatten UM26 sector dark contrast', () => {
    expect(v4Css).toContain('UM26 sector dark surfaces: keep image-backed and black modules readable under every skin.');
    expect(v4Css).toMatch(/body\[data-skin\] main \.sector26-hero-frame__body > p:not\(\.sector26-kicker\),[\s\S]*color:\s*rgba\(255,255,255,0\.88\) !important;/);
    expect(v4Css).toMatch(/body\[data-skin\] main \.sector26-service-card p,[\s\S]*body\[data-skin\] main \.sector26-case-row em,[\s\S]*color:\s*rgba\(255,255,255,0\.78\) !important;/);
    expect(v4Css).toMatch(/body\[data-skin\] main \.sector26-service-card span,[\s\S]*body\[data-skin\] main \.sector26-case-row > span,[\s\S]*color:\s*#DC2626 !important;/);
  });

  test('antecedentes hero secondary action renders as an intentional muted button, not loose text', () => {
    const actionsBlock = cssBlock(antecedentesEditorial, '.ante-dossier__actions a + a');

    expect(actionsBlock).toMatch(/background:\s*#eef0f2;/);
    expect(actionsBlock).toMatch(/color:\s*#111;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__actions a:first-child:hover,[\s\S]*\.ante-dossier__actions a:first-child:focus-visible\s*\{[\s\S]*color:\s*#fff;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__actions a \+ a:hover,[\s\S]*\.ante-dossier__actions a \+ a:focus-visible\s*\{[\s\S]*background:\s*#111;/);
  });

  test('antecedentes archive exposes a crawlable complete index of case links', () => {
    // Rediseño 2026-09: todas las fichas se renderizan en SSR como <a href>; el
    // filtrado y el "ver más" sólo ocultan en el cliente.
    const source = read('src/pages/antecedentes/index.astro');

    expect(source).toContain('const cases = [...orderedLead, ...rest].map');
    expect(source).toContain("href: `/antecedentes/${item.id}/${item.slug}`,");
    expect(source).toContain('data-card');
    expect(source).toContain('<a class="ev-card" href={item.href}>');
    expect(source).not.toContain('data-case-modal');
    expect(source).not.toMatch(/cases\.slice\(/);
  });

  test('antecedentes archive keeps crawlable view and sort controls', () => {
    // El toggle grilla/lista se eliminó a propósito en el rediseño; el archivo
    // conserva orden real sobre las fichas SSR y una vista móvil en filas.
    const source = read('src/pages/antecedentes/index.astro');

    expect(source).toContain('<select aria-label="Ordenar antecedentes" data-sort>');
    expect(source).toContain('<option value="recent">Destacados</option>');
    expect(source).toContain('<option value="year-desc">Año, más reciente</option>');
    expect(source).toContain('ordered.forEach((card) => grid?.appendChild(card));');
    expect(source).toMatch(/data-order=\{index\}/);
    expect(source).toMatch(/\.ev-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/);
    expect(source).toMatch(/@media \(max-width: 639px\)[\s\S]*\.ev-card\s*\{\s*display:\s*grid;/);
  });

  test('evidence case rows reserve enough copy width to avoid broken client names', () => {
    const evidenceRow = read('src/components/um/EvidenceCaseRow.astro');
    const rowBlock = cssBlock(evidenceRow, '.evidence-case-row');
    const titleBlock = cssBlock(evidenceRow, '.evidence-case-row h3');

    expect(rowBlock).toMatch(/grid-template-columns:\s*3rem minmax\(156px,\s*0\.2fr\) minmax\(240px,\s*1fr\) minmax\(160px,\s*0\.34fr\) auto;/);
    expect(titleBlock).toMatch(/overflow-wrap:\s*normal;/);
    expect(titleBlock).toMatch(/word-break:\s*normal;/);
    expect(titleBlock).toMatch(/hyphens:\s*none;/);
    expect(evidenceRow).toMatch(/@media \(max-width:\s*520px\)\s*\{[\s\S]*\.evidence-case-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    expect(evidenceRow).toMatch(/@media \(max-width:\s*520px\)\s*\{[\s\S]*\.evidence-case-row__copy\s*\{[\s\S]*align-self:\s*start;/);
  });

  test('home secondary evidence rows remove repeated sector metadata to prevent compressed words', () => {
    const home = read('src/pages/index.astro');

    expect(home).toContain('class="um26-case-grid"');
    expect(home).toMatch(/\.um26-case-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
    expect(home).toMatch(/\.um26-case-card\s*\{[\s\S]*min-height:\s*380px;/);
    expect(home).toMatch(/@media \(max-width:\s*760px\)\s*\{[\s\S]*\.um26-case-grid,[\s\S]*\.um26-hub-grid\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
  });

  test('home service visual loads reliably for full-page visual QA', () => {
    // Rediseño 2026-09: la primera pantalla es CineBanner (póster con prioridad
    // alta); las imágenes de servicios están bajo el pliegue y reservan su tamaño.
    const home = read('src/pages/index.astro');
    const banner = read('src/components/cine/CineBanner.astro');
    const story = read('src/components/cine/ServicesStory.astro');

    expect(home).toContain('<CineBanner');
    expect(banner).toMatch(/<img class="umc-poster"[^>]*width="1920" height="1080" fetchpriority="high" decoding="async"/);
    // El escenario tiene dos capas de póster (se funden al cambiar de servicio) con dimensiones
    // explícitas y carga diferida; las miniaturas son el póster v4 de cada servicio.
    expect(story).toMatch(/<img class="svc-story__poster is-on"[^>]*width="1920" height="1080" loading="lazy" decoding="async" data-poster-layer \/>/);
    expect(story).toMatch(/<img class="svc-story__render" src=\{s\.poster\}[^>]*width="320" height="180" loading="lazy" decoding="async" \/>/);
    expect(home).toContain('width="1200"');
    expect(home).toContain('height="900"');
    expect(home).toContain('decoding="async"');
  });

  test('contact antispam field stays visually hidden without offscreen overflow', () => {
    // Rediseño 2026-09: el formulario de /contacto es ContactForm (cine) y sus
    // honeypots usan .ctf__hp. Misma garantía: ocultos sin coordenadas negativas.
    const contacto = read('src/pages/contacto.astro');
    const form = read('src/components/cine/ContactForm.astro');
    const honeypotBlock = cssBlock(form, '.ctf__hp');

    expect(form).toContain('name="website" class="ctf__hp"');
    expect(form).toContain('name="contact_phone" class="ctf__hp"');
    expect(honeypotBlock).not.toMatch(/left:\s*-[0-9]/);
    expect(honeypotBlock).not.toMatch(/top:\s*-[0-9]/);
    expect(honeypotBlock).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(honeypotBlock).toMatch(/overflow:\s*hidden/);
    expect(honeypotBlock).toMatch(/visibility:\s*hidden/);
    expect(form).toMatch(/\.ctf__form\s*\{[^}]*position:\s*relative;/);
    expect(contacto).toContain('class="ctc-panel" id="formulario"');
    expect(contacto).toMatch(/\.ctc-panel\s*\{[^}]*scroll-margin-top:\s*clamp\(84px,\s*10vw,\s*112px\)/);
  });

  test('contact keeps the public form short: three required fields, optional context and invisible antispam only', () => {
    // El diseño anterior tenía exactamente 4 campos. El rediseño suma contexto
    // opcional (motivo, servicios plegados, sede, urgencia); la intención de fondo
    // se mantiene: sólo nombre, email y mensaje son obligatorios, los servicios
    // quedan plegados y el antispam no es visible.
    const contacto = read('src/pages/contacto.astro');
    const form = read('src/components/cine/ContactForm.astro');
    const formSource = form.slice(
      form.indexOf('<form class="ctf__form" id="contactForm"'),
      form.indexOf('</form>') + '</form>'.length
    );
    const hiddenNames = ['website', 'contact_phone', 'startedAt', 'contactProof'];
    const fieldTags = Array.from(formSource.matchAll(/<(?:input|textarea|select)\b[^>]*\sname="([^"]+)"[^>]*>/g));
    const visibleFieldNames = [...new Set(fieldTags.map((match) => match[1]).filter((name) => !hiddenNames.includes(name)))];
    const requiredFieldNames = fieldTags.filter((match) => /\srequired\b/.test(match[0])).map((match) => match[1]);

    expect(requiredFieldNames).toEqual(['name', 'email', 'message']);
    expect(visibleFieldNames).toEqual(['name', 'email', 'company', 'topic', 'services', 'site', 'urgency', 'message']);
    expect(visibleFieldNames.length).toBeLessThanOrEqual(8);
    expect(formSource).toMatch(/<details class="ctf__more"[\s\S]*name="services"[\s\S]*<\/details>/);
    expect(formSource).toMatch(/<input type="hidden" name="startedAt"/);
    expect(formSource).toMatch(/<input type="hidden" name="contactProof"/);
    expect(contacto).not.toContain('BudgetBriefFields');
    expect(contacto).not.toContain('contact-budget-details');
    expect(contacto).toContain('<ContactForm />');
    expect(formSource.indexOf('class="ctf__submit"')).toBeGreaterThan(formSource.indexOf('name="message"'));
    expect(form.indexOf('class="ctf__submit"')).toBeLessThan(form.indexOf('class="ctf__done"'));
  });

  test('blog single keeps the reading sidebar and removes repeated commercial header CTAs', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const toc = read('src/components/blog/BlogTOC.astro');
    const layoutIndex = blogSingle.indexOf("class:list={['bp-layout'");
    const tocIndex = blogSingle.indexOf('<BlogTOC headings={headings} />');
    const proseIndex = blogSingle.indexOf('class="prose"');
    const header = blogSingle.slice(blogSingle.indexOf('<header class="bp-head'), blogSingle.indexOf('</header>'));

    expect(tocIndex).toBeGreaterThan(layoutIndex);
    expect(proseIndex).toBeGreaterThan(tocIndex);
    expect(toc).toMatch(/\.btoc\s*\{[^}]*position:\s*sticky;/);
    expect(header).not.toContain('/contacto');
    expect(blogSingle).not.toContain('article-hero-actions');
    expect(blogSingle).not.toContain('article-sticky-cta');
    expect(blogSingle).not.toContain('href={heroPrimaryHref}');
    expect(blogSingle).not.toContain('href={heroSecondaryHref}');
    expect(blogSingle).not.toContain('Solicitar diagnóstico');
    expect(blogSingle).not.toContain('Ver servicios');
  });

  test('blog single no longer ships sticky or secondary commercial action styles', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');

    expect(cssBlock(blogSingle, '.article-hero-actions__secondary')).toBe('');
    expect(cssBlock(blogSingle, '.article-sticky-cta')).toBe('');
    expect(blogSingle).not.toMatch(/@media[\s\S]*?\.article-hero-actions\s*\{/);
    expect(blogSingle).not.toMatch(/\.article-hero-actions a\s*\{/);
    expect(blogSingle).not.toContain('const sticky = document.getElementById');
    expect(blogSingle).not.toContain('article-commercial-fold');
  });

  test('blog single canonicalizes internal production links inside article content', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const normalizeStart = blogSingle.indexOf('const normalizeArticleContent');
    const normalizeEnd = blogSingle.indexOf('const normalizedContent');
    const normalizer = blogSingle.slice(normalizeStart, normalizeEnd);

    expect(normalizer).toContain("const canonicalizedHtml = canonicalizeInternalBlogLinks(html || '')");
    expect(normalizer).toContain('replace(/https?:');
    expect(normalizer).toContain('ultimamilla');
    expect(normalizer).toContain('siteUrl');
  });

  test('blog single H1 keeps the complete editorial title instead of truncating with ellipsis', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const titleBuilderStart = blogSingle.indexOf('const buildArticleTitle');
    const titleBuilderEnd = blogSingle.indexOf('const editorialArticleTitle');
    const titleBuilder = blogSingle.slice(titleBuilderStart, titleBuilderEnd);
    const mobile = (blogSingle.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n  \}/) || [])[1] || '';

    expect(titleBuilderStart).toBeGreaterThan(-1);
    expect(titleBuilder).toMatch(/\.trim\(\);\s*$/);
    expect(titleBuilder).not.toMatch(/\.slice\(/);
    expect(titleBuilder).not.toMatch(/afterColon/);
    expect(titleBuilder).not.toContain('…');
    expect(blogSingle).toContain('<h1 id="bp-title" class="article-title bp-title">{articleTitle}</h1>');
    expect(cssBlock(blogSingle, '.bp-title')).not.toMatch(/text-overflow:\s*ellipsis|line-clamp/);
    // El título completo no desborda en teléfonos: tamaño relativo al ancho.
    expect(mobile).toMatch(/\.bp-title\s*\{\s*font-size:\s*clamp\([^;]*vw[^;]*\)\s*!important;/);
  });

  test('blog single shows an editorial cover image before article prose', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const metaIndex = blogSingle.indexOf('<dl class="bp-meta">');
    const coverIndex = blogSingle.indexOf('<figure class="bp-cover bp-shell">');
    const proseIndex = blogSingle.indexOf('class="prose"');

    expect(blogSingle).toContain('blogPostImageAlt');
    expect(blogSingle).toContain('alt={imgAlt}');
    expect(coverIndex).toBeGreaterThan(metaIndex);
    expect(proseIndex).toBeGreaterThan(coverIndex);
    expect(blogSingle).toMatch(/\.bp-cover img\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9;/);
    expect(blogSingle).toMatch(/\.bp-cover img\s*\{[^}]*object-fit:\s*cover;/);
  });

  test('blog index stays readable without a duplicated featured banner or repeated header CTAs', () => {
    // Rediseño 2026-09: el índice vuelve a tener un artículo destacado (BlogHero),
    // sólo en la página 1 y excluido del archivo, así que no se duplica. La
    // cabecera no repite CTAs comerciales.
    const blogIndex = read('src/pages/blog/index.astro');
    const headerIndex = blogIndex.indexOf('<header class="bx-hero bx-shell">');
    const header = blogIndex.slice(headerIndex, blogIndex.indexOf('</header>'));
    const archiveIndex = blogIndex.indexOf('<section class="bx-archive"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(archiveIndex).toBeGreaterThan(headerIndex);
    expect(blogIndex).toContain('const featuredPost = page === 1 ? posts[0] : null;');
    expect(blogIndex).toContain('const archivePosts = featuredPost ? posts.slice(1) : posts;');
    expect((blogIndex.match(/<BlogHero /g) || []).length).toBe(1);
    expect(blogIndex).toContain('{archivePosts.map((post, idx) => <BlogCard post={post} eager={idx < 3} />)}');
    expect(header).not.toContain('/contacto');
    expect(blogIndex).not.toContain('blog-header__actions');
    expect(blogIndex).not.toContain('Solicitar diagnóstico');
    expect(blogIndex).not.toContain('src={heroImgUrl}');
  });

  test('blog index mobile proofline wraps long evidence without viewport overflow', () => {
    // La "proofline" del diseño anterior ya no existe. Garantía equivalente: las
    // grillas del índice y del destacado nunca usan pistas max-content/auto y el
    // contenedor no genera scroll horizontal.
    const blogIndex = read('src/pages/blog/index.astro');
    const hero = read('src/components/blog/BlogHero.astro');

    expect(blogIndex).toMatch(/\.bx-grid\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
    expect(blogIndex).toMatch(/@media \(max-width: 680px\)[\s\S]*\.bx-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/);
    expect(hero).toMatch(/\.bfeat\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);\s*\}/);
    expect(blogIndex).toMatch(/\.bx\s*\{[^}]*overflow-x:\s*clip;/);
    for (const source of [blogIndex, hero]) {
      expect(source).not.toMatch(/max-content/);
    }
  });

  test('services mobile proofline avoids narrow three-column word breaks', () => {
    const servicios = read('src/pages/servicios/index.astro');

    expect(servicios).toContain('class="services-demo"');
    expect(servicios).toContain('class="services-demo-row"');
    expect(servicios).toMatch(/<a\s+class="services-demo-row"[\s\S]*?href=\{`\/servicios\/\$\{service\.code\}\/\$\{service\.slug\}`\}/);
    expect(servicios).toContain('aria-label={`Abrir servicio ${service.name}`}');
    expect(servicios).toContain('class="services-demo-action"');
    expect(servicios).not.toMatch(/<h2><a\s+href=\{`\/servicios\/\$\{service\.code\}\/\$\{service\.slug\}`\}/);
    expect(servicios).not.toMatch(/<footer>[\s\S]*?<a\s+href=\{`\/servicios\/\$\{service\.code\}\/\$\{service\.slug\}`\}/);
    expect(cssBlock(servicios, '.services-demo-row')).toMatch(/text-decoration:\s*none;/);
    expect(servicios).toMatch(/\.services-demo-row:focus-visible\s*\{[\s\S]*outline:\s*3px solid rgba\(220,38,38,0\.58\);/);
    // Rediseño 2026-09: la primera pantalla es CineBanner; las filas de servicio
    // quedan bajo el pliegue, cargan diferido y reservan su tamaño intrínseco.
    expect(servicios).toContain('<CineBanner');
    expect(servicios).toContain('<img src={service.image} alt="" width="1200" height="900" loading="lazy" decoding="async" />');
    expect(servicios).toMatch(/\.services-demo-row\s*\{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-block-size:\s*360px;/);
    expect(servicios).toMatch(/\.services-demo-media\s*\{[\s\S]*background-image:\s*var\(--service-image\);/);
    expect(cssBlock(servicios, '.services-demo-media div')).toMatch(/z-index:\s*1;/);
    expect(cssBlock(servicios, '.services-demo-media img')).toMatch(/z-index:\s*0;/);
    expect(cssBlock(servicios, '.services-demo-media span,\n    .services-demo-media em')).toMatch(/z-index:\s*2;/);
    expect(servicios).toMatch(/\.services-demo-body ul\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
    expect(servicios).toMatch(/@media \(max-width:\s*980px\)\s*\{[\s\S]*\.services-demo-row,[\s\S]*\.services-demo-row:nth-child\(even\)\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(servicios).toMatch(/@media \(max-width:\s*980px\)\s*\{[\s\S]*\.services-demo-body ul\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(servicios).not.toMatch(/@media \(max-width:\s*980px\)\s*\{[\s\S]*\.services-demo-body ul\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  });

  test('services dark product band avoids off-brand red microtext', () => {
    const servicios = read('src/pages/servicios/index.astro');

    expect(servicios).not.toContain('#fca5a5');
    expect(cssBlock(servicios, '.services-demo-closing')).toMatch(/background:\s*#0f0f11;/);
    expect(cssBlock(servicios, '.services-demo-closing a')).toMatch(/background:\s*#dc2626;/);
    expect(cssBlock(servicios, '.services-demo-closing a + a')).toMatch(/background:\s*transparent;/);
    expect(servicios).toContain('class="services-demo-shell services-demo-closing"');
  });

  test('contact feedback links use canonical UMSA red only', () => {
    // Rediseño 2026-09: el feedback de /contacto está en ContactForm y usa el
    // token oscuro --x-red (#dc2626, el mismo rojo canónico que --um-red).
    const contacto = read('src/pages/contacto.astro');
    const form = read('src/components/cine/ContactForm.astro');
    const modal = read('src/components/um/ContactModal.astro');

    expect(v4Css).toMatch(/--x-red:\s*#dc2626;/i);
    expect(v4Css).toMatch(/--um-red:\s*#DC2626;/i);
    for (const source of [contacto, form, modal]) {
      expect(source).not.toMatch(/#B91C1C/i);
    }
    expect(cssBlock(form, '.ctf__error-box :global(a)')).toMatch(/text-decoration-color:\s*var\(--x-red\);/);
    expect(cssBlock(modal, '.um-contact-message a')).toMatch(/color:\s*var\(--um-red\);/);
    expect(cssBlock(form, '.ctf__error-box')).toMatch(/border-left:\s*2px solid var\(--x-red\);/);
    expect(cssBlock(form, '.ctf__error-box')).toMatch(/rgba\(220,\s*38,\s*38,/);
  });

  test('public utility fallbacks keep UMSA typography and restrained motion', () => {
    const manifest = JSON.parse(read('public/manifest.json'));
    const status = read('public/status/index.html');
    const offline = read('public/offline.html');
    const effects = read('public/uiEffects.css');
    const effectsSystem = read('public/uiEffectsSystem.js');
    const serviceWorker = read('public/sw.js');
    const publicContactSystem = read('public/contactSystem.js');
    const sourceContactSystem = read('src/scripts/contactSystem.js');
    const terminalEnhanced = read('public/terminalEnhanced.js');
    const terminalBasicCss = read('public/terminal-basic.css');
    const terminalBasicJs = read('public/terminal-basic.js');
    const analytics = read('src/components/Analytics.astro');

    expect(manifest.name).toBe('ULTIMA MILLA');
    expect(manifest.short_name).toBe('ULTIMA MILLA');
    expect(manifest.theme_color).toBe('#DC2626');
    expect(manifest.background_color).toBe('#050505');
    expect(manifest.description).not.toMatch(/terminal cli/i);
    expect(status).toContain('--primary-color: #DC2626');
    expect(status).toContain('background: #111111;');
    expect(status).not.toMatch(/font-size:\s*0\.[0-9]+rem/);
    expect(status).not.toMatch(/transition:\s*all/);
    expect(status).not.toMatch(/animation:\s*fadeIn\s+0\.3s\s+ease-in/);
    expect(status).not.toMatch(/#4a90e2|#667eea|#764ba2|#4CAF50|#45a049|linear-gradient\(135deg,\s*#667eea|linear-gradient\(135deg,\s*#4CAF50/);
    expect(offline).toContain('--um-red: #DC2626');
    expect(offline).not.toMatch(/#00d4aa|#00a085|var\(--terminal-primary\)|linear-gradient|transition:\s*all|font-size:\s*0\.[0-9]+rem/);
    expect(offline).not.toMatch(/Terminal CLI|CLI funcional/);
    expect(offline).not.toMatch(/[📱💾⚡📝🎨🔴🟢]/);
    expect(effects).toContain('--terminal-primary: #DC2626');
    expect(effects).not.toMatch(/transition:\s*all/);
    expect(effects).not.toContain('scale(0)');
    expect(effects).not.toContain('rgba(239, 68, 68');
    expect(`${effects}\n${effectsSystem}`).not.toMatch(/#00d4aa|#00a085|#00ff41|#00aa00|#ff6ec7|#00d9ff|#ff0040|#00ffff|#ffff00/);
    expect(serviceWorker).toContain("const CACHE_NAME = 'um-public-v1.0.0';");
    expect(serviceWorker).not.toMatch(/Terminal CLI|um-terminal-v/);
    expect(`${publicContactSystem}\n${terminalEnhanced}`).not.toMatch(/#00d4aa|color:\s*#00d4aa|Terminal CLI|desde CLI|desde el CLI/);
    expect(`${publicContactSystem}\n${terminalEnhanced}`).toMatch(/text-decoration-color:\s*#DC2626/);
    expect(sourceContactSystem).not.toMatch(/#00d4aa|color:\s*#00d4aa|Terminal CLI|desde CLI|desde el CLI/);
    expect(sourceContactSystem).toMatch(/text-decoration-color:\s*#DC2626/);
    expect(terminalBasicCss).not.toMatch(/#00d4aa|#00b894|#00ff00|font-size:\s*(1[0-5]px|0\.[0-9]+rem)/);
    expect(terminalBasicCss).toMatch(/border-bottom:\s*1px solid #DC2626/);
    expect(terminalBasicJs).not.toMatch(/Terminal CLI|UM CLI Básico|CLI básico|📋|🚀|💻|⚡|📁|📂|📄|📜|🏢|📞|📧|🌐|💡|🔒|🛠️|📊|✅/);
    expect(terminalBasicJs).toContain('Consola operativa UMSA');
    expect(analytics).not.toMatch(/#00d4aa|privacy-notice" style=/);
    expect(analytics).toMatch(/\.um-privacy-notice__copy\s*\{[\s\S]*font-size:\s*16px;/);
    expect(analytics).toMatch(/\.um-privacy-notice__button--primary\s*\{[\s\S]*background:\s*#DC2626;/);
  });

  test('product sheets keep service detail images visible without decorative frames', () => {
    const productCard = read('src/components/v4/ProductCard.astro');

    expect(cssBlock(productCard, '.product-sheet__frame')).toMatch(/border:\s*0;/);
    expect(cssBlock(productCard, '.product-sheet__frame')).toMatch(/box-shadow:\s*none;/);
    expect(cssBlock(productCard, '.product-sheet__image')).toMatch(/height:\s*clamp\(240px,\s*32vw,\s*380px\);/);
    expect(productCard).toMatch(/@media \(max-width:\s*900px\)\s*\{[\s\S]*\.product-sheet__image\s*\{[\s\S]*height:\s*clamp\(220px,\s*62vw,\s*320px\);/);
  });

  test('shared service imagery reserves intrinsic space before loading', () => {
    const productCard = read('src/components/v4/ProductCard.astro');
    const ctaSection = read('src/components/v4/CTASection.astro');
    expect(productCard).toContain('width="1600"');
    expect(productCard).toContain('height="900"');
    expect(ctaSection).toContain('width="1920"');
    expect(ctaSection).toContain('height="1080"');
  });

  test('service detail equipment heading stays in one readable column', () => {
    // Rediseño 2026-09: las secciones del detalle usan .svc-head (título + bajada).
    // Garantía equivalente: columnas que no se comprimen, título acotado sin
    // cortes de palabra y una sola columna en móvil.
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');
    const layout = read('src/layouts/LayoutV4.astro');
    const headGrid = cssBlock(serviceDetail, '.svc-head');
    const titleBlock = cssBlock(serviceDetail, '.svc-head h2');

    expect(headGrid).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*0\.92fr\);/);
    expect(titleBlock).toMatch(/max-width:\s*18ch;/);
    expect(titleBlock).toMatch(/text-wrap:\s*balance;/);
    expect(layout).toMatch(/main :where\(h1, h2, h3, h4\)[\s\S]*word-break:\s*normal !important;/);
    expect(serviceDetail).toMatch(/@media \(max-width: 760px\) \{\s*\.svc-head\s*\{\s*grid-template-columns:\s*1fr;/);
    expect(serviceDetail).not.toMatch(/grid-template-columns:\s*minmax\(220px,\s*0\.34fr\)/);
  });

  test('replica service detail H1s use editorial headlines without legacy separators', () => {
    const replicaCopy = JSON.parse(read('src/data/replica-prod-copy.json'));
    const serviceEntries = Object.entries(replicaCopy.paths).filter(([route]) => route.startsWith('/servicios/'));

    expect(serviceEntries.length).toBeGreaterThan(0);
    for (const [route, entry] of serviceEntries) {
      expect(entry.h1).toBeTruthy();
      expect(entry.h1).not.toContain('|');
      expect(entry.h1.length).toBeLessThanOrEqual(62);
      expect(route).toMatch(/^\/servicios\/\d+\//);
    }
  });

  test('service detail hero titles are not constrained to narrow poster columns on desktop', () => {
    // Rediseño 2026-09: el H1 del servicio lo pinta CineBanner (variante sector).
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');
    const bannerCss = read('src/styles/cine-banner.css');
    const sectorH1 = cssBlock(bannerCss, '.umc--sector h1');
    const sectorMaxCh = Number((sectorH1.match(/max-width:\s*(\d+)ch/) || [])[1]);

    expect(serviceDetail).toMatch(/<CineBanner\s+variant="sector"[\s\S]*titleId="service-title"[\s\S]*title=\{serviceHeroTitle\}/);
    expect(sectorMaxCh).toBeGreaterThanOrEqual(16);
    expect(bannerCss).toMatch(/@media \(max-width: 820px\)[\s\S]*\.umc h1 \{ font-size: clamp\([^)]*vw[^)]*\); \}/);
  });

  test('service detail injected editorial copy keeps controlled mobile typography', () => {
    // Rediseño 2026-09: el copy del CMS ya no se inyecta como HTML; se limpia con
    // cleanCmsText y se pinta en bloques con tipografía fija (>= 15 px).
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');

    expect(serviceDetail).not.toContain('prose prose-lg max-w-none text-um-gray mb-12 service-detail-copy');
    expect(serviceDetail).not.toMatch(/set:html=/);
    expect(serviceDetail).toContain('<p class="svc-tile__text">{cleanCmsText(item.description)}</p>');
    expect(cssBlock(serviceDetail, '.svc-head__lead')).toMatch(/max-width:\s*62ch;/);
    expect(cssBlock(serviceDetail, '.svc-head__lead')).toMatch(/font-size:\s*1\.0625rem;/);
    expect(cssBlock(serviceDetail, '.svc-head__lead')).toMatch(/line-height:\s*1\.6;/);
  });

  test('service detail mobile breadcrumb does not leave a trailing separator when current item is hidden', () => {
    // Rediseño 2026-09: la miga visible se reemplazó por un enlace "Todos los
    // servicios" en CineBanner (sin separadores que puedan quedar colgados); la
    // jerarquía sigue expuesta a buscadores como BreadcrumbList.
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');
    const banner = read('src/components/cine/CineBanner.astro');

    expect(serviceDetail).toContain("back={{ href: '/servicios', label: '← Todos los servicios' }}");
    expect(banner).toContain('{back && <a class="umc-back" href={back.href}>{back.label}</a>}');
    expect(serviceDetail).not.toContain('service-detail-breadcrumb');
    expect(read('src/layouts/LayoutV4.astro')).toContain('breadcrumbs={breadcrumbs}');
    expect(read('src/components/SEO/SEOHead.astro')).toContain('"@type": "BreadcrumbList"');
  });

  test('service detail technical sidebar renders as a compact ledger instead of a redundant card', () => {
    // Rediseño 2026-09: la ficha técnica es un <dl> compacto junto al CTA único.
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');

    expect(serviceDetail).toContain('<aside class="svc-ficha" aria-label="Ficha técnica del servicio">');
    expect(serviceDetail).not.toContain('<SectionHeader kicker="Ficha técnica" title={sidebarInfoTitle} />');
    expect(cssBlock(serviceDetail, '.svc-ficha dl > div')).toMatch(/grid-template-columns:\s*minmax\(120px,\s*0\.4fr\) minmax\(0,\s*0\.6fr\);/);
    expect(cssBlock(serviceDetail, '.svc-ficha dd')).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(serviceDetail).not.toMatch(/\.svc-ficha\s*\{[^}]*box-shadow/);
  });

  test('blog category stays readable without a duplicated featured banner or repeated header CTAs', () => {
    const blogCategory = read('src/pages/blog/categoria/[cat].astro');
    const headerIndex = blogCategory.indexOf('<header class="bx-hero bx-shell">');
    const header = blogCategory.slice(headerIndex, blogCategory.indexOf('</header>'));
    const archiveIndex = blogCategory.indexOf('<div class="bx-grid">');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(archiveIndex).toBeGreaterThan(headerIndex);
    expect(header).not.toContain('/contacto');
    expect(blogCategory).not.toContain('const heroImgUrl = hero ? blogPostImageUrl(hero)');
    expect(blogCategory).not.toContain('src={heroImgUrl}');
    expect(blogCategory).not.toContain('blog-header__actions');
    expect(blogCategory).not.toContain('Solicitar diagnóstico');
    expect(blogCategory).not.toContain('import BlogHero');
    expect(blogCategory).not.toContain('<BlogHero');
    expect(blogCategory).toMatch(/@media \(max-width: 680px\) \{ \.bx-grid \{ grid-template-columns: minmax\(0, 1fr\);/);
  });

  test('certifications page exposes first-fold action and avoids unsafe ledger columns', () => {
    const certificaciones = read('src/pages/certificaciones.astro');
    const heroIndex = certificaciones.indexOf('class="cert-page__hero"');
    const actionsIndex = certificaciones.indexOf('cert-page__hero-actions');
    const ledgerIndex = certificaciones.indexOf('class="cert-page__ledger"');

    expect(actionsIndex).toBeGreaterThan(heroIndex);
    expect(ledgerIndex).toBeGreaterThan(actionsIndex);
    expect(certificaciones).toContain('<UMButton href="/contacto">Solicitar documentación</UMButton>');
    expect(cssBlock(certificaciones, '.cert-page__ledger article')).toMatch(/grid-template-columns:\s*64px minmax\(0, 1fr\);/);
    expect(cssBlock(certificaciones, '.cert-page__ledger strong')).toMatch(/display:\s*block/);
  });

  test('footer utility links resolve to real utility pages instead of sector fallback', () => {
    const footer = read('src/components/v4/FooterV4.astro');

    expect(footer).toContain('href="/privacidad"');
    expect(footer).toContain('href="/terminos"');
    expect(() => read('src/pages/privacidad.astro')).not.toThrow();
    expect(() => read('src/pages/terminos.astro')).not.toThrow();
  });

  test('commercial GEO dossier does not use sub-16px visible text', () => {
    const geoHubDossier = read('src/components/templates/GeoHubDossier.astro');

    expect(geoHubDossier).not.toMatch(/font-size:\s*(0\.[0-9]+rem|1[0-5]px)/);
    expect(cssBlock(geoHubDossier, '.geo-budget-brief__note')).toMatch(/font-size:\s*1rem;/);
  });
});
