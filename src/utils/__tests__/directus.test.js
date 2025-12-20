import { describe, it, expect, jest, beforeAll, beforeEach, afterEach } from '@jest/globals';

// Mock fetch
global.fetch = jest.fn();

// Mock globalThis.Astro for the tests
globalThis.Astro = {
  url: new URL('http://localhost:4321')
};

const API_URL = 'http://localhost:8055';
const STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

// Helper function to create a mock response
const createMockResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
});

// Mock para localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Configurar localStorage mock
global.localStorage = localStorageMock;

// Mock directus before importing
jest.mock('../directus', () => ({
  directus: {
    login: jest.fn(),
    getAntecedentes: jest.fn(),
    getFilterOptions: jest.fn(),
    getRandomImages: jest.fn()
  }
}));

import { directus } from '../directus';

describe('Directus Utils', () => {
  let originalEnv;

  beforeAll(() => {
    // Guardar el entorno original
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
    fetch.mockClear();
    localStorage.clear();
    
    // Configurar el entorno
    process.env.PUBLIC_DIRECTUS_URL = API_URL;
    process.env.DIRECTUS_STATIC_TOKEN = STATIC_TOKEN;
    
    // Mock fetch por defecto
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
        status: 200
      })
    );
  });

  afterEach(() => {
    // Restaurar el entorno después de cada prueba
    process.env = { ...originalEnv };
  });

  describe('login', () => {
    it('should login with static token', async () => {
      const mockResponse = {
        data: {
          access_token: STATIC_TOKEN,
          expires: 3600
        }
      };

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      await directus.login();

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/auth/login/static-token`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATIC_TOKEN}`
          },
          body: JSON.stringify({
            access_token: STATIC_TOKEN
          })
        })
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', STATIC_TOKEN);
    });

    it('should throw an error on failed login', async () => {
      const errorResponse = {
        errors: [
          {
            message: 'Invalid token',
            extensions: {
              code: 'INVALID_CREDENTIALS'
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce(createMockResponse(errorResponse, 401));

      await expect(directus.login()).rejects.toThrow('Error de autenticación');
    });
  });

  describe('getAntecedentes', () => {
    it('should make a GET request to Directus API with correct parameters', async () => {
      const mockData = {
        data: [
          {
            id: '1',
          }
        ] 
      };
      
      fetch.mockResolvedValueOnce(createMockResponse(mockData));

      const filters = { status: 'published' };
      const result = await directus.getAntecedentes(filters);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/antecedentes'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${STATIC_TOKEN}`
          })
        })
      );
      expect(result).toEqual(mockData.data);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        errors: [{ message: 'Server error' }]
      };
      
      fetch.mockResolvedValueOnce(createMockResponse(errorResponse, 500));

      await expect(directus.getAntecedentes())
        .rejects
        .toThrow('Error al obtener los antecedentes');
    });
  });

  describe('getFilterOptions', () => {
    it('should fetch filter options', async () => {
      const mockOptions = {
        categories: ['cat1', 'cat2'],
        years: [2022, 2023]
      };

      fetch
        .mockResolvedValueOnce(createMockResponse({ data: mockOptions.categories }))
        .mockResolvedValueOnce(createMockResponse({ data: mockOptions.years }));

      const result = await directus.getFilterOptions();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockOptions);
    });
  });

  describe('getRandomImages', () => {
    it('should fetch random images', async () => {
      const mockImages = [
        { 
          id: 'img1', 
          title: 'Image 1',
          filename_download: 'image1.jpg',
          type: 'image/jpeg'
        },
        { 
          id: 'img2', 
          title: 'Image 2',
          filename_download: 'image2.jpg',
          type: 'image/jpeg'
        }
      ];

      fetch.mockResolvedValueOnce(createMockResponse({ data: mockImages }));

      const count = 2;
      const result = await directus.getRandomImages(count);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/items/files?limit=${count}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${STATIC_TOKEN}`
          })
        })
      );
      expect(result).toEqual(mockImages);
    });
  });
});
