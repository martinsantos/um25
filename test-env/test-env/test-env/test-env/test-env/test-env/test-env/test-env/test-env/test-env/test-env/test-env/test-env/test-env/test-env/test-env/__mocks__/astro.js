// Mock para el objeto global de Astro
const Astro = {
  request: {
    url: new URL('http://localhost:3000/antecedentes'),
    canonicalURL: new URL('http://localhost:3000/antecedentes')
  },
  site: new URL('http://localhost:3000'),
  props: {},
  params: {},
  redirect: jest.fn(),
  response: {
    status: 200,
    statusText: 'OK',
    headers: new Headers()
  },
  cookies: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn()
  },
  locals: {},
  // Añadir métodos de utilidad comunes
  url: {
    pathname: '/antecedentes',
    search: '',
    searchParams: new URLSearchParams()
  },
  canonicalURL: new URL('http://localhost:3000/antecedentes'),
  // Mock para import.meta.env
  env: {
    MODE: 'test',
    DEV: true,
    PROD: false,
    BASE_URL: '/',
    SITE: 'http://localhost:3000',
    PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
    DIRECTUS_STATIC_TOKEN: 'test-token'
  }
};

// Hacer que Astro esté disponible globalmente
global.Astro = Astro;

// Mock para import.meta.env
const env = new Proxy({}, {
  get(_, prop) {
    return Astro.env[prop] || process.env[prop] || '';
  }
});

global.import = {
  meta: { env }
};

// Exportar el mock para su uso en pruebas
module.exports = Astro;
