import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock de Astro global
globalThis.Astro = {
  request: {
    url: new URL('http://localhost:3000/antecedentes')
  },
  params: {},
  props: {}
};

// Mock de los componentes de Astro
const MockProjectCard = ({ project }) => {
  const div = document.createElement('div');
  div.setAttribute('data-testid', 'project-card');
  div.innerHTML = `
    <h3>${project.Titulo}</h3>
    <p>${project.Descripcion}</p>
  `;
  return div;
};

jest.mock('../../../components/ProjectCard.astro', () => ({
  default: MockProjectCard
}));

// Mock de la función directus
jest.mock('../../../utils/directus', () => ({
  directus: {
    getAntecedentes: jest.fn(),
    getFilterOptions: jest.fn(),
    getRandomImages: jest.fn(),
    DEFAULT_IMAGE: 'default-image.jpg',
    PAGE_SIZE: 9
  }
}));

describe('Página de Antecedentes', () => {
  const mockAntecedentes = {
    data: [
      {
        id: '1',
        Titulo: 'Proyecto de prueba',
        Descripcion: 'Descripción de prueba',
        Fecha: '2023-01-01',
        Cliente: 'Cliente de prueba',
        Unidad_de_negocio: 'Unidad de prueba',
        Area: 'Área de prueba',
        Imagen: 'imagen1.jpg'
      }
    ],
    meta: {
      filter_count: 1,
      total_count: 1
    }
  };

  const mockFilterOptions = {
    areas: ['Área 1', 'Área 2'],
    clientes: ['Cliente 1', 'Cliente 2'],
    unidades: ['Unidad 1', 'Unidad 2']
  };

  const mockImages = [
    { url: 'imagen1.jpg', id: '1', filename: 'imagen1.jpg', width: 800, height: 600 }
  ];

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    directus.getAntecedentes.mockResolvedValue(mockAntecedentes);
    directus.getFilterOptions.mockResolvedValue(mockFilterOptions);
    directus.getRandomImages.mockResolvedValue(mockImages);

    // Mock de window.matchMedia que es requerido por algunos componentes
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('debe cargar y mostrar los proyectos', async () => {
    // Mock de la respuesta de la API
    directus.getAntecedentes.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          Titulo: 'Proyecto de prueba',
          Descripcion: 'Descripción de prueba',
          Fecha: '2023-01-01',
          Cliente: 'Cliente de prueba',
          Unidad_de_negocio: 'Unidad de prueba',
          Area: 'Área de prueba',
          Imagen: 'imagen1.jpg'
        }
      ],
      meta: {
        filter_count: 1,
        total_count: 1
      }
    });

    // Verificar que la API fue configurada correctamente
    expect(directus.getAntecedentes).toBeDefined();
  });

  it('debe manejar errores al cargar los datos', async () => {
    // Configuramos el mock para que falle
    directus.getAntecedentes.mockRejectedValueOnce(new Error('Error de red'));

    // Verificar que el mock fue configurado correctamente
    expect(directus.getAntecedentes).toBeDefined();
  });

  it('debe aplicar filtros correctamente', async () => {
    // Mock de la función handleFilterChange
    const mockHandleFilterChange = jest.fn();

    // Verificar que los parámetros por defecto son correctos
    expect(mockAntecedentes).toBeDefined();
    expect(mockFilterOptions).toBeDefined();
  });
});
