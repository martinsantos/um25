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
    headline: 'Seguridad electrónica para proteger activos críticos.',
    paragraph: 'Videovigilancia IP, control de accesos, intrusión y monitoreo, con documentación y evidencia técnica para operaciones que no pueden detenerse.',
    capabilitiesIntro: 'Un mismo equipo releva, diseña, implementa, documenta y sostiene cada frente de protección para operaciones que no pueden detenerse.',
    approachHeading: 'De la auditoría de riesgo al monitoreo continuo.',
    approachIntro: 'Un mismo equipo releva, diseña, instala y opera la seguridad del sitio. Sin proveedores cruzados ni responsabilidades difusas.',
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
    approachIntro: 'No empezamos por la tecnología, empezamos por cómo trabaja el equipo. El software se adapta a la operación, no al revés.',
  },
  105: {
    headline: 'Soporte 24/7 para que nada se detenga.',
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
    headline: 'Detección de incendios para proteger personas y activos.',
    paragraph: 'Ingeniería, paneles, sensores y alarmas integradas con monitoreo, con documentación y evidencia técnica para instalaciones que no pueden quedar desprotegidas.',
    capabilitiesIntro: 'Un mismo equipo diseña, implementa, integra, documenta y sostiene cada sistema de detección para instalaciones que no pueden detenerse.',
    approachHeading: 'Del estudio de riesgo a la respuesta inmediata.',
    approachIntro: 'Cada sistema se diseña sobre el riesgo real del sitio, se prueba zona por zona y se sostiene con mantenimiento y monitoreo.',
  },
  108: {
    headline: 'Eléctricos para IT que garantizan continuidad.',
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
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/0792af63-ai-generated-1781790816373.png',
      imageAlt: 'Cableado estructurado conectado a un patch panel gigabit ethernet',
    },
    {
      number: '02',
      title: 'Redes LAN / WAN',
      description: 'Arquitectura, segmentación y enlaces entre sedes para operaciones distribuidas.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/e83893ba-ai-generated-1781790818341.png',
      imageAlt: 'Switch de red empresarial con puertos y LEDs de estado',
    },
    {
      number: '03',
      title: 'Fibra óptica',
      description: 'Backbone, fusión, medición y tendido para troncales de alta capacidad y baja latencia.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/9767f994-ai-generated-1781790820504.png',
      imageAlt: 'Conectores de fibra óptica con hilos luminosos',
    },
    {
      number: '04',
      title: 'WiFi corporativo',
      description: 'Relevamiento de cobertura, controladoras, roaming y redes separadas por uso.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/4eb08d1a-ai-generated-1781790829128.png',
      imageAlt: 'Access point WiFi empresarial montado en cielorraso',
    },
    {
      number: '05',
      title: 'Switching y routing',
      description: 'Conmutación gestionada, VLANs, QoS y ruteo para tráfico crítico y continuidad.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/ebf2dea8-ai-generated-1781790833997.png',
      imageAlt: 'Switches y router empresariales montados en rack con LEDs',
    },
    {
      number: '06',
      title: 'Documentación y certificación',
      description: 'Dossier por proyecto: diagramas, mediciones, etiquetado y evidencia técnica.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/ffb25574-ai-generated-1781790838183.png',
      imageAlt: 'Certificador de cableado mostrando resultado PASS sobre dossier técnico',
    },
  ],
  102: [
    {
      number: '01',
      title: 'Videovigilancia IP (CCTV)',
      description: 'Cámaras IP, grabación, analítica de video y verificación remota para cubrir perímetros y activos críticos.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/d319f77f-ai-generated-1781790891017.png',
      imageAlt: 'Cámara de videovigilancia IP profesional en primer plano',
    },
    {
      number: '02',
      title: 'Control de accesos',
      description: 'Lectores, credenciales, molinetes y registro de quién entra, cuándo y a qué zona.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/7e3cd73b-ai-generated-1781790894665.png',
      imageAlt: 'Lector de control de accesos con credencial RFID en puerta',
    },
    {
      number: '03',
      title: 'Detección de intrusión',
      description: 'Sensores perimetrales e interiores, paneles de alarma y protocolos de respuesta ante eventos.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/e5f3c9da-ai-generated-1781790893371.png',
      imageAlt: 'Sensor de movimiento PIR y teclado de alarma de intrusión',
    },
    {
      number: '04',
      title: 'Monitoreo y operación 24/7',
      description: 'Estación de monitoreo continuo, atención de incidentes y continuidad operativa en sitio.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/0363f585-ai-generated-1781790905608.png',
      imageAlt: 'Estación de monitoreo CCTV con joystick PTZ frente a muro de monitores',
    },
    {
      number: '05',
      title: 'Detección de incendios',
      description: 'Ingeniería, paneles, sensores y alarmas integradas para proteger activos y personas.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/250695f3-ai-generated-1781790904600.png',
      imageAlt: 'Detector de humo y avisador de incendio en primer plano',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: alcance, protocolo, responsables y evidencia técnica para auditoría o licitación.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/ff6df555-ai-generated-1781790907125.png',
      imageAlt: 'Dossier de seguridad con planos CCTV y tablet mostrando cámaras',
    },
  ],
  103: [
    {
      number: '01',
      title: 'Radioenlaces y vínculos',
      description: 'Enlaces punto a punto y multipunto para conectar sedes, plantas y sitios remotos.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/cfa4e82e-ai-generated-1781789280675.png',
      imageAlt: 'Antenas de radioenlace de microondas montadas en torre de telecomunicaciones al atardecer',
    },
    {
      number: '02',
      title: 'Telefonía IP (VoIP)',
      description: 'Centrales, troncales SIP, planes de numeración y movilidad para equipos distribuidos.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/f7abd3b0-ai-generated-1781789284197.png',
      imageAlt: 'Teléfono IP y gateway de telefonía SIP en sala de equipos',
    },
    {
      number: '03',
      title: 'Conectividad e internet',
      description: 'Vínculos dedicados, redundancia de enlaces y balanceo para continuidad operativa.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/0e52972c-ai-generated-1781789286002.png',
      imageAlt: 'Panel de fibra óptica con enlaces redundantes y conectividad en sala de red',
    },
    {
      number: '04',
      title: 'Infraestructura de sitio',
      description: 'Torres, mástiles, energía y acometidas para puntos de telecomunicación críticos.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/5d6e14a6-ai-generated-1781789307371.png',
      imageAlt: 'Base de torre de telecomunicaciones con gabinetes de energía en sitio remoto',
    },
    {
      number: '05',
      title: 'Integración y gestión',
      description: 'Interconexión con redes existentes, segmentación y QoS para tráfico prioritario.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/1752ae26-ai-generated-1781789311306.png',
      imageAlt: 'Técnico gestionando tráfico y QoS de red en estación de operaciones',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: enlaces, mediciones de señal, responsables y trazabilidad.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/4d90c1ed-ai-generated-1781789313927.png',
      imageAlt: 'Dossier técnico de telecomunicaciones con mediciones de señal y tablet',
    },
  ],
  104: [
    {
      number: '01',
      title: 'Aplicaciones a medida',
      description: 'Sistemas web y de gestión diseñados sobre el proceso real de cada operación.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/af4d1184-ai-generated-1781790967471.png',
      imageAlt: 'Laptop mostrando una aplicación de gestión web a medida',
    },
    {
      number: '02',
      title: 'Integraciones',
      description: 'Conexión entre sistemas, equipos en sitio, sensores y plataformas existentes.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/9e98f59f-ai-generated-1781790967009.png',
      imageAlt: 'Monitor mostrando un diagrama de integración entre sistemas y APIs',
    },
    {
      number: '03',
      title: 'Portales y backoffice',
      description: 'Paneles, reportería y flujos para administrar operación, evidencia y usuarios.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/1787e4ce-ai-generated-1781790968832.png',
      imageAlt: 'Monitor mostrando un panel de administración backoffice',
    },
    {
      number: '04',
      title: 'Automatización',
      description: 'Tareas, alertas y procesos automáticos para reducir trabajo manual y errores.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/9f2dd251-ai-generated-1781790978194.png',
      imageAlt: 'Monitor mostrando un constructor de flujos de automatización',
    },
    {
      number: '05',
      title: 'Datos y trazabilidad',
      description: 'Registro, auditoría y tableros para decisiones basadas en evidencia.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/6fd5df1d-ai-generated-1781790977806.png',
      imageAlt: 'Monitor mostrando un tablero de analítica y auditoría',
    },
    {
      number: '06',
      title: 'Mantenimiento evolutivo',
      description: 'Soporte, mejoras y nuevas funciones para que el software acompañe la operación.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/d1524519-ai-generated-1781790980410.png',
      imageAlt: 'Laptop con editor de código fuente en desarrollo',
    },
  ],
  105: [
    {
      number: '01',
      title: 'Mesa de ayuda',
      description: 'Atención de incidentes, tickets y seguimiento para usuarios y operaciones.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/b6ad1321-ai-generated-1781791038314.png',
      imageAlt: 'Headset de mesa de ayuda junto a monitor con tablero de tickets',
    },
    {
      number: '02',
      title: 'Soporte en sitio',
      description: 'Técnicos que se presentan donde está el problema, en Cuyo y Patagonia.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/4bacd5d7-ai-generated-1781791038748.png',
      imageAlt: 'Maletín de herramientas de técnico de campo con laptop y tester',
    },
    {
      number: '03',
      title: 'Monitoreo continuo',
      description: 'Vigilancia de red, equipos y servicios para anticipar fallas antes del impacto.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/ce00fdfb-ai-generated-1781791039646.png',
      imageAlt: 'Pantallas de monitoreo continuo con estado de red y uptime',
    },
    {
      number: '04',
      title: 'Mantenimiento preventivo',
      description: 'Rutinas programadas para sostener disponibilidad y extender vida útil.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/92bd0682-ai-generated-1781791082900.png',
      imageAlt: 'Manos de técnico realizando mantenimiento en rack de servidores',
    },
    {
      number: '05',
      title: 'Acuerdos de servicio (SLA)',
      description: 'Tiempos de respuesta y resolución comprometidos por escrito.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/bf2b52b0-ai-generated-1781791082485.png',
      imageAlt: 'Documento de acuerdo de nivel de servicio SLA firmado',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Registro de incidentes, intervenciones y resultados para auditoría y mejora.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/8e20575b-ai-generated-1781791051074.png',
      imageAlt: 'Tablet con registro de incidentes junto a planillas de mantenimiento',
    },
  ],
  106: [
    {
      number: '01',
      title: 'Diagnóstico de infraestructura',
      description: 'Relevamiento del estado real de red, seguridad, energía y sistemas.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/f95b77d5-ai-generated-1781791134827.png',
      imageAlt: 'Tablet con checklist de diagnóstico de infraestructura junto a rack de red',
    },
    {
      number: '02',
      title: 'Arquitectura y diseño',
      description: 'Definición técnica de soluciones acorde a la operación y el presupuesto.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/d32ec6d1-ai-generated-1781791135929.png',
      imageAlt: 'Laptop con diagrama de arquitectura de red sobre planos técnicos',
    },
    {
      number: '03',
      title: 'Roadmap e inversión',
      description: 'Plan por etapas con prioridades, riesgos y necesidades de inversión.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/a60c168c-ai-generated-1781791141074.png',
      imageAlt: 'Plan de roadmap e inversión IT impreso con fases y línea de tiempo',
    },
    {
      number: '04',
      title: 'Pliegos y licitaciones',
      description: 'Especificaciones técnicas y soporte documental para procesos formales.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/56b99a8d-ai-generated-1781791176952.png',
      imageAlt: 'Dossier de especificaciones técnicas con secciones y sello de validación',
    },
    {
      number: '05',
      title: 'Continuidad y riesgo',
      description: 'Análisis de puntos críticos, redundancia y planes de contingencia.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/e33ffc45-ai-generated-1781791146847.png',
      imageAlt: 'Monitor con tablero de análisis de riesgo y matriz de contingencia',
    },
    {
      number: '06',
      title: 'Acompañamiento de proyecto',
      description: 'Dirección técnica y control durante la ejecución, con evidencia.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/00b8d12a-ai-generated-1781791151763.png',
      imageAlt: 'Casco de ingeniería sobre planos técnicos enrollados',
    },
  ],
  107: [
    {
      number: '01',
      title: 'Ingeniería y diseño',
      description: 'Proyecto de detección según normativa, riesgo y características del sitio.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/8a7bff1e-ai-generated-1781791231291.png',
      imageAlt: 'Planos de ingeniería de detección de incendios con zonificación',
    },
    {
      number: '02',
      title: 'Paneles y centrales',
      description: 'Centrales de incendio, zonificación y lógica de alarma para cada instalación.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/64c5d967-ai-generated-1781791230027.png',
      imageAlt: 'Central de alarma de incendios roja con indicadores de zona',
    },
    {
      number: '03',
      title: 'Sensores y detectores',
      description: 'Detección de humo, temperatura y llama distribuida según el área protegida.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/cf10ca1a-ai-generated-1781791233792.png',
      imageAlt: 'Detectores de humo, temperatura y llama en fila',
    },
    {
      number: '04',
      title: 'Alarma y notificación',
      description: 'Avisadores, sirenas e integración con monitoreo para respuesta inmediata.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/ca1d4e74-ai-generated-1781791242575.png',
      imageAlt: 'Avisador de incendio rojo con luz estroboscópica en pared',
    },
    {
      number: '05',
      title: 'Integración y monitoreo',
      description: 'Conexión con seguridad electrónica, accesos y estación de monitoreo 24/7.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/d0fec213-ai-generated-1781791242881.png',
      imageAlt: 'Estación de monitoreo de incendios con estado de zonas y seguridad integrada',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: planos, pruebas, mantenimiento y trazabilidad.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/766ee2f2-ai-generated-1781791246321.png',
      imageAlt: 'Dossier de protección contra incendios con certificados y planos',
    },
  ],
  108: [
    {
      number: '01',
      title: 'Energía ininterrumpida (UPS)',
      description: 'Respaldo, autonomía y protección eléctrica para equipos que no pueden apagarse.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/9954c7ae-ai-generated-1781791300405.png',
      imageAlt: 'UPS montado en rack con display de estado de batería y carga',
    },
    {
      number: '02',
      title: 'Tableros y distribución',
      description: 'Tableros, protecciones y distribución dedicada para cargas críticas de IT.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/ce35c182-ai-generated-1781791301821.png',
      imageAlt: 'Tablero eléctrico con interruptores y circuitos etiquetados',
    },
    {
      number: '03',
      title: 'Tendido eléctrico',
      description: 'Canalizaciones, acometidas y circuitos para racks, datacenter y sitios técnicos.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/621314f6-ai-generated-1781791305714.png',
      imageAlt: 'Canalizaciones y cableado eléctrico hacia un rack técnico',
    },
    {
      number: '04',
      title: 'Puesta a tierra',
      description: 'Sistemas de tierra y protección contra sobretensiones para equipos sensibles.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/dfe49e83-ai-generated-1781791317761.png',
      imageAlt: 'Barra de puesta a tierra de cobre con conexiones y protección contra sobretensiones',
    },
    {
      number: '05',
      title: 'Respaldo y continuidad',
      description: 'Grupos electrógenos, transferencia y esquemas de redundancia energética.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/7a470db0-ai-generated-1781791315725.png',
      imageAlt: 'Grupo electrógeno industrial junto a tablero de transferencia automática',
    },
    {
      number: '06',
      title: 'Documentación y evidencia',
      description: 'Dossier por proyecto: unifilares, mediciones, mantenimiento y trazabilidad.',
      image: 'https://storage.googleapis.com/ployai/d4da483b-5503-417b-b1d2-011899258577/user/e411de55-ai-generated-1781791317361.png',
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
    { number: '02', title: 'Diseño funcional', description: 'Definimos flujos, datos e integraciones sobre el proceso real, no genérico.' },
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
