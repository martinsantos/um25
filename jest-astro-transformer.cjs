// @ts-nocheck
// Transformador personalizado para archivos .astro en Jest (CommonJS)

// Importar el compilador de Astro sincrónicamente
const { compile } = require('astro/compiler-runtime');

// Configuración del compilador
const compilerOptions = {
  sourcefile: '',
  sourcemap: 'both',
  mode: 'test',
  module: 'esm',
  jsx: 'automatic',
  jsxImportSource: 'astro',
  define: {
    'import.meta.env.TEST': 'true',
    'import.meta.env.PROD': 'false',
    'import.meta.env.DEV': 'true',
    'import.meta.env.BASE_URL': '/',
    'import.meta.env.SITE': 'http://localhost:3000',
    'import.meta.env.SSR': 'true',
  },
  paths: {
    base: '/',
    assets: '/_astro',
  },
  output: 'server',
  fragments: true,
  optimize: false,
};

// Crear el transformador
const transformer = {
  // Procesar archivos .astro
  process: async (content, filename) => {
    try {
      // Configurar opciones del compilador
      const options = {
        ...compilerOptions,
        sourcefile: filename,
      };
      
      // Compilar el componente Astro a JavaScript
      const result = await compile(content, options);
      
      // Devolver el código JavaScript compilado
      return {
        code: result.code || '',
        map: result.map || {},
      };
    } catch (error) {
      console.error('Error al compilar el componente Astro:', error);
      return {
        code: `console.error('Error al compilar el componente Astro: ${error.message}');`,
        map: {},
      };
    }
  },
  
  // Función para procesar archivos de manera síncrona (requerido por Jest)
  processSync() {
    throw new Error('No se admite la compilación síncrona de componentes Astro');
  },
  
  // Función para obtener la clave de caché (requerido por Jest)
  getCacheKey() {
    return 'astroTransform';
  }
};

// Exportar el transformador
module.exports = transformer;
