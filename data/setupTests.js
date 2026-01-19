// Configuración global para pruebas de Jest
import '@testing-library/jest-dom';
import 'jest-localstorage-mock';
import 'jest-canvas-mock';

// Mock de fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de localStorage
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
    }),
  };
})();

// Mock de sessionStorage
const sessionStorageMock = {
  ...localStorageMock,
  clear: jest.fn(),
};

// Asignar los mocks a global
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

// Mock de matchMedia
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

// Mock de IntersectionObserver
class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserver;

// Mock de ResizeObserver
class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Mock de requestAnimationFrame y cancelAnimationFrame
const requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

const cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

global.requestAnimationFrame = requestAnimationFrame;
global.cancelAnimationFrame = cancelAnimationFrame;

// Mock de scrollTo
global.scrollTo = jest.fn();

// Mock de console para evitar ruido en las pruebas
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Opcional: silenciar mensajes de consola durante las pruebas
  console.error = (...args) => {
    // Ignorar errores específicos que no son relevantes para las pruebas
    if (
      args[0]?.includes('Using kebab-case for css properties') ||
      args[0]?.includes('React does not recognize the')
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    // Ignorar advertencias específicas que no son relevantes para las pruebas
    if (
      args[0]?.includes('componentWillReceiveProps') ||
      args[0]?.includes('componentWillUpdate')
    ) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  // Restaurar los métodos originales
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Limpiar los mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mockFetch.mockClear();
});
