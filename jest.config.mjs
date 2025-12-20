export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '!**/__tests__/**/._*'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.(css|less|scss|sass))$': 'identity-obj-proxy',
    '^(\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.astro$': 'jest-transform-stub',
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|@directus|@babel/runtime/helpers/esm)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
  globals: {
    'import.meta': {
      env: {
        PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
        DIRECTUS_STATIC_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
        NODE_ENV: 'test',
      },
    },
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    url: 'http://localhost:4321',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backups/',
    '/dist/',
    '/.astro/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.cache/',
    '<rootDir>/src/test/__mocks__',
    '<rootDir>/backups/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60,
    },
  },
  verbose: true,
};
