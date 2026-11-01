describe('antecedente service inference evidence', () => {
  test('does not turn the documented olive processing client into an airport through the telecom area', async () => {
    const { resolverSector } = await import('../src/components/proto/sectorReal');
    const resolve = resolverSector([]);
    expect(resolve('José Nucete e Hijos S.A.', 'aeropuertos', 'Telefonía y cableado en selectoras de aceitunas en planta')).toBe('industria');
    expect(resolve('José Nucete e Hijos S.A.', 'seguridad-electronica', 'Reemplazo de cámaras de CCTV')).toBe('industria');
    expect(resolve('Aeropuertos Argentina 2000', 'aeropuertos', 'Telefonía')).toBe('aeropuertos');
    expect(resolve('José Nucete e Hijos S.A.', 'aeropuertos', 'Trabajo en aeropuerto')).toBe('aeropuertos');
  });
  test('shares the software evidence rule with the sector instead of treating every system as software', async () => {
    const { mapearAntecedentes } = await import('../src/lib/um26-data/antecedentesReales');
    const rows = mapearAntecedentes([
      { id: 1, Titulo: 'Sistema de detección de incendios', Area: 'Detección de Incendios & Seguridad' },
      { id: 2, Titulo: 'Sistema de gestión de turnos y expedientes' },
    ]);
    expect(rows[0].serviceCodes).toContain(107);
    expect(rows[0].serviceCodes).not.toContain(104);
    expect(rows[1].serviceCodes).toContain(104);
  });
  test('does not infer consulting from the repeated Directus engineering boilerplate', async () => {
    const { mapearAntecedentes } = await import('../src/lib/um26-data/antecedentesReales');
    const [caseRecord] = mapearAntecedentes([{
      id: 3065,
      Titulo: 'Cámara de CCTV - Aeropuerto de Mendoza',
      Cliente: 'Aeropuertos Argentina 2000',
      Area: 'Aeropuertos & Telecomunicaciones',
      Descripcion: 'Para Aeropuertos Argentina 2000. Solución implementada por el equipo de ingeniería de Última Milla.',
      Fecha: '2025-08-14',
    }]);

    expect(caseRecord.serviceCodes).toEqual(expect.arrayContaining([102, 103]));
    expect(caseRecord.serviceCodes).not.toContain(106);
  });

  test('keeps explicit consulting and engineering evidence, but excludes consultorios', async () => {
    const { ANTECEDENTES_REALES, mapearAntecedentes } = await import('../src/lib/um26-data/antecedentesReales');
    const consultoria = mapearAntecedentes([{
      id: 3256,
      Titulo: 'Consultoría integral para sistemas de información',
      Cliente: 'Jose Nucete e Hijos SA',
      Area: 'Soluciones Tecnológicas',
      Descripcion: 'Servicios de consultoría integral para sistemas de información.',
      Fecha: '2020-01-01',
    }])[0];
    const consultorios = mapearAntecedentes([{
      id: 3492,
      Titulo: 'Ampliación Hospital Perrupato Consultorios Externo',
      Cliente: 'PROCON SRL',
      Area: 'Salud & Sector Salud',
      Descripcion: 'Ampliación de consultorios externos del Hospital Perrupato.',
      Fecha: '2020-01-01',
    }])[0];
    const sourceById = new Map(ANTECEDENTES_REALES.map((item) => [item.id, item]));

    expect(consultoria.serviceCodes).toContain(106);
    expect(consultorios.serviceCodes).not.toContain(106);
    expect(sourceById.get(3421)?.serviceCodes).toContain(106);
    expect(sourceById.get(3477)?.serviceCodes).toContain(106);
  });
});
