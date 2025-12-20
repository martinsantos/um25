// Jest globals are automatically available

// Configuración global de Jest para pruebas

// Configuración del entorno global para Node.js
if (typeof globalThis.window === 'undefined') {
  global.window = {};
  global.document = {};
  global.navigator = {
    userAgent: 'node',
  };
}

// Configuración básica para requestAnimationFrame
if (typeof window !== 'undefined') {
  global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 0);
  };
  
  global.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

// Asegurarse de que Element esté definido
if (typeof Element === 'undefined') {
  global.Element = class Element {};
}

// Mock para getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  x: 0,
  y: 0,
  toJSON: () => ({})
}));

// Mock para localStorage y sessionStorage
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
    key: jest.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Asegurar que window esté definido
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock para sessionStorage (similar a localStorage)
const sessionStorageMock = (() => {
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
    key: jest.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Aplicar el mock de localStorage
global.localStorage = localStorageMock;
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  enumerable: true,
  writable: true
});

// Aplicar el mock de localStorage a window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  enumerable: true,
  writable: true
});

// Aplicar el mock de sessionStorage a window
global.sessionStorage = sessionStorageMock;
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
  enumerable: true,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
  enumerable: true,
  writable: true
});

// ========== Mocks para APIs del navegador ==========
// Mock para fetch global con soporte para respuestas JSON y de error
globalThis.fetch = jest.fn((url, options = {}) => {
  // Respuesta por defecto
  let response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: () => Promise.resolve({ data: [] }),
    text: () => Promise.resolve(JSON.stringify({ data: [] })),
  };

  // Simular respuestas basadas en la URL
  if (typeof url === 'string' && url.includes('/api/')) {
    response = {
      ...response,
      json: () => Promise.resolve({ data: 'API response' }),
    };
  }

  return Promise.resolve({
    ...response,
    clone: () => ({ ...response }),
    text: async () => JSON.stringify(await response.json()),
  });
});



// Mock para matchMedia con soporte para listeners
const matchMediaMock = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(matchMediaMock),
});

// ========== Mocks para Observers ==========
// Mock para IntersectionObserver mejorado
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.root = null;
    this.rootMargin = '0px';
    this.thresholds = [0];
  }
  
  observe = jest.fn((target) => {
    const entry = {
      isIntersecting: true,
      target,
      boundingClientRect: {},
      intersectionRatio: 1,
      intersectionRect: {},
      rootBounds: null,
      time: 0
    };
    this.callback([entry], this);
  });
  
  unobserve = jest.fn(() => {});
  disconnect = jest.fn(() => {});
  takeRecords = jest.fn(() => []);
}

globalThis.IntersectionObserver = IntersectionObserverMock;

// Mock para ResizeObserver mejorado
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe = jest.fn(() => {});
  unobserve = jest.fn(() => {});
  disconnect = jest.fn(() => {});
  
  // Propiedad estática para pruebas
  static mockClear() {
    ResizeObserverMock.prototype.observe.mockClear();
    ResizeObserverMock.prototype.unobserve.mockClear();
    ResizeObserverMock.prototype.disconnect.mockClear();
  }
}

globalThis.ResizeObserver = ResizeObserverMock;

// Mock para MutationObserver
class MutationObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe = jest.fn(() => {});
  disconnect = jest.fn(() => {});
  takeRecords = jest.fn(() => []);
  
  // Propiedad estática para pruebas
  static mockClear() {
    MutationObserverMock.prototype.observe.mockClear();
    MutationObserverMock.prototype.disconnect.mockClear();
    MutationObserverMock.prototype.takeRecords.mockClear();
  }
}

globalThis.MutationObserver = MutationObserverMock;

// ========== Mocks para APIs de navegador ==========
// Mocks para scroll
window.scroll = jest.fn();
window.scrollTo = jest.fn();
window.scrollBy = jest.fn();
window.scrollBy = jest.fn();
window.scrollX = 0;
window.scrollY = 0;

// Mock para requestAnimationFrame
let rafCallbacks = [];

window.requestAnimationFrame = jest.fn((cb) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});

// Función auxiliar para ejecutar los callbacks de requestAnimationFrame
window.runAnimationFrames = () => {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  const timestamp = performance.now();
  callbacks.forEach((cb) => cb(timestamp));
};

// Mock para cancelAnimationFrame
window.cancelAnimationFrame = jest.fn((id) => {
  rafCallbacks[id - 1] = null;
});

// Mock para getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    getPropertyValue: (prop) => '',
    display: 'block',
    appearance: ['-webkit-appearance'],
  })),
});

// Mock para getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}));

// Mock para createElementNS (útil para SVGs)
const originalCreateElementNS = document.createElementNS;

document.createElementNS = function(namespaceURI, qualifiedName) {
  const element = originalCreateElementNS.call(this, namespaceURI, qualifiedName);
  
  // Añadir soporte para SVG
  if (namespaceURI === 'http://www.w3.org/2000/svg' && qualifiedName === 'svg') {
    element.createSVGRect = function() {
      return {};
    };
  }
  
  return element;
};

// Mock para console.warn y console.error en pruebas
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Silenciar advertencias de React sobre act()
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React.createFactory()') ||
        args[0].includes('ReactTestUtils has been moved to react-dom/test-utils') ||
        args[0].includes('act(') ||
        args[0].includes('ReactDOM.render is no longer supported in React 18'))
    ) {
      return;
    }
    originalWarn(...args);
  });

  // Silenciar errores específicos de React
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: useLayoutEffect does nothing on the server') ||
        args[0].includes('Warning: An update to %s inside a test was not wrapped in act') ||
        args[0].includes('validateDOMNesting'))
    ) {
      return;
    }
    originalError(...args);
  });
});

afterAll(() => {
  // Restaurar implementaciones originales después de las pruebas
  console.warn = originalWarn;
  console.error = originalError;
});

// Mock para process.env
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
  DIRECTUS_STATIC_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
};

// Configuración global de expect para mensajes de error más descriptivos
try {
  // Intentar cargar @testing-library/jest-dom si está disponible
  try {
    require('@testing-library/jest-dom');
  } catch (e) {
    // Ignorar si no está disponible
  }
} catch (e) {
  // Si @testing-library/jest-dom no está instalado, usar mocks básicos
  expect.extend({
    toBeInTheDocument(actual) {
      const pass = actual !== null && actual !== undefined;
      return {
        pass,
        message: () =>
          `expected ${this.utils.printReceived(actual)} to be in the document`,
      };
    },
    toHaveClass(actual, className) {
      const pass = actual?.classList?.contains(className) || false;
      return {
        pass,
        message: () =>
          `expected ${this.utils.printReceived(actual)} to have class ${this.utils.printExpected(className)}`,
      };
    },
    toHaveTextContent(actual, text) {
      const actualText = actual?.textContent || '';
      const pass = actualText.includes(text);
      return {
        pass,
        message: () =>
          `expected ${this.utils.printReceived(actualText)} to include ${this.utils.printExpected(text)}`,
      };
    },
  });
}

// Configuración para limpiar mocks entre pruebas
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Limpiar localStorage y sessionStorage después de cada prueba
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpiar fetch mocks
  if (globalThis.fetch && globalThis.fetch.mockClear) {
    globalThis.fetch.mockClear();
  }
});
