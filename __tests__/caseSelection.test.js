const { selectCaseProjects, remainingCaseProjects, pageCaseCandidates, isShowcaseProject } = require('../src/components/proto/caseSelection.ts');
const story = (id, extra = {}) => ({ id, client: 'Cliente identificado', title: 'Cableado de cinco cámaras CCTV', summary: 'Cableado de cinco cámaras CCTV y provisión de balunes para el sistema existente.', image: `/images/antecedentes/p-${id}.webp`, year: 2024, sectorSlug: 'salud', serviceCodes: ['102'], ...extra });
const linked = id => ({ id: 10000 + id, publicado: id, titulo: 'Cámaras', cliente: 'Cliente identificado', servicios: ['102'], texto: 'Cableado', year: 2024, sector: 'salud' });

test('an explicitly empty page scope cannot reintroduce historical cases', () => {
  expect(selectCaseProjects([linked(1)], [story(1)], [])).toEqual([]);
  expect(selectCaseProjects([linked(1)], [story(1)])).toHaveLength(1);
});
test('never repeats an image variant or featured ID in the lower gallery', () => {
  const a = story(1), b = story(2, {image:'/images/antecedentes/p-1-480.webp'}), c = story(3);
  const featured = selectCaseProjects([linked(1)], [a,b,c], [a,b,c], 1);
  expect(remainingCaseProjects([a,b,c], featured).map(s=>s.id)).toEqual([3]);
});
test('does not use a service cover or an anonymous client as a named feature', () => {
  expect(selectCaseProjects([], [], [story(1,{image:'/images/editorial/cover.webp'}),story(2,{client:'Cliente Confidencial'})])).toEqual([]);
});
test.each(['En Quilmes hay que cotizar el tendido', 'DCYF TRAMITA LICITACION PUBLICA PARA EL CABLEADO'])('withholds a proposal from completed-work showcases: %s', title => {
  expect(isShowcaseProject(story(1,{title}))).toBe(false);
});
test('withholds an ambiguous sector placement without changing the source', () => {
  const original = story(3099,{sectorSlug:'industria'});
  expect(pageCaseCandidates([original],'industria')).toEqual([]);
  expect(pageCaseCandidates([original])).toEqual([original]);
  expect(original.sectorSlug).toBe('industria');
});
test('generic titles with no scope do not fill featured slots', () => {
  const generic = story(1,{title:'Desarrollo de Software y Digitalización de Procesos',summary:''});
  expect(selectCaseProjects([],[],[generic,story(2)]).map(s=>s.pub.id)).toEqual([2]);
});
test('a telecom label alone does not turn CCTV wiring into telecom evidence', () => {
  const camera = story(1, { serviceCodes: ['102','103'] });
  expect(pageCaseCandidates([camera], undefined, '103')).toEqual([]);
  expect(pageCaseCandidates([camera], undefined, '102')).toEqual([camera]);
});
test('a generic software title cannot override an explicit physical-system scope', () => {
  const physical = story(1, {title:'Desarrollo de Software y Digitalización de Procesos',summary:'Sistema para sirena con parlante y control remoto.'});
  expect(pageCaseCandidates([physical], undefined, '104')).toEqual([]);
  const software = {...physical, summary:'Software para administrar la distribución de agua de riego.'};
  expect(pageCaseCandidates([software], undefined, '104')).toEqual([software]);
});
