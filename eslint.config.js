import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/',
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
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  }
]; 