// Configuraciones adicionales después de configurar el entorno de pruebas
import '@testing-library/jest-dom';
import { configure } from '@testing-library/dom';

// Configurar testing-library
configure({
  testIdAttribute: 'data-test',
  asyncUtilTimeout: 10000, // Aumentar el tiempo de espera para las pruebas asíncronas
});

// Mock para IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn((target) => {
      this.callback([{ isIntersecting: true, target }], this);
    });
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock para ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

// Mock para matchMedia
global.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Mock para scrollTo
global.scrollTo = jest.fn();

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

global.localStorage = localStorageMock;

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

global.sessionStorage = sessionStorageMock;

// Mock para fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: [] }),
  })
);

// Mock para URL.createObjectURL
window.URL.createObjectURL = jest.fn();

// Mock para requestAnimationFrame
window.requestAnimationFrame = (callback) => setTimeout(callback, 0);

// Mock para cancelAnimationFrame
window.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock para scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Configurar el entorno para Astro
process.env.NODE_ENV = 'test';
process.env.PUBLIC_DIRECTUS_URL = 'http://localhost:8055';
process.env.PUBLIC_DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
process.env.SITE_URL = 'http://localhost:4321';

// Configurar el entorno para pruebas de React
if (typeof document !== 'undefined') {
  document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });
}

// Configurar el entorno para pruebas de navegador
global.window = global;
global.document = window.document || {};
global.navigator = window.navigator || {
  userAgent: 'node.js',
};

// Configurar el entorno para pruebas de fecha
jest.useFakeTimers().setSystemTime(new Date('2025-06-06T23:19:34-03:00'));

// Configurar el entorno para pruebas de zona horaria
process.env.TZ = 'America/Argentina/Buenos_Aires';

// Configurar el entorno para pruebas de internacionalización
const { JSDOM } = require('jsdom');
const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:4321',
});

global.window = window;
global.document = window.document;
global.navigator = window.navigator;

// Configurar el entorno para pruebas de estilos
document.documentElement.setAttribute('data-theme', 'light');

// Configurar el entorno para pruebas de accesibilidad
const { toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);

// Configurar el entorno para pruebas de snapshots
expect.addSnapshotSerializer(require('jest-serializer-html'));

// Configurar el entorno para pruebas de consola
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      !args[0].includes('Warning: An update to %s inside a test was not wrapped in act') &&
      !args[0].includes('Warning: ReactDOM.render is no longer supported in React 18') &&
      !args[0].includes('Warning: validateDOMNesting') &&
      !args[0].includes('Warning: Each child in a list should have a unique') &&
      !args[0].includes('Warning: Failed prop type') &&
      !args[0].includes('Warning: React does not recognize the') &&
      !args[0].includes('Warning: The tag <') &&
      !args[0].includes('Warning: validateDOMNesting') &&
      !args[0].includes('Warning: Received `%s` for a non-boolean attribute') &&
      !args[0].includes('Warning: Invalid value for prop `%s` on <%s> tag')
    ) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args) => {
    if (
      !args[0].includes('DeprecationWarning:') &&
      !args[0].includes('Warning: componentWillMount has been renamed') &&
      !args[0].includes('Warning: componentWillReceiveProps has been renamed')
    ) {
      originalConsoleWarn(...args);
    }
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.resetAllMocks();
  jest.clearAllTimers();
});
