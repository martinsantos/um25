import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuración para manejar archivos .astro en las pruebas
const astroFileRegex = /\.(astro|css|scss|sass|less|styl|stylus|pcss|postcss)$/;

export default defineConfig({
  plugins: [
    react(),
  ],
  test: {
    // Configuración global para las pruebas
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    
    // Excluir archivos que no son de prueba
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/*.astro', // Excluir archivos .astro
      '**/*.stories.*', // Excluir archivos de historias de Storybook
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    
    // Incluir solo archivos de prueba
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
    ],
    
    // Configuración de cobertura
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/vendor/**',
        '**/*.astro',
        '**/*.stories.*',
      ],
    },
    
    // Configuración del entorno de prueba
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    
    // Mock para archivos estáticos
    server: {
      deps: {
        inline: [
          '@astrojs/**',
          'astro',
          '**/src/__mocks__/**',
        ],
      },
    },
  },
  
  // Configuración de resolución de módulos
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@astrojs/mdx': fileURLToPath(new URL('./node_modules/@astrojs/mdx/dist/index.js', import.meta.url)),
      'astro:content': fileURLToPath(new URL('./node_modules/astro/dist/content/index.js', import.meta.url)),
      '@': resolve(__dirname, './src'),
    },
  },
  
  // Configuración de optimización de dependencias
  optimizeDeps: {
    include: [
      '@astrojs/mdx',
      'astro',
      '@astrojs/renderer-react',
    ],
    exclude: [
      '@astrojs/renderer-vue',
      '@astrojs/renderer-svelte',
    ],
  },
  
  // Configuración del servidor de desarrollo
  server: {
    fs: {
      // Permitir servir archivos desde el directorio del proyecto
      allow: ['..'],
    },
  },
  
  // Configuración para manejar archivos estáticos
  assetsInclude: ['**/*.md'],
  
  // Configuración para transformar archivos
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }],
  },
  
  // Mock para archivos de estilo y recursos estáticos
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@astrojs/(.*)$': '<rootDir>/node_modules/@astrojs/$1',
    '^astro:config$': '<rootDir>/node_modules/astro/dist/config/index.js',
    '^astro:components$': '<rootDir>/node_modules/astro/dist/components/index.js',
    '^astro:content$': '<rootDir>/node_modules/astro/dist/content/index.js',
    '^astro:middleware$': '<rootDir>/node_modules/astro/dist/middleware/index.js',
    '^astro:middleware/kit$': '<rootDir>/node_modules/astro/dist/middleware/kit/index.js',
    '^astro:middleware/kit/ssr$': '<rootDir>/node_modules/astro/dist/middleware/kit/ssr.js',
    '^astro:middleware/kit/ssr/load$': '<rootDir>/node_modules/astro/dist/middleware/kit/ssr/load.js',
    '^astro:middleware/kit/ssr/manifest$': '<rootDir>/node_modules/astro/dist/middleware/kit/ssr/manifest.js',
    '^astro:middleware/kit/ssr/response$': '<rootDir>/node_modules/astro/dist/middleware/kit/ssr/response.js',
  },
  
  // Configuración de transformación de módulos
  transformIgnorePatterns: [
    'node_modules/(?!(astro|@astrojs|@astrojs/renderer-react|@astrojs/renderer-vue|@astrojs/renderer-svelte|@astrojs/renderer-solid|@astrojs/renderer-preact|@astrojs/renderer-lit|@astrojs/renderer-vue3|@astrojs/renderer-svelte3)/)',
  ],
  
  // Configuración de módulos sin procesar
  moduleDirectories: ['node_modules', 'src'],
  
  // Configuración de extensiones de archivo
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Configuración de mocks
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Configuración de watch
  watchPathIgnorePatterns: [
    'node_modules',
    '\.cache',
    '\.git',
    'dist',
    'build',
    'coverage',
    '.astro',
    '.svelte-kit',
    '.vercel',
    '.netlify',
    '.output',
  ],
  
  // Configuración de cobertura
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/test/**/*',
    '!src/**/__tests__/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  
  // Configuración de reportes
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }],
  ],
});
