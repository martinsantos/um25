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
    'node_modules/(?!(node-fetch|@directus|@babel/runtime/helpers/esm|unified|remark-[^/]+|rehype-[^/]+|micromark[^/]*|mdast-util-[^/]+|hast-util-[^/]+|hastscript|web-namespaces|unist-util-[^/]+|vfile[^/]*|trough|bail|character-entities[^/]*|decode-named-character-reference|stringify-entities|parse-entities|property-information|space-separated-tokens|comma-separated-tokens|html-void-elements|is-plain-obj|devlop|ccount|escape-string-regexp|longest-streak|markdown-table|zwitch|extend|trim-lines|@types/unist)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    url: 'http://localhost:4321',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/work/',
    '<rootDir>/.cache/',
    '<rootDir>/.claude/',
    '<rootDir>/src/test/__mocks__',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/work/',
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
};
