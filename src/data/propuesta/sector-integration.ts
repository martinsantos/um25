import { sectorVisualSystem } from '../sectorVisualSystem';

/** Context from the published verticals; offering copy, never evidence of installed equipment. */
const scope: Record<string, Record<string, string>> = {
  aeropuertos: {
    '101': 'Conectamos terminales, puestos y salas técnicas mediante cableado, fibra y redes segmentadas.',
    '102': 'Integramos cámaras, grabación y control de accesos para supervisar terminales y perímetros.',
    '103': 'Conectamos la telefonía, los enlaces y el voceo con la operación de la terminal.',
    '104': 'Integramos aplicaciones y datos para acompañar los procesos de la operación aeroportuaria.',
    '105': 'Coordinamos monitoreo, mantenimiento y respuesta técnica con la operación del aeropuerto.',
    '107': 'Integramos centrales, detectores y alarmas según las áreas y el proyecto de detección.',
  },
  bodegas: {
    '101': 'Conectamos producción, depósitos y administración con redes de datos y enlaces de fibra.',
    '102': 'Integramos videovigilancia y control de accesos para las áreas productivas y de circulación.',
    '104': 'Conectamos sistemas de gestión, trazabilidad y datos de producción para reducir tareas manuales.',
    '105': 'Planificamos soporte y mantenimiento según los tiempos de producción y cosecha.',
    '106': 'Relevamos la infraestructura y ordenamos las mejoras según la operación de la bodega.',
    '107': 'Diseñamos la detección y el aviso de incendios para las condiciones de cavas, salas y depósitos.',
  },
  constructoras: {
    '101': 'Coordinamos canalizaciones, cableado, racks y puntos de red con el avance de la obra.',
    '102': 'Integramos cámaras y accesos para obra, garajes y espacios comunes del edificio.',
    '103': 'Preparamos los enlaces y la telefonía que necesita el edificio al entrar en operación.',
    '104': 'Integramos herramientas de gestión y aplicaciones según los procesos del proyecto.',
    '105': 'Acompañamos la puesta en marcha y el mantenimiento de los sistemas entregados.',
    '107': 'Coordinamos centrales, detectores y avisos con el proyecto y las etapas de construcción.',
    '108': 'Integramos tableros, alimentación y puesta a tierra para la infraestructura tecnológica.',
  },
  gobiernosectorpublico: {
    '101': 'Conectamos sedes, áreas de atención y puestos de trabajo con una red documentada.',
    '102': 'Integramos videovigilancia, grabación y accesos para edificios y operaciones distribuidas.',
    '103': 'Unificamos telefonía y enlaces entre oficinas, sedes y equipos de atención.',
    '104': 'Integramos aplicaciones, trámites y datos para sostener los procesos del organismo.',
    '105': 'Organizamos soporte, monitoreo e incidentes según la prioridad de cada servicio público.',
    '106': 'Relevamos sistemas y necesidades para definir arquitectura, prioridades y documentación técnica.',
    '107': 'Integramos detección y señalización de incendios según las condiciones de cada edificio.',
    '108': 'Dimensionamos alimentación, respaldo y puesta a tierra para los sistemas de cada sede.',
  },
  industria: {
    '101': 'Conectamos las áreas de planta, producción y administración con cableado y enlaces adecuados al sitio.',
    '102': 'Integramos cámaras, grabación y accesos para supervisar la planta y sus perímetros.',
    '103': 'Vinculamos equipos y áreas operativas mediante telefonía, radioenlaces y voceo.',
    '105': 'Coordinamos monitoreo y mantenimiento con las ventanas de intervención de la planta.',
    '107': 'Definimos detección y avisos según los ambientes, la actividad y el riesgo de cada área.',
    '108': 'Integramos distribución eléctrica, respaldo y puesta a tierra para sostener los sistemas IT.',
  },
  mineria: {
    '101': 'Conectamos campamentos y áreas operativas mediante redes de datos y fibra según las distancias.',
    '102': 'Integramos cámaras, grabación y control de accesos para supervisar sitios y perímetros remotos.',
    '103': 'Diseñamos radioenlaces y comunicaciones entre campamentos, frentes de trabajo y bases operativas.',
    '105': 'Combinamos monitoreo remoto, mantenimiento y asistencia según el acceso y las condiciones del sitio.',
    '107': 'Integramos detección y avisos para las áreas técnicas definidas en el proyecto.',
    '108': 'Dimensionamos alimentación y respaldo eléctrico para los equipos de comunicaciones y seguridad.',
  },
  salud: {
    '101': 'Conectamos consultorios, áreas de atención y sistemas de información con una red documentada.',
    '102': 'Integramos cámaras y accesos para las áreas de circulación y los espacios restringidos.',
    '103': 'Conectamos telefonía, enlaces y comunicaciones entre servicios y áreas del establecimiento.',
    '104': 'Integramos aplicaciones y datos de gestión según los procesos del establecimiento.',
    '105': 'Organizamos mantenimiento, monitoreo y soporte según la criticidad de cada sistema.',
    '106': 'Relevamos infraestructura y riesgos para priorizar mejoras y documentar la arquitectura IT.',
    '107': 'Coordinamos detección y avisos de incendio según los ambientes y el proyecto del edificio.',
    '108': 'Integramos alimentación, UPS y puesta a tierra para la continuidad de los sistemas tecnológicos.',
  },
};

const serviceCode: Record<string, string> = {
  Redes: '101', 'Seguridad electrónica': '102', Telecomunicaciones: '103',
  'Software a medida': '104', 'Soporte 24/7': '105', 'Consultoría IT': '106',
  'Detección de incendios': '107', 'Eléctricos para IT': '108',
};
export const sectorDeclaredServices = (slug: string): string[] =>
  (sectorVisualSystem[slug]?.services || []).map(name => serviceCode[name]).filter(Boolean);

export const sectorIntegrationScope = (slug: string, code: string, fallback: string): string =>
  scope[slug]?.[code] || fallback;
