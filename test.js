import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import axios from 'axios';
import { verServicios } from './verservicios';
import { cargarServicios } from './cargarservicios';
import { eliminarCamposNulos } from './limpiarnullos';

// Mock de node-fetch para verservicios y limpiarnullos
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));
import fetch from 'node-fetch';

// Mock de fs
vi.mock('fs');

// Mock de axios
vi.mock('axios');

describe('verServicios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch services and save them to a JSON file', async () => {
    const mockData = { data: [{ id: 1, Titulo: 'Servicio 1', Descripcion: 'Descripcion 1' }, { id: 2, Titulo: 'Servicio 2', Descripcion: 'Descripcion 2' }] };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockData)
    };
    fetch.mockResolvedValue(mockResponse);

    await verServicios();

    expect(fetch).toHaveBeenCalledWith('http://localhost:8055/items/servicios?fields=*.*', {
      headers: {
        'Authorization': expect.any(String)
      }
    });
    expect(mockResponse.json).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './nuevo_servicios.json',
      JSON.stringify(mockData.data, null, 2),
      'utf-8'
    );
  });

  it('should log an error if fetching services fails', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Not Found'
    };
    fetch.mockResolvedValue(mockResponse);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await verServicios();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al obtener los servicios:', 'Not Found');

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await verServicios();

    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Network error'));
    consoleErrorSpy.mockRestore();
  })
});

describe('cargarServicios', () => {
  const serviciosLimpios = [
    { A: 'Titulo 1', B: 'Area 1', C: 'Cliente 1', D: 'Descripcion 1', E: 'Contenido 1', G: 'Monto 1', I: 'Unidad 1', J: '2024-01-01' },
    { A: 'Titulo 2', B: 'Area 2', C: 'Cliente 2', D: 'Descripcion 2', E: 'Contenido 2', G: 'Monto 2', I: 'Unidad 2', J: '2024-01-02' },
    { A: 'Titulo 3', B: 'Area 3', C: 'Cliente 3', D: null, E: 'Contenido 3', G: 'Monto 3', I: 'Unidad 3', J: '2024-01-03' },
  ];
  beforeEach(() => {
    vi.clearAllMocks();
    fs.readFileSync.mockReturnValue(JSON.stringify(serviciosLimpios));
  });

  it('should load services from JSON and post them to Directus', async () => {
    axios.post.mockResolvedValue({});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await cargarServicios();

    expect(fs.readFileSync).toHaveBeenCalledWith('./servicios_limpios.json', 'utf-8');
    expect(axios.post).toHaveBeenCalledTimes(2); //Only 2 because one does not have title and description
    expect(axios.post).toHaveBeenNthCalledWith(1, 'http://localhost:8055/items/servicios', {
      Titulo: 'Titulo 1',
      Area: 'Area 1',
      Cliente: 'Cliente 1',
      Descripcion: 'Descripcion 1',
      Contenido_completo: 'Contenido 1',
      Monto_contratado: 'Monto 1',
      Unidad_de_negocio: 'Unidad 1',
      Fecha: '2024-01-01',
      status: 'published'
    }, { headers: expect.any(Object) });
    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Servicio incompleto omitido: {"Titulo":"Titulo 3","Area":"Area 3","Cliente":"Cliente 3","Descripcion":null,"Contenido_completo":"Contenido 3","Monto_contratado":"Monto 3","Unidad_de_negocio":"Unidad 3","Fecha":"2024-01-03"}');

    consoleWarnSpy.mockRestore();
  });

  it('should log an error if a service fails to post', async () => {
    axios.post.mockRejectedValue({ response: { data: 'Error from server' } });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cargarServicios();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error en servicio'), expect.anything());
    consoleErrorSpy.mockRestore();
  });
  it('should handle errors gracefully', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await cargarServicios();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error en servicio'), expect.anything());
    consoleErrorSpy.mockRestore();
  })
});

describe('eliminarCamposNulos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete services with null fields', async () => {
    const mockData = {
      data: [
        { id: 1, Titulo: null, Descripcion: 'Desc 1', Imagen: 'image1' },
        { id: 2, Titulo: 'Titulo 2', Descripcion: 'Desc 2', Imagen: 'image2' },
        { id: 3, Titulo: 'Titulo 3', Descripcion: null, Imagen: 'image3'},
        { id: 4, Titulo: 'Titulo 4', Descripcion: 'Desc 4', Imagen: null},
        { id: 5, Titulo: 'Titulo 5', Descripcion: 'Desc 5', Imagen: 'image5' },
      ]
    };
    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockData)
    };
    fetch.mockResolvedValue(mockResponse);
    fetch.mockResolvedValueOnce(mockResponse);
    fetch.mockResolvedValueOnce({ok:true});
    fetch.mockResolvedValueOnce({ok:true});
    fetch.mockResolvedValueOnce({ok:true});
    
    await eliminarCamposNulos();

    expect(fetch).toHaveBeenCalledWith('http://localhost:8055/items/servicios', {
      headers: {
        'Authorization': expect.any(String)
      }
    });

    expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:8055/items/servicios/1', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      }
    });
    expect(fetch).toHaveBeenNthCalledWith(3, 'http://localhost:8055/items/servicios/3', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      }
    });
    expect(fetch).toHaveBeenNthCalledWith(4, 'http://localhost:8055/items/servicios/4', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      }
    });
    expect(fetch).toHaveBeenCalledTimes(4)

  });

  it('should handle errors gracefully', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await eliminarCamposNulos();

    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Network error'));
    consoleErrorSpy.mockRestore();
  })
});

