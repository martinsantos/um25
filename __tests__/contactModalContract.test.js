const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

describe('global contact modal contract', () => {
  test('LayoutV4 renders the contextual contact modal globally', () => {
    const layout = read('src/layouts/LayoutV4.astro');

    expect(layout).toContain("import ContactModal from '../components/um/ContactModal.astro'");
    expect(layout).toContain('<ContactModal />');
  });

  test('contact modal keeps the visible form simple and sends context invisibly', () => {
    const modal = read('src/components/um/ContactModal.astro');
    const formSource = modal.slice(
      modal.indexOf('<form id="umContactModalForm"'),
      modal.indexOf('</form>') + '</form>'.length
    );

    const visibleFieldNames = Array.from(formSource.matchAll(/<(?:input|textarea|select)\b[^>]*\sname="([^"]+)"/g))
      .map((match) => match[1])
      .filter((name) => ![
        'website',
        'contact_phone',
        'startedAt',
        'formVariant',
        'contactProof',
        'originPath',
        'originTitle',
        'originLabel',
        'originIntent',
        'originHref',
      ].includes(name));

    expect(visibleFieldNames).toEqual(['name', 'email', 'company', 'message']);
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('data-contact-context');
    expect(modal).toContain('data-contact-prompt');
    expect(modal).toContain('contactHref(source)');
    expect(modal).toContain('Enviar por email');
    expect(modal).toContain('buildFallbackMailto()');
  });

  test('contact API sends by default instead of blocking on hidden browser proof', () => {
    const api = read('src/pages/api/contact.ts');

    expect(api).toContain('const duplicateMap = new Map<string, number>();');
    expect(api).not.toContain('hasInvalidModalProof(data)');
    expect(api).not.toContain('isInvalidFormTiming(data.startedAt)');
    expect(api).not.toContain('isSpam({ ...data');
    expect(api).toContain('function isDuplicateSubmission(email: string, message: string): boolean');
    expect(api).not.toContain('isDuplicateSubmission(clientIP');
    expect(api).toContain('trimString(data.originPath');
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
    expect(form).toContain('Enviala por email');
    expect(form).toMatch(/const mailto = \(body: string\) =>/);
    expect(form).toContain("['contacto', 'ultimamilla.com.ar'].join('@')");
    expect(form).toContain("['mai', 'lto:'].join('')");
    expect(form).toMatch(/catch \(err\) \{[\s\S]*link\.href = mailto\(/);
    expect(form).toContain('role="alert"');
    for (const source of [page, form]) {
      expect(source).not.toContain('mailto:contacto@ultimamilla.com.ar');
    }
  });
});
