import {
  filterSoftwareSectorCases,
  isSoftwareSectorCase,
  softwareSectorCandidateKeywords,
} from '../src/lib/sectorSoftwareRelevance';

describe('software sector case relevance', () => {
  test('keeps real software cases even when the source area names another service', () => {
    expect(isSoftwareSectorCase({
      id: 3113,
      Titulo: 'Desarrollo de Software y Digitalización de Procesos - Jose Nucete e Hijos SA',
      Area: 'Video Vigilancia & Seguridad',
    })).toBe(true);
  });

  test('rejects detection work that only mentions a system', () => {
    for (const candidate of [
      { id: 3067, Titulo: 'Mantenimiento Crítico de Sistemas de Detección - TORRE THAYS', Area: 'Detección de Incendios & Seguridad' },
      { id: 3071, Titulo: 'Mantenimiento Crítico de Sistemas de Detección - Cela SA - Junio 2025', Area: 'Detección de Incendios & Seguridad' },
    ]) {
      expect(isSoftwareSectorCase(candidate)).toBe(false);
    }
  });

  test('recognizes documented software systems and preserves order while limiting cards', () => {
    const candidates = [
      { id: 1, Titulo: 'Sistema de trazabilidad para alimentos' },
      { id: 2, Titulo: 'Cableado de red y sistema de detección de incendios' },
      { id: 3, Titulo: 'Desarrollo de software para servicios públicos' },
      { id: 4, Titulo: 'API de validación de usuarios' },
    ];

    expect(filterSoftwareSectorCases(candidates, 2).map(({ id }) => id)).toEqual([1, 3]);
    expect(filterSoftwareSectorCases(candidates).map(({ id }) => id)).toEqual([1, 3, 4]);
  });

  test('retains broad retrieval terms while the functional filter rejects generic system matches', () => {
    const terms = softwareSectorCandidateKeywords(['software', 'desarrollo', 'sistema']);
    const candidates = [
      { id: 1, Titulo: 'Software para administración' },
      { id: 2, Titulo: 'Mantenimiento de sistemas de detección' },
    ];

    expect(terms).toContain('sistema de trazabilidad');
    expect(terms).toContain('erp');
    expect(terms).toContain('sistema');
    expect(new Set(terms).size).toBe(terms.length);
    expect(filterSoftwareSectorCases(candidates).map(({ id }) => id)).toEqual([1]);
  });
});
