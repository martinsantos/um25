// Jest configuration for TypeScript projects
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // File extensions to test
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/'
  ],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/__mocks__/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '@testing-library/jest-dom/extend-expect',
  ],
  
  // Collect coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
    },
    'process.env': {
      NODE_ENV: 'test',
      TEST_ENV: 'jest',
      PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
      DIRECTUS_STATIC_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      PUBLIC_DIRECTUS_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      DIRECTUS_URL: 'http://localhost:8055',
      DIRECTUS_EMAIL: 'admin@example.com',
      DIRECTUS_PASSWORD: 'd1r3ctu5',
      CI: process.env.CI || 'false',
    },
  },
  // Clear mock calls and instances between tests
  clearMocks: true,
  
  // The directory where Jest should output coverage files
  coverageDirectory: 'coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov', 'clover', 'json', 'html'],
  
  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,
  
  // A set of global variables that need to be available in all test environments
  globals: {
    'ts-jest': {
      // ts-jest configuration goes here
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      babelConfig: true,
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
    'process.env': {
      NODE_ENV: 'test',
      TEST_ENV: 'jest',
      PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
      DIRECTUS_STATIC_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      PUBLIC_DIRECTUS_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      // Directus configuration
      DIRECTUS_URL: 'http://localhost:8055',
      DIRECTUS_EMAIL: 'admin@example.com',
      DIRECTUS_PASSWORD: 'd1r3ctu5',
      // App configuration
      NODE_ENV: 'test',
      // Testing configuration
      CI: process.env.CI || 'false',
    },
  },
  
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/src',
    '<rootDir>/tests',
  ],
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ],
  
  // An array of regexp pattern strings that are matched against all test paths before executing the test
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/.vercel/',
    '/.github/',
    '/dist/',
    '/out/',
    '/public/',
  ],
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
    '^.+\\.(css|scss|sass|less)$': 'jest-transform-stub',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg|ttf|woff|woff2)$': 'jest-transform-stub',
  },
  
  // An array of regexp pattern strings that are matched against all source file paths before transformation
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
  ],
  
  // A list of paths to modules that run some code to configure or set up the testing framework
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '@testing-library/jest-dom/extend-expect',
  ],
  
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/__mocks__/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // A list of paths to modules that run some code to configure or set up the testing framework
  setupFiles: [
    'jest-canvas-mock',
    './jest.polyfills.js',
  ],
  
  // Test timeout in milliseconds
  testTimeout: 30000,
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Whether to use watchman for file crawling
  watchman: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Reset the module registry before running each individual test
  resetModules: true,
  
  // Reset the mock state between every test
  resetMocks: true,
  
  // Restore mock state between every test
  restoreMocks: true,
  
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
  
  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // A list of paths to modules that run some code to configure or set up the testing framework
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  
  // A list of paths to modules that run code to configure or set up the testing framework
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // Options that will be passed to the testEnvironment
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    url: 'http://localhost:4321',
  },
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['babel-jest', { rootMode: 'upward' }],
  },
  
  // An array of regexp pattern strings that are matched against all source file paths
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch|@directus|@babel/runtime/helpers/esm)/)',
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
};
