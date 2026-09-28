/**
 * Taxonomía temática del sitio: servicios (101–108) y sectores.
 *
 * Módulo puro y sin imports: lo usan el sitio (Astro/TS), los tests (jest) y
 * `scripts/build-blog-topic-map.mjs` (Node con --experimental-strip-types).
 * Evitar sintaxis TS que requiera transformación (enums, namespaces).
 *
 * Criterio: un artículo o antecedente pertenece a un cluster sólo si su propio
 * texto contiene términos del cluster. No hay asignaciones manuales.
 */

export type TopicKind = 'service' | 'sector';

export interface TopicTerm {
  /** Término en minúsculas; se compara normalizado (sin tildes) y por palabra completa. */
  t: string;
  /** Peso: 3 = específico del cluster, 2 = fuerte, 1 = contextual. */
  w: number;
}

export interface TopicCluster {
  kind: TopicKind;
  /** '101'…'108' para servicios; slug público para sectores. */
  key: string;
  label: string;
  /** Página comercial canónica del cluster. */
  href: string;
  /** Slug del listado temático del blog (/blog/tema/<slug>). Sólo servicios. */
  hubSlug?: string;
  /** Nombre de la entidad para schema.org (Service o Thing). */
  schemaName: string;
  terms: TopicTerm[];
  /**
   * Frases del cuerpo que pueden enlazar a `href` (primera aparición, sólo si la
   * frase ya existe en el texto). Deben ser específicas: nunca palabras sueltas genéricas.
   */
  anchors: string[];
}

