const fs = require('fs');
const path = require('path');

describe('UMCLI release audit contracts', () => {
  test('production UMCLI audit cross-checks GEO totals and legacy aliases', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'scripts/umcli-contract-audit.mjs'), 'utf8');

    expect(source).toContain('/api/umcli.json');
    expect(source).toContain('/geo/image-evidence.json');
    expect(source).toContain('totalServicios');
    expect(source).toContain('totalAntecedentes');
    expect(source).toContain('totalCasosExito');
    expect(source).toContain('totalBlogPosts');
    expect(source).toContain('blog_posts');
    expect(source).toContain('titulo');
    expect(source).toContain('nombre');
    expect(source).toContain('descripcion');
    expect(source).toContain('resumen');
    expect(source).toContain('fecha_publicacion');
    expect(source).toContain('cliente');
    expect(source).toContain('area');
    expect(source).toContain('servicios.length === stats.totalServicios');
    expect(source).toContain('antecedentes.length === stats.totalAntecedentes');
    expect(source).toContain('stats.totalAntecedentes === expectedAntecedentes');
    expect(source).toContain('stats.totalCasosExito === expectedAntecedentes');
  });
});
