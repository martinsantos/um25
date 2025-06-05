import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extiende expect con los matchers de jest-dom
Object.entries(matchers).forEach(([key, value]) => {
  if (key.startsWith('to')) {
    expect.extend({ [key]: value });
  }
});

// Limpia el DOM después de cada prueba
afterEach(() => {
  cleanup();
});

// Mock para los componentes de Astro
globalThis.Astro = {
  url: new URL('http://localhost:3000/antecedentes'),
  request: {
    url: 'http://localhost:3000/antecedentes'
  },
  params: {}
};

// Mock para el entorno de desarrollo
globalThis.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false
    }
  }
};

// Mock para el objeto global de Vite
if (!globalThis.import.meta) {
  globalThis.import.meta = {
    env: {
      DEV: true,
      PROD: false
    }
  };
}

// Mock para el objeto global de Node.js
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {}
  };
}
