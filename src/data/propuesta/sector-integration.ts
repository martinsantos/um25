import { sectorVisualSystem } from '../sectorVisualSystem';

/** Context from the published verticals; offering copy, never evidence of installed equipment. */
const scope: Record<string, Record<string, string>> = {
  aeropuertos: {
    '101': 'Conectamos terminales, puestos y salas técnicas mediante cableado, fibra y redes segmentadas.',
    '102': 'Definimos el encuadre de las cámaras según el área que se necesita supervisar, desde el mostrador hasta los accesos.',
    '103': 'Conectamos la telefonía, los enlaces y el voceo con la operación de la terminal.',
    '104': 'Integramos aplicaciones y datos para acompañar los procesos de la operación aeroportuaria.',
    '105': 'Coordinamos monitoreo, mantenimiento y respuesta técnica con la operación del aeropuerto.',
    '107': 'Integramos centrales, detectores y alarmas según las áreas y el proyecto de detección.',
  },
  bodegas: {
    '101': 'Llevamos el cableado hasta los puntos de acceso que dan cobertura Wi-Fi a las áreas de la bodega.',
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
    '104': 'Diseñamos aplicaciones que permiten registrar cambios y consultar el historial de los procesos del organismo.',
    '105': 'Organizamos soporte, monitoreo e incidentes según la prioridad de cada servicio público.',
    '106': 'Relevamos sistemas y necesidades para definir arquitectura, prioridades y documentación técnica.',
    '107': 'Integramos detección y señalización de incendios según las condiciones de cada edificio.',
    '108': 'Distribuimos la alimentación desde los tableros hacia los puestos de cada dependencia. Dimensionamos el respaldo y la puesta a tierra según la instalación.',
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
  (sectorVisualSystem[slug]?.services || []).map(name => serviceCode[name]).filter((code): code is string => Boolean(code));

export const sectorIntegrationScope = (slug: string, code: string, fallback: string): string =>
  scope[slug]?.[code] || fallback;

// Task names for the selector. Services without an edited task retain their catalog name.
const tasks: Record<string, Record<string, string>> = {
  aeropuertos: {
    '101':'Unir puntos de la terminal por fibra', '102':'Supervisar los mostradores del parking', '103':'Emitir avisos en la terminal',
    '104':'Integrar datos operativos', '105':'Atender incidencias en la terminal', '107':'Localizar una alarma de incendio',
  },
  bodegas: {
    '101':'Llevar Wi-Fi a las áreas de la bodega', '102':'Supervisar accesos y circulación', '104':'Seguir un lote en producción',
    '105':'Sostener los sistemas durante la cosecha', '106':'Planificar la infraestructura de la bodega', '107':'Recibir una alerta en la nave',
  },
  constructoras: {
    '101':'Preparar las redes del edificio', '102':'Controlar accesos de obra y espacios comunes', '103':'Poner en marcha la telefonía',
    '104':'Integrar la gestión de obra', '105':'Acompañar la puesta en marcha', '107':'Coordinar la detección por planta', '108':'Alimentar las salas técnicas',
  },
  gobiernosectorpublico: {
    '101':'Conectar dependencias', '102':'Supervisar edificios públicos', '103':'Comunicar oficinas y sedes',
    '104':'Seguir el historial de un registro', '105':'Sostener los puestos de atención', '106':'Evaluar la infraestructura',
    '107':'Coordinar avisos de incendio', '108':'Alimentar los equipos de informática',
  },
  industria: {
    '101':'Llevar datos a planta', '102':'Supervisar accesos industriales', '103':'Enlazar dos sitios de planta',
    '104':'Integrar datos de producción', '105':'Atender fallas en planta', '107':'Detectar un evento en planta', '108':'Respaldar equipos críticos',
  },
  mineria: {
    '101':'Llevar la red al campamento', '102':'Supervisar instalaciones remotas', '103':'Enlazar la base y el campamento',
    '105':'Asistir a un sitio remoto', '107':'Recibir avisos de áreas técnicas', '108':'Alimentar equipos en terreno',
  },
  salud: {
    '101':'Organizar la red en el rack', '102':'Supervisar circulaciones restringidas', '103':'Comunicar áreas de atención',
    '104':'Integrar sistemas de gestión', '105':'Atender incidentes por criticidad', '106':'Coordinar las corrientes débiles', '107':'Localizar avisos por ambiente', '108':'Respaldar la infraestructura IT',
  },
};
export const sectorSystemTask = (slug:string, code:string) => tasks[slug]?.[code];
