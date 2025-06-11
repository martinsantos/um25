// Polyfill for TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  import { TextEncoder, TextDecoder } from 'util';
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for fetch
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Polyfill for URL and URLSearchParams
if (typeof global.URL === 'undefined' || typeof global.URLSearchParams === 'undefined') {
  const { URL, URLSearchParams } = require('url');
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
}

// Mock window object if it doesn't exist (for JSDOM)
if (typeof window === 'undefined') {
  const { JSDOM } = require('jsdom');
  const { window: jsdomWindow } = new JSDOM('<!doctype html><html><body></body></html>');
  
  global.window = jsdomWindow;
  global.document = window.document;
  global.navigator = window.navigator;
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Ensure process.env is available
if (typeof process === 'undefined') {
  global.process = require('process');
}

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

global.localStorage = localStorageMock;

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

global.sessionStorage = sessionStorageMock;
