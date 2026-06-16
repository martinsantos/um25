const directus = require('../src/lib/directus');

jest.mock('../src/lib/directus', () => ({
  getServicios: jest.fn(),
  getAllAntecedentes: jest.fn(),
  getBlogPosts: jest.fn(),
}));

class TestResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || {};
  }

  async json() {
    return JSON.parse(this.body);
  }
}

describe('UM CLI JSON API', () => {
  const originalResponse = global.Response;

  beforeEach(() => {
    global.Response = TestResponse;
    directus.getServicios.mockReset();
    directus.getAllAntecedentes.mockReset();
    directus.getBlogPosts.mockReset();
  });

  afterAll(() => {
    global.Response = originalResponse;
  });

  test('returns a non-2xx status when Directus payload generation fails', async () => {
    directus.getServicios.mockRejectedValueOnce(new Error('Directus down'));
    directus.getAllAntecedentes.mockResolvedValueOnce([]);
    directus.getBlogPosts.mockResolvedValueOnce([]);

    const { GET } = require('../src/pages/api/umcli.json.ts');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.success).toBe(false);
  });

  test('returns full antecedente counts with legacy-friendly fields', async () => {
    directus.getServicios.mockResolvedValueOnce([
      { id: 101, Titulo: 'Infraestructura de Redes', Descripcion: 'Redes y fibra', Area: 'Redes' },
    ]);
    directus.getAllAntecedentes.mockResolvedValueOnce([
      { id: 3064, Titulo: 'Caso A', Descripcion: 'Resumen A', Fecha: '2026-06-01', Cliente: 'Cliente A', Area: 'Gobierno' },
      { id: 3065, Titulo: 'Caso B', Descripcion: 'Resumen B', Fecha: '2026-06-02', Cliente: 'Cliente B', Area: 'Salud' },
    ]);
    directus.getBlogPosts.mockResolvedValueOnce([
      { id: 1, titulo: 'Post A' },
    ]);

    const { GET } = require('../src/pages/api/umcli.json.ts');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.estadisticas.totalServicios).toBe(1);
    expect(body.data.estadisticas.totalAntecedentes).toBe(2);
    expect(body.data.estadisticas.totalCasosExito).toBe(2);
    expect(body.data.servicios[0].titulo).toBe('Infraestructura de Redes');
    expect(body.data.casos_de_exito[0].titulo).toBe('Caso A');
    expect(body.data.casos_de_exito[0].fecha_publicacion).toBe('2026-06-01');
  });
});
