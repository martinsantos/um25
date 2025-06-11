export default {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: false, // Use ES modules
    }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    ['@babel/plugin-transform-modules-commonjs', { loose: true }],
  ],
};
