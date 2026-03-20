import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  output: 'server',
  adapter: netlify(),

  site: 'https://ultimamilla.com.ar',
  trailingSlash: 'never',

  integrations: [
    mdx(),
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
