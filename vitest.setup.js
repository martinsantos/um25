import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpiar el entorno después de cada prueba
afterEach(() => {
  cleanup();
});

// Configuración global para las pruebas
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
  };
};

// Mock para el objeto global de Astro
global.Astro = {
  request: {
    url: new URL('http://localhost:4321/'),
    canonicalURL: new URL('http://localhost:4321/')
  },
  site: 'http://localhost:4321/',
  slugify: (text) => text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
};
