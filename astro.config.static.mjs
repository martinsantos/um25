import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  // Configuración estática para producción
  output: 'static',

  // URL base para generación de sitemap y rutas absolutas
  site: process.env.PUBLIC_SITE_URL || 'https://www.umbot.com.ar',

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