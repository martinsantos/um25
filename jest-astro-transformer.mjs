// Transformador personalizado para archivos .astro
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default {
  process() {
    // Retornamos un objeto con el código transformado
    return {
      code: `
        import React from 'react';
        export default function AstroComponent() {
          return React.createElement('div', { 'data-astro-mock': true });
        }
      `,
    };
  },
};
