import { publicCaseFor, samePublicClient } from '../src/components/proto/casePresentation';
import { CASOS_DESTACADOS } from '../src/data/propuesta/casos-destacados';

describe('public identity in editorial cases', () => {
  test('anonymous labels never relate separate projects', () => {
    expect(samePublicClient('Cliente Confidencial', 'Cliente Confidencial')).toBe(false);
    expect(samePublicClient('Sin datos', 'Sin datos')).toBe(false);
    expect(samePublicClient('Empresa S.A.', 'Empresa SA')).toBe(false);
    expect(samePublicClient('Bódega Norte', 'bodega norte')).toBe(true);
  });
  test('every curated case can render for its verified public client', () => {
    for (const record of CASOS_DESTACADOS) expect(publicCaseFor(record)).toBe(record);
  });
  test('a later CMS anonymization or reassignment disables the historical override', () => {
    const record = CASOS_DESTACADOS[0];
    expect(publicCaseFor({ id: record.id, client: 'Cliente Confidencial' })).toBeUndefined();
    expect(publicCaseFor({ id: record.id, client: 'Otro cliente' })).toBeUndefined();
    expect(publicCaseFor({ id: 3552, client: 'Cliente Confidencial' })).toBeUndefined();
  });
});