export const TOPIC_SERVICES: TopicCluster[] = [
  {
    kind: 'service',
    key: '101',
    label: 'Redes e infraestructura',
    href: '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces',
    hubSlug: 'redes-e-infraestructura',
    schemaName: 'Infraestructura de redes, cableado estructurado, fibra óptica y radioenlaces',
    terms: [
      { t: 'cableado estructurado', w: 3 }, { t: 'fibra optica', w: 3 }, { t: 'radioenlace', w: 3 },
      { t: 'radioenlaces', w: 3 }, { t: 'switching', w: 3 }, { t: 'switch', w: 2 }, { t: 'switches', w: 2 },
      { t: 'vlan', w: 3 }, { t: 'vlans', w: 3 }, { t: 'backbone', w: 3 }, { t: 'otdr', w: 3 },
      { t: 'wifi', w: 2 }, { t: 'wi-fi', w: 2 }, { t: 'access point', w: 2 }, { t: 'red lan', w: 3 },
      { t: 'lan', w: 1 }, { t: 'wan', w: 2 }, { t: 'sd-wan', w: 3 }, { t: 'rack', w: 2 },
      { t: 'mikrotik', w: 3 }, { t: 'ubiquiti', w: 3 }, { t: 'routeros', w: 3 }, { t: 'router', w: 1 },
      { t: 'firewall', w: 1 }, { t: 'opnsense', w: 2 }, { t: 'pfsense', w: 2 }, { t: 'wireguard', w: 2 },
      { t: 'vpn', w: 1 }, { t: 'ipv6', w: 2 }, { t: 'bgp', w: 3 }, { t: 'ospf', w: 3 },
      { t: 'conectividad', w: 1 }, { t: 'red de datos', w: 3 }, { t: 'redes de datos', w: 3 },
      { t: 'infraestructura de red', w: 3 }, { t: 'patch panel', w: 3 }, { t: 'utp', w: 2 },
      { t: 'enlace punto a punto', w: 3 }, { t: 'fusion de fibra', w: 3 }, { t: 'poe', w: 2 },
    ],
    anchors: [
      'cableado estructurado', 'fibra óptica', 'radioenlaces', 'radioenlace', 'infraestructura de red',
      'red de datos', 'redes de datos',
    ],
  },
  {
    kind: 'service',
    key: '102',
    label: 'Seguridad electrónica',
    href: '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi',
    hubSlug: 'seguridad-electronica-y-cctv',
    schemaName: 'Seguridad electrónica: CCTV, control de acceso e intrusión',
    terms: [
      { t: 'cctv', w: 3 }, { t: 'videovigilancia', w: 3 }, { t: 'video vigilancia', w: 3 },
      { t: 'camaras de seguridad', w: 3 }, { t: 'camaras de video', w: 3 }, { t: 'camaras ip', w: 3 }, { t: 'nvr', w: 3 },
      { t: 'vms', w: 3 }, { t: 'frigate', w: 3 }, { t: 'control de acceso', w: 3 },
      { t: 'control de accesos', w: 3 }, { t: 'intrusion', w: 2 }, { t: 'lpr', w: 3 },
      { t: 'lectura de patentes', w: 3 }, { t: 'analitica de video', w: 3 }, { t: 'biometria', w: 2 },
      { t: 'biometrico', w: 2 }, { t: 'seguridad electronica', w: 3 }, { t: 'perimetral', w: 2 },
      { t: 'onvif', w: 3 }, { t: 'rtsp', w: 2 }, { t: 'zoneminder', w: 3 }, { t: 'shinobi', w: 3 },
      { t: 'molinete', w: 2 }, { t: 'molinetes', w: 2 }, { t: 'monitoreo de alarmas', w: 3 },
    ],
    anchors: [
      'videovigilancia', 'control de acceso', 'control de accesos', 'seguridad electrónica', 'analítica de video',
      'lectura de patentes',
    ],
  },
  {
    kind: 'service',
    key: '103',
    label: 'Telecomunicaciones',
    href: '/servicios/103/telecomunicaciones-datos-voz-video',
    hubSlug: 'telecomunicaciones',
    schemaName: 'Telecomunicaciones de datos, voz y video',
    terms: [
      { t: 'telecomunicaciones', w: 3 }, { t: 'telefonia', w: 3 }, { t: 'telefonia ip', w: 3 },
      { t: 'voip', w: 3 }, { t: 'sip', w: 2 }, { t: 'asterisk', w: 3 }, { t: 'freepbx', w: 3 },
      { t: 'central telefonica', w: 3 }, { t: 'pbx', w: 3 }, { t: 'troncal sip', w: 3 },
      { t: 'videoconferencia', w: 3 }, { t: 'jitsi', w: 3 }, { t: 'matrix', w: 1 },
      { t: 'radio', w: 1 }, { t: 'radiocomunicacion', w: 3 }, { t: 'satelital', w: 3 },
      { t: 'starlink', w: 3 }, { t: 'lte', w: 2 }, { t: '4g', w: 2 }, { t: '5g', w: 2 },
      { t: 'enacom', w: 3 }, { t: 'espectro', w: 2 }, { t: 'datos voz y video', w: 3 },
      { t: 'call center', w: 2 }, { t: 'contact center', w: 2 }, { t: 'internos', w: 1 },
    ],
    anchors: ['telefonía IP', 'central telefónica', 'telecomunicaciones', 'videoconferencia'],
  },
  {
    kind: 'service',
    key: '104',
    label: 'Software y automatización',
    href: '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp',
    hubSlug: 'software-y-automatizacion',
    schemaName: 'Desarrollo de software a medida, web, mobile y ERP',
    terms: [
      { t: 'software a medida', w: 3 }, { t: 'desarrollo de software', w: 3 }, { t: 'api', w: 2 },
      { t: 'apis', w: 2 }, { t: 'erp', w: 3 }, { t: 'odoo', w: 3 }, { t: 'n8n', w: 3 },
      { t: 'automatizacion', w: 2 }, { t: 'webhook', w: 2 }, { t: 'webhooks', w: 2 },
      { t: 'base de datos', w: 1 }, { t: 'postgresql', w: 1 }, { t: 'aplicacion movil', w: 3 },
      { t: 'app movil', w: 3 }, { t: 'integracion', w: 1 }, { t: 'integraciones', w: 1 },
      { t: 'nextcloud', w: 2 }, { t: 'keycloak', w: 2 }, { t: 'paperless', w: 2 }, { t: 'traccar', w: 2 },
      { t: 'immich', w: 2 }, { t: 'metabase', w: 2 }, { t: 'directus', w: 2 }, { t: 'low-code', w: 2 },
      { t: 'python', w: 2 }, { t: 'javascript', w: 2 }, { t: 'docker', w: 1 }, { t: 'kubernetes', w: 2 },
      { t: 'open source', w: 1 }, { t: 'codigo abierto', w: 1 }, { t: 'sistema de gestion', w: 2 },
      { t: 'facturacion electronica', w: 3 }, { t: 'arca', w: 1 }, { t: 'llm', w: 2 }, { t: 'ollama', w: 3 },
      { t: 'inteligencia artificial', w: 1 }, { t: 'ia local', w: 3 }, { t: 'rag', w: 2 },
      { t: 'crm', w: 2 }, { t: 'digitalizacion', w: 1 }, { t: 'expediente digital', w: 2 },
      { t: 'erpnext', w: 3 }, { t: 'dolibarr', w: 3 }, { t: 'facturas', w: 1 }, { t: 'odk', w: 2 },
      { t: 'formularios', w: 1 }, { t: 'duckdb', w: 2 }, { t: 'parquet', w: 2 }, { t: 'redis', w: 2 }, { t: 'nats', w: 2 },
    ],
    anchors: ['software a medida', 'desarrollo de software', 'facturación electrónica'],
  },
  {
    kind: 'service',
    key: '105',
    label: 'Soporte y operación IT',
    href: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it',
    hubSlug: 'soporte-y-operacion-it',
    schemaName: 'Soporte técnico 24/7, mesa de ayuda y mantenimiento IT',
    terms: [
      { t: 'soporte tecnico', w: 3 }, { t: 'mesa de ayuda', w: 3 }, { t: 'help desk', w: 3 },
      { t: 'helpdesk', w: 3 }, { t: 'mantenimiento preventivo', w: 3 }, { t: 'mantenimiento', w: 1 },
      { t: 'monitoreo', w: 1 }, { t: 'zabbix', w: 3 }, { t: 'grafana', w: 2 }, { t: 'prometheus', w: 2 },
      { t: 'uptime kuma', w: 3 }, { t: 'glpi', w: 3 }, { t: 'backup', w: 1 }, { t: 'backups', w: 1 },
      { t: 'respaldo', w: 1 }, { t: 'respaldos', w: 1 }, { t: 'restic', w: 3 }, { t: 'proxmox', w: 2 },
      { t: 'sla', w: 2 }, { t: 'incidente', w: 1 }, { t: 'incidentes', w: 1 }, { t: 'parches', w: 2 },
      { t: 'actualizaciones', w: 1 }, { t: 'inventario', w: 1 }, { t: 'ticket', w: 2 }, { t: 'tickets', w: 2 },
      { t: 'restauracion', w: 1 }, { t: 'recuperacion ante desastres', w: 3 }, { t: 'guardia', w: 1 },
      { t: '24/7', w: 1 }, { t: 'wazuh', w: 2 }, { t: 'rustdesk', w: 3 }, { t: 'soporte remoto', w: 3 },
      { t: 'soporte de infraestructura', w: 3 }, { t: 'alta disponibilidad', w: 2 }, { t: 'mantenimiento correctivo', w: 3 },
      { t: 'snapshots', w: 2 }, { t: 'truenas', w: 3 }, { t: 'nas', w: 2 }, { t: 'minio', w: 2 }, { t: 'object lock', w: 3 },
    ],
    anchors: ['mesa de ayuda', 'soporte técnico', 'mantenimiento preventivo', 'soporte remoto'],
  },
  {
    kind: 'service',
    key: '106',
    label: 'Consultoría y cumplimiento',
    href: '/servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria',
    hubSlug: 'consultoria-y-cumplimiento',
    schemaName: 'Consultoría IT, transformación digital, arquitectura y auditoría',
    terms: [
      { t: 'consultoria', w: 3 }, { t: 'auditoria', w: 2 }, { t: 'transformacion digital', w: 3 },
      { t: 'arquitectura', w: 1 }, { t: 'roadmap', w: 2 }, { t: 'gobernanza', w: 2 },
      { t: 'cumplimiento', w: 2 }, { t: 'normativa', w: 2 }, { t: 'regulacion', w: 2 },
      { t: 'resolucion', w: 1 }, { t: 'ley', w: 1 }, { t: 'iso 27001', w: 3 }, { t: 'iso', w: 1 },
      { t: 'riesgo', w: 1 }, { t: 'riesgos', w: 1 }, { t: 'ciberseguridad', w: 2 },
      { t: 'proteccion de datos', w: 3 }, { t: 'datos personales', w: 3 }, { t: 'licitacion', w: 2 },
      { t: 'pliego', w: 2 }, { t: 'costo total', w: 2 }, { t: 'tco', w: 3 }, { t: 'soberania de datos', w: 3 },
      { t: 'licencias', w: 1 }, { t: 'estrategia', w: 1 }, { t: 'diagnostico', w: 1 }, { t: 'nis2', w: 3 },
      { t: 'identidad', w: 1 }, { t: 'resolucion general', w: 2 }, { t: 'boletin oficial', w: 2 }, { t: 'decreto', w: 1 }, { t: 'compliance', w: 2 }, { t: 'sso', w: 2 }, { t: 'mfa', w: 2 }, { t: 'passkeys', w: 2 },
      { t: 'contrasenas', w: 2 }, { t: 'gestor de contrasenas', w: 3 }, { t: 'passbolt', w: 3 }, { t: 'vaultwarden', w: 3 },
    ],
    anchors: ['transformación digital', 'consultoría IT', 'protección de datos', 'soberanía de datos'],
  },
  {
    kind: 'service',
    key: '107',
    label: 'Detección de incendios',
    href: '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios',
    hubSlug: 'deteccion-de-incendios',
    schemaName: 'Sistemas de detección y alarma de incendios',
    terms: [
      { t: 'deteccion de incendios', w: 3 }, { t: 'deteccion de incendio', w: 3 }, { t: 'incendio', w: 1 },
      { t: 'incendios', w: 1 }, { t: 'alarma de incendio', w: 3 }, { t: 'sdi', w: 3 },
      { t: 'detector de humo', w: 3 }, { t: 'detectores de humo', w: 3 }, { t: 'detectores', w: 1 },
      { t: 'notifier', w: 3 }, { t: 'central de incendio', w: 3 }, { t: 'nfpa', w: 3 }, { t: 'nfpa 72', w: 3 },
      { t: 'rociadores', w: 3 }, { t: 'extincion', w: 2 }, { t: 'evacuacion', w: 2 },
      { t: 'sistemas de deteccion', w: 3 }, { t: 'lazo', w: 1 }, { t: 'sirenas', w: 1 }, { t: 'pulsadores', w: 2 },
    ],
    anchors: ['detección de incendios', 'alarma de incendio', 'detectores de humo'],
  },
  {
    kind: 'service',
    key: '108',
    label: 'Energía para IT',
    href: '/servicios/108/servicios-electricos-para-it',
    hubSlug: 'energia-para-it',
    schemaName: 'Servicios eléctricos para IT: UPS, tableros y puesta a tierra',
    terms: [
      { t: 'ups', w: 3 }, { t: 'energia', w: 2 }, { t: 'electrica', w: 1 }, { t: 'electrico', w: 1 },
      { t: 'tablero electrico', w: 3 }, { t: 'tableros electricos', w: 3 }, { t: 'puesta a tierra', w: 3 },
      { t: 'grupo electrogeno', w: 3 }, { t: 'generador', w: 2 }, { t: 'data center', w: 2 },
      { t: 'datacenter', w: 2 }, { t: 'centro de datos', w: 2 }, { t: 'climatizacion', w: 2 },
      { t: 'pdu', w: 3 }, { t: 'corte de energia', w: 3 }, { t: 'cortes de luz', w: 3 }, { t: 'cortes', w: 1 },
      { t: 'fotovoltaica', w: 3 }, { t: 'paneles solares', w: 3 }, { t: 'baterias', w: 1 }, { t: 'nut', w: 2 },
      { t: 'autonomia', w: 1 }, { t: 'sala de servidores', w: 2 }, { t: 'sobretension', w: 3 },
    ],
    anchors: ['puesta a tierra', 'grupo electrógeno', 'tablero eléctrico'],
  },
];

