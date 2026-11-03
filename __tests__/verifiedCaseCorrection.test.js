const { verifiedCaseCorrection } = require('../src/utils/verifiedCaseCorrection.ts');

const bodega = {
  id: 3295, client: 'Bodega Caro',
  title: 'Implementación de Redes de Datos y Fibra Óptica - Bodega Caro',
  summary: 'Canalización y cableado para traslado de Central de Detección de inc', year: 2021,
};
const afip = {
  id: 3388, client: 'AFIP', title: 'Desarrollo de Software y Digitalización de Procesos - AFIP',
  summary: 'Sistema de Detección de Incendio sede de San Martin, San Rafael, San', year: 2019,
};

test.each([bodega, afip])('corrects the title and service only for the evidenced record $id', (source) => {
  const correction = verifiedCaseCorrection(source);
  expect(correction.title).toMatch(/detección de incendios/i);
  expect(correction.services).toEqual([107]);
  for (const change of [{ id: 9999 }, { client: 'Otro cliente' }, { title: 'Nuevo título' }, { summary: 'Nuevo alcance' }, { year: 2030 }]) {
    expect(verifiedCaseCorrection({ ...source, ...change })).toBeUndefined();
  }
});

test('usa el alcance histórico coincidente para el cableado del Hospital de Uspallata', () => {
  const source = {
    id: 3103, client: 'FUESMEN - Fundación Escuela Medicina Nuclear',
    title: 'Corrientes débiles y eléctricas para el Hospital Uspallata', year: 2024,
    summary: 'Ejecución integral de CE - Hospital Uspallata  para FUESMEN - Fundación Escuela Medicina Nuclear, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.',
  };
  expect(verifiedCaseCorrection(source)).toMatchObject({ title: 'Cableado estructurado en el Hospital de Uspallata', services: [101] });
  expect(verifiedCaseCorrection({ ...source, summary: 'Corrientes débiles y eléctricas para el Hospital Uspallata Cliente: FUESMEN - Fundación Escuela Medicina Nuclear. Sector: Salud & Sector Salud.' })).toMatchObject({ services: [101] });
  expect(verifiedCaseCorrection({ ...source, summary: 'Un alcance diferente' })).toBeUndefined();
});
test('corrige contradicciones de título con la descripción del mismo registro sin cruzar identidades', () => {
  const { verifiedCaseCorrection } = require('../src/utils/verifiedCaseCorrection');
  const rules = require('../src/data/propuesta/same-record-corrections.json');
  const snapshot = require('../src/data/snapshots/antecedentes.json');
  const byId = new Map(snapshot.data.map((item) => [Number(item.id), item]));
  for (const [id, rule] of Object.entries(rules)) {
    const source = byId.get(Number(id));
    const input = { id, client: source.Cliente, title: source.Titulo, summary: source.Descripcion, year: Number(source.Fecha.slice(0, 4)) };
    expect(verifiedCaseCorrection(input)).toEqual(rule.value);
    expect(verifiedCaseCorrection({ ...input, client: 'Otro cliente' })).toBeUndefined();
    expect(verifiedCaseCorrection({ ...input, summary: 'Descripción diferente' })).toBeUndefined();
  }
});
