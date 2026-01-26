/**
 * Tests for Directus Helpers V4
 *
 * These tests verify that the Directus helper functions correctly:
 * 1. Fetch data from Directus when available
 * 2. Fall back to JS data when Directus fails
 * 3. Handle errors gracefully
 * 4. Convert data formats correctly
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Directus lib functions
jest.mock('../src/lib/directus', () => ({
  getServiciosV4: jest.fn(),
  getServicioConProductos: jest.fn(),
  getProductosPorServicio: jest.fn(),
  getAntecedenteConServicios: jest.fn(),
  getAntecedentesPorServicio: jest.fn(),
  buscarServicios: jest.fn(),
}));

// Mock JS data imports
jest.mock('../src/data/servicios_completos_v4.js', () => ({
  serviciosCompletos: {
    101: {
      id: 101,
      Titulo: 'Ciberseguridad',
      Descripcion: 'Soluciones de ciberseguridad',
      Imagen: '/images/ciberseguridad.jpg',
      Subtitulo: 'Protección avanzada',
      Area: 'Seguridad',
      Stats: [
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Monitoreo' },
      ],
      Marcas: ['Cisco', 'Fortinet'],
      PorQueElegirnos: ['Experiencia comprobada', 'Soporte 24/7'],
      Productos: [
        {
          titulo: 'Firewall Empresarial',
          descripcion: 'Protección perimetral avanzada',
          imagen: '/images/firewall.jpg',
          features: ['IPS/IDS', 'VPN', 'Filtrado de contenido'],
          destacado: 'Alta disponibilidad',
          marcas: ['Fortinet'],
        },
      ],
    },
    102: {
      id: 102,
      Titulo: 'Infraestructura de Redes',
      Descripcion: 'Redes empresariales',
      Imagen: '/images/redes.jpg',
      Subtitulo: 'Conectividad confiable',
      Area: 'Redes',
      Stats: [],
      Marcas: [],
      PorQueElegirnos: [],
      Productos: [],
    },
  },
  getServicioCompleto: jest.fn((id) => {
    const servicios: any = {
      101: {
        id: 101,
        Titulo: 'Ciberseguridad',
        Descripcion: 'Soluciones de ciberseguridad',
        Imagen: '/images/ciberseguridad.jpg',
        Subtitulo: 'Protección avanzada',
        Area: 'Seguridad',
        Stats: [{ value: '99.9%', label: 'Uptime' }],
        Marcas: ['Cisco'],
        PorQueElegirnos: ['Experiencia'],
        Productos: [
          {
            titulo: 'Firewall',
            descripcion: 'Protección',
            imagen: '/images/firewall.jpg',
            features: ['IPS'],
            destacado: 'HA',
            marcas: ['Fortinet'],
          },
        ],
      },
    };
    return servicios[id] || null;
  }),
  listarServicios: jest.fn(() => [
    {
      id: 101,
      Titulo: 'Ciberseguridad',
      Descripcion: 'Soluciones de ciberseguridad',
      Imagen: '/images/ciberseguridad.jpg',
      Subtitulo: 'Protección avanzada',
      Area: 'Seguridad',
      Stats: [],
      Marcas: [],
      PorQueElegirnos: [],
      Productos: [],
    },
    {
      id: 102,
      Titulo: 'Infraestructura de Redes',
      Descripcion: 'Redes empresariales',
      Imagen: '/images/redes.jpg',
      Subtitulo: 'Conectividad',
      Area: 'Redes',
      Stats: [],
      Marcas: [],
      PorQueElegirnos: [],
      Productos: [],
    },
  ]),
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
  getDirectusImageUrl,
  getDirectusThumbnail,
} from '../src/utils/directusHelpers';

import * as directusLib from '../src/lib/directus';

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

  test('falls back to JS data when Directus returns empty', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockResolvedValue([]);

    const result = await getAllServicios();

    expect(result).toHaveLength(2);
    expect(result[0].Titulo).toBe('Ciberseguridad');
    expect(result[1].Titulo).toBe('Infraestructura de Redes');
  });

  test('falls back to JS data when Directus throws error', async () => {
    (directusLib.getServiciosV4 as jest.Mock).mockRejectedValue(new Error('Directus error'));

    const result = await getAllServicios();

    expect(result).toHaveLength(2);
    expect(result[0].Titulo).toBe('Ciberseguridad');
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

  test('falls back to JS data when Directus returns null', async () => {
    (directusLib.getServicioConProductos as jest.Mock).mockResolvedValue(null);

    const result = await getServicioById(101);

    expect(result).not.toBeNull();
    expect(result?.Titulo).toBe('Ciberseguridad');
    expect(result?.productos).toHaveLength(1);
  });

  test('returns null when servicio not found in JS data', async () => {
    (directusLib.getServicioConProductos as jest.Mock).mockResolvedValue(null);

    const result = await getServicioById(999);

    expect(result).toBeNull();
  });

  test('falls back to JS data when Directus throws error', async () => {
    (directusLib.getServicioConProductos as jest.Mock).mockRejectedValue(new Error('Error'));

    const result = await getServicioById(101);

    expect(result).not.toBeNull();
    expect(result?.Titulo).toBe('Ciberseguridad');
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

  test('falls back to JS data when Directus returns empty', async () => {
    (directusLib.getProductosPorServicio as jest.Mock).mockResolvedValue([]);

    const result = await getProductos(101);

    expect(result).toHaveLength(1);
    expect(result[0].titulo).toBe('Firewall');
  });

  test('returns empty array when servicio has no productos in JS', async () => {
    (directusLib.getProductosPorServicio as jest.Mock).mockResolvedValue([]);

    const result = await getProductos(102);

    expect(result).toEqual([]);
  });

  test('falls back to JS data when Directus throws error', async () => {
    (directusLib.getProductosPorServicio as jest.Mock).mockRejectedValue(new Error('Error'));

    const result = await getProductos(101);

    expect(result).toHaveLength(1);
    expect(result[0].titulo).toBe('Firewall');
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

  test('falls back to JS search when Directus returns empty', async () => {
    (directusLib.buscarServicios as jest.Mock).mockResolvedValue([]);

    const result = await searchServicios('ciberseguridad');

    expect(result).toHaveLength(1);
    expect(result[0].Titulo).toBe('Ciberseguridad');
  });

  test('filters by area in JS fallback search', async () => {
    (directusLib.buscarServicios as jest.Mock).mockResolvedValue([]);

    const result = await searchServicios('', 'Seguridad');

    expect(result).toHaveLength(1);
    expect(result[0].area).toBe('Seguridad');
  });

  test('falls back to JS search when Directus throws error', async () => {
    (directusLib.buscarServicios as jest.Mock).mockRejectedValue(new Error('Error'));

    const result = await searchServicios('redes');

    expect(result).toHaveLength(1);
    expect(result[0].Titulo).toBe('Infraestructura de Redes');
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

describe('Directus Helpers - Image Utilities', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env.PUBLIC_DIRECTUS_URL = 'https://admin.ultimamilla.com.ar';
  });

  test('getDirectusImageUrl returns full URL for UUID', () => {
    const result = getDirectusImageUrl('abc-123-def-456');

    expect(result).toBe('https://admin.ultimamilla.com.ar/assets/abc-123-def-456');
  });

  test('getDirectusImageUrl returns URL unchanged if already full URL', () => {
    const fullUrl = 'https://example.com/image.jpg';
    const result = getDirectusImageUrl(fullUrl);

    expect(result).toBe(fullUrl);
  });

  test('getDirectusImageUrl returns fallback for undefined', () => {
    const result = getDirectusImageUrl(undefined, '/fallback.jpg');

    expect(result).toBe('/fallback.jpg');
  });

  test('getDirectusThumbnail generates optimized URL with params', () => {
    const result = getDirectusThumbnail('abc-123', 400, 300, 80);

    expect(result).toContain('https://admin.ultimamilla.com.ar/assets/abc-123');
    expect(result).toContain('width=400');
    expect(result).toContain('height=300');
    expect(result).toContain('quality=80');
    expect(result).toContain('format=webp');
    expect(result).toContain('fit=cover');
  });

  test('getDirectusThumbnail generates URL without height', () => {
    const result = getDirectusThumbnail('abc-123', 400);

    expect(result).toContain('width=400');
    expect(result).not.toContain('height=');
    expect(result).not.toContain('fit=cover');
  });

  test('getDirectusThumbnail returns placeholder for undefined', () => {
    const result = getDirectusThumbnail(undefined);

    expect(result).toBe('/images/placeholder.jpg');
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
