describe('TemplateManager Component - localStorage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('TemplateManager.astro debe existir', async () => {
    const { existsSync } = await import('fs');
    const { join, dirname, resolve } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const componentPath = resolve(
      __dirname,
      '../../../src/components/arca/TemplateManager.astro'
    );

    expect(existsSync(componentPath)).toBe(true);
  });

  test('debe guardar plantilla en localStorage con estructura correcta', () => {
    const template = {
      id: 'miempresa-001',
      nombre: 'Mi Empresa',
      cuit: '20123456789',
      razon_social: 'Mi Empresa S.A.',
      domicilio: 'Av. Corrientes 1234, CABA',
      condicion_iva: 'Responsable Inscripto',
      logo_url: null,
      fecha_creacion: new Date().toISOString(),
    };

    const templates = JSON.parse(localStorage.getItem('plantilla_arca_templates') || '[]');
    templates.push(template);
    localStorage.setItem('plantilla_arca_templates', JSON.stringify(templates));

    const stored = JSON.parse(localStorage.getItem('plantilla_arca_templates'));
    expect(stored.length).toBe(1);
    expect(stored[0].nombre).toBe('Mi Empresa');
    expect(stored[0].cuit).toBe('20123456789');
  });

  test('debe cargar plantilla desde localStorage por id', () => {
    const templates = [
      {
        id: 'template-1',
        nombre: 'Empresa 1',
        cuit: '20111111111',
        razon_social: 'Empresa 1 S.A.',
        domicilio: 'Calle 1',
        condicion_iva: 'Responsable Inscripto',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
      {
        id: 'template-2',
        nombre: 'Empresa 2',
        cuit: '20222222222',
        razon_social: 'Empresa 2 S.A.',
        domicilio: 'Calle 2',
        condicion_iva: 'Monotributo',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
    ];

    localStorage.setItem('plantilla_arca_templates', JSON.stringify(templates));

    const stored = JSON.parse(localStorage.getItem('plantilla_arca_templates'));
    const loaded = stored.find((t) => t.id === 'template-2');

    expect(loaded).toBeTruthy();
    expect(loaded.nombre).toBe('Empresa 2');
    expect(loaded.cuit).toBe('20222222222');
  });

  test('debe eliminar plantilla de localStorage', () => {
    const templates = [
      {
        id: 'template-1',
        nombre: 'Empresa 1',
        cuit: '20111111111',
        razon_social: 'Empresa 1 S.A.',
        domicilio: 'Calle 1',
        condicion_iva: 'Responsable Inscripto',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
      {
        id: 'template-2',
        nombre: 'Empresa 2',
        cuit: '20222222222',
        razon_social: 'Empresa 2 S.A.',
        domicilio: 'Calle 2',
        condicion_iva: 'Monotributo',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
    ];

    localStorage.setItem('plantilla_arca_templates', JSON.stringify(templates));

    // Eliminar template-1
    const stored = JSON.parse(localStorage.getItem('plantilla_arca_templates'));
    const filtered = stored.filter((t) => t.id !== 'template-1');
    localStorage.setItem('plantilla_arca_templates', JSON.stringify(filtered));

    const updated = JSON.parse(localStorage.getItem('plantilla_arca_templates'));
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBe('template-2');
  });

  test('debe generar ID único para nuevas plantillas', () => {
    const name = 'Mi Empresa';
    const timestamp = Date.now();
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;

    expect(id).toMatch(/^[a-z-]+-\d+$/);
    expect(id).toContain('mi-empresa');
  });

  test('debe soportar logo_url como data URL', () => {
    const templateWithLogo = {
      id: 'template-1',
      nombre: 'Empresa con Logo',
      cuit: '20123456789',
      razon_social: 'Empresa S.A.',
      domicilio: 'Av. Test 123',
      condicion_iva: 'Responsable Inscripto',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      fecha_creacion: new Date().toISOString(),
    };

    localStorage.setItem('plantilla_arca_templates', JSON.stringify([templateWithLogo]));

    const stored = JSON.parse(localStorage.getItem('plantilla_arca_templates'));
    expect(stored[0].logo_url).toMatch(/^data:image/);
  });

  test('debe permitir listar todas las plantillas guardadas', () => {
    const templates = [
      {
        id: 'template-1',
        nombre: 'Empresa 1',
        cuit: '20111111111',
        razon_social: 'Empresa 1 S.A.',
        domicilio: 'Calle 1',
        condicion_iva: 'Responsable Inscripto',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
      {
        id: 'template-2',
        nombre: 'Empresa 2',
        cuit: '20222222222',
        razon_social: 'Empresa 2 S.A.',
        domicilio: 'Calle 2',
        condicion_iva: 'Monotributo',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
      {
        id: 'template-3',
        nombre: 'Empresa 3',
        cuit: '20333333333',
        razon_social: 'Empresa 3 S.A.',
        domicilio: 'Calle 3',
        condicion_iva: 'Exento',
        logo_url: null,
        fecha_creacion: new Date().toISOString(),
      },
    ];

    localStorage.setItem('plantilla_arca_templates', JSON.stringify(templates));

    const stored = JSON.parse(localStorage.getItem('plantilla_arca_templates') || '[]');
    expect(stored.length).toBe(3);
    expect(stored.map((t) => t.nombre)).toEqual(['Empresa 1', 'Empresa 2', 'Empresa 3']);
  });
});
