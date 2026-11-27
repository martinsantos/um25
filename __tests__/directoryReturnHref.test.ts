import { directoryReturnHref } from '../src/data/navigation';

describe('returning to a directory card', () => {
  test('a printable technical sheet returns to its service', () => {
    expect(directoryReturnHref('/servicios', '/servicios/108/ficha/')).toBe('/servicios#ficha-108');
  });

  test('keeps the same behavior for listed sector pages and unrelated routes', () => {
    expect(directoryReturnHref('/sectores', '/sectores/bodegas')).toBe('/sectores#ficha-bodegas');
    expect(directoryReturnHref('/servicios', '/servicios/108/otra-ruta')).toBe('/servicios');
  });
});
