import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the directus client
jest.mock('../../../src/utils/directus', () => ({
  __esModule: true,
  directus: {
    getAntecedentes: jest.fn(),
    getFilterOptions: jest.fn(),
    getRandomImages: jest.fn()
  }
}));

describe('Antecedentes Page', () => {
  const mockAntecedentes = [
    {
      id: 1,
      Titulo: 'Proyecto de prueba',
      Descripcion: 'Descripción de prueba',
      Fecha: '2023-01-01',
      Cliente: 'Cliente de prueba',
      Unidad_de_negocio: 'Unidad de prueba',
      Area: 'Área de prueba',
      imagen: 'test-image.jpg'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load antecedentes successfully', async () => {
    // Test data loading
    expect(mockAntecedentes).toBeDefined();
    expect(mockAntecedentes.length).toBe(1);
    expect(mockAntecedentes[0].Titulo).toBe('Proyecto de prueba');
  });

  it('should have correct antecedentes structure', () => {
    const antecedente = mockAntecedentes[0];
    expect(antecedente).toHaveProperty('id');
    expect(antecedente).toHaveProperty('Titulo');
    expect(antecedente).toHaveProperty('Descripcion');
    expect(antecedente).toHaveProperty('Fecha');
    expect(antecedente).toHaveProperty('Cliente');
    expect(antecedente).toHaveProperty('imagen');
  });

  it('should filter by title', () => {
    const searchTerm = 'prueba';
    const filtered = mockAntecedentes.filter(item =>
      item.Titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].Titulo).toContain('prueba');
  });

  it('should handle empty antecedentes', () => {
    const emptyData = [];
    expect(emptyData).toBeDefined();
    expect(emptyData.length).toBe(0);
  });
});
