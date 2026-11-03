const { CASOS, casoDe, cerrarTexto } = require('../src/components/proto/relato');
const { antecedentesReales } = require('../src/data/antecedentes_completos.js');

const origenPorId = new Map(antecedentesReales.map((row) => [row.id, row]));

describe('relato editorial de casos', () => {
  test.each([
    [10728, '50 centros de impresión operativos para la sala de prensa.'],
    [11146, 'Notifier NFS-320-SP.'],
  ])('cierra la descripción limitada del origen sin dejar palabras cortadas (%i)', (id, expectedEnd) => {
    const row = origenPorId.get(id);
    expect(row).toBeDefined();
    const text = cerrarTexto(row.Descripcion, row.Cliente);
    expect(text.endsWith(expectedEnd)).toBe(true);
    expect(text).not.toMatch(/\b(?:WI|Detec)\.$/);
  });

  test('enlaza sólo los cuatro cruces inequívocos con fichas publicadas', () => {
    expect([11158, 11179, 11174, 11162].map((id) => casoDe(id)?.publicado)).toEqual([3140, 3085, 3103, 3116]);
  });

  test('conserva fallback sectorial cuando no hay cruce de ficha inequívoco', () => {
    expect(casoDe(11166)?.publicado).toBeUndefined();
    expect(casoDe(10740)?.publicado).toBeUndefined();
    expect(CASOS.find((item) => item.id === 10740)?.publicado).toBeUndefined();
  });
});
