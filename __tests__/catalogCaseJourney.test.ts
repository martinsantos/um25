import { caseContextQuery } from '../src/components/proto/catalogFilters';
import type { Story } from '../src/components/proto/isoData';
import { catalogCaseJourney } from '../src/components/proto/catalogCaseJourney';
import { relatedCaseJourney, relatedCaseQuery } from '../src/components/proto/relatedCaseGroups';

jest.mock('../src/components/proto/isoData', () => ({ services: [] }));

const work = (id: number, year = 2024): Story => ({
  id,
  slug: 'control-de-acceso',
  href: `/antecedentes/${id}/control-de-acceso`,
  client: 'Aeropuertos Argentina 2000',
  title: 'Control de acceso',
  month: 10,
  year,
  sector: 'Aeropuertos',
  sectorSlug: 'aeropuertos',
  services: ['Seguridad electrónica'],
  serviceCodes: ['102'],
  image: '',
  summary: 'Adecuación de una puerta controlada.',
  status: 'verificado',
});

test('returns through contact to the same filtered selection, with safe catalogue fields only', () => {
  const story = work(3104);
  const list = [work(3110, 2023), story, work(3111, 2025)];
  const search = new URLSearchParams('desde=archivo&sector=aeropuertos&q=control+de+acceso&orden=year-asc&origen=%2Fotra');
  const journey = catalogCaseJourney(story, search, list)!;

  expect(journey.href).toBe('/antecedentes?sector=aeropuertos&q=control+de+acceso&orden=year-asc#resultado-um-3104');
  expect([journey.position, journey.total]).toEqual([2, 3]);
  expect(journey.prev?.id).toBe(3110);
  expect(journey.next?.id).toBe(3111);
  const carried = new URLSearchParams(journey.contact.get('seleccionArchivo')!);
  expect(carried.has('origen')).toBe(false);
  expect(catalogCaseJourney(story, carried, list)?.href).toBe(journey.href);
});

test('rejects an archive selection that does not contain the referenced work', () => {
  const story = work(3104);
  expect(catalogCaseJourney(story, new URLSearchParams('desde=archivo&q=UM+3105'), [story, work(3105)])).toBeUndefined();
  expect(catalogCaseJourney(story, new URLSearchParams('desde=inicio&q=UM+3104'), [story])).toBeUndefined();
});

test('only expanded unfiltered lists carry a selection, including the card anchor', () => {
  const list = Array.from({ length: 80 }, (_, index) => work(4000 + index));
  expect(caseContextQuery({}, 36)).toBe('');
  const query = caseContextQuery({}, 72);
  expect(query).toBe('?desde=archivo&mostrar=72');
  expect(catalogCaseJourney(list[52]!, new URLSearchParams(query), list)?.href)
    .toBe('/antecedentes?mostrar=72#resultado-um-4052');
});

test('a related work retains the source and original results through contact', () => {
  const origin = work(3104);
  const related = work(4104);
  const list = [origin, related];
  const archive = catalogCaseJourney(origin, new URLSearchParams('desde=archivo&q=UM+3104'), list)!;
  const params = new URLSearchParams(relatedCaseQuery(origin, { id: origin.id, ...archive }));
  const journey = relatedCaseJourney(related, params, list)!;

  expect(journey.href).toBe(origin.href + archive.query + '#obras-relacionadas');
  expect(journey.archive?.href).toBe('/antecedentes?q=UM+3104#resultado-um-3104');
  expect(relatedCaseJourney(related, journey.contact, list)).toEqual(journey);
  expect(relatedCaseJourney(related, new URLSearchParams('desde=relacionada&obraOrigen=4104'), list)).toBeUndefined();

  params.set('filtrosArchivo', 'desde=archivo&q=UM+9999');
  expect(relatedCaseJourney(related, params, list)?.archive).toBeUndefined();
  expect(relatedCaseJourney(related, params, list)?.href).toBe(origin.href + '#obras-relacionadas');
});
