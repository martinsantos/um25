import type { ParteKey } from '../../components/proto/despiece';

export type ProvisionPart = { key: ParteKey; label: string };
type VisualEntry = [serviceCode: number, title: string, parts: [ParteKey, string][]];

/**
 * Visual vocabulary for the published product catalog, separate from project evidence.
 * These describe the service offering; they do not assert equipment installed in a case.
 * Unknown CMS products remain visible without assigning unreviewed components.
 */
const entries: VisualEntry[] = [
  [101, 'Fibra Óptica de Alta Capacidad', [['fibra', 'Fibra óptica'], ['plano', 'Medición y documentación']]],
  [101, 'Centro de Distribución de Red', [['rack', 'Racks'], ['patch', 'Patch panels']]],
  [101, 'Cableado Estructurado Certificado', [['cableado', 'Cableado de red'], ['patch', 'Terminaciones']]],
  [101, 'Switching de Alto Rendimiento', [['switch', 'Switches'], ['pantalla', 'Configuración y monitoreo']]],
  [101, 'Data Center Llave en Mano', [['rack', 'Racks'], ['tablero', 'Energía'], ['cableado', 'Cableado']]],
  [101, 'Radioenlaces Punto a Punto', [['antena', 'Radioenlaces'], ['plano', 'Estudio de factibilidad']]],
  [101, 'Certificación Profesional de Red', [['cableado', 'Puntos de red'], ['plano', 'Reportes de medición']]],
  [101, 'Gestión Profesional de Fibra Óptica', [['fibra', 'Fibra y ODF'], ['plano', 'Medición por hilo']]],
  [102, 'Videovigilancia IP Profesional', [['camara', 'Cámaras IP'], ['nvr', 'Grabadores NVR'], ['servidor', 'Servidor de video']]],
  [102, 'Cámaras de Exterior Alta Definición', [['camara', 'Cámaras exteriores'], ['cableado', 'Cableado protegido']]],
  [102, 'Sistema de Detección de Incendios', [['detector', 'Detectores'], ['central', 'Central de alarma'], ['sirena', 'Sirenas']]],
  [102, 'Panel Central de Alarma SDI', [['central', 'Central SDI'], ['pantalla', 'Programación e integración']]],
  [102, 'Estaciones Manuales de Alarma', [['pulsador', 'Pulsadores manuales']]],
  [102, 'Control de Acceso Biométrico', [['acceso', 'Lectores biométricos y RFID'], ['pantalla', 'Gestión de accesos']]],
  [102, 'Grabación y Almacenamiento de Video', [['nvr', 'Grabadores NVR'], ['disco', 'Almacenamiento'], ['pantalla', 'Acceso remoto']]],
  [102, 'Detección de Intrusos PIR', [['alarma', 'Sensores PIR'], ['sirena', 'Sirenas'], ['pantalla', 'Monitoreo central']]],
  [103, 'Central Telefónica IP', [['central-ip', 'Central IP'], ['telefono', 'Telefonía IP']]],
  [103, 'Telefonía Cloud', [['servidor', 'Telefonía en nube'], ['telefono', 'Internos y numeración']]],
  [103, 'Sistema de Voceo y PA', [['parlante', 'Parlantes'], ['central-ip', 'Amplificación y control']]],
  [103, 'Integración Microsoft Teams', [['pantalla', 'Microsoft Teams'], ['central-ip', 'Integración telefónica']]],
  [103, 'Radiotroncalizado Digital', [['antena', 'Radio y repetidores'], ['puesto', 'Consolas de despacho']]],
  [103, 'Videocolaboración Profesional', [['pantalla', 'Pantallas'], ['camara', 'Cámaras de video'], ['parlante', 'Audio de sala']]],
  [104, 'Desarrollo Web Full Stack', [['pantalla', 'Aplicaciones web'], ['plano', 'Diseño UX/UI']]],
  [104, 'Aplicaciones Móviles', [['movil', 'Apps iOS y Android']]],
  [104, 'Sistemas ERP/CRM', [['pantalla', 'ERP y CRM']]],
  [104, 'Automatización de Procesos', [['plano', 'Análisis de procesos'], ['pantalla', 'Flujos y bots']]],
  [104, 'Integración de Sistemas', [['servidor', 'APIs y conectores'], ['plano', 'Documentación']]],
  [104, 'Business Intelligence', [['pantalla', 'Tableros BI'], ['servidor', 'Modelo de datos']]],
  [105, 'Mesa de Ayuda 24/7', [['maletin', 'Soporte técnico'], ['pantalla', 'Gestión de tickets']]],
  [105, 'Mantenimiento Preventivo', [['servidor', 'Servidores'], ['switch', 'Equipos de red'], ['puesto', 'Puestos de trabajo']]],
  [105, 'Monitoreo Proactivo 24/7', [['pantalla', 'Tableros y alertas']]],
  [105, 'Gestión de Incidentes ITIL', [['pantalla', 'Gestión ITSM'], ['plano', 'Reportes de incidentes']]],
  [105, 'Backup y Recuperación', [['disco', 'Respaldos'], ['servidor', 'Recuperación']]],
  [106, 'Auditoría de Infraestructura IT', [['plano', 'Relevamiento e informes']]],
  [106, 'Planificación Estratégica IT', [['plano', 'Plan y hoja de ruta']]],
  [106, 'Arquitectura Empresarial', [['plano', 'Arquitectura y documentación']]],
  [106, 'Evaluación de Riesgos IT', [['plano', 'Matriz de riesgos'], ['pantalla', 'Seguimiento']]],
  [106, 'Cumplimiento Normativo', [['plano', 'Análisis y plan de remediación']]],
  [107, 'Centrales de Detección Inteligentes', [['central', 'Centrales de detección']]],
  [107, 'Detectores de Humo Fotoeléctricos', [['detector', 'Detectores de humo']]],
  [107, 'Detectores de Temperatura', [['detector', 'Detectores térmicos']]],
  [107, 'Pulsadores Manuales de Alarma', [['pulsador', 'Pulsadores manuales']]],
  [107, 'Sirenas y Balizas Estroboscópicas', [['sirena', 'Sirenas y balizas']]],
  [107, 'Módulos de Control y Supervisión', [['modulo', 'Módulos de control']]],
  [107, 'Detectores Especiales VESDA', [['vesda', 'Detección por aspiración']]],
  [107, 'Software de Gestión y Reportes', [['servidor', 'Servidor dedicado'], ['pantalla', 'Gestión y reportes']]],
  [108, 'Tableros Eléctricos Principales', [['tablero', 'Tableros eléctricos']]],
  [108, 'Sistemas de Puesta a Tierra', [['tierra', 'Malla y puesta a tierra']]],
  [108, 'Instalaciones Eléctricas Industriales', [['tablero', 'Distribución eléctrica'], ['canalizacion', 'Canalizaciones'], ['plano', 'Proyecto y ensayos']]],
  [108, 'Sistemas de Alimentación Ininterrumpida (UPS)', [['ups', 'UPS'], ['bateria', 'Baterías y autonomía']]],
  [108, 'Grupos Electrógenos', [['generador', 'Grupos electrógenos']]],
  [108, 'Instalaciones Fotovoltaicas', [['solar', 'Paneles solares'], ['tablero', 'Instalación eléctrica']]],
  [108, 'Bancos de Capacitores Automáticos', [['capacitores', 'Banco de capacitores']]],
  [108, 'Termografía y Análisis de Calidad de Energía', [['termografia', 'Inspección termográfica'], ['plano', 'Mediciones e informe']]],
];

const catalog = new Map(entries.map(([code, title, parts]) => [
  `${code}:${title}`,
  parts.map(([key, label]) => ({ key, label })),
]));

export function serviceProvisionParts(serviceCode: number, title: string): ProvisionPart[] {
  return catalog.get(`${serviceCode}:${title}`) || [];
}
