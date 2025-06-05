import { describe, it, expect, vi, beforeEach } from 'vitest';
import { directus } from '../directus';

// Mock de las funciones de fetch
global.fetch = vi.fn();

const API_URL = 'http://localhost:8055';
const STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

describe('Directus Utils', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    fetch.mockClear();
    
    // Configurar el entorno
    process.env.PUBLIC_DIRECTUS_URL = API_URL;
    process.env.DIRECTUS_STATIC_TOKEN = STATIC_TOKEN;
  });

  describe('getAntecedentes', () => {
    it('debe hacer una solicitud GET a la API de Directus con los parámetros correctos', async () => {
      const mockData = {
        data: [
          {
            id: '1',
            Titulo: 'Proyecto de prueba',
            Descripcion: 'Descripción de prueba',
            Fecha: '2023-01-01',
            Cliente: 'Cliente de prueba',
            Unidad_de_negocio: 'Unidad de prueba',
            Area: 'Área de prueba'
          }
        ],
        meta: {
          filter_count: 1,
          total_count: 1
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await directus.getAntecedentes();

      // Verificar que se llamó a fetch con los parámetros correctos
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/items/Antecedentes`,
        {
          params: {
            fields: 'id,Titulo,Descripcion,Imagen,Fecha,Cliente,Unidad_de_negocio,Area',
            sort: '-Fecha',
            limit: 9, // Valor por defecto de PAGE_SIZE
            meta: '*'
          },
          credentials: 'same-origin',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual(mockData);
    });

    it('debe manejar errores de la API', async () => {
      fetch.mockRejectedValueOnce(new Error('Error de red'));
      await expect(directus.getAntecedentes()).rejects.toThrow('Error de red');
    });
  });

  describe('getFilterOptions', () => {
    it('debe obtener las opciones de filtro de la API', async () => {
      // Configurar mocks para las tres llamadas a la API
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { Area: 'Área 1' },
              { Area: 'Área 2' }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { Cliente: 'Cliente 1' },
              { Cliente: 'Cliente 2' }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { Unidad_de_negocio: 'Unidad 1' },
              { Unidad_de_negocio: 'Unidad 2' }
            ]
          })
        });

      const result = await directus.getFilterOptions();

      // Verificar que se realizaron las tres llamadas esperadas
      expect(fetch).toHaveBeenCalledTimes(3);
      
      // Verificar la primera llamada para obtener áreas
      expect(fetch).toHaveBeenNthCalledWith(1,
        `${API_URL}/items/Antecedentes?groupBy[]=Area`,
        {
          credentials: 'same-origin',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Verificar la segunda llamada para obtener clientes
      expect(fetch).toHaveBeenNthCalledWith(2,
        `${API_URL}/items/Antecedentes?groupBy[]=Cliente`,
        {
          credentials: 'same-origin',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Verificar la tercera llamada para obtener unidades de negocio
      expect(fetch).toHaveBeenNthCalledWith(3,
        `${API_URL}/items/Antecedentes?groupBy[]=Unidad_de_negocio`,
        {
          credentials: 'same-origin',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // Verificar el resultado
      expect(result).toEqual({
        areas: ['Área 1', 'Área 2'],
        clientes: ['Cliente 1', 'Cliente 2'],
        unidades: ['Unidad 1', 'Unidad 2']
      });
    });
  });

  describe('getRandomImages', () => {
    it('debe obtener imágenes aleatorias de la API', async () => {
      const mockImages = [
        { id: 'img1', filename_download: 'img1.jpg', width: 800, height: 600 },
        { id: 'img2', filename_download: 'img2.jpg', width: 1024, height: 768 }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockImages
        })
      });

      const result = await directus.getRandomImages(2);

      // Verificar que se llamó a la API correctamente
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/files?filter[type][_starts_with]=image&limit=2`,
        {
          credentials: 'same-origin',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // Verificar el resultado
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'img1',
        url: `${API_URL}/assets/img1`,
        filename: 'img1.jpg',
        width: 800,
        height: 600
      });
    });
  });
});
