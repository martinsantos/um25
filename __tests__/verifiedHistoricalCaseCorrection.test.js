const { verifiedHistoricalCaseCorrection } = require('../src/utils/verifiedHistoricalCaseCorrection.ts');
const { verifiedCaseCorrection } = require('../src/utils/verifiedCaseCorrection.ts');
const { entries } = require('../src/data/propuesta/historical-corrections.json');

test('las correcciones corresponden a registros con evidencia histórica coincidente', () => {
  expect(entries).toHaveLength(59);
  expect(new Set(entries.map((x) => x.id)).size).toBe(entries.length);
  for (const item of entries) {
    const current = { id: item.id, ...item.match };
    expect(verifiedCaseCorrection(current)).toEqual(item.value);
    for (const summary of item.alternativeSummaries) expect(verifiedHistoricalCaseCorrection({ ...current, summary })).toEqual(item.value);
  }
});

test('no corrige otra identidad, descripción o fecha', () => {
  for (const item of entries) {
    const current = { id: item.id, ...item.match };
    for (const changed of [{ id: 1 }, { client: 'Otro cliente' }, { title: 'Otro título' }, { summary: 'Otro alcance' }, { year: item.match.year + 1 }]) {
      expect(verifiedHistoricalCaseCorrection({ ...current, ...changed })).toBeUndefined();
    }
  }
});

test('los casos de CCTV, telefonía e incendios no heredan software', () => {
  for (const [id, service] of [[3113, 102], [3118, 103], [3235, 107], [3255, 103], [3283, 107], [3468, 102]]) {
    const item = entries.find((x) => x.id === id);
    expect(verifiedHistoricalCaseCorrection({ id, ...item.match }).services).toEqual([service]);
  }
});
