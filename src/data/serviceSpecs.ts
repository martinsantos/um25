// Fichas técnicas por frente de servicio (101–108). Alimentan el bloque
// "Ficha técnica" del detalle, el comparador del índice, el centro de
// descargas de /certificaciones y la versión imprimible/PDF.
//
// Regla: sólo normas, garantías y alcances que ya figuran en el contenido
// publicado (Directus, /certificaciones, resúmenes de servicio). Ninguna cifra
// de marketing. Los valores finales se ajustan por sitio en el relevamiento.
import { NAV_SECTORS, NAV_SERVICES } from './navigation';

export interface ServiceSpec {
  code: string;
  name: string;
  slug: string;
  href: string;
  /** Promesa de una línea (la misma del menú y la home). */
  promise: string;
  scope: string[];
  standards: string[];
  deliverables: string[];
  serviceLevel: string[];
  equipment: string[];
  /** Slugs de sectores donde el frente tiene casos documentados. */
  sectorSlugs: string[];
  sectors: { name: string; href: string }[];
  /** Entregable clave y referencia normativa para el comparador. */
  keyDeliverable: string;
  keyStandard: string;
  revision: string;
}

const REVISION = '2026-10';

const sectorsFor = (slugs: string[]) =>
  slugs
    .map((slug) => NAV_SECTORS.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ name: s.name, href: s.href }));

const base = (code: string) => {
  const nav = NAV_SERVICES.find((s) => s.code === code)!;
  return { code, name: nav.name, slug: nav.href.split('/').pop() || '', href: nav.href, promise: nav.text, revision: REVISION };
};

const spec = (
  code: string,
  data: Omit<ServiceSpec, 'code' | 'name' | 'slug' | 'href' | 'promise' | 'sectors' | 'revision'>,
): ServiceSpec => ({ ...base(code), ...data, sectors: sectorsFor(data.sectorSlugs) });

