const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

describe('UM Sans local website sample', () => {
  test('keeps the sample isolated, noindex, and on the public UM Sans family', () => {
    const route = fs.readFileSync(path.join(root, 'src/pages/estilo/muestra.astro'), 'utf8');

    expect(route).toContain("import LayoutV4 from '../../layouts/LayoutV4.astro';");
    expect(route).toContain('noindex={true}');
    expect(route).toContain('UM Sans 1.2 Production');
    expect(route).toContain('var(--um-font-body)');
    expect(route).toContain('class="um-local-hero"');
    expect(route).toContain('class="um-local-service-grid"');
    expect(route).toContain('class="um-local-type-sample"');
    expect(route).toContain('class="um-local-tour-grid"');
    expect(route.match(/id: 'tour-/g)).toHaveLength(8);
    expect(route).toContain("href: '/blog'");
    expect(route).toContain("href: '/certificaciones'");
    expect(route).not.toContain('UM Sans 2');
  });

  test('updates the interactive style guide to the production typography release', () => {
    const guide = fs.readFileSync(path.join(root, 'src/assets/estilo/sistema-estilo-umsa.html'), 'utf8');

    expect(guide).toContain('UM Sans 1.2 Production');
    expect(guide).toContain('href="/estilo/muestra"');
    expect(guide).toContain('Body: UM Sans mínimo 12pt / 24hp');
    expect(guide).not.toContain('UM Sans 1.1 Editorial RC');
  });
});
