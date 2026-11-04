import { mapearAntecedentes } from '../src/lib/um26-data/antecedentesReales';
import { verifiedCaseCorrection } from '../src/utils/verifiedCaseCorrection';
import { publicCaseRecord } from '../src/utils/publicCaseRecord';

const boilerplate = (title: string, client: string) => `Ejecución integral de ${title} para ${client}, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.`;
const rows = [
  { id: 3585, Titulo: 'bobina de cable cat.6 + plug RJ45 Cat.6', Cliente: 'Administración Tributaria Mendoza (ATM)', Fecha: '2024-01-01', expected: 101 },
  { id: 3591, Titulo: '10 disco duro de 4TB', Cliente: 'Aeropuertos Argentina 2000', Fecha: '2023-08-09', expected: 102 },
];

test.each(rows)('el registro CMS $id conserva la corrección verificada en la página y GEO', row => {
  const raw = { ...row, Descripcion: boilerplate(row.Titulo, row.Cliente) };
  const mapped = mapearAntecedentes([raw])[0];
  const correction = verifiedCaseCorrection(mapped);
  expect(correction?.services).toEqual([row.expected]);
  const geo = publicCaseRecord(raw);
  expect(geo.Titulo).toBe(correction?.title);
  expect(geo.Descripcion).toBe(correction?.summary);
  expect(verifiedCaseCorrection({ ...mapped, summary: mapped.summary + ' Alcance modificado posteriormente.' })).toBeUndefined();
  expect(verifiedCaseCorrection({ ...mapped, client: 'Otro cliente' })).toBeUndefined();
  expect(verifiedCaseCorrection({ ...mapped, year: mapped.year + 1 })).toBeUndefined();
});

test('detección genérica no afirma detección de incendios sin respaldo', () => {
  const mapped = mapearAntecedentes([{ id: 3066, Titulo: 'Torre Thays - Dispositivos de detección', Cliente: 'Consorcio Torre Thays', Fecha: '2025-08-12', Descripcion: 'Dispositivos de detección para Consorcio Torre Thays, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.' }])[0];
  expect(verifiedCaseCorrection(mapped)?.services).toEqual([]);
});
