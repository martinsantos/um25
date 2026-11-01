const { CASOS_DESTACADOS, PORTADA_CASOS_IDS, casoDestacadoDe } = require('../src/data/propuesta/casos-destacados');
const { antecedentesReales } = require('../src/data/antecedentes_completos.js');
const snapshot = require('../src/data/snapshots/antecedentes.json').data;
const sgi = require('../src/data/sgi/fechas.json').fechas;

const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const sourceById = new Map(antecedentesReales.map((row) => [row.id, row]));
const snapshotById = new Map(snapshot.map((row) => [row.id, row]));

describe('casos destacados y respaldo de identidad', () => {
  test('incluye 12 IDs web únicos con cliente coincidente y fecha SGI coherente con la fuente', () => {
    expect(CASOS_DESTACADOS).toHaveLength(12);
    expect(new Set(CASOS_DESTACADOS.map(({ id }) => id)).size).toBe(12);

    for (const caso of CASOS_DESTACADOS) {
      const web = snapshotById.get(caso.id);
      const originRef = caso.sourceRefs.find((ref) => ref.startsWith('src/data/antecedentes_completos.js#'));
      const originId = Number(originRef?.split('#')[1]);
      const origin = sourceById.get(originId);
      expect(web).toBeDefined();
      expect(normalize(caso.client)).toBe(normalize(web.Cliente));
      if (origin) {
        expect(sgi[String(caso.id)].inicio).toBe(origin.Fecha);
      } else {
        expect(sgi[String(caso.id)].inicio.slice(0, 4)).toBe(web.Fecha.slice(0, 4));
      }
      expect(caso.scope.length).toBeGreaterThan(0);
      expect(caso.client).not.toMatch(/confidencial|reservado/i);
      expect(caso.imageKind).toBe('illustration');
      expect(caso.outcome).toBeUndefined();
      if (originRef) expect(origin).toBeDefined();
      const evidenceText = normalize(`${web.Titulo} ${web.Descripcion} ${origin?.Titulo || ''} ${origin?.Descripcion || ''}`);
      for (const metric of caso.evidence) {
        for (const number of metric.value.match(/\d+(?:[.,]\d+)?/g) || []) {
          expect(evidenceText).toContain(normalize(number));
        }
      }
      expect(caso.introduction.length).toBeGreaterThanOrEqual(110);
      expect(caso.introduction.length).toBeLessThanOrEqual(200);
      expect(caso.introduction).not.toMatch(/catálogo|ficha vigente|registro de origen|según el registro/i);
    }
  });

  test('los tres destacados de portada existen en el dataset y tienen cifras', () => {
    expect(PORTADA_CASOS_IDS).toEqual([3588, 3144, 3126]);
    for (const id of PORTADA_CASOS_IDS) {
      const caso = casoDestacadoDe(id);
      expect(caso).toBeDefined();
      expect(caso.evidence.length).toBeGreaterThan(0);
    }
  });

  test('el snapshot no contiene identidades anonimizadas entre las fichas seleccionadas', () => {
    for (const caso of CASOS_DESTACADOS) {
      const live = snapshotById.get(caso.id);
      expect(live.Cliente).not.toMatch(/confidencial|reservado/i);
      expect(live.Titulo).not.toMatch(/cliente confidencial/i);
      expect(live.Descripcion).not.toMatch(/cliente confidencial/i);
    }
  });
});
