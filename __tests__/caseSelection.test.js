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
test('a reviewed case photograph remains eligible for its featured story', () => {
  const reviewed = story(3, {image:'/images/photography/0123456789abcdef0123.webp'});
  expect(selectCaseProjects([linked(3)], [reviewed], [reviewed]).map(x => x.pub.id)).toEqual([3]);
});
test('prefers a relevant reviewed photograph without removing older catalog records', () => {
  const older = story(1);
  const reviewed = story(2, {image:'/images/photography/0123456789abcdef0123.webp'});
  const selected = selectCaseProjects([linked(1)], [older, reviewed], [older, reviewed], 1);
  expect(selected.map(x => x.pub.id)).toEqual([2]);
  expect(remainingCaseProjects([older, reviewed], selected).map(x => x.id)).toEqual([1]);
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

test('a service category label and generated summary do not prove fire-detection work', () => {
  const phones = story(3224, {
    title: 'Seguridad Electrónica & SDI: 10 Telefonos IP  - Obras SRL',
    summary: 'Ejecución integral de Seguridad Electrónica & SDI: 10 Telefonos IP  - Obras SRL para Obras SRL, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.',
  });

  expect(pageCaseCandidates([phones], undefined, '107')).toEqual([]);
  expect(pageCaseCandidates([phones], undefined, '103')).toEqual([phones]);
  expect(pageCaseCandidates([phones])).toEqual([phones]);
});

test('server application disks are not software evidence, while an implemented app remains eligible', () => {
  const disks = story(3334, {
    title: 'Provisión de discos para servidor de aplicaciones.',
    summary: 'Ejecución integral de Provisión de discos para servidor de aplicaciones. para Bodegas y Viñedos Santa Elena SRL - TYGIA SRL - UTE, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.',
  });
  const app = story(3335, { title: 'Implementación de aplicación móvil para gestión de turnos', summary: 'Puesta en marcha de aplicación móvil para gestión de turnos.' });

  expect(pageCaseCandidates([disks], undefined, '104')).toEqual([]);
  expect(pageCaseCandidates([disks])).toEqual([disks]);
  expect(pageCaseCandidates([app], undefined, '104')).toEqual([app]);
});

test('a documented management application remains eligible without calling it web or mobile', () => {
  const app = story(3344, { title: 'Aplicación para Gestión y operación de Créditos', summary: 'Aplicación para Gestión y operación de Créditos.' });
  expect(pageCaseCandidates([app], undefined, '104')).toEqual([app]);
});

test('generic detection alone is not proof of a fire-detection project', () => {
  const generic = story(3410, { title: 'Mantenimiento de un sistema de detección', summary: 'Mantenimiento preventivo de un sistema de detección.' });
  const fire = story(3411, { title: 'Mantenimiento de detectores de humo', summary: 'Mantenimiento preventivo.' });
  expect(pageCaseCandidates([generic], undefined, '107')).toEqual([]);
  expect(pageCaseCandidates([fire], undefined, '107')).toEqual([fire]);
  expect(pageCaseCandidates([generic], undefined, '105')).toEqual([generic]);
});

test('a featured project does not mix contradictory dated evidence', () => {
  const conflict = story(3393, { year: 2021, title: 'Soporte de infraestructura IT', summary: 'Bodegas y Viñedo Santa Elena SRL - Octubre 2019' });
  expect(isShowcaseProject(conflict)).toBe(false);
  expect(isShowcaseProject({ ...conflict, year: 2019 })).toBe(true);
});

test('a web quotation is not shown as completed software work and stays in the catalog input', () => {
  const quotation = story(3648, {
    title: 'Cotización para web, estimativa',
    summary: 'Ejecución integral de Cotización para web, estimativa para poder judicial mendoza, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.',
  });
  const original = { ...quotation };

  expect(isShowcaseProject(quotation)).toBe(false);
  expect(pageCaseCandidates([quotation], undefined, '104')).toEqual([]);
  expect(quotation).toEqual(original);
});

test('a concatenated cost estimate is not presented as an executed project', () => {
  const estimate = story(3472, { title: 'Servicios para conectividad en eventosCostos por puesto simple', summary: 'Costos por persona conectada al wifi' });
  expect(isShowcaseProject(estimate)).toBe(false);
  expect(pageCaseCandidates([estimate], undefined, '108')).toEqual([]);
});

test('generic imported records without a documented scope stay out of showcases', () => {
  for (const id of [3145, 3150]) {
    const generic = story(id, {title: 'Desarrollo de Software y Digitalización de Procesos', summary: 'Cliente: FIDEICOMISO PEDRO J. GODOY. Sector: Seguridad Electrónica.'});
    expect(isShowcaseProject(generic)).toBe(false);
  }
});
