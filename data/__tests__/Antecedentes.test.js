import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { mockDirectus } from '../__test-utils__/index.js';

// Mock the directus utility before importing the component
const mockDirectusClient = mockDirectus({
  readByQuery: jest.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        titulo: 'Test Antecedente',
        descripcion: 'Test Description',
        fecha: '2023-01-01',
        imagen: 'test-image.jpg'
      }
    ],
    meta: { total_count: 1 }
  })
});

// Mock the directus module
jest.mock('../../utils/directus.js', () => ({
  __esModule: true,
  default: () => mockDirectusClient
}));

// Now import the component after setting up the mock
import Antecedentes from '../pages/antecedentes/index.js';

describe('Antecedentes Component', () => {
  let originalError;
  
  beforeEach(() => {
    // Mock console.error to avoid error logs in test output
    originalError = console.error;
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalError;
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<Antecedentes />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
  
  it('renders antecedentes after loading', async () => {
    render(<Antecedentes />);
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    
    // Check if the test data is rendered
    expect(screen.getByText('Test Antecedente')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByAltText('Test Antecedente')).toHaveAttribute('src', 'test-image.jpg');
  });

  it('handles empty state', async () => {
    // Override the mock for this test
    mockDirectusClient.readByQuery.mockResolvedValueOnce({
      data: [],
      meta: { total_count: 0 }
    });

    render(<Antecedentes />);
    
    await waitFor(() => {
      expect(screen.getByText('No se encontraron antecedentes')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    // Mock the directus utility to reject with an error
    mockDirectusClient.readByQuery.mockRejectedValueOnce(new Error('API Error'));
    
    render(<Antecedentes />);
    
    // Wait for the error state
    await waitFor(() => {
      expect(screen.getByText('Error al cargar los antecedentes')).toBeInTheDocument();
    });
  });
});