export const SERVICE_SPECS: Record<string, ServiceSpec> = {
  '101': spec('101', {
    scope: [
      'Relevamiento y diseño de topología LAN/WAN por sitio',
      'Cableado estructurado Cat 6, 6A y 7, canalizaciones y racks',
      'Fibra óptica monomodo y multimodo OM3/OM4, fusiones y ODF',
      'Radioenlaces punto a punto entre sitios y campamentos',
      'Switching de acceso y núcleo, Wi-Fi corporativo y data center',
    ],
    standards: [
      'TIA/EIA-568 e ISO/IEC 11801 para cableado estructurado',
      'Certificación punto por punto con equipamiento Fluke',
      'Documentación de obra según el alcance contratado',
    ],
    deliverables: [
      'Reporte de certificación por canal (Fluke)',
      'Planos as-built, rotulado y memoria técnica',
      'Protocolos de prueba y registro del alcance ejecutado',
    ],
    serviceLevel: [
      'Garantía extendida de 25 años en cableado certificado',
      'Mantenimiento correctivo y preventivo con SLA por contrato',
      'Soporte 24/7 sobre lo instalado desde el frente 105',
    ],
    equipment: ['Switches gestionables PoE', 'Patch panels y organizadores', 'ODF y pigtails', 'Radios outdoor y antenas', 'Racks y gabinetes de piso o pared'],
    sectorSlugs: ['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud', 'software'],
    keyDeliverable: 'Certificación Fluke por punto',
    keyStandard: 'TIA/EIA-568 · ISO/IEC 11801',
  }),
  '102': spec('102', {
    scope: [
      'Videovigilancia CCTV IP: cámaras, grabación y VMS',
      'Control de acceso biométrico y RFID',
      'Alarmas de intrusión y monitoreo centralizado',
      'Integración con detección de incendios y operación existente',
    ],
    standards: [
      'Personal propio capacitado en normas NFPA',
      'Instalación sobre red certificada (TIA/EIA-568)',
      'Accesos, resguardos y responsabilidades definidos por proyecto',
    ],
    deliverables: [
      'Plano de cámaras y cobertura por sitio',
      'Protocolos de prueba de grabación, accesos y alarmas',
      'Documentación de obra y credenciales entregadas al cliente',
    ],
    serviceLevel: [
      'Mantenimiento preventivo programado',
      'Monitoreo 24/7 disponible según contrato',
      'Soporte sobre lo instalado desde el frente 105',
    ],
    equipment: ['Cámaras IP bullet, domo y PTZ', 'NVR y almacenamiento', 'Lectores biométricos y RFID', 'Paneles de alarma y sensores PIR', 'Switches PoE dedicados'],
    sectorSlugs: ['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud', 'seguridad-electronica'],
    keyDeliverable: 'Plano de cobertura y protocolo de grabación',
    keyStandard: 'NFPA · red certificada',
  }),
  '103': spec('103', {
    scope: [
      'Enlaces de datos, voz y video para sitios remotos',
      'Centrales telefónicas IP y telefonía cloud',
      'Voceo, PA y videocolaboración',
      'Radiotroncalizado digital e integración de operadores',
    ],
    standards: [
      'Migración gradual sin interrumpir operaciones',
      'Enlaces documentados con protocolo de prueba por extremo',
      'Puesta a tierra y protección eléctrica de equipos outdoor',
    ],
    deliverables: [
      'Diagrama de enlaces y numeración',
      'Protocolo de prueba de voz, datos y video',
      'Documentación de obra y plan de contingencia',
    ],
    serviceLevel: [
      'Soporte técnico especializado 24/7',
      'Redundancia y contingencia definidas por sitio',
    ],
    equipment: ['Radios y antenas de enlace', 'Centrales IP y teléfonos', 'Gateways y SBC', 'Altavoces y amplificadores PA', 'Terminales de videocolaboración'],
    sectorSlugs: ['aeropuertos', 'bodegas', 'gobiernosectorpublico', 'industria', 'mineria', 'salud'],
    keyDeliverable: 'Protocolo de prueba por enlace',
    keyStandard: 'Migración sin corte de operación',
  }),
  '104': spec('104', {
    scope: [
      'Aplicaciones web y mobile a medida',
      'Sistemas ERP/CRM y automatización de procesos',
      'APIs e integración de sistemas existentes',
      'Tableros de indicadores y business intelligence',
    ],
    standards: [
      'Código fuente propiedad del cliente',
      'Equipo de desarrollo propio en Argentina',
      'Metodologías ágiles con entregas verificables',
    ],
    deliverables: [
      'Repositorio y documentación técnica del sistema',
      'Manual de operación y capacitación',
      'Plan de puesta en producción y respaldo',
    ],
    serviceLevel: [
      'Soporte y evolutivos por contrato',
      'Monitoreo y respaldo coordinados con el frente 105',
    ],
    equipment: ['Infraestructura cloud o en sitio', 'Bases de datos y APIs', 'Integraciones con ERP y campo', 'Tableros operativos'],
    sectorSlugs: ['bodegas', 'gobiernosectorpublico', 'industria', 'salud', 'software'],
    keyDeliverable: 'Código y documentación del cliente',
    keyStandard: 'Propiedad del código · entregas ágiles',
  }),
  '105': spec('105', {
    scope: [
      'Mesa de ayuda 24/7 y gestión de incidentes',
      'Mantenimiento preventivo y correctivo de infraestructura',
      'Monitoreo proactivo de redes, servidores y servicios',
      'Backup y recuperación',
    ],
    standards: [
      'Gestión de incidentes según prácticas ITIL',
      'Herramientas ITSM con trazabilidad por ticket',
      'SLA garantizado por contrato',
    ],
    deliverables: [
      'Informe mensual de tickets, incidentes y tendencias',
      'Inventario y documentación actualizada de la infraestructura',
      'Plan de mantenimiento preventivo',
    ],
    serviceLevel: [
      'Disponibilidad 24/7 de mesa de ayuda',
      'Tiempos de respuesta y resolución definidos por contrato',
    ],
    equipment: ['Plataforma ITSM', 'Monitoreo de red y servidores', 'Herramientas de respaldo', 'Acceso remoto seguro'],
    sectorSlugs: ['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud', 'software'],
    keyDeliverable: 'Informe mensual y trazabilidad por ticket',
    keyStandard: 'ITIL · SLA por contrato',
  }),
  '106': spec('106', {
    scope: [
      'Auditoría de infraestructura IT y seguridad',
      'Arquitectura empresarial y roadmap tecnológico',
      'Evaluación de riesgos y proveedores',
      'Cumplimiento normativo',
    ],
    standards: [
      'Referencias ISO 27001 para seguridad de la información',
      'Metodologías probadas con enfoque práctico',
      'Informe con hallazgos, prioridades y costos',
    ],
    deliverables: [
      'Informe de auditoría con hallazgos priorizados',
      'Arquitectura objetivo y roadmap por etapas',
      'Pliego técnico o especificación para compras',
    ],
    serviceLevel: [
      'Consultores senior con experiencia regional',
      'Seguimiento de implementación por contrato',
    ],
    equipment: ['Instrumentos de diagnóstico de red', 'Herramientas de auditoría y escaneo', 'Documentación y planos existentes'],
    sectorSlugs: ['gobiernosectorpublico', 'industria', 'mineria', 'salud', 'software'],
    keyDeliverable: 'Informe de auditoría y roadmap',
    keyStandard: 'Referencias ISO 27001',
  }),
  '107': spec('107', {
    scope: [
      'Ingeniería, instalación y mantenimiento de SDI',
      'Centrales de detección inteligentes y direccionables',
      'Detectores de humo, temperatura y aspiración (VESDA)',
      'Pulsadores, sirenas, balizas y módulos de supervisión',
    ],
    standards: [
      'Diseño según NFPA 72 y normas IRAM aplicables a cada obra',
      'Habilitación de bomberos y mantenimiento periódico',
      'Protocolos de prueba por lazo y por dispositivo',
    ],
    deliverables: [
      'Ingeniería documentada con las normas aplicadas',
      'Planos de dispositivos y lazos',
      'Protocolos de prueba y registro para habilitación',
    ],
    serviceLevel: [
      'Mantenimiento periódico programado',
      'Soporte sobre lo instalado desde el frente 105',
    ],
    equipment: ['Centrales direccionables', 'Detectores fotoeléctricos y térmicos', 'Pulsadores manuales', 'Sirenas y balizas estroboscópicas', 'Módulos de control y supervisión'],
    sectorSlugs: ['aeropuertos', 'bodegas', 'constructoras', 'industria', 'salud'],
    keyDeliverable: 'Ingeniería y protocolo para habilitación',
    keyStandard: 'NFPA 72 · IRAM',
  }),
  '108': spec('108', {
    scope: [
      'Tableros eléctricos dedicados para IT',
      'UPS online, bancos de baterías y grupos electrógenos',
      'Puesta a tierra técnica para racks y equipos críticos',
      'Termografía y análisis de calidad de energía',
    ],
    standards: [
      'Instalación según normas IRAM aplicables a cada obra',
      'Medición y protocolo de puesta a tierra',
      'Documentación de tableros y circuitos',
    ],
    deliverables: [
      'Planos unifilares y de tableros',
      'Protocolo de medición de tierra y calidad de energía',
      'Informe termográfico cuando aplica',
    ],
    serviceLevel: [
      'Autonomía de respaldo dimensionada por carga crítica',
      'Mantenimiento preventivo con SLA por contrato',
    ],
    equipment: ['Tableros y protecciones', 'UPS online y baterías selladas', 'Grupos electrógenos', 'Sistemas de puesta a tierra', 'Bancos de capacitores'],
    sectorSlugs: ['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud'],
    keyDeliverable: 'Protocolo de tierra y calidad de energía',
    keyStandard: 'IRAM',
  }),
};

export const SERVICE_SPEC_LIST = Object.values(SERVICE_SPECS);

export const getServiceSpec = (code: unknown): ServiceSpec | undefined => SERVICE_SPECS[String(code)];
