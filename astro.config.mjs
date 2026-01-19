import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import alpinejs from '@astrojs/alpinejs';
// import sentry from '@sentry/astro';

export default defineConfig({
  // Configuración SSR y Adaptador
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  // URL base para generación de sitemap y rutas absolutas
  site: process.env.PUBLIC_SITE_URL || 'https://ultimamilla.com.ar',

  // Integraciones
  integrations: [
    // sentry({
    //   dsn: process.env.SENTRY_DSN,
    //   environment: process.env.NODE_ENV || 'development',
    //   release: process.env.npm_package_version,
    //   enabled: process.env.NODE_ENV === 'production',
    //   tracesSampleRate: 1.0,
    //   replaysSessionSampleRate: 0.1,
    //   replaysOnErrorSampleRate: 1.0,
    // }),
    mdx(),
    tailwind(),
    alpinejs()
  ],

  // Configuración del servidor
  server: {
    host: true,
    port: 4321,
  },

  // Configuración de Vite
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  },

  // Especifica explícitamente la ruta de tsconfig.json
  typescript: {
    tsconfig: './tsconfig.json',
  }
});