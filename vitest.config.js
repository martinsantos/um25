import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import astro from '@astrojs/vitest-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuración para manejar archivos .astro en las pruebas
const astroFileRegex = /\.(astro|css|scss|sass|less|styl|stylus|pcss|postcss)$/;

export default defineConfig({
  plugins: [
    react(),
    astro()
  ],
  test: {
    // Configuración global para las pruebas
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    
    // Configuración para incluir archivos .astro en las pruebas
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/__tests__/*.{js,jsx,ts,tsx}'
    ],
    
    // Excluir archivos que no son de prueba
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/*.stories.*', // Excluir archivos de historias de Storybook
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    
    // Configuración de cobertura
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/vendor/**',
        '**/*.stories.*',
      ],
    },
    
    // Configuración del entorno de prueba
    environmentOptions: {
      // Configuración específica para jsdom
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    
    // Mock de módulos
    server: {
      deps: {
        inline: ['@astrojs/renderer-react'],
      },
    },
    
    // Configuración de alias
    resolve: {
      alias: [
        // Asegúrate de que las importaciones de @/ funcionen correctamente
        { find: '@', replacement: resolve(__dirname, 'src') },
      ],
    },
  },
  
  // Configuración de Vite
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '~', replacement: resolve(__dirname, 'node_modules') },
    ],
  },
  
  // Configuración para manejar archivos .astro
  optimizeDeps: {
    include: ['@astrojs/renderer-react'],
    exclude: ['@astrojs/renderer-vue', '@astrojs/renderer-svelte'],
  },
  
  // Configuración de build
  build: {
    target: 'esnext',
    minify: 'terser',
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['axios', 'date-fns'],
        },
      },
    },
  },
  
  // Configuración para manejar archivos estáticos
  server: {
    fs: {
      allow: ['.'],
    },
  },
  
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
