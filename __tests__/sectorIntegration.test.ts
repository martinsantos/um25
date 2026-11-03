import { sectorDeclaredServices, sectorIntegrationScope } from '../src/data/propuesta/sector-integration';
import { despieceAgregado } from '../src/components/proto/despiece';
import { caseEquipmentFor } from '../src/components/proto/casePresentation';
import { CASOS_DESTACADOS } from '../src/data/propuesta/casos-destacados';

describe('Sector offering and project evidence remain distinct', () => {
  test('mining includes the electrical offering already declared by its published vertical', () => {
    expect(sectorDeclaredServices('mineria')).toContain('108');
    expect(sectorIntegrationScope('mineria', '108', '')).toMatch(/respaldo eléctrico/);
  });

  test('declared primary services have contextual scope and unknown CMS additions retain their description', () => {
    for (const slug of ['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud']) {
      for (const code of sectorDeclaredServices(slug)) {
        expect(sectorIntegrationScope(slug, code, '').length).toBeGreaterThan(40);
      }
    }
    expect(sectorIntegrationScope('nuevo-sector', '101', 'Alcance del catálogo')).toBe('Alcance del catálogo');
  });

  test('sector counts use the same verified parts as the project detail, excluding service-kit fallbacks', () => {
    const record = CASOS_DESTACADOS[0];
    const verified = { id: record.id, client: record.client, title: 'Proyecto', summary: '', serviceCodes: [] };
    const fallback = { id: -1, client: 'Otro cliente', title: 'Proyecto', summary: '', serviceCodes: ['101'] };
    const totals = despieceAgregado([verified, fallback], caseEquipmentFor);
    expect(totals.map(p => p.key).sort()).toEqual([...new Set(record.parts.map(p => p.key))].sort());
    expect(totals.every(p => p.proyectos === 1)).toBe(true);
    expect(despieceAgregado([{ ...verified, client: 'Cliente Confidencial' }], caseEquipmentFor)).toEqual([]);
  });

  test('aggregate labels do not turn DVR and NVR records into a single claimed technology', () => {
    const records = [{ title: 'DVR', summary: '', serviceCodes: ['102'] }, { title: 'NVR', summary: '', serviceCodes: ['102'] }];
    expect(despieceAgregado(records)).toEqual([expect.objectContaining({ key: 'nvr', label: 'Grabación y gestión de video', proyectos: 2 })]);
  });

  test('a project with multiple entries for one component is counted once and preserves its recorded quantities', () => {
    const record = CASOS_DESTACADOS.find(record => record.id === 3144)!;
    const result = despieceAgregado([{ ...record, title: 'Proyecto', summary: '', serviceCodes: ['101', '103'] }], caseEquipmentFor);
    expect(result.find(p => p.key === 'cableado')).toMatchObject({ proyectos: 1, unidades: 61, label: 'Cableado estructurado' });
    expect(result.find(p => p.key === 'rack')?.label).toBe('Rack');
  });
});
