const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

describe('estilo DESIGN.md publication', () => {
  test('documents the visual, corporate skill, and blog skill sources', () => {
    const design = fs.readFileSync(path.join(root, 'src/assets/estilo/DESIGN.md'), 'utf8');

    expect(design).toContain('https://ultimamilla.com.ar/estilo');
    expect(design).toContain('https://ultimamilla.com.ar/estilo/skill.md');
    expect(design).toContain('https://ultimamilla.com.ar/estilo/blog/blogskill.md');
    expect(design).toContain('## 15. Fuentes Operativas');
  });

  test('publishes both markdown route variants requested for /estilo', () => {
    expect(fs.existsSync(path.join(root, 'src/pages/estilo/design.md.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/pages/estilo/design,md.ts'))).toBe(true);
  });
});