export const TOPIC_SECTORS: TopicCluster[] = [
  {
    kind: 'sector',
    key: 'aeropuertos',
    label: 'Aeropuertos',
    href: '/aeropuertos',
    schemaName: 'Tecnología para aeropuertos',
    terms: [
      { t: 'aeropuerto', w: 3 }, { t: 'aeropuertos', w: 3 }, { t: 'aeroportuario', w: 3 },
      { t: 'aeroportuaria', w: 3 }, { t: 'aeronautico', w: 3 }, { t: 'aeronautica', w: 2 },
      { t: 'anac', w: 3 }, { t: 'eana', w: 3 }, { t: 'aa2000', w: 3 }, { t: 'aeropuertos argentina 2000', w: 3 },
      { t: 'terminal aerea', w: 3 }, { t: 'torre de control', w: 3 }, { t: 'aviacion', w: 2 },
      { t: 'pasajeros', w: 1 }, { t: 'aerolinea', w: 2 }, { t: 'aerolineas', w: 2 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'bodegas',
    label: 'Bodegas',
    href: '/bodegas',
    schemaName: 'Tecnología para bodegas y la industria vitivinícola',
    terms: [
      { t: 'bodega', w: 3 }, { t: 'bodegas', w: 3 }, { t: 'vitivinicola', w: 3 }, { t: 'vitivinicolas', w: 3 },
      { t: 'vino', w: 2 }, { t: 'vinos', w: 2 }, { t: 'vinedo', w: 3 }, { t: 'vinedos', w: 3 },
      { t: 'vendimia', w: 3 }, { t: 'enoturismo', w: 3 }, { t: 'finca', w: 2 },
      { t: 'fincas', w: 2 }, { t: 'cosecha', w: 2 }, { t: 'barricas', w: 3 }, { t: 'lagar', w: 3 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'gobiernosectorpublico',
    label: 'Gobierno y sector público',
    href: '/gobiernosectorpublico',
    schemaName: 'Tecnología para gobierno y sector público',
    terms: [
      { t: 'municipio', w: 3 }, { t: 'municipios', w: 3 }, { t: 'municipalidad', w: 3 },
      { t: 'municipal', w: 2 }, { t: 'gobierno', w: 2 }, { t: 'sector publico', w: 3 },
      { t: 'ministerio', w: 2 }, { t: 'organismo publico', w: 3 }, { t: 'organismos publicos', w: 3 },
      { t: 'estado provincial', w: 3 }, { t: 'intendencia', w: 3 }, { t: 'concejo deliberante', w: 3 },
      { t: 'tramites', w: 1 }, { t: 'ciudadanos', w: 1 }, { t: 'vecinos', w: 1 }, { t: 'licitacion publica', w: 3 },
      { t: 'administracion publica', w: 3 }, { t: 'expediente', w: 1 }, { t: 'poder judicial', w: 3 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'salud',
    label: 'Salud',
    href: '/salud',
    schemaName: 'Tecnología para salud',
    terms: [
      { t: 'hospital', w: 3 }, { t: 'hospitales', w: 3 }, { t: 'clinica', w: 3 }, { t: 'clinicas', w: 3 },
      { t: 'sanatorio', w: 3 }, { t: 'salud', w: 2 }, { t: 'paciente', w: 2 }, { t: 'pacientes', w: 2 },
      { t: 'historia clinica', w: 3 }, { t: 'hl7', w: 3 }, { t: 'fhir', w: 3 }, { t: 'pacs', w: 3 },
      { t: 'centro de salud', w: 3 }, { t: 'consultorio', w: 2 }, { t: 'medico', w: 1 }, { t: 'medicos', w: 1 },
      { t: 'obra social', w: 2 }, { t: 'laboratorio', w: 1 }, { t: 'guardia medica', w: 3 }, { t: 'quirofano', w: 3 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'constructoras',
    label: 'Construcción',
    href: '/constructoras',
    schemaName: 'Tecnología para constructoras',
    terms: [
      { t: 'constructora', w: 3 }, { t: 'constructoras', w: 3 }, { t: 'construccion', w: 2 },
      { t: 'obra', w: 1 }, { t: 'obras', w: 1 }, { t: 'obrador', w: 3 }, { t: 'obradores', w: 3 },
      { t: 'bim', w: 3 }, { t: 'inmobiliaria', w: 2 }, { t: 'desarrollo inmobiliario', w: 3 },
      { t: 'computo metrico', w: 3 }, { t: 'edificio', w: 1 }, { t: 'edificios', w: 1 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'industria',
    label: 'Industria',
    href: '/industria',
    schemaName: 'Tecnología para la industria',
    terms: [
      { t: 'industria', w: 2 }, { t: 'industrial', w: 2 }, { t: 'planta industrial', w: 3 },
      { t: 'fabrica', w: 3 }, { t: 'manufactura', w: 3 }, { t: 'scada', w: 3 }, { t: 'plc', w: 3 },
      { t: 'iiot', w: 3 }, { t: 'industria 4.0', w: 3 }, { t: 'mqtt', w: 2 }, { t: 'node-red', w: 2 },
      { t: 'logistica', w: 2 }, { t: 'deposito', w: 2 }, { t: 'flota', w: 2 }, { t: 'flotas', w: 2 },
      { t: 'produccion', w: 1 }, { t: 'agroindustria', w: 3 }, { t: 'frigorifico', w: 3 }, { t: 'distribuidora', w: 2 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'mineria',
    label: 'Minería',
    href: '/mineria',
    schemaName: 'Tecnología para minería y energía',
    terms: [
      { t: 'mineria', w: 3 }, { t: 'minera', w: 3 }, { t: 'mineras', w: 3 }, { t: 'mina', w: 2 },
      { t: 'yacimiento', w: 3 }, { t: 'yacimientos', w: 3 }, { t: 'campamento', w: 2 },
      { t: 'petrolera', w: 3 }, { t: 'petroleo', w: 3 }, { t: 'oil & gas', w: 3 }, { t: 'vaca muerta', w: 3 },
      { t: 'litio', w: 3 }, { t: 'rigi', w: 3 }, { t: 'upstream', w: 3 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'seguridad-electronica',
    label: 'Seguridad electrónica',
    href: '/seguridad-electronica',
    schemaName: 'Seguridad electrónica como vertical',
    terms: [
      { t: 'seguridad electronica', w: 3 }, { t: 'videovigilancia', w: 3 }, { t: 'cctv', w: 3 },
      { t: 'centro de monitoreo', w: 3 }, { t: 'seguridad privada', w: 3 }, { t: 'barrio privado', w: 3 },
      { t: 'seguridad ciudadana', w: 3 }, { t: 'monitoreo de alarmas', w: 3 }, { t: 'control de acceso', w: 2 },
    ],
    anchors: [],
  },
  {
    kind: 'sector',
    key: 'software',
    label: 'Software',
    href: '/software',
    schemaName: 'Software y sistemas para organizaciones',
    terms: [
      { t: 'saas', w: 3 }, { t: 'devops', w: 3 }, { t: 'ci/cd', w: 3 }, { t: 'kubernetes', w: 3 },
      { t: 'microservicios', w: 3 }, { t: 'desarrollo de software', w: 3 }, { t: 'gitlab', w: 3 },
      { t: 'github actions', w: 3 }, { t: 'opentofu', w: 3 }, { t: 'terraform', w: 3 }, { t: 'woodpecker', w: 3 }, { t: 'integracion continua', w: 3 }, { t: 'empresas de software', w: 3 },
    ],
    anchors: [],
  },
];

export const TOPIC_CLUSTERS: TopicCluster[] = [...TOPIC_SERVICES, ...TOPIC_SECTORS];

// ---------------------------------------------------------------------------
// Normalización y conteo
// ---------------------------------------------------------------------------

export const normalizeTopicText = (value: unknown): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9/&.+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const termRegexCache = new Map<string, RegExp>();

/** Coincidencia por palabra completa sobre texto ya normalizado. */
export const termRegex = (term: string): RegExp => {
  const cached = termRegexCache.get(term);
  if (cached) return cached;
  const normalized = normalizeTopicText(term);
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalized)}(?=$|[^a-z0-9])`, 'g');
  termRegexCache.set(term, pattern);
  return pattern;
};

export const countTerm = (normalizedText: string, term: string): number => {
  if (!normalizedText) return 0;
  const regex = termRegex(term);
  regex.lastIndex = 0;
  let count = 0;
  while (regex.exec(normalizedText)) count += 1;
  return count;
};

// ---------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------

export interface TopicDocument {
  title?: string;
  summary?: string;
  tags?: string[];
  body?: string;
}

export interface TopicScore {
  kind: TopicKind;
  key: string;
  /** Puntaje bruto acumulado. */
  score: number;
  /** Relevancia 0–100 (saturación exponencial del puntaje bruto). */
  relevance: number;
  /** Términos que aportaron más puntaje: la evidencia de la asignación. */
  evidence: string[];
  /** true si algún término aparece en título, resumen o etiquetas. */
  headline: boolean;
}

const FIELD_WEIGHTS = { title: 4, tags: 2.5, summary: 2 } as const;
const RELEVANCE_SCALE = 14;

export const relevanceFromScore = (score: number): number =>
  Math.round(100 * (1 - Math.exp(-Math.max(0, score) / RELEVANCE_SCALE)));

/** Puntaje de un documento contra todos los clusters (sin filtrar). */
export function scoreTopicDocument(doc: TopicDocument, clusters: TopicCluster[] = TOPIC_CLUSTERS): TopicScore[] {
  const title = normalizeTopicText(doc.title);
  const summary = normalizeTopicText(doc.summary);
  const tags = normalizeTopicText((doc.tags || []).join(' ').replace(/-/g, ' '));
  const body = normalizeTopicText(doc.body);

  return clusters.map((cluster) => {
    let score = 0;
    let headline = false;
    const contributions: Array<{ term: string; value: number }> = [];

    for (const { t, w } of cluster.terms) {
      const inTitle = countTerm(title, t) > 0;
      const inTags = countTerm(tags, t) > 0;
      const inSummary = countTerm(summary, t) > 0;
      const bodyCount = countTerm(body, t);
      if (!inTitle && !inTags && !inSummary && bodyCount === 0) continue;

      const bodyValue = bodyCount > 0 ? Math.min(4, 1 + Math.log2(bodyCount)) : 0;
      const value = w * (
        (inTitle ? FIELD_WEIGHTS.title : 0)
        + (inTags ? FIELD_WEIGHTS.tags : 0)
        + (inSummary ? FIELD_WEIGHTS.summary : 0)
        + bodyValue
      );
      if (inTitle || inTags || inSummary) headline = true;
      score += value;
      contributions.push({ term: t, value });
    }

    const evidence = contributions
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((entry) => entry.term);

    return {
      kind: cluster.kind,
      key: cluster.key,
      score: Math.round(score * 10) / 10,
      relevance: relevanceFromScore(score),
      evidence,
      headline,
    };
  });
}

export interface TopicClassification {
  /** Servicios asignados, de mayor a menor relevancia. */
  services: TopicScore[];
  /** Sectores asignados, de mayor a menor relevancia. */
  sectors: TopicScore[];
  primaryService: string | null;
  primarySector: string | null;
}

/** Umbrales: evitan asignar un cluster por una mención al pasar. */
export const TOPIC_THRESHOLDS = {
  service: { minRelevance: 45, minShareOfTop: 0.4, max: 3 },
  sector: { minRelevance: 55, minShareOfTop: 0.45, max: 2 },
} as const;

const pickAssigned = (scores: TopicScore[], kind: TopicKind): TopicScore[] => {
  const rule = TOPIC_THRESHOLDS[kind];
  const ordered = scores
    .filter((entry) => entry.kind === kind)
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const top = ordered[0];
  if (!top || top.relevance < rule.minRelevance) return [];
  return ordered
    .filter((entry) => entry.relevance >= rule.minRelevance && entry.score >= top.score * rule.minShareOfTop)
    // Un sector sólo se asigna si aparece en título, resumen o etiquetas, o si el cuerpo lo sostiene con fuerza.
    .filter((entry) => kind === 'service' || entry.headline || entry.relevance >= 75)
    .slice(0, rule.max);
};

export function classifyTopicDocument(doc: TopicDocument): TopicClassification {
  const scores = scoreTopicDocument(doc);
  const services = pickAssigned(scores, 'service');
  const sectors = pickAssigned(scores, 'sector');
  return {
    services,
    sectors,
    primaryService: services[0]?.key ?? null,
    primarySector: sectors[0]?.key ?? null,
  };
}

export const getTopicCluster = (kind: TopicKind, key: string): TopicCluster | undefined =>
  (kind === 'service' ? TOPIC_SERVICES : TOPIC_SECTORS).find((cluster) => cluster.key === key);

export const getServiceClusterByHubSlug = (hubSlug: string): TopicCluster | undefined =>
  TOPIC_SERVICES.find((cluster) => cluster.hubSlug === hubSlug);
