// Import testing utilities
require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

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
});

// Assign mocks to global scope
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;
