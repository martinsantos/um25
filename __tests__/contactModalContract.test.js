const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

describe('single contextual contact form', () => {
  test('the site shell links to the existing form', () => {
    for (const file of ['src/layouts/LayoutV4.astro','src/components/proto/Cierre.astro']) {
      expect(read(file)).toContain('<ContactLinks />');
      expect(read(file)).not.toContain('<ContactModal');
    }
    expect(read('src/components/um/ContactLinks.astro')).not.toContain('<form');
    for (const file of ['src/pages/propuesta/contacto.astro','src/pages/propuesta/en/contact.astro']) {
      expect(read(file).match(/<ContactForm\b/g)).toHaveLength(1);
    }
  });

  test('the contact form submits the originating page and selections', () => {
    const form = read('src/components/cine/ContactForm.astro');
    expect(form).toContain('contextualParams(incoming, from)');
    expect(form).toContain('originPath: root.dataset.originPath');
    expect(form).toContain('checked={selectedServices.has(s.toLowerCase())}');
  });

  test('contact API sends by default instead of blocking on hidden browser proof', () => {
    const api = read('src/pages/api/contact.ts');

    expect(api).not.toContain('hasInvalidModalProof(data)');
    expect(api).not.toContain('isInvalidFormTiming(data.startedAt)');
    expect(api).not.toContain('isSpam({ ...data');
    expect(api).toContain("trimString(data['originPath']");
    expect(api).toContain('Contexto de origen');
  });

  test('contact page error state offers direct email fallback', () => {
    // Rediseño 2026-09: el formulario de /contacto vive en ContactForm (cine).
    // La garantía es la misma: ante un error de envío se ofrece un mailto armado
    // en el cliente con la consulta completa, sin email literal en el HTML SSR.
    const page = read('src/pages/contacto.astro');
    const form = read('src/components/cine/ContactForm.astro');

    expect(page).toContain("import ContactForm from '../components/cine/ContactForm.astro'");
    expect(page).toContain('<ContactForm />');
    expect(form).toContain('Enviar por email');
    expect(form).toMatch(/const mailto = \(body: string\) =>/);
    expect(form).toContain("['contacto', 'ultimamilla.com.ar'].join('@')");
    expect(form).toContain("['mai', 'lto:'].join('')");
    expect(form).toMatch(/const updateEmailFallback = \(\) => \{[\s\S]*errorEmail\.href = mailto\(/);
    expect(form).toMatch(/catch \(err\) \{[^]*?errorBox\.hidden = false;\s*updateEmailFallback\(\);/);
    expect(form).toContain('role="alert"');
    for (const source of [page, form]) {
      expect(source).not.toContain('mailto:contacto@ultimamilla.com.ar');
    }
  });
});
