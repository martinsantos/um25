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
  });

  test('contact API preserves invisible antispam and contextual email metadata', () => {
    const api = read('src/pages/api/contact.ts');

    expect(api).toContain('const duplicateMap = new Map<string, number>();');
    expect(api).toContain('hasInvalidModalProof(data)');
    expect(api).toContain('trimString(data.originPath');
    expect(api).toContain('Contexto de origen');
    expect(api).toContain('trimString(data.contact_phone');
  });
});
