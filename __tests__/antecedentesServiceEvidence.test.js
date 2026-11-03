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

    expect(caseRecord.serviceCodes).toContain(102);
    expect(caseRecord.serviceCodes).not.toContain(103);
    expect(caseRecord.serviceCodes).not.toContain(106);
  });

  test('an airport category alone does not prove telecom work, but explicit telephony does', async () => {
    const { mapearAntecedentes } = await import('../src/lib/um26-data/antecedentesReales');
    const [camera, telephone] = mapearAntecedentes([
      { id: 3065, Titulo: 'Cámara de CCTV - Aeropuerto de Mendoza', Area: 'Aeropuertos & Telecomunicaciones', Descripcion: 'Cámara CCTV. Sector: Aeropuertos & Telecomunicaciones.' },
      { id: 7003, Titulo: 'Telefonía IP del aeropuerto', Area: 'Aeropuertos & Telecomunicaciones', Descripcion: 'Instalación de teléfonos IP.' },
    ]);
    expect(camera.serviceCodes).toContain(102);
    expect(camera.serviceCodes).not.toContain(103);
    expect(telephone.serviceCodes).toContain(103);
  });

  test('does not mistake an imported category label for documented fire work', async () => {
    const { mapearAntecedentes } = await import('../src/lib/um26-data/antecedentesReales');
    const [disk, detection] = mapearAntecedentes([
      {
        id: 3176,
        Titulo: 'Seguridad Electrónica & SDI: Disco duro NAS 12TB - PROCON SRL',
        Cliente: 'PROCON SRL',
        Area: 'Seguridad Electrónica & SDI',
        Descripcion: 'Disco duro NAS 12TB. Sector: Seguridad Electrónica & SDI.',
      },
      {
        id: 7000,
        Titulo: 'Seguridad Electrónica & SDI: Mantenimiento de SDI',
        Area: 'Seguridad Electrónica & SDI',
        Descripcion: 'Mantenimiento de la central de incendio.',
      },
    ]);
    expect(disk.serviceCodes).not.toContain(107);
    expect(detection.serviceCodes).toContain(107);
  });

  test('does not identify a generic detector as fire work without evidence', async () => {
    const { mapearAntecedentes } = await import('../src/lib/um26-data/antecedentesReales');
    const [ambiguous, explicit, fireArea] = mapearAntecedentes([
      { id: 3066, Titulo: 'Dispositivos de detección', Area: 'Soluciones Tecnológicas' },
      { id: 7001, Titulo: 'Mantenimiento de detectores de humo', Area: 'Soluciones Tecnológicas' },
      { id: 7002, Titulo: 'Mantenimiento de detectores', Area: 'Detección de Incendios & Seguridad' },
    ]);
    expect(ambiguous.serviceCodes).not.toContain(107);
    expect(explicit.serviceCodes).toContain(107);
    expect(fireArea.serviceCodes).toContain(107);
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
