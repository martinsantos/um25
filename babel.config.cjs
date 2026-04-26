module.exports = (api) => {
  const isTest = api.env('test');

  return {
    presets: [
      ['@babel/preset-env', {
        targets: isTest ? { node: 'current' } : '> 0.25%, not dead',
        modules: isTest ? 'commonjs' : false,
      }],
      '@babel/preset-typescript',
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      ...(isTest ? [
        '@babel/plugin-transform-modules-commonjs',
      ] : []),
    ],
  };
};
