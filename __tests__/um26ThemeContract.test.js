const fs = require('fs');
const path = require('path');

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('UM26 theme contract', () => {
  test('sector index defaults to the UM26 template and exposes its DOM marker', () => {
    const page = read('src/pages/sectores.astro');
    const template = read('src/components/templates/SectorIndexUM26.astro');

    expect(page).toContain("import SectorIndexUM26 from '../components/templates/SectorIndexUM26.astro'");
    expect(page).toContain(": 'um26'");
    expect(page).toContain('<SectorIndexUM26');
    expect(page).not.toContain("?? 'editorial'");
    expect(template).toContain('class="um26-sectors"');
    expect(template).not.toContain('sector-editorial');
  });

  test('dynamic sector pages default to the UM26 template and expose their DOM marker', () => {
    const page = read('src/pages/[sector].astro');
    const template = read('src/components/templates/SectorTemplateUM26.astro');

    expect(page).toContain("import SectorTemplateUM26 from '../components/templates/SectorTemplateUM26.astro'");
    expect(page).toContain(": 'um26'");
    expect(page).toContain('<SectorTemplateUM26');
    expect(page).not.toContain("?? 'editorial'");
    expect(template).toContain('class="um26-sector"');
    expect(template).not.toContain('sector-editorial');
  });

  test('antecedentes index renders the UM26 evidence experience and exposes its DOM marker', () => {
    const page = read('src/pages/antecedentes/index.astro');

    expect(page).toContain("import { getAntecedentes, getServicios } from '../../lib/um26-directus'");
    expect(page).toContain('class="um26-evidence"');
    expect(page).toContain('class="um26-evidence-hero"');
    expect(page).toContain('data-um26-search');
    expect(page).toContain('data-case-grid');
    expect(page).toContain('data-case-modal-backdrop');
    expect(page).not.toContain('AntecedentesTemplateEditorial');
    expect(page).not.toContain('class="ante-dossier"');
  });
});
