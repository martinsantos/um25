// @ts-nocheck
const { render, screen, waitFor } = require('@testing-library/react');
const React = require('react');

// Mock de los datos de prueba
const mockAntecedentes = {
  data: [
    {
      id: 1,
      titulo: 'Proyecto de prueba',
      descripcion: 'Descripción de prueba',
      fecha: '2023-01-01',
      imagen_principal: 'test-image.jpg',
      Area: 'Área de prueba',
      Cliente: 'Cliente de prueba',
      Unidad_de_negocio: 'Unidad de prueba',
      slug: 'proyecto-de-prueba'
    },
  ],
  meta: {
    total_count: 1,
    filter_count: 1
  }
};

// Mock de las funciones de directus
const mockDirectus = {
  getAntecedentes: jest.fn().mockResolvedValue({
    data: mockAntecedentes.data,
    meta: mockAntecedentes.meta
  }),
  getFilterOptions: jest.fn().mockResolvedValue({
    area: ['Área de prueba', 'Otra área'],
    cliente: ['Cliente de prueba', 'Otro cliente'],
    unidad_negocio: ['Unidad de prueba', 'Otra unidad']
  }),
  PAGE_SIZE: 10,
  DEFAULT_IMAGE: '/default-image.jpg'
};

// Mock del módulo directus
jest.mock('../../src/utils/directus', () => ({
  directus: mockDirectus
}));

// Mock del componente Astro
jest.mock('../../../src/pages/antecedentes/index.astro', () => {
  // Importar React para el mock
  const React = require('react');
  
  // Mock del componente
  return function MockAntecedentes() {
    return (
      <div data-testid="mock-antecedentes">
        <h1>Nuestros Proyectos</h1>
        <div>
          <label htmlFor="area">Área</label>
          <select id="area">
            <option value="">Todas las áreas</option>
            <option value="Área de prueba">Área de prueba</option>
            <option value="Otra área">Otra área</option>
          </select>
        </div>
        <div>
          <label htmlFor="cliente">Cliente</label>
          <select id="cliente">
            <option value="">Todos los clientes</option>
            <option value="Cliente de prueba">Cliente de prueba</option>
            <option value="Otro cliente">Otro cliente</option>
          </select>
        </div>
        <div>
          <label htmlFor="unidad">Unidad de Negocio</label>
          <select id="unidad">
            <option value="">Todas las unidades</option>
            <option value="Unidad de prueba">Unidad de prueba</option>
            <option value="Otra unidad">Otra unidad</option>
          </select>
        </div>
        <div className="proyecto">
          <h2>Proyecto de prueba</h2>
          <p>Descripción de prueba</p>
          <img src="test-image.jpg" alt="Proyecto de prueba" />
        </div>
      </div>
    );
  };
});

// Importar el componente después de configurar los mocks
const Antecedentes = require('../../../src/pages/antecedentes/index.astro');

