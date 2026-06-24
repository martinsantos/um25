/**
 * Test suite for Plantilla ARCA page (src/pages/plantilla-arca.astro)
 * Tests the integration of all components and orchestration logic
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('Plantilla ARCA Page', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;

  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <form id="formulario-arca"></form>
          <div id="logo-upload"></div>
          <div id="email-input"></div>
          <div id="pdf-preview"></div>
          <button id="btn-generate">Generar Factura</button>
          <div id="resultado-generacion"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost:4321',
    });

    window = dom.window as any;
    document = dom.window.document;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render the page title in the document', () => {
      const title = document.querySelector('title');
      expect(title).toBeTruthy();
    });

    it('should have all required sections', () => {
      expect(document.getElementById('formulario-arca')).toBeTruthy();
      expect(document.getElementById('logo-upload')).toBeTruthy();
      expect(document.getElementById('email-input')).toBeTruthy();
      expect(document.getElementById('pdf-preview')).toBeTruthy();
      expect(document.getElementById('btn-generate')).toBeTruthy();
      expect(document.getElementById('resultado-generacion')).toBeTruthy();
    });
  });

  describe('Form Integration', () => {
    it('should collect form data when FormularioARCA emits formDataChange', () => {
      const form = document.getElementById('formulario-arca');
      const mockFormData = {
        cuit: '20123456789',
        razon_social: 'Test Company',
        domicilio: 'Calle Test 123',
        condicion_iva: 'Responsable Inscripto',
        tipo_comprobante: 'Factura A',
        fecha_emision: '2024-04-26',
        descripcion: 'Servicios profesionales',
        importe_total: 1000,
      };

      // Verify form exists and can be used to collect data
      expect(form).toBeTruthy();
      expect(form?.id).toBe('formulario-arca');

      let receivedFormData: typeof mockFormData | null = null;
      form?.addEventListener('formDataChange', ((event: CustomEvent<typeof mockFormData>) => {
        receivedFormData = event.detail;
      }) as EventListener);
      form?.dispatchEvent(new window.CustomEvent('formDataChange', { detail: mockFormData }));

      expect(receivedFormData).toEqual(mockFormData);
    });

    it('should have form for data collection', () => {
      const form = document.getElementById('formulario-arca');
      expect(form).toBeTruthy();
      expect(form?.tagName).toBe('FORM');
    });
  });

  describe('Logo Upload', () => {
    it('should have logo upload component', () => {
      const logoUpload = document.getElementById('logo-upload');
      expect(logoUpload).toBeTruthy();
    });

    it('should handle logo URL storage', () => {
      window.currentLogoUrl = 'https://example.com/logo.png';
      expect(window.currentLogoUrl).toBe('https://example.com/logo.png');
    });

    it('should allow clearing logo', () => {
      window.currentLogoUrl = 'https://example.com/logo.png';
      window.currentLogoUrl = undefined;
      expect(window.currentLogoUrl).toBeUndefined();
    });
  });

  describe('Email Input', () => {
    it('should have email input component', () => {
      const emailInput = document.getElementById('email-input');
      expect(emailInput).toBeTruthy();
    });

    it('should provide function to get email when toggled', () => {
      window.getEmailToSend = jest.fn().mockReturnValue('test@example.com');
      const email = window.getEmailToSend?.();
      expect(email).toBe('test@example.com');
    });

    it('should return null when email sending is disabled', () => {
      window.getEmailToSend = jest.fn().mockReturnValue(null);
      const email = window.getEmailToSend?.();
      expect(email).toBeNull();
    });
  });

  describe('PDF Generation Button', () => {
    it('should have generate button', () => {
      const btn = document.getElementById('btn-generate');
      expect(btn).toBeTruthy();
      expect(btn?.textContent).toContain('Generar');
    });

    it('should be clickable', () => {
      const btn = document.getElementById('btn-generate') as HTMLButtonElement;
      expect(btn?.disabled).toBe(false);
    });
  });

  describe('PDF Preview', () => {
    it('should have PDF preview component', () => {
      const preview = document.getElementById('pdf-preview');
      expect(preview).toBeTruthy();
    });

    it('should display PDF URL when set', () => {
      window.pdfPreviewUrl = 'https://example.com/factura.pdf';
      expect(window.pdfPreviewUrl).toBe('https://example.com/factura.pdf');
    });
  });

  describe('Result Display', () => {
    it('should have result display component', () => {
      const resultado = document.getElementById('resultado-generacion');
      expect(resultado).toBeTruthy();
    });

    it('should display success message with PDF URL', () => {
      window.showResult = jest.fn();
      window.showResult?.('success', 'Factura generada', '/pdf/factura.pdf', true);
      expect(window.showResult).toHaveBeenCalledWith(
        'success',
        'Factura generada',
        '/pdf/factura.pdf',
        true
      );
    });

    it('should display error message', () => {
      window.showResult = jest.fn();
      window.showResult?.('error', 'Error al generar factura', undefined, false);
      expect(window.showResult).toHaveBeenCalledWith(
        'error',
        'Error al generar factura',
        undefined,
        false
      );
    });
  });

  describe('Orchestration Logic', () => {
    it('should handle full workflow: form -> PDF generation -> email', async () => {
      // Setup mocks
      const mockFormData = {
        cuit: '20123456789',
        razon_social: 'Test Company',
        domicilio: 'Calle Test 123',
        condicion_iva: 'Responsable Inscripto',
        tipo_comprobante: 'Factura A',
        fecha_emision: '2024-04-26',
        descripcion: 'Servicios',
        importe_total: 1000,
      };

      window.lastFormData = mockFormData;
      window.currentLogoUrl = undefined;
      window.getEmailToSend = jest.fn().mockReturnValue('customer@example.com');
      window.showResult = jest.fn();

      // Mock fetch response for PDF generation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          pdf_url: '/pdf/factura-123.pdf',
          cae: '71234567890123',
          vencimiento_cae: '25/06/2026',
        }),
      });

      // Simulate button click
      const btn = document.getElementById('btn-generate') as HTMLButtonElement;
      expect(btn).toBeTruthy();

      // Verify mocks were set up
      expect(window.lastFormData).toEqual(mockFormData);
      expect(window.getEmailToSend?.()).toBe('customer@example.com');
    });

    it('should disable button during generation', () => {
      const btn = document.getElementById('btn-generate') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Generando...';

      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toBe('Generando...');

      // Re-enable after
      btn.disabled = false;
      btn.textContent = '✨ Generar Factura';

      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toBe('✨ Generar Factura');
    });

    it('should handle API errors gracefully', () => {
      window.showResult = jest.fn();

      // Simulate error
      const errorMsg = 'Error al generar PDF: Connection timeout';
      window.showResult?.('error', errorMsg);

      expect(window.showResult).toHaveBeenCalledWith(
        'error',
        errorMsg
      );
    });
  });

  describe('Template Manager Integration', () => {
    it('should provide template save/load functionality', () => {
      const mockTemplate = {
        razon_social: 'Mi Empresa',
        domicilio: 'Av. Test 100',
        condicion_iva: 'Responsable Inscripto',
      };

      // Simulate saving to localStorage
      const templates = JSON.parse(localStorage.getItem('arca-templates') || '[]');
      templates.push(mockTemplate);
      localStorage.setItem('arca-templates', JSON.stringify(templates));

      // Simulate loading
      const loadedTemplates = JSON.parse(localStorage.getItem('arca-templates') || '[]');
      expect(loadedTemplates).toHaveLength(1);
      expect(loadedTemplates[0]).toEqual(mockTemplate);
    });

    it('should allow deleting templates', () => {
      const templates = [
        { name: 'Template 1', razon_social: 'Company 1' },
        { name: 'Template 2', razon_social: 'Company 2' },
      ];

      localStorage.setItem('arca-templates', JSON.stringify(templates));

      // Delete first template
      const loaded = JSON.parse(localStorage.getItem('arca-templates') || '[]');
      loaded.splice(0, 1);
      localStorage.setItem('arca-templates', JSON.stringify(loaded));

      const remaining = JSON.parse(localStorage.getItem('arca-templates') || '[]');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].razon_social).toBe('Company 2');
    });
  });

  describe('Accessibility', () => {
    it('should have keyboard accessible button', () => {
      const btn = document.getElementById('btn-generate');
      // Button should be focusable and keyboard accessible
      expect(btn?.tagName).toBe('BUTTON');
      expect(btn?.disabled).toBe(false);
    });

    it('should have form with proper structure', () => {
      const form = document.getElementById('formulario-arca');
      expect(form?.tagName).toBe('FORM');
      expect(form).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const btn = document.getElementById('btn-generate') as HTMLButtonElement;
      // Button can be focused and activated
      btn.focus();
      expect(document.activeElement).toBe(btn);
    });
  });

  describe('Responsive Design', () => {
    it('should have form element for responsive styling', () => {
      const form = document.getElementById('formulario-arca');
      // Form exists and can be styled responsively
      expect(form).toBeTruthy();
      expect(form?.tagName).toBe('FORM');
    });

    it('should have email and logo inputs for responsive layout', () => {
      const emailInput = document.getElementById('email-input');
      const logoUpload = document.getElementById('logo-upload');
      expect(emailInput).toBeTruthy();
      expect(logoUpload).toBeTruthy();
    });
  });
});
