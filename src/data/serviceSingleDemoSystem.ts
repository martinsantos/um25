export type ServiceSingleCapability = {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type ServiceSingleApproachStep = {
  number: string;
  title: string;
  description: string;
};

export type ServiceSingleCopy = {
  headline: string;
  paragraph: string;
  capabilitiesIntro: string;
  approachHeading: string;
  approachIntro: string;
};

export const serviceSingleDemoCopy: Record<number, ServiceSingleCopy> = {
  101: {
    headline: 'Redes que sostienen la operación crítica.',
    paragraph: 'Cableado estructurado, fibra óptica, LAN/WAN, WiFi corporativo y conmutación gestionada, con documentación y evidencia técnica para infraestructura que no puede detenerse.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, implementa, certifica y sostiene cada capa de red para operaciones que no pueden detenerse.',
    approachHeading: 'De la medición a la red certificada.',
    approachIntro: 'Cada obra de red se entrega medida, etiquetada y documentada. Lo que instalamos, lo podemos probar.',
  },
  102: {
    headline: 'Seguridad electrónica para actuar.',
    paragraph: 'Videovigilancia IP, control de accesos, intrusión y monitoreo, con documentación y evidencia técnica para operaciones que no pueden detenerse.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, implementa, documenta y sostiene cada frente de protección para operaciones que no pueden detenerse.',
    approachHeading: 'De la auditoría de riesgo al monitoreo continuo.',
    approachIntro: 'Un mismo equipo releva, diseña, instala y opera la seguridad del sitio, con un único responsable de punta a punta.',
  },
  103: {
    headline: 'Telecomunicaciones para conectar lo crítico.',
    paragraph: 'Radioenlaces, telefonía IP, conectividad redundante e infraestructura de sitio, con documentación y evidencia técnica para operaciones que no pueden quedar incomunicadas.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, implementa, documenta y sostiene cada vínculo de comunicación para operaciones que no pueden detenerse.',
    approachHeading: 'Del estudio de enlace al vínculo sostenido.',
    approachIntro: 'Conectamos sitios donde otros no llegan: estudio de señal, montaje en altura y monitoreo continuo del vínculo.',
  },
  104: {
    headline: 'Software a medida para tu operación real.',
    paragraph: 'Aplicaciones, integraciones y automatización diseñadas sobre el proceso concreto de cada empresa, con datos, trazabilidad y soporte para que el sistema acompañe la operación.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, desarrolla, documenta y sostiene cada sistema sobre el proceso real de la operación.',
    approachHeading: 'Del proceso real al sistema que lo ordena.',
    approachIntro: 'Empezamos por cómo trabaja el equipo y adaptamos el software a esa operación.',
  },
  105: {
    headline: 'Soporte 24/7, del incidente a la solución.',
    paragraph: 'Mesa de ayuda, monitoreo continuo, mantenimiento preventivo y respuesta en sitio con acuerdos de servicio, para operaciones que necesitan continuidad y evidencia.',
    capabilitiesIntro: 'Un mismo equipo monitorea, previene, responde y documenta cada incidente para operaciones que no pueden detenerse.',
    approachHeading: 'Del incidente resuelto a la falla evitada.',
    approachIntro: 'No esperamos a que algo se rompa. Monitoreamos, anticipamos y, cuando hace falta, estamos en sitio dentro del SLA.',
  },
  106: {
    headline: 'Consultoría IT con criterio de terreno.',
    paragraph: 'Diagnóstico, arquitectura, roadmap e inversión basados en 22 años de obras reales, para decidir infraestructura con datos, riesgos claros y evidencia.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, planifica y acompaña cada decisión de infraestructura con criterio técnico y evidencia.',
    approachHeading: 'Del relevamiento a la decisión respaldada.',
    approachIntro: 'No vendemos un informe genérico. Auditamos el sitio, ordenamos riesgos y entregamos un plan que se puede ejecutar y medir.',
  },
  107: {
    headline: 'Detección de incendios para actuar a tiempo.',
    paragraph: 'Ingeniería, paneles, sensores y alarmas integradas con monitoreo, con documentación y evidencia técnica para instalaciones que no pueden quedar desprotegidas.',
    capabilitiesIntro: 'Un mismo equipo diseña, implementa, integra, documenta y sostiene cada sistema de detección para instalaciones que no pueden detenerse.',
    approachHeading: 'Del estudio de riesgo a la respuesta inmediata.',
    approachIntro: 'Cada sistema se diseña sobre el riesgo real del sitio, se prueba zona por zona y se sostiene con mantenimiento y monitoreo.',
  },
  108: {
    headline: 'Energía IT para sostener la operación.',
    paragraph: 'UPS, tableros, tendido, puesta a tierra y respaldo energético dedicados a infraestructura tecnológica, con documentación y evidencia técnica para que nada se apague.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, implementa, documenta y sostiene cada instalación eléctrica que alimenta la infraestructura crítica.',
    approachHeading: 'Del cálculo de cargas al respaldo garantizado.',
    approachIntro: 'La energía es el cimiento de todo lo demás. La diseñamos con redundancia, la probamos bajo carga y la monitoreamos en continuo.',
  },
};

export const serviceSingleDemoCapabilities: Record<number, ServiceSingleCapability[]> = {
  101: [
    {
      number: '01',
      title: 'Cableado estructurado',
      description: 'Diseño, tendido y certificación de cobre y fibra para datacenter, edificios y plantas.',
      image: '/img/servicios/sistemas/0792af63.webp',
      imageAlt: 'Cableado estructurado conectado a un patch panel gigabit ethernet',
    },
    {
      number: '02',
      title: 'Redes LAN / WAN',
      description: 'Arquitectura, segmentación y enlaces entre sedes para operaciones distribuidas.',
      image: '/img/servicios/sistemas/e83893ba.webp',
      imageAlt: 'Switch de red empresarial con puertos y LEDs de estado',
    },
    {
      number: '03',
      title: 'Fibra óptica',
      description: 'Backbone, fusión, medición y tendido para troncales de alta capacidad y baja latencia.',
      image: '/img/servicios/sistemas/9767f994.webp',
      imageAlt: 'Conectores de fibra óptica con hilos luminosos',
    },
    {
      number: '04',
      title: 'WiFi corporativo',
      description: 'Relevamiento de cobertura, controladoras, roaming y redes separadas por uso.',
      image: '/img/servicios/sistemas/4eb08d1a.webp',
      imageAlt: 'Access point WiFi empresarial montado en cielorraso',
    },
    {
      number: '05',
      title: 'Switching y routing',
      description: 'Conmutación gestionada, VLANs, QoS y ruteo para tráfico crítico y continuidad.',
      image: '/img/servicios/sistemas/ebf2dea8.webp',
      imageAlt: 'Switches y router empresariales montados en rack con LEDs',
    },
    {
      number: '06',
      title: 'Documentación y certificación',
      description: 'Dossier por proyecto: diagramas, mediciones, etiquetado y evidencia técnica.',
      image: '/img/servicios/sistemas/ffb25574.webp',
      imageAlt: 'Certificador de cableado mostrando resultado PASS sobre dossier técnico',
    },
  ],
  102: [
    {
      number: '01',
      title: 'Videovigilancia IP (CCTV)',
      description: 'Cámaras IP, grabación, analítica de video y verificación remota para cubrir perímetros y activos críticos.',
      image: '/img/servicios/sistemas/d319f77f.webp',
      imageAlt: 'Cámara de videovigilancia IP profesional en primer plano',
    },
    {
      number: '02',
      title: 'Control de accesos',
      description: 'Lectores, credenciales, molinetes y registro de quién entra, cuándo y a qué zona.',
      image: '/img/servicios/sistemas/7e3cd73b.webp',
      imageAlt: 'Lector de control de accesos con credencial RFID en puerta',
    },
    {
      number: '03',
      title: 'Detección de intrusión',
      description: 'Sensores perimetrales e interiores, paneles de alarma y protocolos de respuesta ante eventos.',
      image: '/img/servicios/sistemas/e5f3c9da.webp',
      imageAlt: 'Sensor de movimiento PIR y teclado de alarma de intrusión',
    },
    {
      number: '04',
      title: 'Monitoreo y operación 24/7',
      description: 'Estación de monitoreo continuo, atención de incidentes y continuidad operativa en sitio.',
      image: '/img/servicios/sistemas/0363f585.webp',
      imageAlt: 'Estación de monitoreo CCTV con joystick PTZ frente a muro de monitores',
    },
    {
      number: '05',
      title: 'Detección de incendios',
      description: 'Ingeniería, paneles, sensores y alarmas integradas para proteger activos y personas.',
      image: '/img/servicios/sistemas/250695f3.webp',
      imageAlt: 'Detector de humo y avisador de incendio en primer plano',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: alcance, protocolo, responsables y evidencia técnica para auditoría o licitación.',
      image: '/img/servicios/sistemas/ff6df555.webp',
      imageAlt: 'Dossier de seguridad con planos CCTV y tablet mostrando cámaras',
    },
  ],
  103: [
    {
      number: '01',
      title: 'Radioenlaces y vínculos',
      description: 'Enlaces punto a punto y multipunto para conectar sedes, plantas y sitios remotos.',
      image: '/img/servicios/sistemas/cfa4e82e.webp',
      imageAlt: 'Antenas de radioenlace de microondas montadas en torre de telecomunicaciones al atardecer',
    },
    {
      number: '02',
      title: 'Telefonía IP (VoIP)',
      description: 'Centrales, troncales SIP, planes de numeración y movilidad para equipos distribuidos.',
      image: '/img/servicios/sistemas/f7abd3b0.webp',
      imageAlt: 'Teléfono IP y gateway de telefonía SIP en sala de equipos',
    },
    {
      number: '03',
      title: 'Conectividad e internet',
      description: 'Vínculos dedicados, redundancia de enlaces y balanceo para continuidad operativa.',
      image: '/img/servicios/sistemas/0e52972c.webp',
      imageAlt: 'Panel de fibra óptica con enlaces redundantes y conectividad en sala de red',
    },
    {
      number: '04',
      title: 'Infraestructura de sitio',
      description: 'Torres, mástiles, energía y acometidas para puntos de telecomunicación críticos.',
      image: '/img/servicios/sistemas/5d6e14a6.webp',
      imageAlt: 'Base de torre de telecomunicaciones con gabinetes de energía en sitio remoto',
    },
    {
      number: '05',
      title: 'Integración y gestión',
      description: 'Interconexión con redes existentes, segmentación y QoS para tráfico prioritario.',
      image: '/img/servicios/sistemas/1752ae26.webp',
      imageAlt: 'Técnico gestionando tráfico y QoS de red en estación de operaciones',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: enlaces, mediciones de señal, responsables y trazabilidad.',
      image: '/img/servicios/sistemas/4d90c1ed.webp',
      imageAlt: 'Dossier técnico de telecomunicaciones con mediciones de señal y tablet',
    },
  ],
  104: [
    {
      number: '01',
      title: 'Aplicaciones a medida',
      description: 'Sistemas web y de gestión diseñados sobre el proceso real de cada operación.',
      image: '/img/servicios/sistemas/af4d1184.webp',
      imageAlt: 'Laptop mostrando una aplicación de gestión web a medida',
    },
    {
      number: '02',
      title: 'Integraciones',
      description: 'Conexión entre sistemas, equipos en sitio, sensores y plataformas existentes.',
      image: '/img/servicios/sistemas/9e98f59f.webp',
      imageAlt: 'Monitor mostrando un diagrama de integración entre sistemas y APIs',
    },
    {
      number: '03',
      title: 'Portales y backoffice',
      description: 'Paneles, reportería y flujos para administrar operación, evidencia y usuarios.',
      image: '/img/servicios/sistemas/1787e4ce.webp',
      imageAlt: 'Monitor mostrando un panel de administración backoffice',
    },
    {
      number: '04',
      title: 'Automatización',
      description: 'Tareas, alertas y procesos automáticos para reducir trabajo manual y errores.',
      image: '/img/servicios/sistemas/9f2dd251.webp',
      imageAlt: 'Monitor mostrando un constructor de flujos de automatización',
    },
    {
      number: '05',
      title: 'Datos y trazabilidad',
      description: 'Registro, auditoría y tableros para decisiones basadas en evidencia.',
      image: '/img/servicios/sistemas/6fd5df1d.webp',
      imageAlt: 'Monitor mostrando un tablero de analítica y auditoría',
    },
    {
      number: '06',
      title: 'Mantenimiento evolutivo',
      description: 'Soporte, mejoras y nuevas funciones para que el software acompañe la operación.',
      image: '/img/servicios/sistemas/d1524519.webp',
      imageAlt: 'Laptop con editor de código fuente en desarrollo',
    },
  ],
  105: [
    {
      number: '01',
      title: 'Mesa de ayuda',
      description: 'Atención de incidentes, tickets y seguimiento para usuarios y operaciones.',
      image: '/img/servicios/sistemas/b6ad1321.webp',
      imageAlt: 'Headset de mesa de ayuda junto a monitor con tablero de tickets',
    },
    {
      number: '02',
      title: 'Soporte en sitio',
      description: 'Técnicos que se presentan donde está el problema, en Cuyo y Patagonia.',
      image: '/img/servicios/sistemas/4bacd5d7.webp',
      imageAlt: 'Maletín de herramientas de técnico de campo con laptop y tester',
    },
    {
      number: '03',
      title: 'Monitoreo continuo',
      description: 'Vigilancia de red, equipos y servicios para anticipar fallas antes del impacto.',
      image: '/img/servicios/sistemas/ce00fdfb.webp',
      imageAlt: 'Pantallas de monitoreo continuo con estado de red y uptime',
    },
    {
      number: '04',
      title: 'Mantenimiento preventivo',
      description: 'Rutinas programadas para sostener disponibilidad y extender vida útil.',
      image: '/img/servicios/sistemas/92bd0682.webp',
      imageAlt: 'Manos de técnico realizando mantenimiento en rack de servidores',
    },
    {
      number: '05',
      title: 'Acuerdos de servicio (SLA)',
      description: 'Tiempos de respuesta y resolución comprometidos por escrito.',
      image: '/img/servicios/sistemas/bf2b52b0.webp',
      imageAlt: 'Documento de acuerdo de nivel de servicio SLA firmado',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Registro de incidentes, intervenciones y resultados para auditoría y mejora.',
      image: '/img/servicios/sistemas/8e20575b.webp',
      imageAlt: 'Tablet con registro de incidentes junto a planillas de mantenimiento',
    },
  ],
  106: [
    {
      number: '01',
      title: 'Diagnóstico de infraestructura',
      description: 'Relevamiento del estado real de red, seguridad, energía y sistemas.',
      image: '/img/servicios/sistemas/f95b77d5.webp',
      imageAlt: 'Tablet con checklist de diagnóstico de infraestructura junto a rack de red',
    },
    {
      number: '02',
      title: 'Arquitectura y diseño',
      description: 'Definición técnica de soluciones acorde a la operación y el presupuesto.',
      image: '/img/servicios/sistemas/d32ec6d1.webp',
      imageAlt: 'Laptop con diagrama de arquitectura de red sobre planos técnicos',
    },
    {
      number: '03',
      title: 'Roadmap e inversión',
      description: 'Plan por etapas con prioridades, riesgos y necesidades de inversión.',
      image: '/img/servicios/sistemas/a60c168c.webp',
      imageAlt: 'Plan de roadmap e inversión IT impreso con fases y línea de tiempo',
    },
    {
      number: '04',
      title: 'Pliegos y licitaciones',
      description: 'Especificaciones técnicas y soporte documental para procesos formales.',
      image: '/img/servicios/sistemas/56b99a8d.webp',
      imageAlt: 'Dossier de especificaciones técnicas con secciones y sello de validación',
    },
    {
      number: '05',
      title: 'Continuidad y riesgo',
      description: 'Análisis de puntos críticos, redundancia y planes de contingencia.',
      image: '/img/servicios/sistemas/e33ffc45.webp',
      imageAlt: 'Monitor con tablero de análisis de riesgo y matriz de contingencia',
    },
    {
      number: '06',
      title: 'Acompañamiento de proyecto',
      description: 'Dirección técnica y control durante la ejecución, con evidencia.',
      image: '/img/servicios/sistemas/00b8d12a.webp',
      imageAlt: 'Casco de ingeniería sobre planos técnicos enrollados',
    },
  ],
  107: [
    {
      number: '01',
      title: 'Ingeniería y diseño',
      description: 'Proyecto de detección según normativa, riesgo y características del sitio.',
      image: '/img/servicios/sistemas/8a7bff1e.webp',
      imageAlt: 'Planos de ingeniería de detección de incendios con zonificación',
    },
    {
      number: '02',
      title: 'Paneles y centrales',
      description: 'Centrales de incendio, zonificación y lógica de alarma para cada instalación.',
      image: '/img/servicios/sistemas/64c5d967.webp',
      imageAlt: 'Central de alarma de incendios roja con indicadores de zona',
    },
    {
      number: '03',
      title: 'Sensores y detectores',
      description: 'Detección de humo, temperatura y llama distribuida según el área protegida.',
      image: '/img/servicios/sistemas/cf10ca1a.webp',
      imageAlt: 'Detectores de humo, temperatura y llama en fila',
    },
    {
      number: '04',
      title: 'Alarma y notificación',
      description: 'Avisadores, sirenas e integración con monitoreo para respuesta inmediata.',
      image: '/img/servicios/sistemas/ca1d4e74.webp',
      imageAlt: 'Avisador de incendio rojo con luz estroboscópica en pared',
    },
    {
      number: '05',
      title: 'Integración y monitoreo',
      description: 'Conexión con seguridad electrónica, accesos y estación de monitoreo 24/7.',
      image: '/img/servicios/sistemas/d0fec213.webp',
      imageAlt: 'Estación de monitoreo de incendios con estado de zonas y seguridad integrada',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: planos, pruebas, mantenimiento y trazabilidad.',
      image: '/img/servicios/sistemas/766ee2f2.webp',
      imageAlt: 'Dossier de protección contra incendios con certificados y planos',
    },
  ],
  108: [
    {
      number: '01',
      title: 'Energía ininterrumpida (UPS)',
      description: 'Respaldo, autonomía y protección eléctrica para equipos que no pueden apagarse.',
      image: '/img/servicios/sistemas/9954c7ae.webp',
      imageAlt: 'UPS montado en rack con display de estado de batería y carga',
    },
    {
      number: '02',
      title: 'Tableros y distribución',
      description: 'Tableros, protecciones y distribución dedicada para cargas críticas de IT.',
      image: '/img/servicios/sistemas/ce35c182.webp',
      imageAlt: 'Tablero eléctrico con interruptores y circuitos etiquetados',
    },
    {
      number: '03',
      title: 'Tendido eléctrico',
      description: 'Canalizaciones, acometidas y circuitos para racks, datacenter y sitios técnicos.',
      image: '/img/servicios/sistemas/621314f6.webp',
      imageAlt: 'Canalizaciones y cableado eléctrico hacia un rack técnico',
    },
    {
      number: '04',
      title: 'Puesta a tierra',
      description: 'Sistemas de tierra y protección contra sobretensiones para equipos sensibles.',
      image: '/img/servicios/sistemas/dfe49e83.webp',
      imageAlt: 'Barra de puesta a tierra de cobre con conexiones y protección contra sobretensiones',
    },
    {
      number: '05',
      title: 'Respaldo y continuidad',
      description: 'Grupos electrógenos, transferencia y esquemas de redundancia energética.',
      image: '/img/servicios/sistemas/7a470db0.webp',
      imageAlt: 'Grupo electrógeno industrial junto a tablero de transferencia automática',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: unifilares, mediciones, mantenimiento y trazabilidad.',
      image: '/img/servicios/sistemas/e411de55.webp',
      imageAlt: 'Dossier con diagrama unifilar eléctrico y mediciones',
    },
  ],
};

export const serviceSingleDemoApproachSteps: Record<number, ServiceSingleApproachStep[]> = {
  101: [
    { number: '01', title: 'Relevamiento de red', description: 'Medimos cobertura, puntos de demanda y cuellos de botella en el sitio.' },
    { number: '02', title: 'Diseño y certificación', description: 'Proyectamos topología, cableado y enlaces con normas y mediciones.' },
    { number: '03', title: 'Tendido e implementación', description: 'Instalamos cobre, fibra y equipos sin cortar la operación existente.' },
    { number: '04', title: 'Monitoreo y soporte', description: 'Vigilamos el tráfico, documentamos y respondemos ante cualquier falla.' },
  ],
  102: [
    { number: '01', title: 'Relevamiento de riesgo', description: 'Recorremos el sitio, mapeamos perímetros, accesos y puntos ciegos.' },
    { number: '02', title: 'Diseño e ingeniería', description: 'Proyectamos CCTV, accesos, intrusión y detección como un solo sistema.' },
    { number: '03', title: 'Implementación', description: 'Instalamos y configuramos en sitio sin frenar la operación del cliente.' },
    { number: '04', title: 'Monitoreo y evidencia', description: 'Operamos 24/7, documentamos cada intervención y dejamos trazabilidad.' },
  ],
  103: [
    { number: '01', title: 'Estudio de enlace', description: 'Analizamos línea de vista, distancias y demanda de tráfico entre sitios.' },
    { number: '02', title: 'Diseño del vínculo', description: 'Definimos radioenlaces, redundancia y telefonía según la operación.' },
    { number: '03', title: 'Montaje en sitio', description: 'Instalamos torres, antenas y equipos, incluso en sitios remotos.' },
    { number: '04', title: 'Medición y monitoreo', description: 'Verificamos señal, documentamos y sostenemos el vínculo 24/7.' },
  ],
  104: [
    { number: '01', title: 'Mapa del proceso', description: 'Entendemos cómo trabaja el equipo hoy y dónde se pierde tiempo o control.' },
    { number: '02', title: 'Diseño funcional', description: 'Definimos flujos, datos e integraciones sobre el proceso real de cada cliente.' },
    { number: '03', title: 'Desarrollo e integración', description: 'Construimos, conectamos los sistemas existentes y validamos con usuarios.' },
    { number: '04', title: 'Evolución continua', description: 'Mantenemos, medimos y sumamos funciones a medida que crece la operación.' },
  ],
  105: [
    { number: '01', title: 'Onboarding del parque', description: 'Relevamos equipos, servicios críticos y puntos de falla de la operación.' },
    { number: '02', title: 'Monitoreo y alertas', description: 'Vigilamos en continuo para detectar el problema antes que el usuario.' },
    { number: '03', title: 'Respuesta y resolución', description: 'Atendemos remoto o en sitio, dentro de los tiempos del SLA acordado.' },
    { number: '04', title: 'Prevención y reporte', description: 'Mantenimiento programado y reportes con evidencia de cada intervención.' },
  ],
  106: [
    { number: '01', title: 'Relevamiento técnico', description: 'Auditamos el estado real de red, seguridad, energía y sistemas en sitio.' },
    { number: '02', title: 'Análisis de riesgo', description: 'Identificamos puntos críticos, brechas y dependencias de la operación.' },
    { number: '03', title: 'Roadmap e inversión', description: 'Priorizamos por impacto y costo, con etapas y plan de inversión claro.' },
    { number: '04', title: 'Dirección técnica', description: 'Acompañamos la ejecución y validamos resultados con evidencia.' },
  ],
  107: [
    { number: '01', title: 'Estudio de riesgo', description: 'Evaluamos el sitio, las áreas a proteger y la normativa aplicable.' },
    { number: '02', title: 'Ingeniería del sistema', description: 'Diseñamos centrales, zonificación y sensores para detección temprana.' },
    { number: '03', title: 'Instalación y pruebas', description: 'Montamos paneles, sensores y alarmas, y probamos cada zona.' },
    { number: '04', title: 'Mantenimiento y monitoreo', description: 'Sostenemos el sistema con pruebas periódicas y respuesta 24/7.' },
  ],
  108: [
    { number: '01', title: 'Relevamiento de cargas', description: 'Medimos consumo, criticidad y riesgos eléctricos de la infraestructura.' },
    { number: '02', title: 'Diseño eléctrico', description: 'Proyectamos UPS, tableros, tierra y redundancia para cargas críticas.' },
    { number: '03', title: 'Montaje y puesta en marcha', description: 'Instalamos y energizamos sin interrumpir lo que ya está operando.' },
    { number: '04', title: 'Mantenimiento y monitoreo', description: 'Verificamos autonomía, medimos y sostenemos el respaldo 24/7.' },
  ],
};
