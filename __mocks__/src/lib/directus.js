// Manual mock for src/lib/directus.ts
const mockEmptyArray = jest.fn().mockResolvedValue([]);
const mockNull = jest.fn().mockResolvedValue(null);

module.exports = {
  __esModule: true,
  DIRECTUS_CONFIG: { url: 'http://localhost:8055', token: 'mock-token' },
  getClient: jest.fn(),
  getServiciosV4: mockEmptyArray,
  getServicioConProductos: mockNull,
  getProductosPorServicio: mockEmptyArray,
  getAntecedenteConServicios: mockNull,
  getAntecedentesPorServicio: mockEmptyArray,
  buscarServicios: mockEmptyArray,
  getAllProductos: mockEmptyArray,
  getHeroHomeImages: mockEmptyArray,
  getAllAntecedentes: mockEmptyArray,
  getDirectusImageUrl: jest.fn((id) => id || '/placeholder.jpg'),
  getDirectusImageFallback: jest.fn((id) => id || '/placeholder.jpg'),
};
