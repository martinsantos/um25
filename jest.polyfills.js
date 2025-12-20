// Jest polyfills and mocks for testing
// JSDOM provides most of these, but we define them for consistency

// Mock localStorage
global.localStorage = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn((key, value) => {}),
  removeItem: jest.fn((key) => {}),
  clear: jest.fn(() => {}),
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn((key, value) => {}),
  removeItem: jest.fn((key) => {}),
  clear: jest.fn(() => {}),
};
