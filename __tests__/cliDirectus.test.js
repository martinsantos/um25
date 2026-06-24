const {
  CLI_ANTECEDENTES_FIELDS,
  CLI_SERVICIOS_FIELDS,
  antecedenteClient,
  antecedenteDescription,
  antecedenteTitle,
  antecedenteUrl,
  servicioDescription,
  servicioTitle,
  servicioUrl,
} = require('../src/utils/cliDirectus');

describe('CLI Directus mapping', () => {
  test('requests current Directus V4 fields instead of legacy lowercase fields', () => {
    expect(CLI_ANTECEDENTES_FIELDS).toBe('id,Titulo,Nombre,Descripcion,Cliente,Fecha,slug');
    expect(CLI_SERVICIOS_FIELDS).toBe('id,Titulo,Descripcion,slug');
    expect(CLI_ANTECEDENTES_FIELDS).not.toContain('title');
    expect(CLI_ANTECEDENTES_FIELDS).not.toContain('content');
    expect(CLI_SERVICIOS_FIELDS).not.toContain('description');
  });

  test('maps antecedentes from V4 fields with real slug URLs', () => {
    const antecedente = {
      id: 3064,
      Titulo: 'Desarrollo de Software',
      Descripcion: 'Digitalización de procesos para gobierno.',
      Cliente: 'Gobierno de Mendoza',
      slug: '3064/desarrollo-de-software',
    };

    expect(antecedenteTitle(antecedente)).toBe('Desarrollo de Software');
    expect(antecedenteDescription(antecedente)).toBe('Digitalización de procesos para gobierno.');
    expect(antecedenteClient(antecedente)).toBe('Gobierno de Mendoza');
    expect(antecedenteUrl(antecedente)).toBe(
      'https://www.ultimamilla.com.ar/antecedentes/3064/desarrollo-de-software',
    );
  });

  test('maps services from V4 fields and falls back to index without fabricated detail slugs', () => {
    const servicio = {
      id: 101,
      Titulo: 'Redes de Datos',
      Descripcion: 'Cableado, switching y conectividad.',
    };

    expect(servicioTitle(servicio)).toBe('Redes de Datos');
    expect(servicioDescription(servicio)).toBe('Cableado, switching y conectividad.');
    expect(servicioUrl(servicio)).toBe('https://www.ultimamilla.com.ar/servicios');
  });
});
