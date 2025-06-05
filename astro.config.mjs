// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node'; // ¡Nota! Aquí hay una doble importación, elimina una si no es intencional.
import netlify from '@astrojs/netlify'; // Si usas netlify, asegúrate de que no entre en conflicto con node


// import dotenv from 'dotenv'; // Remove dotenv

// dotenv.config(); // Remove dotenv

import mdx from '@astrojs/mdx';             // <-- Descomentado
import tailwind from '@astrojs/tailwind';   // <-- Descomentado
import sitemap from '@astrojs/sitemap';     // <-- Descomentado
import alpinejs from '@astrojs/alpinejs';   // <-- Descomentado
// import { loadEnv } from 'vite'; // Solo necesario si lees .env para 'site' abajo

// Importa el adaptador (Asegúrate de tener solo una importación de @astrojs/node)
// import node from '@astrojs/node'; // <-- Elimina esta si ya la importaste arriba

// Usa la forma simple que funcionó
export default defineConfig({

  // Configuración SSR y Adaptador (Funcionando)
  output: 'server',
  adapter: node({ // Asegúrate de usar el adaptador node si ese es tu objetivo
    mode: 'standalone' // o 'middleware' si lo integras en otro servidor Node

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
    // Si no usas netlify, elimina esta línea: netlify(),
  ],

  // Agrega o modifica la sección server así:
  server: {
    host: true, // <-- ¡AGREGA ESTA LÍNEA! Esto hace que escuche en 0.0.0.0
    port: 4321, // El puerto interno del contenedor
  },


  // Puedes mantener la configuración de Vite comentada si no la necesitas
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