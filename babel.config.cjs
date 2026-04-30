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
        // Custom transform: import.meta.env.X → process.env.X for Jest
        customImportMetaCjs,
      ] : []),
    ],
  };
};

/**
 * Custom Babel plugin to transform import.meta in CommonJS test environment
 * - import.meta.env.X → process.env.X
 * - import.meta.url → 'file:///__test__/module.js'
 * - import.meta.MODE → 'test'
 *
 * This mirrors Vite's import.meta behavior for tests.
 */
function customImportMetaCjs({ types: t }) {
  const envProperties = ['env', 'url', 'MODE', 'DEV', 'PROD'];

  return {
    visitor: {
      MetaProperty(path, state) {
        if (!path.isMetaProperty()) return;
        const property = path.node.property.name;
        const filePath = state.file?.opts?.filename || '/__test__/module.js';

        if (property === 'url') {
          path.replaceWith(t.stringLiteral('file://' + filePath));
          return;
        }

        // For import.meta.env.X — replace the outer member expression
        const memberExpr = path.parentPath;
        if (
          t.isMemberExpression(memberExpr) &&
          t.isIdentifier(memberExpr.node.property) &&
          envProperties.includes(memberExpr.node.property.name)
        ) {
          const envKey = memberExpr.node.property.name;

          if (envKey === 'url') {
            memberExpr.replaceWith(t.stringLiteral('file://' + filePath));
          } else if (envKey === 'MODE') {
            memberExpr.replaceWith(t.stringLiteral('test'));
          } else if (envKey === 'DEV') {
            memberExpr.replaceWith(t.booleanLiteral(false));
          } else if (envKey === 'PROD') {
            memberExpr.replaceWith(t.booleanLiteral(true));
          } else if (envKey === 'env') {
            // import.meta.env.X → process.env.X
            const propPath = memberExpr.parentPath;
            if (
              t.isMemberExpression(propPath) &&
              t.isIdentifier(propPath.node.property)
            ) {
              const envVarName = propPath.node.property.name;
              propPath.replaceWith(
                t.memberExpression(
                  t.memberExpression(
                    t.identifier('process'),
                    t.identifier('env')
                  ),
                  t.identifier(envVarName)
                )
              );
            }
          }
        }
      },
    },
  };
}
