import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';
import astroParser from 'astro-eslint-parser';

export default [
  {
    ignores: [
      'dist/',
      'outputs/',
      'node_modules/',
      '.astro/',
      'public/',
      '*.d.ts',
      'coverage/',
      'build/',
      'out/',
      '.next/',
      'temp/',
      'tmp/',
      'cache/',
      '**/*.min.js',
      '**/*.bundle.js',
      'scripts/build/',
      'scripts/dist/',
      'backups/',
      'logs/',
      'uploads/',
      'temp_uploads/',
      'temp_images/',
      'local-uploads/',
      'imagenes_antecedentes_versionproduccion/',
      'directus_data/',
      'directus-admin/',
      '*.sql',
      '*.tar.gz',
      '*.zip',
      'antecedentes-single/',
      'fumbling-field/',
      'umnueva25/',
      'data/',
      'Downloads/',
      'assets/',
      'certs/',
      'caddy/',
      'grafana/',
      'prometheus/',
      'dashboards/',
      'healthcheck/',
      'nginx/',
      'Views/',
      'server_templates/',
      'test-results/',
      'docs/',
      'antecedentes/',
      'acciones/',
      'de/',
      'despliegue/',
      'futuras/',
      'Para/',
      'Documentación/',
      'CI/',
      '#/',
      'html/',
      '.cursor/',
      '.windsurf/',
      '.vscode/',
      '.netlify/',
      '.husky/',
      '.github/',
      'tests/',
      '__tests__/',
      '__mocks__/',
      '**/_.*.astro',
      'jest.config.*',
      'babel.config.*',
      'tsconfig.*',
      'tailwind.config.*',
      'astro.config.*',
      'postcss.config.*',
      'vitest.config.*',
      '*.log',
      '*.backup',
      '*.bak',
      '*.old',
      '*.tmp',
      '*.temp',
      '.env*',
      '!.env.example'
    ]
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        crypto: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLSelectElement: 'readonly',
        IntersectionObserver: 'readonly',
        Node: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: typescriptParser,
        extraFileExtensions: ['.astro'],
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        Astro: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        IntersectionObserver: 'readonly'
      }
    },
    plugins: {
      astro: astroPlugin,
      '@typescript-eslint': typescript
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  }
]; 
