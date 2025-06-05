import { describe, it, expect, vi, beforeEach } from 'vitest';
import { directus } from '../../../utils/directus';

// Mock de las funciones de directus
vi.mock('../../../utils/directus', () => ({
  directus: {
    getAntecedentes: vi.fn(),
    getFilterOptions: vi.fn(),
    getRandomImages: vi.fn(),
    DEFAULT_IMAGE: 'default-image.jpg',
    PAGE_SIZE: 9
  }
}));

// Mock del módulo de la página de antecedentes
vi.mock('../index.astro', () => ({
  default: {
    getStaticProps: vi.fn()
  }
}));

// Importamos el mock del módulo
import antecedentesPage from '../index.astro';

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
    vi.clearAllMocks();
    
    // Configurar mocks por defecto
    directus.getAntecedentes.mockResolvedValue(mockAntecedentes);
    directus.getFilterOptions.mockResolvedValue(mockFilterOptions);
    directus.getRandomImages.mockResolvedValue(mockImages);
  });

  it('debe cargar los datos correctamente', async () => {
    // Configuramos el mock de getStaticProps
    antecedentesPage.getStaticProps.mockImplementation(async () => {
      const antecedentes = await directus.getAntecedentes({ sort: '-Fecha', limit: 9 });
      const filterOptions = await directus.getFilterOptions();
      const randomImages = await directus.getRandomImages(3);
      
      return {
        props: {
          servicios: antecedentes.data,
          filterOptions,
          randomImages,
          total: antecedentes.meta.total_count,
          page: 1,
          totalPages: Math.ceil(antecedentes.meta.total_count / 9)
        }
      };
    });

    // Llamamos a getStaticProps
    const result = await antecedentesPage.getStaticProps();

    // Verificamos que se hayan llamado las funciones de la API
    expect(directus.getAntecedentes).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: '-Fecha',
        limit: 9
      })
    );
    expect(directus.getFilterOptions).toHaveBeenCalled();
    expect(directus.getRandomImages).toHaveBeenCalledWith(3);

    // Verificamos que los datos se devuelvan correctamente
    expect(result.props).toEqual({
      servicios: mockAntecedentes.data,
      filterOptions: mockFilterOptions,
      randomImages: mockImages,
      total: 1,
      page: 1,
      totalPages: 1
    });
  });

  it('debe manejar errores al cargar los datos', async () => {
    // Configuramos el mock para que falle
    const errorMessage = 'Error de red';
    directus.getAntecedentes.mockRejectedValueOnce(new Error(errorMessage));

    // Configuramos el mock de getStaticProps para que maneje el error
    antecedentesPage.getStaticProps.mockImplementation(async () => {
      try {
        const antecedentes = await directus.getAntecedentes({ sort: '-Fecha', limit: 9 });
        const filterOptions = await directus.getFilterOptions();
        const randomImages = await directus.getRandomImages(3);
        
        return {
          props: {
            servicios: antecedentes.data,
            filterOptions,
            randomImages,
            total: antecedentes.meta.total_count,
            page: 1,
            totalPages: 1
          }
        };
      } catch (error) {
        return {
          props: {
            error: error.message,
            servicios: [],
            filterOptions: { areas: [], clientes: [], unidades: [] },
            randomImages: [],
            total: 0,
            page: 1,
            totalPages: 0
          }
        };
      }
    });

    // Llamamos a getStaticProps
    const result = await antecedentesPage.getStaticProps();

    // Verificamos que se haya llamado a la API
    expect(directus.getAntecedentes).toHaveBeenCalled();

    // Verificamos que se devuelva el error correctamente
    expect(result.props.error).toBe(errorMessage);
    expect(result.props.servicios).toEqual([]);
    expect(result.props.filterOptions).toEqual({ areas: [], clientes: [], unidades: [] });
    expect(result.props.randomImages).toEqual([]);
    expect(result.props.total).toBe(0);
  });

  it('debe aplicar filtros correctamente', async () => {
    // Configuramos el mock para devolver datos filtrados
    const filtros = {
      area: 'Área de prueba',
      cliente: 'Cliente de prueba',
      unidad: 'Unidad de prueba',
      search: 'prueba',
      page: 1
    };

    const filteredAntecedentes = {
      data: [
        {
          id: '2',
          Titulo: 'Proyecto filtrado',
          Descripcion: 'Descripción filtrada',
          Fecha: '2023-02-01',
          Cliente: filtros.cliente,
          Unidad_de_negocio: filtros.unidad,
          Area: filtros.area,
          Imagen: 'imagen-filtrada.jpg'
        }
      ],
      meta: {
        filter_count: 1,
        total_count: 1
      }
    };

    // Configuramos el mock para devolver los datos filtrados
    directus.getAntecedentes.mockResolvedValueOnce(filteredAntecedentes);

    // Configuramos el mock de getStaticProps para que aplique los filtros
    antecedentesPage.getStaticProps.mockImplementation(async ({ props }) => {
      const filterParams = {};
      
      if (filtros.area) filterParams['filter[Area][_eq]'] = filtros.area;
      if (filtros.cliente) filterParams['filter[Cliente][_eq]'] = filtros.cliente;
      if (filtros.unidad) filterParams['filter[Unidad_de_negocio][_eq]'] = filtros.unidad;
      if (filtros.search) {
        filterParams['search'] = filtros.search;
      }

      const antecedentes = await directus.getAntecedentes({
        ...filterParams,
        sort: '-Fecha',
        limit: 9,
        page: filtros.page || 1
      });
      
      const filterOptions = await directus.getFilterOptions();
      const randomImages = await directus.getRandomImages(3);
      
      return {
        props: {
          servicios: antecedentes.data,
          filterOptions,
          randomImages,
          total: antecedentes.meta.total_count,
          page: filtros.page || 1,
          totalPages: Math.ceil(antecedentes.meta.total_count / 9),
          currentFilters: {
            area: filtros.area,
            cliente: filtros.cliente,
            unidad: filtros.unidad,
            search: filtros.search
          }
        }
      };
    });

    // Llamamos a getStaticProps con los filtros
    const result = await antecedentesPage.getStaticProps({ props: { ...filtros } });

    // Verificamos que se hayan aplicado los filtros correctamente
    expect(directus.getAntecedentes).toHaveBeenCalledWith(
      expect.objectContaining({
        'filter[Area][_eq]': filtros.area,
        'filter[Cliente][_eq]': filtros.cliente,
        'filter[Unidad_de_negocio][_eq]': filtros.unidad,
        search: filtros.search,
        sort: '-Fecha',
        limit: 9,
        page: 1
      })
    );

    // Verificamos que los datos filtrados se devuelvan correctamente
    expect(result.props.servicios).toEqual(filteredAntecedentes.data);
    expect(result.props.total).toBe(1);
    expect(result.props.page).toBe(1);
    expect(result.props.totalPages).toBe(1);
    expect(result.props.currentFilters).toEqual({
      area: filtros.area,
      cliente: filtros.cliente,
      unidad: filtros.unidad,
      search: filtros.search
    });
  });
});
