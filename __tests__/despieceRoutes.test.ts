import { despieceRoute, publicDespiecePath } from '../src/lib/despieceRoutes';

describe('Despiece public routing', () => {
  test.each(['/', '/contacto', '/servicios/101', '/sectores/salud', '/antecedentes/100/obra', '/blog/una-nota', '/en/contact', '/antecedentes/datos.json'])('renders %s from the delivered page', path => {
    expect(despieceRoute(path)).toEqual({ rewrite: '/propuesta' + (path === '/' ? '' : path) });
  });
  test.each(['/software', '/seguridad-electronica', '/api/contact', '/api/monitoring/services', '/dge/login', '/status/', '/directus/admin', '/admin/', '/plantilla-arca/', '/estilo/fuentes/plantilla', '/downloads/presupuesto.xlsx', '/servicios/101/ficha', '/blog/og/nota.jpg', '/blog/categoria/redes', '/sgi', '/aceite', '/propuesta-maliciosa', '//externo.test', '/servicios/999'])('preserves operational or out-of-scope route %s', path => {
    expect(despieceRoute(path)).toBeNull();
  });
  test.each(['POST', 'PUT', 'DELETE', 'OPTIONS'])('does not rewrite %s requests', method => {
    expect(despieceRoute('/contacto', method)).toBeNull();
    expect(despieceRoute('/propuesta/contacto', method)).toBeNull();
  });
  test.each([['/propuesta', '/'], ['/propuesta/antecedentes', '/antecedentes'], ['/servicios/101/redes', '/servicios/101'], ['/bodegas', '/sectores/bodegas'], ['/sectores/software', '/software'], ['/sectores/seguridad-electronica', '/seguridad-electronica'], ['/en/contacto', '/en/contact']])('keeps old URL %s reachable', (path, destination) => {
    expect(despieceRoute(path)).toEqual({ redirect: destination });
  });
  test('internal render paths have public canonicals', () => {
    expect(publicDespiecePath('/propuesta')).toBe('/');
    expect(publicDespiecePath('/propuesta/antecedentes/17/obra')).toBe('/antecedentes/17/obra');
    expect(publicDespiecePath('/propuesta-other')).toBe('/propuesta-other');
  });
});
