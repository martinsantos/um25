// Import testing utilities
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
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

// Mock sessionStorage
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
  };
})();

// Mock fetch with default implementation
global.fetch = jest.fn((...args) => {
  console.warn('global.fetch is not mocked for this call:', ...args);
  return Promise.reject(new Error('Global fetch must be mocked in tests'));
});

// Mock Directus SDK
jest.mock('@directus/sdk', () => ({
  createDirectus: jest.fn().mockImplementation(() => ({
    withRest: jest.fn().mockReturnThis(),
    withAuth: jest.fn().mockReturnThis(),
    login: jest.fn().mockResolvedValue({ access_token: 'mocked-token' }),
    request: jest.fn().mockResolvedValue({}),
  })),
}));

// Set up environment variables for tests
process.env.NODE_ENV = 'test';
process.env.TEST_ENV = 'jest';
process.env.PUBLIC_DIRECTUS_URL = 'http://localhost:8055';
process.env.DIRECTUS_STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
process.env.PUBLIC_DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
process.env.DIRECTUS_URL = 'http://localhost:8055';
process.env.DIRECTUS_EMAIL = 'admin@example.com';
process.env.DIRECTUS_PASSWORD = 'd1r3ctu5';
process.env.CI = 'false';

// Mock console methods to keep test output clean
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: jest.fn(originalConsole.log),
  debug: jest.fn(originalConsole.debug),
  info: jest.fn(originalConsole.info),
  warn: jest.fn(originalConsole.warn),
  error: jest.fn(originalConsole.error),
};

// Mock Response object
class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map();
    
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
    
    // Default to JSON content type if not specified
    if (!this.headers.has('content-type')) {
      this.headers.set('content-type', 'application/json');
    }
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body.toString();
  }
  
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
}

// Mock window object
const mockResponse = (status, statusText, response) => {
  return new MockResponse(JSON.stringify(response), {
    status,
    statusText,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Mock window.URL
const originalURL = global.URL;
const mockURL = {
  createObjectURL: jest.fn((blob) => `blob:${URL.createObjectURL(blob)}`),
  revokeObjectURL: jest.fn(),
};

global.URL = {
  ...originalURL,
  ...mockURL,
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
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

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.elements = new Set();
  }
  
  disconnect() {
    this.elements.clear();
  }
  
  observe(element) {
    this.elements.add(element);
  }
  
  unobserve(element) {
    this.elements.delete(element);
  }
  
  takeRecords() {
    return [];
  }
  
  // Test helper to trigger intersection changes
  trigger(entries) {
    this.callback(entries, this);
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observations = [];
  }
  
  observe(target) {
    this.observations.push(target);
  }
  
  unobserve(target) {
    this.observations = this.observations.filter(obs => obs !== target);
  }
  
  disconnect() {
    this.observations = [];
  }
  
  // Test helper to trigger resize
  trigger(entries) {
    this.callback(entries, this);
  }
}

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Setup global mocks
beforeEach(() => {
  // Clear all mocks between tests
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch mock
  global.fetch.mockImplementation((...args) => {
    console.warn('global.fetch is not mocked for this call:', ...args);
    return Promise.reject(new Error('Global fetch must be mocked in tests'));
  });
  
  // Reset URL mocks
  mockURL.createObjectURL.mockClear();
  mockURL.revokeObjectURL.mockClear();
  
  // Reset scrollTo mock
  window.scrollTo.mockClear();
});

// Assign mocks to global scope
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

// Global test helpers
global.mockResponse = mockResponse;

// Mock Directus static token
process.env.DIRECTUS_STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
process.env.PUBLIC_DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
process.env.PUBLIC_DIRECTUS_URL = 'http://localhost:8055';

// Mock console methods to reduce test noise
const originalConsole = { ...console };
const consoleMock = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

global.console = consoleMock;

// Reset all mocks before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset URL mocks
  URL.createObjectURL.mockClear();
  URL.revokeObjectURL.mockClear();
  
  // Reset console mocks
  console.log.mockClear();
  console.warn.mockClear();
  console.error.mockClear();
  console.debug.mockClear();
});

// Restore original console after all tests
afterAll(() => {
  global.console = originalConsole;
});
