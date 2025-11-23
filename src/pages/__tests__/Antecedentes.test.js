import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { mockDirectus } from '../../../src/__test-utils__';
import Antecedentes from '../antecedentes';

// Mock the directus client
jest.mock('../../../src/utils/directus', () => ({
  __esModule: true,
  default: () => mockDirectus()
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

  const renderComponent = () => {
    return render(<Antecedentes />);
  };

  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = class MockIntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    renderComponent();
    expect(screen.getByText(/cargando.../i)).toBeInTheDocument();
  });

  it('should render antecedentes after loading', async () => {
    // Mock the API response
    const mockClient = mockDirectus({
      readByQuery: jest.fn().mockResolvedValue({
        data: mockAntecedentes,
        meta: { total_count: 1 }
      })
    });

    require('../../../src/utils/directus').default.mockImplementation(() => mockClient);

    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Proyecto de prueba')).toBeInTheDocument();
      expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
      expect(screen.getByAltText('Proyecto de prueba')).toHaveAttribute('src', 'test-image.jpg');
    });
  });

  it('should handle empty state', async () => {
    // Mock empty response
    const mockClient = mockDirectus({
      readByQuery: jest.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 }
      })
    });

    require('../../../src/utils/directus').default.mockImplementation(() => mockClient);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron antecedentes/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    // Mock error response
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = mockDirectus({
      readByQuery: jest.fn().mockRejectedValue(new Error('API Error'))
    });

    require('../../../src/utils/directus').default.mockImplementation(() => mockClient);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/error al cargar los antecedentes/i)).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });

  it('should filter antecedentes when search term is entered', async () => {
    const mockClient = mockDirectus({
      readByQuery: jest.fn().mockResolvedValue({
        data: mockAntecedentes,
        meta: { total_count: 1 }
      })
    });

    require('../../../src/utils/directus').default.mockImplementation(() => mockClient);

    const { user } = require('@testing-library/user-event');
    renderComponent();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Proyecto de prueba')).toBeInTheDocument();
    });

    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/buscar.../i);
    await user.type(searchInput, 'prueba');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(mockClient.readByQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          _or: expect.arrayContaining([
            { Titulo: { _icontains: 'prueba' } },
            { Descripcion: { _icontains: 'prueba' } }
          ])
        })
      })
    );
  });
});
