// Polyfill for TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  const util = await import('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Polyfill for fetch
if (typeof global.fetch === 'undefined') {
  const nodeFetch = await import('node-fetch');
  global.fetch = nodeFetch.default;
}

// Polyfill for URL and URLSearchParams
if (typeof global.URL === 'undefined' || typeof global.URLSearchParams === 'undefined') {
  const url = await import('url');
  global.URL = url.URL;
  global.URLSearchParams = url.URLSearchParams;
}

// Mock window object if it doesn't exist (for JSDOM)
if (typeof window === 'undefined') {
  const jsdomModule = await import('jsdom');
  const { JSDOM } = jsdomModule;
  const { window: jsdomWindow } = new JSDOM('<!doctype html><html><body></body></html>');

  global.window = jsdomWindow;
  global.document = window.document;
  global.navigator = window.navigator;
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Ensure process.env is available
if (typeof process === 'undefined') {
  const processModule = await import('process');
  global.process = processModule;
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.sessionStorage = sessionStorageMock;
