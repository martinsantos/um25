import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  // SSR habilitado para producción
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  // URL base para generación de sitemap y rutas absolutas
  site: process.env.PUBLIC_SITE_URL || 'https://www.ultimamilla.com.ar',

  // Integraciones
  integrations: [
    mdx(),
    tailwind(),
    sitemap(),
    alpinejs()
  ],

  // Configuración del servidor
  server: {
    host: true,
    port: 4321,
    hmr: false, // Deshabilitado para producción
    allowedHosts: [
      'ultimamilla.com.ar',
      'www.ultimamilla.com.ar',
      'ultimamilla.com.ar',
      'www.ultimamilla.com.ar',
      'localhost',
      '127.0.0.1',
      '23.105.176.45',
      // Explicit host:port variants for strict reverse proxy environments
      'ultimamilla.com.ar:443',
      'www.ultimamilla.com.ar:443',
      'ultimamilla.com.ar:443',
      'www.ultimamilla.com.ar:443',
      '23.105.176.45:443',
      'ultimamilla.com.ar:80',
      'www.ultimamilla.com.ar:80',
      'ultimamilla.com.ar:80',
      'www.ultimamilla.com.ar:80',
      '23.105.176.45:80'
    ]
  },

  // Optimizaciones para producción
  build: {
    inlineStylesheets: 'always', // Inline todos los CSS para evitar problemas de MIME type
    assets: '_astro', // Directorio para assets
    splitting: true, // Code splitting habilitado
  },

  // Configuración de Vite con optimizaciones
  vite: {
    // Configuración del entorno
    define: {
      __PROD__: process.env.NODE_ENV === 'production',
      // Deshabilitar completamente Vite HMR en producción
      'import.meta.hot': process.env.NODE_ENV === 'production' ? false : 'undefined'
    },
    // Configuración del servidor
    server: {
      host: true,
      // Completamente deshabilitar HMR en producción
      hmr: process.env.NODE_ENV === 'production' ? false : true,
      allowedHosts: [
        'ultimamilla.com.ar',
        'www.ultimamilla.com.ar',
        'localhost',
        '127.0.0.1',
        '23.105.176.45'
      ]
    },
    preview: {
      host: true,
      allowedHosts: [
        'ultimamilla.com.ar',
        'www.ultimamilla.com.ar',
        'localhost',
        '127.0.0.1',
        '23.105.176.45',
        // Explicit host:port variants for strict reverse proxy environments
        'ultimamilla.com.ar:443',
        'www.ultimamilla.com.ar:443',
        '23.105.176.45:443',
        'ultimamilla.com.ar:80',
        'www.ultimamilla.com.ar:80',
        '23.105.176.45:80'
      ]
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    build: {
      // Optimizaciones de producción
      minify: 'esbuild', // Usar esbuild para mejor compatibilidad
      cssCodeSplit: true, // Dividir CSS por chunks
      rollupOptions: {
        output: {
          // Deshabilitar hashing en nombres de archivos para SSR
          entryFileNames: '[name].mjs',
          chunkFileNames: '[name].mjs',
          assetFileNames: '[name][extname]',
          manualChunks: undefined
        }
      },
      // Configuración de compresión
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000
    },
    // Configuración de compresión y optimización de assets
    ssr: {
      noExternal: ['sharp'] // Incluir sharp en el bundle para optimización de imágenes
    }
  },

  // Configuración de imágenes optimizada
  image: {
    // Configuración de Sharp para optimización de imágenes
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689 // ~16K x 16K
      }
    },
    // Formatos de salida optimizados
    formats: ['webp', 'avif', 'png', 'jpg'],
    // Calidades por formato
    quality: {
      webp: 85,
      avif: 80,
      png: 90,
      jpg: 85
    }
  },

  // Configuración de TypeScript
  typescript: {
    tsconfig: './tsconfig.json',
  },

  // Configuración de compresión y caché
  compressHTML: true
  // Nota: optimizeHoistedScript fue movido a la configuración principal
});
