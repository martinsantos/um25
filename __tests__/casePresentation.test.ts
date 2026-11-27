import { archiveIdentity, caseEquipmentFor, publicCaseFor, samePublicClient } from '../src/components/proto/casePresentation';
import { CASOS_DESTACADOS } from '../src/data/propuesta/casos-destacados';

describe('public identity in editorial cases', () => {
  test('anonymous labels never relate separate projects', () => {
    expect(samePublicClient('Cliente Confidencial', 'Cliente Confidencial')).toBe(false);
    expect(samePublicClient('Sin datos', 'Sin datos')).toBe(false);
    expect(samePublicClient('Empresa S.A.', 'Empresa SA')).toBe(false);
    expect(samePublicClient('Bódega Norte', 'bodega norte')).toBe(true);
  });
  test('every curated case can render for its verified public client', () => {
    for (const record of CASOS_DESTACADOS) expect(publicCaseFor(record)).toBe(record);
  });
  test('a later CMS anonymization or reassignment disables the historical override', () => {
    const record = CASOS_DESTACADOS[0];
    expect(publicCaseFor({ id: record.id, client: 'Cliente Confidencial' })).toBeUndefined();
    expect(publicCaseFor({ id: record.id, client: 'Otro cliente' })).toBeUndefined();
    expect(publicCaseFor({ id: 3552, client: 'Cliente Confidencial' })).toBeUndefined();
  });
  test('equipment does not leak across a changed or anonymized CMS identity', () => {
    const record = CASOS_DESTACADOS[0];
    const story = { id: record.id, client: record.client, title: 'Proyecto', summary: '', serviceCodes: [] };
    expect(caseEquipmentFor(story).partes).toEqual(record.parts);
    expect(caseEquipmentFor({ ...story, client: 'Cliente Confidencial' }).partes).toEqual([]);
    expect(caseEquipmentFor({ ...story, client: 'Otro cliente' }).partes).toEqual([]);
  });
});

test('an editorial title requires the original public client and documented scope', () => {
  const source = {
    id: 3350, client: 'Los Silos Club S.A.', title: 'Gestión y Monitoreo de Seguridad Electrónica',
    summary: 'Soporte técnico mensual para el sistema de CCTV.', sector: 'Industria', services: ['Seguridad electrónica'],
  };
  const item = archiveIdentity(source);
  expect(item.title).toBe('Soporte mensual del sistema de CCTV');
  expect(item.documented).toBe(true);
  expect(item.search).toContain(source.title);
  expect(item.search).toContain(item.title);
  expect(archiveIdentity({ ...source, summary: 'Instalación de controles de acceso' }).title).toBe(source.title);
  expect(archiveIdentity({ ...source, client: 'Cliente Confidencial' }).documented).toBe(false);
});
