// Configuración global para pruebas con Vitest
import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extender expect con matchers de jest-dom
import * as matchers from '@testing-library/jest-dom/matchers';

// Añadir matchers de jest-dom a expect
Object.entries(matchers).forEach(([name, matcher]) => {
  // @ts-ignore
  expect.extend({ [name]: matcher });
});

// Limpiar después de cada prueba
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Definir tipo para Astro global
interface AstroGlobal {
  request: {
    url: URL;
  };
  params: Record<string, string>;
  props: Record<string, unknown>;
}

declare global {
  var Astro: AstroGlobal;
}

// Mock de Astro global
const Astro: AstroGlobal = {
  request: {
    url: new URL('http://localhost:3000/antecedentes')
  },
  params: {},
  props: {}
};

// Asignar el mock a globalThis.Astro
globalThis.Astro = Astro;

// Mock para matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});
