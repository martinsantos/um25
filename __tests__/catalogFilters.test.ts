import { catalogState, matchesCatalog, orderCatalog } from '../src/components/proto/catalogFilters';

const airport = { sector: 'aeropuertos', services: ['101', '107'], year: '2024', client: 'Aeropuertos Argentina 2000', search: 'Aeropuertos Argentina 2000 · Instalación de detección de incendios', status: 'mantenimiento' };
const government = { sector: 'gobiernosectorpublico', services: ['104'], year: '2020', client: 'Municipalidad de Guaymallén', search: 'Municipalidad de Guaymallén · Software de gestión', status: 'verificado' };

test('shared old service/year links still constrain results after a sort interaction', () => {
  const state = catalogState(new URLSearchParams('servicio=107&anio=2024&orden=client'));
  expect([airport, government].filter(it => matchesCatalog(it, state))).toEqual([airport]);
});
test('search finds accented client and scope with unaccented typing', () => {
  expect(matchesCatalog(government, { q: 'guaymallen' })).toBe(true);
  expect(matchesCatalog(airport, { q: 'deteccion de incendios' })).toBe(true);
  expect(matchesCatalog(government, { q: 'incendios' })).toBe(false);
});
test('existing client slug, period and maintenance filter combine without broadening results', () => {
  const state = catalogState(new URLSearchParams('cliente=aeropuertos-argentina-2000&periodo=2024&estado=mantenimiento'));
  expect([airport, government].filter(it => matchesCatalog(it, state))).toEqual([airport]);
  expect(matchesCatalog(airport, { ...state, periodo: '2020' })).toBe(false);
});
test('software and government links remain useful with the physical-sector catalog', () => {
  expect(matchesCatalog(government, { sector: 'software' })).toBe(true);
  expect(matchesCatalog(government, { sector: 'gobierno' })).toBe(true);
});
test('sorting preserves the original list for reset and handles chronological order', () => {
  const source = [airport, government];
  expect(orderCatalog(source, 'year-asc')).toEqual([government, airport]);
  expect(source).toEqual([airport, government]);
  expect(orderCatalog(source, 'client')).toEqual([airport, government]);
});