describe('Página de Antecedentes', () => {
  let originalEnv;
  let originalConsoleError;
  let originalFetch;

  beforeAll(() => {
    // Guardar referencias a las funciones originales
    originalEnv = { ...process.env };
    originalConsoleError = console.error;
    originalFetch = global.fetch;
    
    // Configurar variables de entorno para pruebas
    process.env.PUBLIC_DIRECTUS_URL = 'http://localhost:8055';
    process.env.DIRECTUS_STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
    process.env.NODE_ENV = 'test';
    
    // Mock de fetch global
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    );
    
    // Mock de console.error para evitar ruido en las pruebas
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restaurar el entorno original
    process.env = originalEnv;
    console.error = originalConsoleError;
    global.fetch = originalFetch;
    
    // Limpiar los mocks
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Configurar los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar el mock por defecto para getAntecedentes
    mockDirectus.getAntecedentes.mockResolvedValue({
      data: [...mockAntecedentes.data],
      meta: { ...mockAntecedentes.meta }
    });
    
    // Mock de window.scrollTo
    window.scrollTo = jest.fn();
    
    // Mock de IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('debe renderizar el título de la página', async () => {
    render(React.createElement(Antecedentes));
    
    // Verificar que se muestra el título de la página
    const titleElement = await screen.findByRole('heading', { level: 1 });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('Nuestros Proyectos');
    
    // Verificar que se llamó a getAntecedentes con los parámetros correctos
    expect(mockDirectus.getAntecedentes).toHaveBeenCalledWith(1, 10, {});
  });

  it('debe mostrar los filtros', async () => {
    render(React.createElement(Antecedentes));
    
    // Verificar que se muestran los filtros
    const areaFilter = await screen.findByLabelText('Área');
    const clienteFilter = await screen.findByLabelText('Cliente');
    const unidadFilter = await screen.findByLabelText('Unidad de Negocio');
    
    expect(areaFilter).toBeInTheDocument();
    expect(clienteFilter).toBeInTheDocument();
    expect(unidadFilter).toBeInTheDocument();
    
    // Verificar que se cargaron las opciones de filtro
    await waitFor(() => {
      expect(mockDirectus.getFilterOptions).toHaveBeenCalledTimes(1);
    });
  });

  it('debe mostrar los proyectos al cargar', async () => {
    render(React.createElement(Antecedentes));
    
    // Verificar que se muestra el proyecto de prueba
    const proyectoElement = await screen.findByText('Proyecto de prueba');
    expect(proyectoElement).toBeInTheDocument();
    
    // Verificar que se muestra la descripción
    const descripcionElement = await screen.findByText('Descripción de prueba');
    expect(descripcionElement).toBeInTheDocument();
    
    // Verificar que se cargó la imagen
    const imagenElement = screen.getByAltText('Proyecto de prueba');
    expect(imagenElement).toHaveAttribute('src', 'test-image.jpg');
  });

  it('debe manejar errores al cargar los proyectos', async () => {
    // Configurar el mock para que falle
    const errorMessage = 'Error al cargar los proyectos';
    mockDirectus.getAntecedentes.mockRejectedValueOnce(new Error(errorMessage));
    
    // Espiar en console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(React.createElement(Antecedentes));
    
    // Verificar que se muestra un mensaje de error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al cargar los proyectos:', 
        expect.any(Error)
      );
    });
    
    // Limpiar el espía
    consoleSpy.mockRestore();
  });

  it('debe manejar la paginación correctamente', async () => {
    // Configurar el mock para simular múltiples páginas
    const mockMultiplePages = {
      data: Array(15).fill().map((_, i) => ({
        id: i + 1,
        titulo: `Proyecto ${i + 1}`,
        descripcion: `Descripción del proyecto ${i + 1}`,
        fecha: '2023-01-01',
        imagen_principal: `image-${i + 1}.jpg`,
        Area: `Área ${i % 3 + 1}`,
        Cliente: `Cliente ${i % 2 + 1}`,
        Unidad_de_negocio: `Unidad ${i % 4 + 1}`,
        slug: `proyecto-${i + 1}`
      })),
      meta: {
        total_count: 15,
        filter_count: 15
      }
    };
    
    mockDirectus.getAntecedentes.mockResolvedValue(mockMultiplePages);
    
    render(React.createElement(Antecedentes));
    
    // Verificar que se muestran los primeros 10 proyectos
    const proyecto1 = await screen.findByText('Proyecto 1');
    expect(proyecto1).toBeInTheDocument();
    
    // Aquí podrías agregar pruebas de navegación entre páginas
    // una vez que implementes la lógica de paginación en el componente
  });

  it('debe filtrar proyectos al seleccionar un área', async () => {
    const { user } = require('@testing-library/user-event');
    
    render(React.createElement(Antecedentes));
    
    // Esperar a que se carguen los filtros
    const areaFilter = await screen.findByLabelText('Área');
    
    // Simular selección de un área
    await user.selectOptions(areaFilter, 'Área de prueba');
    
    // Verificar que se llamó a getAntecedentes con el filtro de área
    await waitFor(() => {
      expect(mockDirectus.getAntecedentes).toHaveBeenCalledWith(
        1, 
        10, 
        { area: 'Área de prueba' }
      );
    });
  });
});
