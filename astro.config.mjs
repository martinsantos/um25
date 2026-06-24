import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import alpinejs from '@astrojs/alpinejs';
import sentry from '@sentry/astro';

const sentryDsn = process.env.PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '';
const sentryEnvironment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const sentryRelease = process.env.SENTRY_RELEASE || process.env.npm_package_version || '';

export default defineConfig({
  // Configuración SSR y Adaptador
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  // URL base para generación de sitemap y rutas absolutas
  site: 'https://www.ultimamilla.com.ar',
  trailingSlash: 'ignore',
  devToolbar: {
    enabled: false,
  },

  // Integraciones
  integrations: [
    sentry({
      enabled: process.env.NODE_ENV === 'production',
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    mdx(),
    tailwind(),
    alpinejs(),
  ],

  // Configuración del servidor
  server: {
    host: true,
    port: 4321,
  },

  // Configuración de Vite
  vite: {
    define: {
      __UMSA_SENTRY_DSN__: JSON.stringify(sentryDsn),
      __UMSA_SENTRY_ENVIRONMENT__: JSON.stringify(sentryEnvironment),
      __UMSA_SENTRY_RELEASE__: JSON.stringify(sentryRelease),
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    server: {
      host: '0.0.0.0',
      strictPort: false,
      hmr: false,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'ultimamilla.com.ar',
        'ultimamilla.com.ar',
        '.ultimamilla.com.ar'
      ]
    }
  },

  // Especifica explícitamente la ruta de tsconfig.json
  typescript: {
    tsconfig: './tsconfig.json',
  }
});
