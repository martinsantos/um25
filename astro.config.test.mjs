import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://www.ultimamilla.work',
  integrations: [
    react(),
    mdx(),
    sitemap(),
  ],
  vite: {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['**/*.test.js', '**/*.test.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
      ],
      deps: {
        inline: ['@astrojs/**'],
      },
    },
  },
});
