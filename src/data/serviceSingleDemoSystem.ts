export type ServiceSingleCapability = {
  number: string;
  title: string;
  description: string;
};

export type ServiceSingleCopy = {
  headline: string;
  paragraph: string;
};

export const serviceSingleDemoCopy: Record<number, ServiceSingleCopy> = {
  101: {
    headline: 'Redes que sostienen la operación crítica.',
    paragraph: 'Cableado estructurado, fibra óptica, LAN/WAN, WiFi corporativo y conmutación gestionada, con documentación y evidencia técnica para infraestructura que no puede detenerse.',
  },
  102: {
    headline: 'Seguridad electrónica para proteger activos críticos.',
    paragraph: 'Videovigilancia IP, control de accesos, intrusión y monitoreo, con documentación y evidencia técnica para operaciones que no pueden detenerse.',
  },
  103: {
    headline: 'Telecomunicaciones para conectar lo crítico.',
    paragraph: 'Radioenlaces, telefonía IP, conectividad redundante e infraestructura de sitio, con documentación y evidencia técnica para operaciones que no pueden quedar incomunicadas.',
  },
  104: {
    headline: 'Software a medida para tu operación real.',
    paragraph: 'Aplicaciones, integraciones y automatización diseñadas sobre el proceso concreto de cada empresa, con datos, trazabilidad y soporte para que el sistema acompañe la operación.',
  },
  105: {
    headline: 'Soporte 24/7 para que nada se detenga.',
    paragraph: 'Mesa de ayuda, monitoreo continuo, mantenimiento preventivo y respuesta en sitio con acuerdos de servicio, para operaciones que necesitan continuidad y evidencia.',
  },
  106: {
    headline: 'Consultoría IT con criterio de terreno.',
    paragraph: 'Diagnóstico, arquitectura, roadmap e inversión basados en 22 años de obras reales, para decidir infraestructura con datos, riesgos claros y evidencia.',
  },
  107: {
    headline: 'Detección de incendios para proteger personas y activos.',
    paragraph: 'Ingeniería, paneles, sensores y alarmas integradas con monitoreo, con documentación y evidencia técnica para instalaciones que no pueden quedar desprotegidas.',
  },
  108: {
    headline: 'Eléctricos para IT que garantizan continuidad.',
    paragraph: 'UPS, tableros, tendido, puesta a tierra y respaldo energético dedicados a infraestructura tecnológica, con documentación y evidencia técnica para que nada se apague.',
  },
};

