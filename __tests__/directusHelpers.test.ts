/**
 * Tests for src/utils/directusHelpers.ts
 * Tests helper functions with Directus mocked at the lib layer
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock Directus lib functions — factory avoids loading real directus.ts (which has top-level await)
jest.mock('../src/lib/directus.ts', () => ({
  __esModule: true,
  getServiciosV4: jest.fn(),
  getServicioConProductos: jest.fn(),
  getProductosPorServicio: jest.fn(),
  getAntecedenteConServicios: jest.fn(),
  getAntecedentesPorServicio: jest.fn(),
  buscarServicios: jest.fn(),
  getDirectusImageUrl: jest.fn((id) => id || '/placeholder.jpg'),
  getDirectusImageFallback: jest.fn((id) => id || '/placeholder.jpg'),
}));

// Import helpers after mocks
import {
  getAllServicios,
  getServicioById,
  getProductos,
  getAntecedenteWithServices,
  getProyectosPorServicio,
  searchServicios,
  checkDirectusHealth,
} from '../src/utils/directusHelpers';

import * as directusLib from '../src/lib/directus.ts';

describe('Directus Helpers - getAllServicios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns servicios from Directus when available', async () => {
    const mockDirectusData = [
      {
        id: 101,
        Titulo: 'Servicio Directus',
        Descripcion: 'From Directus',
        Imagen: 'directus-image.jpg',
        subtitulo: 'Subtitle',
        stats: [],
        marcas: [],
        por_que_elegirnos: [],
        area: 'Test',
        slug: 'servicio-directus',
        estado: 'publicado',
        productos: [],
      },
    ];

    (directusLib.getServiciosV4 as jest.Mock).mockResolvedValue(mockDirectusData);

    const result = await getAllServicios();

    expect(result).toEqual(mockDirectusData);
    expect(directusLib.getServiciosV4).toHaveBeenCalledTimes(1);
  });

  test('returns empty array when Directus returns empty', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockResolvedValue([]);

    const result = await getAllServicios();

    expect(result).toEqual([]);
  });

  test('returns empty array when Directus throws error', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockRejectedValue(new Error('Directus error'));

    const result = await getAllServicios();

    expect(result).toEqual([]);
  });
});

describe('Directus Helpers - getServicioById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns servicio from Directus when available', async () => {
    const mockServicio = {
      id: 101,
      Titulo: 'Servicio Directus',
      Descripcion: 'From Directus',
      Imagen: 'image.jpg',
      subtitulo: 'Subtitle',
      stats: [],
      marcas: [],
      por_que_elegirnos: [],
      area: 'Test',
      slug: 'test',
      estado: 'publicado',
      productos: [],
    };

    (directusLib.getServicioConProductos as jest.Mock).mockResolvedValue(mockServicio);

    const result = await getServicioById(101);

    expect(result).toEqual(mockServicio);
    expect(directusLib.getServicioConProductos).toHaveBeenCalledWith(101);
  });

  test('accepts string ID and converts to number', async () => {
    (directusLib.getServicioConProductos as jest.Mock).mockResolvedValue(null);

    await getServicioById('101');

    expect(directusLib.getServicioConProductos).toHaveBeenCalledWith(101);
  });

  test('returns null when Directus returns null', async () => {
    (directusLib.getServicioConProductos as jest.Mock).mockResolvedValue(null);

    const result = await getServicioById(101);

    expect(result).toBeNull();
  });

  test('returns null when Directus throws error', async () => {
    (directusLib.getServicioConProductos as jest.Mock).mockRejectedValue(new Error('Error'));

    const result = await getServicioById(101);

    expect(result).toBeNull();
  });
});

describe('Directus Helpers - getProductos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns productos from Directus when available', async () => {
    const mockProductos = [
      {
        id: 1,
        servicio_id: 101,
        titulo: 'Producto Directus',
        descripcion: 'From Directus',
        imagen: 'image.jpg',
        features: ['Feature 1'],
        destacado: 'Destacado',
        marcas: ['Marca1'],
        orden: 0,
        estado: 'publicado',
      },
    ];

    (directusLib.getProductosPorServicio as jest.Mock).mockResolvedValue(mockProductos);

    const result = await getProductos(101);

    expect(result).toEqual(mockProductos);
    expect(directusLib.getProductosPorServicio).toHaveBeenCalledWith(101);
  });

  test('returns empty array when Directus returns empty', async () => {
    (directusLib.getProductosPorServicio as jest.Mock).mockResolvedValue([]);

    const result = await getProductos(101);

    expect(result).toEqual([]);
  });

  test('returns empty array when Directus throws error', async () => {
    (directusLib.getProductosPorServicio as jest.Mock).mockRejectedValue(new Error('Error'));

    const result = await getProductos(101);

    expect(result).toEqual([]);
  });
});

describe('Directus Helpers - searchServicios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns search results from Directus', async () => {
    const mockResults = [
      {
        id: 101,
        Titulo: 'Ciberseguridad',
        Descripcion: 'Test',
        Imagen: 'img.jpg',
        subtitulo: 'Sub',
        stats: [],
        marcas: [],
        por_que_elegirnos: [],
        area: 'Seguridad',
        slug: 'test',
        estado: 'publicado',
        productos: [],
      },
    ];

    (directusLib.buscarServicios as jest.Mock).mockResolvedValue(mockResults);

    const result = await searchServicios('ciberseguridad');

    expect(result).toEqual(mockResults);
    expect(directusLib.buscarServicios).toHaveBeenCalledWith('ciberseguridad', undefined);
  });

  test('returns empty array when Directus returns empty', async () => {
    (directusLib.buscarServicios as jest.Mock).mockResolvedValue([]);

    const result = await searchServicios('ciberseguridad');

    expect(result).toEqual([]);
  });
});

describe('Directus Helpers - checkDirectusHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns true when Directus is healthy', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const result = await checkDirectusHealth();

    expect(result).toBe(true);
  });

  test('returns false when Directus returns empty', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockResolvedValue([]);

    const result = await checkDirectusHealth();

    expect(result).toBe(false);
  });

  test('returns false when Directus throws error', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockRejectedValue(new Error('Error'));

    const result = await checkDirectusHealth();

    expect(result).toBe(false);
  });
});

describe('Directus Helpers - M2M Relations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAntecedenteWithServices returns antecedente with services', async () => {
    const mockAntecedente = {
      id: 1,
      Titulo: 'Proyecto Test',
      Descripcion: 'Test',
      servicios_relacionados: [
        { id: 101, Titulo: 'Servicio 1' },
        { id: 102, Titulo: 'Servicio 2' },
      ],
    };

    (directusLib.getAntecedenteConServicios as jest.Mock).mockResolvedValue(mockAntecedente);

    const result = await getAntecedenteWithServices(1);

    expect(result).toEqual(mockAntecedente);
    expect(result?.servicios_relacionados).toHaveLength(2);
  });

  test('getAntecedenteWithServices returns null when not found', async () => {
    (directusLib.getAntecedenteConServicios as jest.Mock).mockResolvedValue(null);

    const result = await getAntecedenteWithServices(999);

    expect(result).toBeNull();
  });

  test('getProyectosPorServicio returns antecedentes for servicio', async () => {
    const mockAntecedentes = [
      { id: 1, Titulo: 'Proyecto 1' },
      { id: 2, Titulo: 'Proyecto 2' },
    ];

    (directusLib.getAntecedentesPorServicio as jest.Mock).mockResolvedValue(mockAntecedentes);

    const result = await getProyectosPorServicio(101, 6);

    expect(result).toEqual(mockAntecedentes);
    expect(directusLib.getAntecedentesPorServicio).toHaveBeenCalledWith(101, 6);
  });

  test('getProyectosPorServicio returns empty array when none found', async () => {
    (directusLib.getAntecedentesPorServicio as jest.Mock).mockResolvedValue([]);

    const result = await getProyectosPorServicio(999);

    expect(result).toEqual([]);
  });
});
