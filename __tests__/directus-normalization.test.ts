import { describe, expect, test } from '@jest/globals';

import { normalizeServicioRecord } from '../src/utils/normalizeServicioRecord';

describe('normalizeServicioRecord', () => {
  test('normalizes legacy capitalized Directus fields to the shape expected by UI callers', () => {
    const servicio = normalizeServicioRecord({
      id: 101,
      Titulo: 'Infraestructura',
      Descripcion: 'Servicio de prueba',
      Subtitulo: 'Subtitulo legado',
      Stats: [{ value: '10', label: 'Proyectos' }],
      PorQueElegirnos: ['Cobertura regional'],
      Area: 'Redes',
      Cliente: 'Cliente Demo',
      Productos: [{ titulo: 'Switch Core' }],
    });

    expect(servicio.subtitulo).toBe('Subtitulo legado');
    expect(servicio.stats).toEqual([{ value: '10', label: 'Proyectos' }]);
    expect(servicio.por_que_elegirnos).toEqual(['Cobertura regional']);
    expect(servicio.area).toBe('Redes');
    expect((servicio as any).cliente).toBe('Cliente Demo');
    expect(servicio.productos).toEqual([{ titulo: 'Switch Core' }]);
    expect(servicio.Area).toBe('Redes');
  });

  test('preserves lowercase fields and keeps them mirrored for mixed callers', () => {
    const servicio = normalizeServicioRecord({
      id: 102,
      Titulo: 'Seguridad',
      Descripcion: 'Servicio de seguridad',
      slug: 'seguridad-electronica',
      subtitulo: 'CCTV y control de acceso',
      stats: [{ value: '24/7', label: 'Monitoreo' }],
      por_que_elegirnos: ['Soporte propio'],
      area: 'Seguridad',
      productos: [{ titulo: 'NVR' }],
    });

    expect(servicio.slug).toBe('seguridad-electronica');
    expect(servicio.Subtitulo).toBe('CCTV y control de acceso');
    expect(servicio.Stats).toEqual([{ value: '24/7', label: 'Monitoreo' }]);
    expect(servicio.PorQueElegirnos).toEqual(['Soporte propio']);
    expect(servicio.Area).toBe('Seguridad');
    expect(servicio.Productos).toEqual([{ titulo: 'NVR' }]);
  });
});
