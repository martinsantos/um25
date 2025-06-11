module.exports = (api) => {
  // Cache configuration
  const isTest = api.env('test');
  api.cache.using(() => process.env.NODE_ENV);

  // Common presets
  const presets = [
    ['@babel/preset-env', {
      targets: isTest ? { node: 'current' } : '> 0.25%, not dead',
      modules: isTest ? 'commonjs' : false,
      useBuiltIns: 'usage',
      corejs: 3,
      shippedProposals: true,
      bugfixes: true,
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
      development: process.env.NODE_ENV === 'development',
    }],
    '@babel/preset-typescript',
  ];

  // Common plugins
  const plugins = [
    '@babel/plugin-transform-runtime',
    'babel-plugin-transform-import-meta',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
  ];

  // Development-only plugins
  if (process.env.NODE_ENV === 'development') {
    plugins.push('react-refresh/babel');
  }

  // Test-specific configuration
  if (isTest) {
    plugins.push(
      '@babel/plugin-transform-modules-commonjs',
      'babel-plugin-dynamic-import-node',
      'babel-plugin-transform-import-meta'
    );
  }

  return {
    presets,
    plugins,
    assumptions: {
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
    },
  };
};
