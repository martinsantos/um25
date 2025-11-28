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