export const serviceSingleDemoCapabilities: Record<number, ServiceSingleCapability[]> = {
  101: [
    {
      number: '01',
      title: 'Cableado estructurado',
      description: 'Diseño, tendido y certificación de cobre y fibra para datacenter, edificios y plantas.',
    },
    {
      number: '02',
      title: 'Redes LAN / WAN',
      description: 'Arquitectura, segmentación y enlaces entre sedes para operaciones distribuidas.',
    },
    {
      number: '03',
      title: 'Fibra óptica',
      description: 'Backbone, fusión, medición y tendido para troncales de alta capacidad y baja latencia.',
    },
    {
      number: '04',
      title: 'WiFi corporativo',
      description: 'Relevamiento de cobertura, controladoras, roaming y redes separadas por uso.',
    },
    {
      number: '05',
      title: 'Switching y routing',
      description: 'Conmutación gestionada, VLANs, QoS y ruteo para tráfico crítico y continuidad.',
    },
    {
      number: '06',
      title: 'Documentación y certificación',
      description: 'Dossier por proyecto: diagramas, mediciones, etiquetado y evidencia técnica.',
    },
  ],
  102: [
    {
      number: '01',
      title: 'Videovigilancia IP (CCTV)',
      description: 'Cámaras IP, grabación, analítica de video y verificación remota para cubrir perímetros y activos críticos.',
    },
    {
      number: '02',
      title: 'Control de accesos',
      description: 'Lectores, credenciales, molinetes y registro de quién entra, cuándo y a qué zona.',
    },
    {
      number: '03',
      title: 'Detección de intrusión',
      description: 'Sensores perimetrales e interiores, paneles de alarma y protocolos de respuesta ante eventos.',
    },
    {
      number: '04',
      title: 'Monitoreo y operación 24/7',
      description: 'Estación de monitoreo continuo, atención de incidentes y continuidad operativa en sitio.',
    },
    {
      number: '05',
      title: 'Detección de incendios',
      description: 'Ingeniería, paneles, sensores y alarmas integradas para proteger activos y personas.',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: alcance, protocolo, responsables y evidencia técnica para auditoría o licitación.',
    },
  ],
  103: [
    {
      number: '01',
      title: 'Radioenlaces y vínculos',
      description: 'Enlaces punto a punto y multipunto para conectar sedes, plantas y sitios remotos.',
    },
    {
      number: '02',
      title: 'Telefonía IP (VoIP)',
      description: 'Centrales, troncales SIP, planes de numeración y movilidad para equipos distribuidos.',
    },
    {
      number: '03',
      title: 'Conectividad e internet',
      description: 'Vínculos dedicados, redundancia de enlaces y balanceo para continuidad operativa.',
    },
    {
      number: '04',
      title: 'Infraestructura de sitio',
      description: 'Torres, mástiles, energía y acometidas para puntos de telecomunicación críticos.',
    },
    {
      number: '05',
      title: 'Integración y gestión',
      description: 'Interconexión con redes existentes, segmentación y QoS para tráfico prioritario.',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: enlaces, mediciones de señal, responsables y trazabilidad.',
    },
  ],
  104: [
    {
      number: '01',
      title: 'Aplicaciones a medida',
      description: 'Sistemas web y de gestión diseñados sobre el proceso real de cada operación.',
    },
    {
      number: '02',
      title: 'Integraciones',
      description: 'Conexión entre sistemas, equipos en sitio, sensores y plataformas existentes.',
    },
    {
      number: '03',
      title: 'Portales y backoffice',
      description: 'Paneles, reportería y flujos para administrar operación, evidencia y usuarios.',
    },
    {
      number: '04',
      title: 'Automatización',
      description: 'Tareas, alertas y procesos automáticos para reducir trabajo manual y errores.',
    },
    {
      number: '05',
      title: 'Datos y trazabilidad',
      description: 'Registro, auditoría y tableros para decisiones basadas en evidencia.',
    },
    {
      number: '06',
      title: 'Mantenimiento evolutivo',
      description: 'Soporte, mejoras y nuevas funciones para que el software acompañe la operación.',
    },
  ],
  105: [
    {
      number: '01',
      title: 'Mesa de ayuda',
      description: 'Atención de incidentes, tickets y seguimiento para usuarios y operaciones.',
    },
    {
      number: '02',
      title: 'Soporte en sitio',
      description: 'Técnicos que se presentan donde está el problema, en Cuyo y Patagonia.',
    },
    {
      number: '03',
      title: 'Monitoreo continuo',
      description: 'Vigilancia de red, equipos y servicios para anticipar fallas antes del impacto.',
    },
    {
      number: '04',
      title: 'Mantenimiento preventivo',
      description: 'Rutinas programadas para sostener disponibilidad y extender vida útil.',
    },
    {
      number: '05',
      title: 'Acuerdos de servicio (SLA)',
      description: 'Tiempos de respuesta y resolución comprometidos por escrito.',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Registro de incidentes, intervenciones y resultados para auditoría y mejora.',
    },
  ],
  106: [
    {
      number: '01',
      title: 'Diagnóstico de infraestructura',
      description: 'Relevamiento del estado real de red, seguridad, energía y sistemas.',
    },
    {
      number: '02',
      title: 'Arquitectura y diseño',
      description: 'Definición técnica de soluciones acorde a la operación y el presupuesto.',
    },
    {
      number: '03',
      title: 'Roadmap e inversión',
      description: 'Plan por etapas con prioridades, riesgos y necesidades de inversión.',
    },
    {
      number: '04',
      title: 'Pliegos y licitaciones',
      description: 'Especificaciones técnicas y soporte documental para procesos formales.',
    },
    {
      number: '05',
      title: 'Continuidad y riesgo',
      description: 'Análisis de puntos críticos, redundancia y planes de contingencia.',
    },
    {
      number: '06',
      title: 'Acompañamiento de proyecto',
      description: 'Dirección técnica y control durante la ejecución, con evidencia.',
    },
  ],
  107: [
    {
      number: '01',
      title: 'Ingeniería y diseño',
      description: 'Proyecto de detección según normativa, riesgo y características del sitio.',
    },
    {
      number: '02',
      title: 'Paneles y centrales',
      description: 'Centrales de incendio, zonificación y lógica de alarma para cada instalación.',
    },
    {
      number: '03',
      title: 'Sensores y detectores',
      description: 'Detección de humo, temperatura y llama distribuida según el área protegida.',
    },
    {
      number: '04',
      title: 'Alarma y notificación',
      description: 'Avisadores, sirenas e integración con monitoreo para respuesta inmediata.',
    },
    {
      number: '05',
      title: 'Integración y monitoreo',
      description: 'Conexión con seguridad electrónica, accesos y estación de monitoreo 24/7.',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: planos, pruebas, mantenimiento y trazabilidad.',
    },
  ],
  108: [
    {
      number: '01',
      title: 'Energía ininterrumpida (UPS)',
      description: 'Respaldo, autonomía y protección eléctrica para equipos que no pueden apagarse.',
    },
    {
      number: '02',
      title: 'Tableros y distribución',
      description: 'Tableros, protecciones y distribución dedicada para cargas críticas de IT.',
    },
    {
      number: '03',
      title: 'Tendido eléctrico',
      description: 'Canalizaciones, acometidas y circuitos para racks, datacenter y sitios técnicos.',
    },
    {
      number: '04',
      title: 'Puesta a tierra',
      description: 'Sistemas de tierra y protección contra sobretensiones para equipos sensibles.',
    },
    {
      number: '05',
      title: 'Respaldo y continuidad',
      description: 'Grupos electrógenos, transferencia y esquemas de redundancia energética.',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: unifilares, mediciones, mantenimiento y trazabilidad.',
    },
  ],
};
