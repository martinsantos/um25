const snapshot = require('../src/data/snapshots/antecedentes.json');
const { antecedentesReales } = require('../src/data/antecedentes_completos.js');
const sgiDates = require('../src/data/sgi/fechas.json').fechas;
const {
  correctCuratedClassification,
  CURATED_CLASSIFICATION_CORRECTIONS,
} = require('../src/components/proto/catalogEditorial');

const rows = new Map((snapshot.data || snapshot).map((row) => [row.id, row]));
const sources = new Map(antecedentesReales.map((row) => [row.id, row]));
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\bmza\b/g, 'mendoza').replace(/[^a-z0-9]+/g, ' ').trim();

describe('case-specific classification corrections', () => {
  test('only applies a correction while its exact source wording is present', () => {
    expect(Object.keys(CURATED_CLASSIFICATION_CORRECTIONS)).toHaveLength(11);
    for (const [idText, correction] of Object.entries(CURATED_CLASSIFICATION_CORRECTIONS)) {
      const id = Number(idText);
      const current = rows.get(id);
      expect(current).toBeDefined();
      let sourceText = `${current.Titulo} ${current.Descripcion}`;
      if (correction.sourceRecordId) {
        const source = sources.get(correction.sourceRecordId);
        expect(source).toBeDefined();
        expect(normalize(source.Cliente)).toBe(normalize(current.Cliente));
        expect(source.Fecha).toBe(sgiDates[id].inicio);
        sourceText += ` ${source.Titulo} ${source.Descripcion}`;
      }
      const result = correctCuratedClassification(id, current.Titulo, sourceText, 'aeropuertos', ['103', '108']);
      expect(result.sector).toBe(correction.sector ?? 'aeropuertos');
      expect(result.services).toEqual(correction.services || ['103', '108']);
    }
  });

  test('does not apply a curated change when the source phrase is missing', () => {
    const result = correctCuratedClassification(3588, 'Kristich Desarrollos', 'CCTV para edificios', 'aeropuertos', ['103']);
    expect(result).toEqual({ sector: 'aeropuertos', services: ['103'] });
  });

  test('does not attach a full-source correction to the 3104 case with date ambiguity', () => {
    expect(CURATED_CLASSIFICATION_CORRECTIONS[3104].sourceRecordId).toBeUndefined();
  });
});
