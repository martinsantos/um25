// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';             // <-- Descomentado
import tailwind from '@astrojs/tailwind';   // <-- Descomentado
import sitemap from '@astrojs/sitemap';     // <-- Descomentado
import alpinejs from '@astrojs/alpinejs';   // <-- Descomentado
// import { loadEnv } from 'vite'; // Solo necesario si lees .env para 'site' abajo

// Importa el adaptador
import node from '@astrojs/node';

// Usa la forma simple que funcionó
export default defineConfig({

  // Configuración SSR y Adaptador (Funcionando)
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  // Define la URL base (Importante para sitemap)
  // Puedes usar una variable de entorno leída aquí si prefieres,
  // pero requeriría volver a la forma funcional y loadEnv, ¡prueba esto primero!
  site: process.env.SITE_URL || 'http://localhost:4321', // O tu URL de producción, ej: process.env.PUBLIC_SITE_URL

  // Restaura tus integraciones
  integrations: [
    mdx(),
    tailwind(),
    sitemap(), // <-- Asegúrate que 'site' esté definido arriba
    alpinejs()
  ],

  // Puedes mantener la configuración de Vite comentada si no la necesitas
  vite: {
    define: {
      'process.env.PUBLIC_DIRECTUS_URL': JSON.stringify(process.env.PUBLIC_DIRECTUS_URL),
      'process.env.PUBLIC_DIRECTUS_TOKEN': JSON.stringify(process.env.PUBLIC_DIRECTUS_TOKEN),
    },
  }
});