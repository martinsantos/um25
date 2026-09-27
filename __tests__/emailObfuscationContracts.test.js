const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();

const ssrHtmlSources = [
  'src/pages/index.astro',
  'src/components/v4/FooterV4.astro',
  'src/components/um/ContactModal.astro',
  'src/pages/contacto.astro',
  'src/components/cine/ContactForm.astro',
  'src/pages/privacidad.astro',
  'src/pages/terminos.astro',
  'src/pages/antecedentes/index.astro',
  'src/pages/antecedentes/[id]/[slug].astro',
  'src/pages/antecedentes/_[slug].astro',
  'src/pages/servicios/[id]/[slug].astro',
];

describe('Email obfuscation contracts', () => {
  test('public SSR body sources do not expose literal mailto addresses that trigger Cloudflare email rewrite', () => {
    for (const relativePath of ssrHtmlSources) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

      expect(source).not.toMatch(/mailto:[^"'\s>]*@ultimamilla\.com\.ar/i);
    }
  });

  test('public SSR body sources route visible UMSA email links through the client-side EmailLink component', () => {
    const footer = fs.readFileSync(path.join(repoRoot, 'src/components/v4/FooterV4.astro'), 'utf8');
    const contacto = fs.readFileSync(path.join(repoRoot, 'src/pages/contacto.astro'), 'utf8');

    expect(footer).toContain("import EmailLink from '../common/EmailLink.astro'");
    expect(footer).toContain('<EmailLink');
    expect(contacto).toContain("import EmailLink from '../components/common/EmailLink.astro'");
    expect(contacto).toContain('<EmailLink');
    expect(contacto).not.toMatch(/>\s*contacto@ultimamilla\.com\.ar\s*</i);
    expect(contacto).not.toMatch(/data-copy=\{email\}|data-copy="[^"]*@/);
  });

  test('public service CTAs do not render literal email addresses as visible body text', () => {
    const serviceDetail = fs.readFileSync(path.join(repoRoot, 'src/pages/servicios/[id]/[slug].astro'), 'utf8');

    expect(serviceDetail).not.toContain('secondaryButtonText="contacto@ultimamilla.com.ar"');
    expect(serviceDetail).not.toMatch(/>\s*contacto@ultimamilla\.com\.ar\s*</i);
  });

  test('case detail email CTA keeps its visible action label when routed through EmailLink', () => {
    const caseDetail = fs.readFileSync(path.join(repoRoot, 'src/pages/antecedentes/[id]/[slug].astro'), 'utf8');

    expect(caseDetail).toMatch(/<EmailLink[^>]*>\s*<span[\s\S]*?Enviar email\s*<\/EmailLink>/);
  });
});
