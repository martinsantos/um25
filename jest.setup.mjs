// Configuración global de Jest
import { jest, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// Hacer que expect esté disponible globalmente
globalThis.expect = expect;

// Hacer que jest esté disponible globalmente
globalThis.jest = jest;

// Configuración de variables de entorno globales
globalThis.import = {
  meta: {
    env: {
      MODE: 'test',
      DEV: true,
      PROD: false,
      SSR: false,
      PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
      DIRECTUS_STATIC_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      NODE_ENV: 'test'
    },
  },
};

// Mock para fetch global
globalThis.fetch = jest.fn((url, options = {}) => {
  // Simular respuestas basadas en la URL
  if (url.includes('/users/me')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: {
            id: '74e3b05e-0f14-422e-9ad3-759d426db60a'
          }
        }
      })
    });
  }
  
  // Respuesta por defecto
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: [] }),
    text: () => Promise.resolve(JSON.stringify({ data: [] })),
    headers: new Map([['content-type', 'application/json']])
  });
});

// Mock para la API de Directus
const mockDirectus = {
  items: jest.fn().mockReturnThis(),
  readByQuery: jest.fn().mockResolvedValue({ data: [] }),
  readOne: jest.fn().mockResolvedValue({ data: {} }),
  getAntecedentes: jest.fn().mockResolvedValue({
    data: [{
      id: 1,
      titulo: 'Proyecto de prueba',
      descripcion: 'Descripción de prueba',
      fecha: '2023-01-01',
      imagen_principal: 'test-image.jpg',
      Area: 'Área de prueba',
      Cliente: 'Cliente de prueba',
      Unidad_de_negocio: 'Unidad de prueba',
      slug: 'proyecto-de-prueba'
    }],
    meta: { 
      total_count: 1, 
      filter_count: 1,
      page: 1,
      limit: 10
    }
  }),
  getFilterOptions: jest.fn().mockResolvedValue({
    area: ['Área de prueba', 'Otra área'],
    cliente: ['Cliente de prueba', 'Otro cliente'],
    unidad_negocio: ['Unidad de prueba', 'Otra unidad']
  }),
  PAGE_SIZE: 10,
  DEFAULT_IMAGE: '/default-image.jpg'
};

global.directus = mockDirectus;

// Mock para localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

globalThis.localStorage = localStorageMock;

// Mock para sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

globalThis.sessionStorage = sessionStorageMock;

// Mock para matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para scrollTo
window.scrollTo = jest.fn();

// Mock para IntersectionObserver
class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn((target) => {
      // Simular la intersección inmediatamente
      this.callback([{ isIntersecting: true, target }], this);
    });
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
}

globalThis.IntersectionObserver = IntersectionObserver;

// Configuración de fetch mock
const mockFetchResponse = (status, statusText, response) => {
  return Promise.resolve({
    status,
    statusText,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
    headers: new Map([['content-type', 'application/json']])
  });
};

// Configuración adicional para testing-library
globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Configuración para manejar estilos CSS en pruebas
Object.defineProperty(globalThis.window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Configuración para manejar window.scrollTo
globalThis.window.scroll = jest.fn();
globalThis.window.scrollTo = jest.fn();

// Configuración para manejar window.matchMedia
Object.defineProperty(globalThis.window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
