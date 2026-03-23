/**
 * Astro config for GitHub Pages PREVIEW deployment
 * Uses static output (no SSR) with /um25/ base path
 * DOES NOT affect production (ultimamilla.com.ar)
 */
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  site: 'https://martinsantos.github.io',
  base: '/um25',
  trailingSlash: 'never',

  integrations: [
    tailwind()
  ],

  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  },

  typescript: {
    tsconfig: './tsconfig.json',
  }
});
