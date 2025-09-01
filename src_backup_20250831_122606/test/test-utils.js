import { render } from '@testing-library/react';
import React from 'react';

// Renderiza un componente Astro como un componente de React para pruebas
const renderAstroComponent = async (Component, props = {}) => {
  // Renderiza el componente Astro
  const { default: AstroComponent } = await import(/* @vite-ignore */ Component);
  
  // Convierte las props de Astro a props de React
  const reactProps = Object.entries(props).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
  
  // Renderiza el componente
  const { container, ...rest } = render(
    React.createElement(AstroComponent.default || AstroComponent, reactProps)
  );
  
  return {
    container,
    ...rest,
    // Agrega métodos personalizados aquí si es necesario
  };
};

export * from '@testing-library/react';
export { renderAstroComponent };

// Mock para las utilidades de Directus
export const mockDirectus = {
  getAntecedentes: vi.fn().mockResolvedValue({
    data: [],
    meta: { filter_count: 0 }
  }),
  getFilterOptions: vi.fn().mockResolvedValue({
    areas: [],
    clientes: [],
    unidades_negocio: []
  }),
  getRandomImages: vi.fn().mockResolvedValue([])
};
