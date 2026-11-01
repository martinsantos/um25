jest.mock('../src/lib/um26-directus', () => ({
  getAntecedentes: jest.fn(),
  getServicios: jest.fn(),
}));

describe('service tags after curating generic CMS titles', () => {
  test('removes the inherited software tag from the CCTV scope of antecedent 3140', async () => {
    const { reconcileGeneratedSoftwareService } = await import('../src/components/proto/isoData');
    const serviceCodes = reconcileGeneratedSoftwareService(
      'Desarrollo de Software y Digitalización de Procesos - Aeropuertos Argentina 2000 (2)',
      'Instalación Sistema CCTV Mostradores de Cobro de Parking',
      'Instalación Sistema CCTV Mostradores de Cobro de Parking',
      ['103', '104', '102'],
    );

    expect(serviceCodes).toEqual(['103', '102']);
  });

  test('keeps software tags when curated evidence names a software scope', async () => {
    const { reconcileGeneratedSoftwareService } = await import('../src/components/proto/isoData');
    const serviceCodes = reconcileGeneratedSoftwareService(
      'Desarrollo de Software y Digitalización de Procesos - Municipalidad Guaymallén (2)',
      'Alojamiento, mantenimiento y desarrollo del sitio web municipal',
      'Servicio de alojamiento y mantenimiento de la página web del municipio.',
      ['104', '105'],
    );

    expect(serviceCodes).toEqual(['104', '105']);
  });

  test('does not rewrite codes when the source title is not the generic software title', async () => {
    const { reconcileGeneratedSoftwareService } = await import('../src/components/proto/isoData');
    const sourceCodes = ['102', '104'];

    expect(reconcileGeneratedSoftwareService(
      'Desarrollo de software de trazabilidad',
      'Instalación Sistema CCTV',
      'Instalación Sistema CCTV',
      sourceCodes,
    )).toEqual(sourceCodes);
  });

  test('reconciles after duplicate generic titles are resolved from their own descriptions', async () => {
    const { getAntecedentes } = await import('../src/lib/um26-directus');
    getAntecedentes.mockResolvedValue([
      {
        id: 3140,
        title: 'Desarrollo de Software y Digitalización de Procesos - Aeropuertos Argentina 2000 (2)',
        slug: 'desarrollo-software-aeropuertos-2',
        client: 'Aeropuertos Argentina 2000',
        sector_slug: 'aeropuertos',
        service_codes: [103, 104, 102],
        year: 2024,
        month: 1,
        status: 'verificado',
        summary: 'INSTALACIÓN SISTEMA CCTV MOSTRADORES DE COBRO DE PARKING',
        image: '',
        location: '',
        scope: [],
        tags: [],
      },
      {
        id: 3141,
        title: 'Desarrollo de Software y Digitalización de Procesos - Aeropuertos Argentina 2000 (3)',
        slug: 'desarrollo-software-aeropuertos-3',
        client: 'Aeropuertos Argentina 2000',
        sector_slug: 'aeropuertos',
        service_codes: [103, 104, 107],
        year: 2024,
        month: 1,
        status: 'verificado',
        summary: 'Instalación de sistema de detección de incendio en estacionamiento',
        image: '',
        location: '',
        scope: [],
        tags: [],
      },
    ]);
    const { loadStories } = await import('../src/components/proto/isoData');

    const { stories } = await loadStories();
    const cctv = stories.find((story) => story.id === 3140);

    expect(cctv.title).toMatch(/CCTV/i);
    expect(cctv.serviceCodes).toEqual(['103', '102']);
    expect(cctv.services).not.toContain('Software a medida');
  });
});

// A technical service alone does not identify the building in which it operates.
describe('project illustrations respect the documented setting and scope', () => {
  test('shows site cutaways only for physical systems in a known sector', async () => {
    const { illustrationSiteFor, SITE_OF } = await import('../src/components/proto/isoData');
    expect(illustrationSiteFor({ sectorSlug: 'aeropuertos', serviceCodes: ['101', '102'] })).toBe(SITE_OF.aeropuertos);
    expect(illustrationSiteFor({ sectorSlug: 'gobiernosectorpublico', serviceCodes: ['104', '105'] })).toBeUndefined();
    expect(illustrationSiteFor({ sectorSlug: '', serviceCodes: ['101'] })).toBeUndefined();
    expect(illustrationSiteFor({ sectorSlug: 'constructoras', serviceCodes: [] })).toBeUndefined();
  });
});
