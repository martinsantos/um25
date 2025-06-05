// Mock para el módulo de directus
export const directus = {
  getAntecedentes: vi.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        Titulo: 'Proyecto de prueba',
        Descripcion: 'Descripción de prueba',
        Fecha_inicio: '2023-01-01',
        Cliente: 'Cliente de prueba',
        Area: 'Área de prueba',
        Unidad_de_negocio: 'Unidad de prueba',
        Imagen: { id: 'img-123' }
      }
    ],
    meta: {
      filter_count: 1,
      total_count: 1
    }
  }),
  
  getFilterOptions: vi.fn().mockResolvedValue({
    areas: ['Área 1', 'Área 2'],
    clientes: ['Cliente 1', 'Cliente 2'],
    unidades_negocio: ['Unidad 1', 'Unidad 2']
  }),
  
  getRandomImages: vi.fn().mockResolvedValue([
    { id: 'img-123', url: '/images/test.jpg' }
  ])
};

export const DEFAULT_IMAGE = '/images/default.jpg';
export const PAGE_SIZE = 9;
