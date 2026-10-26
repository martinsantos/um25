import { renderEditorialBody, stripMarketingFluff } from '../src/utils/editorialContent';

describe('antecedentes case body cleanup', () => {
  test.each([
    ['Implementación de redes para PREMIX S.A.', 'PREMIX S.A.'],
    ['Instalación para EQALQ S.R.L.', 'EQALQ S.R.L.'],
    ['Visita técnica para Headcomm S.A.', 'Headcomm S.A.'],
  ])('removes only the generic wrapper and preserves source scope for %s', (scope) => {
    const source = `Ejecución integral de ${scope} para Cliente Confidencial, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad.`;

    expect(stripMarketingFluff(source)).toBe(`${scope} para Cliente Confidencial.`);
  });

  test('preserves paragraph breaks while removing the exact generic wrapper', () => {
    const source = [
      'Ejecución integral de Implementación de redes para PREMIX S.A. para Cliente Confidencial, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad.',
      '',
      'La descripción conserva este segundo párrafo.',
    ].join('\n');

    expect(stripMarketingFluff(source)).toBe(
      'Implementación de redes para PREMIX S.A. para Cliente Confidencial.\n\nLa descripción conserva este segundo párrafo.',
    );
    expect(renderEditorialBody(source)).resolves.toContain('<p>La descripción conserva este segundo párrafo.</p>');
  });
});
