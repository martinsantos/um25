import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  // Configuración SSR y Adaptador
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  // URL base para generación de sitemap y rutas absolutas
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:3000',

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
  },

  // Optimizaciones para producción
  build: {
    inlineStylesheets: 'auto', // Inline CSS pequeño para reducir requests
    assets: '_astro', // Directorio para assets
    splitting: true, // Code splitting habilitado
  },

  // Configuración de Vite con optimizaciones
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    build: {
      // Optimizaciones de producción
      minify: 'terser', // Minificación agresiva con terser
      cssCodeSplit: true, // Dividir CSS por chunks
      rollupOptions: {
        output: {
          // Estrategia de nombrado con hash para caché
          assetFileNames: '_astro/[name].[hash][extname]',
          chunkFileNames: '_astro/[name].[hash].js',
          entryFileNames: '_astro/[name].[hash].js',
          // Optimizar chunks
          manualChunks: {
            vendor: ['@astrojs/node'],
            utils: ['date-fns']
          }
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
