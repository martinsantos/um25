/**
 * Tests para ArcaClient
 *
 * Verifica que el cliente HTTP:
 * - Envía solicitudes POST con el formato correcto
 * - Parsea respuestas JSON
 * - Maneja errores HTTP (no ok response)
 * - Maneja errores de red sin lanzar excepciones
 * - Retorna objetos con ok: false en caso de error
 * - Implementa timeout en las solicitudes
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Importar la clase REAL de ArcaClient
import { ArcaClient } from '../src/lib/arca-client.ts';

// Mock global de fetch
jest.mock('node:fetch', () => {
  const actual = jest.requireActual('node:fetch');
  return {
    ...actual,
    default: jest.fn(),
  };
});

// Alternativa: si jest.mock falla, mockear globalThis.fetch directamente
beforeEach(() => {
  if (!global.fetch) {
    global.fetch = jest.fn();
  } else {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ArcaClient', () => {
  describe('constructor', () => {
    test('should initialize ArcaClient with default baseUrl', () => {
      const client = new ArcaClient();
      expect(client['baseUrl']).toBe('/api/arca');
    });

    test('should initialize ArcaClient with custom baseUrl', () => {
      const customClient = new ArcaClient('/custom/api');
      expect(customClient['baseUrl']).toBe('/custom/api');
    });

    test('should initialize with custom timeout', () => {
      const client = new ArcaClient('/api/arca', 5000);
      expect(client['timeout']).toBe(5000);
    });

    test('should initialize with default timeout of 30000ms', () => {
      const client = new ArcaClient('/api/arca');
      expect(client['timeout']).toBe(30000);
    });
  });

  describe('generatePDF', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should send POST request with correct payload', async () => {
      const mockResponse = {
        ok: true,
        pdf_url: 'https://example.com/pdf/123.pdf',
        cae: '12345678901234',
        vencimiento_cae: '2025-12-31',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: '20123456789',
        razon_social: 'Mi Empresa S.A.',
        domicilio: 'Av. Corrientes 1234, CABA',
        condicion_iva: 'Responsable Inscripto',
        tipo_comprobante: 'Factura A',
        fecha_emision: '2025-04-26',
        descripcion: 'Servicios de consultoría',
        importe_total: 1000.50,
        logo_url: 'https://example.com/logo.png',
      };

      const result = await client.generatePDF(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/arca/generate-pdf',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should return ok: false on HTTP error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValueOnce({ error: 'Invalid CUIT' }),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: 'invalid',
        razon_social: 'Mi Empresa S.A.',
        domicilio: 'Av. Corrientes 1234, CABA',
        condicion_iva: 'Responsable Inscripto',
        tipo_comprobante: 'Factura A',
        fecha_emision: '2025-04-26',
        descripcion: 'Servicios de consultoría',
        importe_total: 1000.50,
      };

      const result = await client.generatePDF(request);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('400');
      expect(result.error).toContain('Invalid CUIT');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: '20123456789',
        razon_social: 'Mi Empresa S.A.',
        domicilio: 'Av. Corrientes 1234, CABA',
        condicion_iva: 'Responsable Inscripto',
        tipo_comprobante: 'Factura A',
        fecha_emision: '2025-04-26',
        descripcion: 'Servicios de consultoría',
        importe_total: 1000.50,
      };

      const result = await client.generatePDF(request);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should handle timeout gracefully', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch.mockRejectedValueOnce(abortError);

      const client = new ArcaClient('/api/arca', 100);
      const request = {
        cuit: '20123456789',
        razon_social: 'Mi Empresa S.A.',
        domicilio: 'Av. Corrientes 1234, CABA',
        condicion_iva: 'Responsable Inscripto',
        tipo_comprobante: 'Factura A',
        fecha_emision: '2025-04-26',
        descripcion: 'Servicios de consultoría',
        importe_total: 1000.50,
      };

      const result = await client.generatePDF(request);

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should handle email send success', async () => {
      const mockResponse = {
        ok: true,
        mensaje: 'Email enviado correctamente',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        email_destino: 'cliente@example.com',
        pdf_path: '/pdfs/factura-123.pdf',
        empresa: 'Mi Empresa S.A.',
      };

      const result = await client.sendEmail(request);

      expect(result.ok).toBe(true);
      expect(result.mensaje).toBe('Email enviado correctamente');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/arca/send-email',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should return ok: false on email send error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValueOnce({ error: 'SMTP connection failed' }),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        email_destino: 'cliente@example.com',
        pdf_path: '/pdfs/factura-123.pdf',
        empresa: 'Mi Empresa S.A.',
      };

      const result = await client.sendEmail(request);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('500');
      expect(result.error).toContain('SMTP connection failed');
    });

    test('should handle network errors in sendEmail', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection timeout'));

      const client = new ArcaClient('/api/arca');
      const request = {
        email_destino: 'cliente@example.com',
        pdf_path: '/pdfs/factura-123.pdf',
        empresa: 'Mi Empresa S.A.',
      };

      const result = await client.sendEmail(request);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });
  });

  describe('getCAE', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should handle CAE request for homologacion', async () => {
      const mockResponse = {
        ok: true,
        cae: '12345678901234',
        vencimiento: '2025-12-31',
        numero_comprobante: '00000001',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: '20123456789',
        importe: 1000.50,
        tipo_comprobante: 'Factura A',
        ambiente: 'homologacion',
      };

      const result = await client.getCAE(request);

      expect(result.ok).toBe(true);
      expect(result.cae).toBe('12345678901234');
      expect(result.vencimiento).toBe('2025-12-31');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/arca/get-cae',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should handle CAE request for produccion', async () => {
      const mockResponse = {
        ok: true,
        cae: '98765432109876',
        vencimiento: '2025-06-30',
        numero_comprobante: '00000002',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: '20123456789',
        importe: 5000,
        tipo_comprobante: 'Factura A',
        ambiente: 'produccion',
      };

      const result = await client.getCAE(request);

      expect(result.ok).toBe(true);
      expect(result.cae).toBe('98765432109876');
      expect(result.ambiente).toBeUndefined(); // No se retorna el ambiente
    });

    test('should not throw on error, return ok: false', async () => {
      global.fetch.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: '20123456789',
        importe: 1000,
        tipo_comprobante: 'Factura A',
        ambiente: 'produccion',
      };

      let threw = false;
      let result;

      try {
        result = await client.getCAE(request);
      } catch (e) {
        threw = true;
      }

      expect(threw).toBe(false);
      expect(result?.ok).toBe(false);
      expect(result?.error).toContain('Service unavailable');
    });

    test('should handle CAE request with HTTP error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValueOnce({ error: 'Invalid credentials' }),
      });

      const client = new ArcaClient('/api/arca');
      const request = {
        cuit: '20123456789',
        importe: 1000,
        tipo_comprobante: 'Factura A',
        ambiente: 'produccion',
      };

      const result = await client.getCAE(request);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('401');
      expect(result.error).toContain('Invalid credentials');
    });
  });

  describe('timeout handling', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should pass AbortSignal to fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ ok: true }),
      });

      const client = new ArcaClient('/api/arca', 5000);
      await client.generatePDF({
        cuit: '20123456789',
        razon_social: 'Test',
        domicilio: 'Test',
        condicion_iva: 'Test',
        tipo_comprobante: 'Test',
        fecha_emision: '2025-04-26',
        descripcion: 'Test',
        importe_total: 100,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});
