import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  output: 'static',
  site: 'https://martinsantos.github.io',
  base: '/um25/',
  trailingSlash: 'always',

  integrations: [
    tailwind(),
    alpinejs()
  ],

  server: {
    host: true,
    port: 4321,
  },

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
