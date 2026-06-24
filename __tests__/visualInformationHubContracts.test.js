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
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__sector-links\s*\{[\s\S]*overscroll-behavior-inline:\s*contain;/);
    expect(antecedentesEditorial).toMatch(/rail\.scrollLeft\s*=\s*Math\.max\(0,\s*targetLeft\);/);
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
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__actions a:first-child:hover,[\s\S]*\.ante-dossier__actions a:first-child:focus-visible\s*\{[\s\S]*color:\s*#fff;/);
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__actions a \+ a:hover,[\s\S]*\.ante-dossier__actions a \+ a:focus-visible\s*\{[\s\S]*background:\s*#111;/);
  });

  test('antecedentes archive exposes a crawlable complete index of case links', () => {
    const source = read('src/pages/antecedentes/index.astro');

    expect(source).toContain('crawlableAntecedenteIndex');
    expect(source).toContain('Índice completo de antecedentes');
    expect(source).toContain('Todos los antecedentes técnicos');
    expect(source).toContain('href={item.href}');
  });

  test('antecedentes archive keeps crawlable view and sort controls', () => {
    const source = read('src/pages/antecedentes/index.astro');

    expect(source).toContain("archiveView: ['list', 'grid'].includes(requestedView) ? requestedView : 'list'");
    expect(source).toContain("archiveSort: ['newest', 'oldest', 'client'].includes(requestedSort) ? requestedSort : 'newest'");
    expect(antecedentesEditorial).toContain('data-view-control={option.id}');
    expect(antecedentesEditorial).toContain('data-sort-control={option.id}');
    expect(antecedentesEditorial).toContain('Más recientes');
    expect(antecedentesEditorial).toMatch(/\.ante-dossier__archive--grid \.ante-dossier__ledger\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
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

    expect(home).toMatch(/\.um-evidence-ledger :global\(\.evidence-case-row\)\s*\{[\s\S]*grid-template-columns:\s*3rem 136px minmax\(0,\s*1fr\) minmax\(4\.5rem,\s*5rem\) auto;/);
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

  test('blog single keeps the reading sidebar and removes repeated commercial header CTAs', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const layoutIndex = blogSingle.indexOf('class="article-layout"');
    const tocIndex = blogSingle.indexOf('<BlogTOC headings={headings} title={articleTitle} />');
    const proseIndex = blogSingle.indexOf('class="prose"');

    expect(tocIndex).toBeGreaterThan(layoutIndex);
    expect(proseIndex).toBeGreaterThan(tocIndex);
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

    expect(normalizer).toContain("const canonicalizedHtml = (html || '').replace");
    expect(normalizer).toContain('replace(/https?:');
    expect(normalizer).toContain('ultimamilla');
    expect(normalizer).toContain('siteUrl');
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

  test('blog single shows an editorial cover image before article prose', () => {
    const blogSingle = read('src/pages/blog/[slug].astro');
    const metaIndex = blogSingle.indexOf('class="author-row"');
    const coverIndex = blogSingle.indexOf('class="article-cover"');
    const proseIndex = blogSingle.indexOf('class="prose"');

    expect(blogSingle).toContain('blogPostImageAlt');
    expect(coverIndex).toBeGreaterThan(metaIndex);
    expect(proseIndex).toBeGreaterThan(coverIndex);
    expect(blogSingle).toMatch(/\.article-cover\s*\{[\s\S]*aspect-ratio:\s*16\s*\/\s*9;/);
    expect(blogSingle).toMatch(/\.article-cover img\s*\{[\s\S]*object-fit:\s*cover;/);
  });

  test('blog index stays readable without a duplicated featured banner or repeated header CTAs', () => {
    const blogIndex = read('src/pages/blog/index.astro');
    const headerIndex = blogIndex.indexOf('class="blog-header"');
    const archiveIndex = blogIndex.indexOf('class="blog-archive"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(archiveIndex).toBeGreaterThan(headerIndex);
    expect(blogIndex).not.toContain("import { blogPostImageAlt, blogPostImageUrl }");
    expect(blogIndex).not.toContain('blog-header__feature');
    expect(blogIndex).not.toContain('src={heroImgUrl}');
    expect(blogIndex).not.toContain('blog-header__actions');
    expect(blogIndex).not.toContain('Solicitar diagnóstico');
    expect(blogIndex).not.toContain('<BlogHero post={hero} />');
    expect(blogIndex).not.toMatch(/<section class="blog-feature"/);
  });

  test('blog index mobile proofline wraps long evidence without viewport overflow', () => {
    const blogIndex = read('src/pages/blog/index.astro');

    expect(blogIndex).toMatch(/\.blog-proofline div\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*124px\) minmax\(0,\s*1fr\);/);
    expect(blogIndex).toMatch(/\.blog-proofline dt\s*\{[\s\S]*white-space:\s*normal;/);
    expect(blogIndex).toMatch(/\.blog-proofline dt\s*\{[\s\S]*overflow-wrap:\s*anywhere;/);
  });

  test('services mobile proofline avoids narrow three-column word breaks', () => {
    const servicios = read('src/pages/servicios/index.astro');

    expect(servicios.indexOf('class="um-section services-index"')).toBeLessThan(servicios.indexOf('<TrustStrip />'));
    expect(servicios).toMatch(/\.services-intent-ctas\s*\{[\s\S]*border:\s*0;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-hero__visual\s*\{[\s\S]*display:\s*none;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-dossier__folio\s*\{[\s\S]*order:\s*1;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-dossier__list\s*\{[\s\S]*order:\s*0;/);
    expect(servicios).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-hero__proofline\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
    expect(servicios).toMatch(/\.services-hero__proofline div,[\s\S]*\.services-hero__proofline div \+ div\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*96px\) minmax\(0,\s*1fr\);/);
    expect(servicios).toMatch(/\.services-hero__proofline dt\s*\{[\s\S]*white-space:\s*normal;/);
    expect(servicios).toMatch(/\.services-hero__proofline dd\s*\{[\s\S]*overflow-wrap:\s*anywhere;/);
    expect(servicios).not.toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*\.services-hero__proofline\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
  });

  test('services dark product band avoids off-brand red microtext', () => {
    const servicios = read('src/pages/servicios/index.astro');

    expect(servicios).not.toContain('#fca5a5');
    expect(cssBlock(servicios, '.services-product-feature__eyebrow')).toMatch(/color:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);/);
    expect(servicios).toMatch(/\.services-product-feature__eyebrow\)\s*\{[\s\S]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.72\) !important;/);
  });

  test('contact feedback links use canonical UMSA red only', () => {
    const contacto = read('src/pages/contacto.astro');
    const modal = read('src/components/um/ContactModal.astro');

    expect(contacto).not.toContain('#B91C1C');
    expect(modal).not.toContain('#B91C1C');
    expect(cssBlock(contacto, '.form-message a')).toMatch(/color:\s*var\(--um-red\);/);
    expect(cssBlock(modal, '.um-contact-message a')).toMatch(/color:\s*var\(--um-red\);/);
    expect(cssBlock(contacto, '.form-message.error')).toMatch(/border-color:\s*rgba\(220,38,38,0\.28\);/);
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

  test('service detail equipment heading stays in one readable column', () => {
    const serviceDetail = read('src/pages/servicios/[id]/[slug].astro');
    const globalCss = read('src/styles/v4.css');
    const headGrid = cssBlock(serviceDetail, '.service-products-head :global(.um-section-header)');
    const titleBlock = cssBlock(serviceDetail, '.service-products-head :global(.um-section-header h2)');
    const globalHeadGrid = cssBlock(globalCss, 'body main .service-products-head .um-section-header');
    const globalTitleBlock = cssBlock(globalCss, 'body main .service-products-head .um-section-header h2');

    expect(headGrid).toMatch(/grid-template-columns:\s*minmax\(0,\s*780px\);/);
    expect(headGrid).toMatch(/"kicker"[\s\S]*"title"[\s\S]*"text"/);
    expect(titleBlock).toMatch(/overflow-wrap:\s*normal;/);
    expect(titleBlock).toMatch(/word-break:\s*normal;/);
    expect(globalHeadGrid).toMatch(/grid-template-columns:\s*minmax\(0,\s*780px\)\s*!important;/);
    expect(globalHeadGrid).toMatch(/"kicker"[\s\S]*"title"[\s\S]*"text"/);
    expect(globalTitleBlock).toMatch(/overflow-wrap:\s*normal\s*!important;/);
    expect(globalTitleBlock).toMatch(/word-break:\s*normal\s*!important;/);
    expect(serviceDetail).not.toMatch(/\.service-products-head\s+:global\(\.um-section-header\)\s*\{[\s\S]*grid-template-columns:\s*minmax\(220px,\s*0\.34fr\)/);
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
    expect(cssBlock(serviceDetail, '.service-info-ledger div')).toMatch(/grid-template-columns:\s*minmax\(148px,\s*0\.48fr\) minmax\(0,\s*0\.52fr\);/);
    expect(serviceDetail).toMatch(/:global\(\.service-info-primary\)[\s\S]*width:\s*100%;/);
    expect(serviceDetail).toMatch(/\.service-info-secondary\s*\{[\s\S]*background:\s*transparent;/);
  });

  test('blog category stays readable without a duplicated featured banner or repeated header CTAs', () => {
    const blogCategory = read('src/pages/blog/categoria/[cat].astro');
    const headerIndex = blogCategory.indexOf('class="blog-header"');
    const archiveIndex = blogCategory.indexOf('class="blog-archive"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(archiveIndex).toBeGreaterThan(headerIndex);
    expect(blogCategory).not.toContain("import { blogPostImageAlt, blogPostImageUrl }");
    expect(blogCategory).not.toContain('const heroImgUrl = hero ? blogPostImageUrl(hero)');
    expect(blogCategory).not.toContain('blog-header__feature');
    expect(blogCategory).not.toContain('src={heroImgUrl}');
    expect(blogCategory).not.toContain('blog-header__actions');
    expect(blogCategory).not.toContain('Solicitar diagnóstico');
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

  test('commercial GEO dossier does not use sub-16px visible text', () => {
    const geoHubDossier = read('src/components/templates/GeoHubDossier.astro');

    expect(geoHubDossier).not.toMatch(/font-size:\s*(0\.[0-9]+rem|1[0-5]px)/);
    expect(cssBlock(geoHubDossier, '.geo-budget-brief__note')).toMatch(/font-size:\s*1rem;/);
  });
});
