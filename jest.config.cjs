module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.(css|less|scss|sass))$': 'identity-obj-proxy',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|@directus|@babel/runtime/helpers/esm)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    url: 'http://localhost:4321',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.cache/',
    '<rootDir>/.claude/',
    '<rootDir>/src/test/__mocks__',
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
};
