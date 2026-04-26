export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.(css|less|scss|sass))$': 'identity-obj-proxy',
    '^(\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      configFile: './babel.config.js',
      rootMode: 'upward'
    }],
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
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.cache/',
    '<rootDir>/src/test/__mocks__',
  ],
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  verbose: true,
};
