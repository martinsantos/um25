// Configuración de prueba para Astro
export default {
  // Deshabilitar el renderizado del lado del servidor para pruebas
  output: 'static',
  // Configuración de Vite para pruebas
  vite: {
    test: {
      // Configuración de entorno para pruebas
      environment: 'jsdom',
      // Configuración de globals
      globals: true,
      // Configuración de cobertura
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
  },
  // Configuración de compilación para pruebas
  build: {
    // Deshabilitar minificación para facilitar las pruebas
    minify: false,
  },
  // Configuración de servidor para pruebas
  server: {
    port: 3000,
  },
};
