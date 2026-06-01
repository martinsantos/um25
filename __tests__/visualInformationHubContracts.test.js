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
    expect(antecedentesEditorial).toMatch(/mask-image:\s*linear-gradient\(90deg,\s*transparent 0,\s*#000 14px,\s*#000 calc\(100% - 28px\),\s*transparent 100%\)/);
    expect(antecedentesEditorial).toMatch(/window\.matchMedia\('\(max-width: 720px\)'\)\.matches \? 'start' : 'nearest'/);
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
    const home = read('src/pages/index.astro');

    expect(home).not.toContain('<i aria-hidden="true"></i>');
    expect(home).not.toMatch(/\.um-service-unit__head i\s*\{/);
    expect(home).toMatch(/\.um-service-unit__head\s*\{[\s\S]*justify-content:\s*flex-start;/);
  });

  test('antecedentes hero secondary action renders as an intentional muted button, not loose text', () => {
    const actionsBlock = cssBlock(antecedentesEditorial, '.ante-dossier__actions a + a');

    expect(actionsBlock).toMatch(/background:\s*#eef0f2;/);
    expect(actionsBlock).toMatch(/color:\s*#111;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__actions a:first-child:hover\s*\{[\s\S]*color:\s*#fff;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__actions a \+ a:hover\s*\{[\s\S]*background:\s*#e1e4e8;/);
  });

  test('evidence case rows reserve enough copy width to avoid broken client names', () => {
    const evidenceRow = read('src/components/um/EvidenceCaseRow.astro');
    const rowBlock = cssBlock(evidenceRow, '.evidence-case-row');
    const titleBlock = cssBlock(evidenceRow, '.evidence-case-row h3');

    expect(rowBlock).toMatch(/grid-template-columns:\s*2\.75rem 128px minmax\(220px,\s*1fr\) minmax\(148px,\s*0\.45fr\) auto;/);
    expect(titleBlock).toMatch(/overflow-wrap:\s*normal;/);
    expect(titleBlock).toMatch(/word-break:\s*normal;/);
    expect(titleBlock).toMatch(/hyphens:\s*none;/);
  });

  test('home secondary evidence rows remove repeated sector metadata to prevent compressed words', () => {
    const home = read('src/pages/index.astro');

    expect(home).toMatch(/\.um-evidence-ledger :global\(\.evidence-case-row\)\s*\{[\s\S]*grid-template-columns:\s*2\.75rem 128px minmax\(260px,\s*1fr\) 72px auto;/);
    expect(home).toMatch(/\.um-evidence-ledger :global\(\.evidence-case-row__meta-group\)\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(home).toMatch(/\.um-evidence-ledger :global\(\.evidence-case-row__meta:first-child\)\s*\{[\s\S]*display:\s*none;/);
  });

  test('home service visual loads reliably for full-page visual QA', () => {
    const home = read('src/pages/index.astro');

    expect(home).toContain('class="um-services-command__visual"');
    expect(home).toContain('loading="eager" decoding="async" fetchpriority="low"');
    expect(home).not.toMatch(/um-services-command__visual"[^>]*>[\s\S]{0,180}<img[^>]+loading="lazy"/);
  });

  test('contact antispam field stays visually hidden without offscreen overflow', () => {
    const contacto = read('src/pages/contacto.astro');
    const honeypotBlock = cssBlock(contacto, '.contact-hp');

    expect(contacto).toContain('name="website" class="contact-hp"');
    expect(honeypotBlock).not.toMatch(/left:\s*-[0-9]/);
    expect(honeypotBlock).not.toMatch(/top:\s*-[0-9]/);
    expect(honeypotBlock).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(honeypotBlock).toMatch(/overflow:\s*hidden/);
    expect(honeypotBlock).toMatch(/visibility:\s*hidden/);
    expect(contacto).toMatch(/\.contact-form\s*\{[\s\S]*position:\s*relative;/);
    expect(contacto).toMatch(/\.contact-form\s*\{[\s\S]*scroll-margin-top:\s*clamp\(84px,\s*10vw,\s*112px\)/);
  });

  test('contact keeps the public form to four visible fields and invisible antispam only', () => {
    const contacto = read('src/pages/contacto.astro');
    const formSource = contacto.slice(
      contacto.indexOf('<form id="contactForm"'),
      contacto.indexOf('</form>') + '</form>'.length
    );
    const visibleFieldNames = Array.from(formSource.matchAll(/<(?:input|textarea|select)\b[^>]*\sname="([^"]+)"/g))
      .map((match) => match[1])
      .filter((name) => !['website', 'startedAt'].includes(name));

    expect(visibleFieldNames).toEqual(['name', 'email', 'company', 'message']);
    expect(contacto).not.toContain('BudgetBriefFields');
    expect(contacto).not.toContain('contact-budget-details');
    expect(contacto).toContain('class="contact-primary-cta"');
    expect(formSource.indexOf('class="contact-submit-row"')).toBeGreaterThan(formSource.indexOf('name="message"'));
    expect(formSource.indexOf('class="contact-submit-row"')).toBeLessThan(formSource.indexOf('id="successMessage"'));
  });

  test('blog single exposes a first-fold commercial action before media and article body', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const actionsIndex = blogSingle.indexOf('article-hero-actions');
    const imageIndex = blogSingle.indexOf('hero-figure');
    const proseIndex = blogSingle.indexOf('class="prose"');

    expect(actionsIndex).toBeGreaterThan(-1);
    expect(imageIndex).toBeGreaterThan(actionsIndex);
    expect(proseIndex).toBeGreaterThan(actionsIndex);
    expect(blogSingle).toContain('href={heroPrimaryHref}');
    expect(blogSingle).toContain('href={heroSecondaryHref}');
  });

  test('blog single secondary actions render as deliberate buttons, not loose underlined text', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');

    const heroSecondaryBlock = cssBlock(blogSingle, '.article-hero-actions__secondary');
    const commercialSecondaryBlock = cssBlock(blogSingle, '.article-commercial-fold__cta--secondary');
    const mobileHeroActionsBlock = blogSingle.match(/@media[\s\S]*?\.article-hero-actions\s*\{([\s\S]*?)\}/)?.[1] || '';

    expect(heroSecondaryBlock).toMatch(/background:\s*#eef0f2/);
    expect(heroSecondaryBlock).not.toMatch(/box-shadow:\s*inset\s+0\s+-[12]px/);
    expect(commercialSecondaryBlock).toMatch(/background:\s*#e9ecef/);
    expect(commercialSecondaryBlock).not.toMatch(/box-shadow:\s*inset\s+0\s+-[12]px/);
    expect(mobileHeroActionsBlock).toMatch(/grid-template-columns:\s*1fr/);
    expect(blogSingle).toMatch(/\.article-hero-actions a\s*\{[\s\S]*min-height:\s*48px/);
    expect(blogSingle).toMatch(/\.article-hero-actions a\s*\{[\s\S]*text-decoration:\s*none/);
  });

  test('blog single H1 keeps the complete editorial title instead of truncating with ellipsis', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const titleBuilderStart = blogSingle.indexOf('const buildArticleTitle');
    const titleBuilderEnd = blogSingle.indexOf('const editorialArticleTitle');
    const titleBuilder = blogSingle.slice(titleBuilderStart, titleBuilderEnd);

    expect(titleBuilder).toContain('return clean;');
    expect(titleBuilder).not.toMatch(/slice\(0,\s*72\)/);
    expect(titleBuilder).not.toMatch(/afterColon\.slice/);
    expect(titleBuilder).not.toContain('trimEnd()}…');
    expect(blogSingle).toContain('<h1 class="article-title">{articleTitle}</h1>');
  });

  test('blog index places the featured article image inside the first editorial viewport without duplicating the hero section', () => {
    const blogIndex = read('src/pages/blog/index.astro');
    const headerIndex = blogIndex.indexOf('class="blog-header"');
    const featureIndex = blogIndex.indexOf('blog-header__feature');
    const archiveIndex = blogIndex.indexOf('class="blog-archive"');

    expect(blogIndex).toContain("import { blogPostImageAlt, blogPostImageUrl }");
    expect(featureIndex).toBeGreaterThan(headerIndex);
    expect(archiveIndex).toBeGreaterThan(featureIndex);
    expect(blogIndex).toContain('src={heroImgUrl}');
    expect(blogIndex).not.toContain('<BlogHero post={hero} />');
    expect(blogIndex).not.toMatch(/<section class="blog-feature"/);
    expect(cssBlock(blogIndex, '.blog-header__feature')).toMatch(/align-items:\s*stretch;/);
    expect(cssBlock(blogIndex, '.blog-header__feature-media')).toMatch(/min-height:\s*100%;/);
    expect(cssBlock(blogIndex, '.blog-header__feature-body')).toMatch(/min-height:\s*clamp\(260px,\s*23vw,\s*348px\);/);
  });

  test('blog index mobile proofline keeps labels as single-line document fields', () => {
    const blogIndex = read('src/pages/blog/index.astro');

    expect(blogIndex).toMatch(/\.blog-proofline div\s*\{[\s\S]*grid-template-columns:\s*minmax\(124px,\s*max-content\) minmax\(0,\s*1fr\);/);
    expect(blogIndex).toMatch(/\.blog-proofline dt\s*\{[\s\S]*white-space:\s*nowrap;/);
    expect(blogIndex).toMatch(/\.blog-proofline dt\s*\{[\s\S]*overflow-wrap:\s*normal;/);
  });

  test('services mobile proofline avoids narrow three-column word breaks', () => {
    const servicios = read('src/pages/servicios/index.astro');

    expect(servicios.indexOf('class="um-section services-index"')).toBeLessThan(servicios.indexOf('<TrustStrip />'));
    expect(servicios).toMatch(/\.services-intent-ctas\s*\{[\s\S]*border:\s*0;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-hero__visual\s*\{[\s\S]*display:\s*none;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-dossier__folio\s*\{[\s\S]*order:\s*1;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-dossier__list\s*\{[\s\S]*order:\s*0;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-hero__proofline\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(servicios).toMatch(/\.services-hero__proofline div,[\s\S]*\.services-hero__proofline div \+ div\s*\{[\s\S]*grid-template-columns:\s*minmax\(96px,\s*max-content\) minmax\(0,\s*1fr\);/);
    expect(servicios).toMatch(/\.services-hero__proofline dt\s*\{[\s\S]*white-space:\s*nowrap;/);
    expect(servicios).toMatch(/\.services-hero__proofline dd\s*\{[\s\S]*overflow-wrap:\s*normal;/);
    expect(servicios).not.toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-hero__proofline\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
  });

  test('product sheets keep service detail images visible without decorative frames', () => {
    const productCard = read('src/components/v4/ProductCard.astro');

    expect(cssBlock(productCard, '.product-sheet__frame')).toMatch(/border:\s*0;/);
    expect(cssBlock(productCard, '.product-sheet__frame')).toMatch(/box-shadow:\s*none;/);
    expect(cssBlock(productCard, '.product-sheet__image')).toMatch(/height:\s*clamp\(240px,\s*32vw,\s*380px\);/);
    expect(productCard).toMatch(/@media \(max-width:\s*900px\)\s*\{[\s\S]*\.product-sheet__image\s*\{[\s\S]*height:\s*clamp\(220px,\s*62vw,\s*320px\);/);
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
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');
    const heroH1 = cssBlock(serviceDetail, '.service-detail-hero h1');

    expect(heroH1).toContain('max-width: min(760px, 22ch)');
    expect(heroH1).not.toMatch(/max-width:\s*1[0-6]ch/);
    expect(serviceDetail).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.service-detail-hero h1\s*\{[\s\S]*max-width:\s*100%;/);
  });

  test('service detail mobile breadcrumb does not leave a trailing separator when current item is hidden', () => {
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');

    expect(serviceDetail).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.service-detail-breadcrumb__current\s*\{[\s\S]*display:\s*none;/);
    expect(serviceDetail).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.service-detail-breadcrumb span:nth-last-child\(2\)\s*\{[\s\S]*display:\s*none;/);
  });

  test('service detail technical sidebar renders as a compact ledger instead of a redundant card', () => {
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');

    expect(serviceDetail).toContain('class="service-info-ledger"');
    expect(serviceDetail).not.toContain('<SectionHeader kicker="Ficha técnica" title={sidebarInfoTitle} />');
    expect(cssBlock(serviceDetail, '.service-info-card--dossier')).toMatch(/padding:\s*0;/);
    expect(cssBlock(serviceDetail, '.service-info-ledger div')).toMatch(/grid-template-columns:\s*minmax\(116px,\s*0\.44fr\) minmax\(0,\s*0\.56fr\);/);
    expect(serviceDetail).toMatch(/:global\(\.service-info-primary\)[\s\S]*width:\s*100%;/);
    expect(serviceDetail).toMatch(/\.service-info-secondary\s*\{[\s\S]*background:\s*transparent;/);
  });

  test('blog category uses the same first-viewport featured image system as the blog index', () => {
    const blogCategory = read('src/pages/blog/categoria/[cat].astro');
    const headerIndex = blogCategory.indexOf('class="blog-header"');
    const featureIndex = blogCategory.indexOf('blog-header__feature');
    const archiveIndex = blogCategory.indexOf('class="blog-archive"');

    expect(blogCategory).toContain("import { blogPostImageAlt, blogPostImageUrl }");
    expect(blogCategory).toContain('const heroImgUrl = hero ? blogPostImageUrl(hero)');
    expect(blogCategory).toContain('const heroDate = hero ? formatBlogDate(hero.fecha_publicacion)');
    expect(featureIndex).toBeGreaterThan(headerIndex);
    expect(archiveIndex).toBeGreaterThan(featureIndex);
    expect(blogCategory).toContain('src={heroImgUrl}');
    expect(blogCategory).not.toContain("import BlogHero");
    expect(blogCategory).not.toContain('<BlogHero post={hero} />');
    expect(blogCategory).not.toMatch(/<section class="blog-feature"/);
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
});
