/**
 * SERVICIOS COMPLETOS V4 - Datos EXACTOS de producción
 * Extraídos de https://ultimamilla.com.ar/servicios
 */

const PROD_URL = 'https://www.ultimamilla.com.ar';

// Helper para URLs de imágenes
const prodAsset = (uuid) => `${PROD_URL}/directus-assets/${uuid}`;
const prodImage = (path) => `${PROD_URL}${path}`;

export const serviciosCompletos = {
  // ==========================================
  // ID 101: INFRAESTRUCTURA DE REDES
  // ==========================================
  101: {
    id: 101,
    Titulo: "Infraestructura de Redes",
    Subtitulo: "Cableado, Fibra Óptica, Radioenlaces",
    Descripcion: "Diseño e implementación de infraestructura de redes de datos en Mendoza, San Juan, San Luis y Cuyo. Soluciones completas: cableado estructurado Cat 6/6A/7, fibra óptica, radioenlaces, LAN/WAN, data centers. +94 proyectos exitosos en minería, bodegas, constructoras, gobierno y salud. Certificación TIA/EIA. Garantía extendida.",
    Area: "Redes",
    Imagen: prodImage('/images/services/servicio-101-infraestructura.jpg'),
    Stats: [
      { value: '94+', label: 'Proyectos Completados' },
      { value: '22+', label: 'Años de Experiencia' },
      { value: '25', label: 'Años de Garantía' },
      { value: '24/7', label: 'Soporte Técnico' }
    ],
    Productos: [
      {
        titulo: "Fibra Óptica de Alta Capacidad",
        descripcion: "Olvídese de los cuellos de botella. Con nuestra instalación certificada de fibra óptica, sus datos viajan a la velocidad de la luz. Ideal para interconectar edificios, data centers o llevar conectividad donde el cobre no alcanza.",
        imagen: prodImage('/images/services/productos/infraestructura/1.1.png'),
        features: ['Velocidades de hasta 100 Gbps', 'Inmune a interferencias electromagnéticas', 'Distancias de hasta 80 km sin repetidores'],
        destacado: 'Instalamos enlaces de fibra óptica monomodo y multimodo con fusiones certificadas, mediciones OTDR y garantía de 25 años.'
      },
      {
        titulo: "Centro de Distribución de Red",
        descripcion: "Un patch panel bien instalado es la diferencia entre encontrar un problema en minutos o en horas. Centralizamos todas sus conexiones en un punto de gestión profesional que facilita el mantenimiento, las expansiones y el troubleshooting.",
        imagen: prodImage('/images/services/productos/infraestructura/1.2.png'),
        features: ['Identifique cualquier punto en segundos', 'Agregue conexiones sin rediseñar', 'Blindaje contra interferencias Cat6A'],
        destacado: 'Instalamos racks completos con patch panels certificados, organizadores verticales, etiquetado profesional y documentación de cada puerto.'
      },
      {
        titulo: "Cableado Estructurado Certificado",
        descripcion: "No instalamos cables, construimos infraestructura. Cada punto que instalamos viene con su certificación Fluke individual. Usted recibe un informe con los valores de medición de cada conexión.",
        imagen: prodImage('/images/services/productos/infraestructura/1.3.png'),
        features: ['Certificación individual Fluke', 'Garantía de 25 años', 'Cumplimiento TIA/EIA-568-C'],
        destacado: 'Diseñamos e instalamos redes de cableado estructurado Cat5e, Cat6 y Cat6A con certificación punto por punto y garantía del fabricante de 25 años.'
      },
      {
        titulo: "Switching de Alto Rendimiento",
        descripcion: "Su red necesita un cerebro que tome decisiones en microsegundos. Implementamos equipos de switching empresarial con redundancia, gestión remota y la capacidad de crecer con su organización.",
        imagen: prodImage('/images/services/productos/infraestructura/1.4.png'),
        features: ['Cero downtime con redundancia', 'Gestión remota segura', 'Arquitectura modular escalable'],
        destacado: 'Configuramos y mantenemos su infraestructura de switching con VLANs, QoS, redundancia y monitoreo 24/7.'
      },
      {
        titulo: "Data Center Llave en Mano",
        descripcion: "Desde el piso técnico hasta el último cable, diseñamos e instalamos cuartos de comunicaciones que cumplen estándares internacionales. Climatización, energía redundante, control de acceso y monitoreo ambiental integrados.",
        imagen: prodImage('/images/services/productos/infraestructura/1.5.png'),
        features: ['Diseño térmico optimizado', 'Acceso y mantenimiento simplificado', 'Cumplimiento TIA-942'],
        destacado: 'Construimos data centers y cuartos de comunicaciones completos: obra civil, climatización, energía, racks, cableado y seguridad.'
      },
      {
        titulo: "Radioenlaces Punto a Punto",
        descripcion: "Cuando el cable no es opción, el aire es el camino. Diseñamos e instalamos radioenlaces de alta capacidad para unir edificios, sucursales o sitios remotos.",
        imagen: prodImage('/images/services/productos/infraestructura/1.6.png'),
        features: ['Distancias de hasta 50 km', 'Velocidades de hasta 1 Gbps', '99.99% de disponibilidad'],
        destacado: 'Implementamos radioenlaces profesionales con estudio de factibilidad, trámites regulatorios, instalación y mantenimiento con SLA.'
      },
      {
        titulo: "Certificación Profesional de Red",
        descripcion: "No confíe en 'funciona bien'. Exija la prueba. Con nuestro equipamiento Fluke de última generación, cada punto de red recibe su certificación individual con valores de medición reales.",
        imagen: prodImage('/images/services/productos/infraestructura/1.7.png'),
        features: ['Reporte PDF por cada punto', 'Válido para garantías 25 años', 'Detecta fallas ocultas'],
        destacado: 'Certificamos instalaciones nuevas y existentes con equipos Fluke DSX. Emitimos reportes PDF individuales válidos para auditorías.'
      },
      {
        titulo: "Gestión Profesional de Fibra Óptica",
        descripcion: "La fibra óptica es delicada y valiosa. La organizamos con precisión quirúrgica: fusiones protegidas, identificación clara por código de colores, y acceso pensado para mantenimiento sin riesgo.",
        imagen: prodImage('/images/services/productos/infraestructura/1.8.png'),
        features: ['Fusiones con pérdida < 0.1 dB', 'Expansión sin interrumpir servicio', 'Identificación por código de colores'],
        destacado: 'Instalamos ODFs y realizamos fusiones certificadas con empalmadora de precisión. Medición OTDR de cada hilo y documentación completa.'
      }
    ],
    Marcas: ['Furukawa', 'Commscope', 'Panduit', 'Fluke', 'Cisco', 'Ubiquiti'],
    PorQueElegirnos: [
      'Certificación Fluke de cada punto instalado',
      'Garantía extendida de 25 años en cableado',
      'Cumplimiento normas TIA/EIA-568 y ISO/IEC 11801'
    ]
  },

  // ==========================================
  // ID 102: SEGURIDAD ELECTRÓNICA
  // ==========================================
  102: {
    id: 102,
    Titulo: "Sistemas de Seguridad Electrónica",
    Subtitulo: "CCTV, Control de Acceso, Detección de Incendios",
    Descripcion: "Proteja su empresa con sistemas de seguridad electrónica de última generación. CCTV con analítica de video, control de acceso biométrico, alarmas de intrusión y sistemas de detección de incendios. Integración con sistemas de edificios inteligentes (BMS). Monitoreo 24/7.",
    Area: "Seguridad",
    Imagen: prodImage('/images/services/servicio-102-seguridad.jpg'),
    Stats: [
      { value: '300+', label: 'Instalaciones Activas' },
      { value: '22+', label: 'Años de Experiencia' },
      { value: '24/7', label: 'Monitoreo Disponible' },
      { value: '< 15min', label: 'Tiempo de Respuesta' }
    ],
    Productos: [
      {
        titulo: "Videovigilancia IP Profesional",
        descripcion: "Sistemas CCTV de alta resolución con analítica de video inteligente. Monitoreo remoto desde cualquier dispositivo, grabación en la nube y detección de eventos automática.",
        imagen: prodImage('/images/services/productos/seguridad/2.1.png'),
        features: ['Cámaras 4K/8MP con IR', 'Analítica de video AI', 'Almacenamiento híbrido'],
        destacado: 'Diseñamos e instalamos sistemas de videovigilancia IP con cámaras de última generación, NVRs y software de gestión centralizada.'
      },
      {
        titulo: "Control de Acceso Biométrico",
        descripcion: "Controle quién entra y sale de sus instalaciones con precisión. Lectores biométricos, tarjetas RFID, reconocimiento facial. Integración con sistemas de RRHH para gestión de asistencia.",
        imagen: prodImage('/images/services/productos/seguridad/2.2.png'),
        features: ['Reconocimiento facial sin contacto', 'Integración con RRHH', 'Anti-passback y zonas'],
        destacado: 'Implementamos sistemas de control de acceso escalables con gestión centralizada y reportes de asistencia.'
      },
      {
        titulo: "Detección de Intrusión",
        descripcion: "Protección perimetral e interior con sensores de movimiento, contactos magnéticos, barreras infrarrojas y cercos eléctricos. Monitoreo profesional opcional.",
        imagen: prodImage('/images/services/productos/seguridad/2.3.png'),
        features: ['Sensores perimetrales', 'Integración con CCTV', 'Notificaciones en tiempo real'],
        destacado: 'Instalamos sistemas de alarma con central monitoreada, sensores de última generación y respuesta inmediata.'
      },
      {
        titulo: "Detección de Incendios",
        descripcion: "Sistemas de detección temprana de incendios certificados según normas NFPA. Detectores de humo, calor, llama. Centrales analógicas y convencionales.",
        imagen: prodImage('/images/services/productos/seguridad/2.4.png'),
        features: ['Certificación NFPA', 'Detectores analógicos', 'Integración con evacuación'],
        destacado: 'Diseñamos e instalamos sistemas de detección de incendios con certificación y mantenimiento preventivo.'
      },
      {
        titulo: "Integración de Sistemas",
        descripcion: "Unifique todos sus sistemas de seguridad en una sola plataforma. CCTV, accesos, alarmas e incendios trabajando juntos con automatizaciones inteligentes.",
        imagen: prodImage('/images/services/productos/seguridad/2.5.png'),
        features: ['Plataforma unificada', 'Automatizaciones', 'Dashboard centralizado'],
        destacado: 'Integramos todos sus sistemas de seguridad para una gestión eficiente desde un solo punto de control.'
      },
      {
        titulo: "Centro de Monitoreo",
        descripcion: "Supervisión profesional 24/7 de todos sus sistemas. Operadores capacitados, protocolos de respuesta y coordinación con fuerzas de seguridad.",
        imagen: prodImage('/images/services/productos/seguridad/2.6.png'),
        features: ['Monitoreo 24/7', 'Protocolos de respuesta', 'Reportes mensuales'],
        destacado: 'Monitoreamos sus instalaciones las 24 horas con personal especializado y protocolos de actuación definidos.'
      },
      {
        titulo: "Control de Rondas",
        descripcion: "Verifique que su personal de seguridad cumpla con las rondas establecidas. Puntos de control NFC, reportes automáticos y alertas de incumplimiento.",
        imagen: prodImage('/images/services/productos/seguridad/2.8.png'),
        features: ['Puntos NFC', 'Reportes automáticos', 'App móvil'],
        destacado: 'Implementamos sistemas de control de rondas con tecnología NFC y reportes en tiempo real.'
      }
    ],
    Marcas: ['Hikvision', 'Dahua', 'ZKTeco', 'DSC', 'Bosch', 'Honeywell'],
    PorQueElegirnos: [
      'Instaladores certificados por fabricantes',
      'Centro de monitoreo propio 24/7',
      'Integración total de sistemas'
    ]
  },

  // ==========================================
  // ID 103: TELECOMUNICACIONES
  // ==========================================
  103: {
    id: 103,
    Titulo: "Telecomunicaciones",
    Subtitulo: "Datos, Voz, Video",
    Descripcion: "Soluciones de telecomunicaciones empresariales: telefonía IP, videoconferencia, comunicaciones unificadas. Reduzca costos y mejore la productividad con tecnología de última generación.",
    Area: "Telecomunicaciones",
    Imagen: prodImage('/images/services/servicio-103-telecomunicaciones.jpg'),
    Stats: [
      { value: '5000+', label: 'Internos Instalados' },
      { value: '22+', label: 'Años de Experiencia' },
      { value: '50%', label: 'Ahorro Promedio' },
      { value: '99.9%', label: 'Disponibilidad' }
    ],
    Productos: [
      {
        titulo: "Telefonía IP Empresarial",
        descripcion: "Centrales telefónicas IP con funcionalidades avanzadas. IVR, colas de llamadas, grabación, reportes. On-premise o en la nube.",
        imagen: prodImage('/images/services/productos/telecomunicaciones/3.1.png'),
        features: ['IVR multinivel', 'Grabación de llamadas', 'Integración con CRM'],
        destacado: 'Implementamos centrales IP con todas las funcionalidades empresariales y soporte local.'
      },
      {
        titulo: "Comunicaciones Unificadas",
        descripcion: "Integre voz, video, chat y presencia en una sola plataforma. Trabaje desde cualquier lugar con la misma experiencia.",
        imagen: prodImage('/images/services/productos/telecomunicaciones/3.2.png'),
        features: ['Voz, video y chat', 'Movilidad total', 'Integración Office 365'],
        destacado: 'Desplegamos soluciones de comunicaciones unificadas con Microsoft Teams, Cisco Webex o 3CX.'
      },
      {
        titulo: "Videoconferencia Profesional",
        descripcion: "Salas de videoconferencia equipadas con tecnología de punta. Audio y video de alta calidad para reuniones productivas.",
        imagen: prodImage('/images/services/productos/telecomunicaciones/3.3.png'),
        features: ['Video 4K', 'Audio de alta fidelidad', 'Pizarra digital'],
        destacado: 'Diseñamos e instalamos salas de videoconferencia con equipamiento profesional y acústica optimizada.'
      },
      {
        titulo: "Contact Center",
        descripcion: "Plataformas de atención al cliente omnicanal. Gestione llamadas, chat, email y redes sociales desde una sola interfaz.",
        imagen: prodImage('/images/services/productos/telecomunicaciones/3.4.png'),
        features: ['Omnicanal', 'Reportes avanzados', 'Integración CRM'],
        destacado: 'Implementamos contact centers con todas las herramientas para una atención al cliente excepcional.'
      },
      {
        titulo: "Troncales SIP",
        descripcion: "Conectividad telefónica por internet con calidad garantizada. Reduzca costos de telefonía hasta un 70%.",
        imagen: prodImage('/images/services/productos/telecomunicaciones/3.5.png'),
        features: ['Ahorro hasta 70%', 'Calidad HD', 'Redundancia'],
        destacado: 'Proveemos troncales SIP con QoS garantizado y portabilidad numérica.'
      },
      {
        titulo: "Redes WiFi Empresariales",
        descripcion: "Cobertura WiFi de alta densidad para oficinas, hoteles, hospitales. Gestión centralizada y seguridad avanzada.",
        imagen: prodImage('/images/services/productos/telecomunicaciones/3.6.png'),
        features: ['WiFi 6', 'Gestión cloud', 'Seguridad WPA3'],
        destacado: 'Diseñamos e instalamos redes WiFi empresariales con cobertura total y gestión centralizada.'
      }
    ],
    Marcas: ['Cisco', '3CX', 'Grandstream', 'Yealink', 'Ubiquiti', 'Microsoft Teams'],
    PorQueElegirnos: [
      'Reducción de hasta 70% en costos de telefonía',
      'Migración sin interrupciones',
      'Soporte técnico especializado en VoIP'
    ]
  },

  // ==========================================
  // ID 104: DESARROLLO DE SOFTWARE
  // ==========================================
  104: {
    id: 104,
    Titulo: "Desarrollo de Software a Medida",
    Subtitulo: "Web, Mobile, ERP",
    Descripcion: "Desarrollamos software a medida que se adapta 100% a sus procesos de negocio. Aplicaciones web, móviles, sistemas ERP/CRM, automatización de procesos e integración de sistemas. Código fuente de su propiedad, metodologías ágiles y equipo de desarrollo local.",
    Area: "Software",
    Imagen: prodImage('/images/services/servicio-104-software.jpg'),
    Stats: [
      { value: '50+', label: 'Proyectos Entregados' },
      { value: '10+', label: 'Años en Desarrollo' },
      { value: '100%', label: 'Código Propio' },
      { value: 'Ágil', label: 'Metodología' }
    ],
    Productos: [
      {
        titulo: "Desarrollo Web Full Stack",
        descripcion: "Desde landing pages hasta aplicaciones empresariales complejas. Desarrollamos con las tecnologías más modernas: React, Vue, Node.js, Python.",
        imagen: prodImage('/images/services/productos/software/4.1.png'),
        features: ['Diseño responsive', 'APIs REST/GraphQL', 'Despliegue en la nube'],
        destacado: 'Desarrollamos aplicaciones web a medida con tecnologías modernas. UX/UI, desarrollo, testing y deployment incluidos.'
      },
      {
        titulo: "Aplicaciones Móviles",
        descripcion: "Apps nativas e híbridas para iOS y Android. Desde apps de productividad interna hasta aplicaciones de cara al cliente.",
        imagen: prodImage('/images/services/productos/software/4.2.png'),
        features: ['iOS y Android', 'Notificaciones push', 'Modo offline'],
        destacado: 'Desarrollamos apps móviles con Flutter, React Native o desarrollo nativo. Publicación en stores incluida.'
      },
      {
        titulo: "Sistemas ERP/CRM",
        descripcion: "Software de gestión empresarial a la medida de su operación. Ventas, compras, inventario, contabilidad, RRHH integrados.",
        imagen: prodImage('/images/services/productos/software/4.3.png'),
        features: ['Módulos integrados', 'Reportes avanzados', 'Multi-sucursal'],
        destacado: 'Implementamos y personalizamos ERP/CRM sobre plataformas existentes o desarrollo 100% a medida.'
      },
      {
        titulo: "Automatización de Procesos",
        descripcion: "RPA y workflows para automatizar lo que no agrega valor. Desde ingreso de datos hasta aprobaciones complejas. ROI medible.",
        imagen: prodImage('/images/services/productos/software/4.4.png'),
        features: ['ROI medible', 'Integración multi-sistema', 'Monitoreo en tiempo real'],
        destacado: 'Implementamos automatizaciones con Power Automate, Zapier o desarrollo de bots a medida.'
      },
      {
        titulo: "Integración de Sistemas",
        descripcion: "¿Datos en silos? Desarrollamos APIs, middleware y conectores para integrar cualquier sistema: ERP, CRM, e-commerce, bancos.",
        imagen: prodImage('/images/services/productos/software/4.5.png'),
        features: ['APIs personalizadas', 'ETL de datos', 'Sincronización en tiempo real'],
        destacado: 'Desarrollamos integraciones mediante APIs, web services, ETL y conectores nativos.'
      },
      {
        titulo: "Business Intelligence",
        descripcion: "Dashboards y reportes que muestran lo que realmente importa. KPIs en tiempo real, alertas automáticas, análisis profundo.",
        imagen: prodImage('/images/services/productos/software/4.6.png'),
        features: ['Dashboards interactivos', 'KPIs en tiempo real', 'Alertas automáticas'],
        destacado: 'Implementamos soluciones BI con Power BI, Tableau o desarrollo propio.'
      }
    ],
    Marcas: ['React', 'Vue', 'Node.js', 'Python', 'Flutter', 'AWS', 'Azure', 'Power BI'],
    PorQueElegirnos: [
      'Equipo de desarrollo propio en Argentina',
      'Metodologías ágiles certificadas',
      'Código fuente 100% propiedad del cliente'
    ]
  },

  // ==========================================
  // ID 105: SOPORTE TÉCNICO
  // ==========================================
  105: {
    id: 105,
    Titulo: "Soporte Técnico 24/7",
    Subtitulo: "Mesa de Ayuda, Mantenimiento IT",
    Descripcion: "Soporte técnico profesional para mantener su infraestructura funcionando. Mesa de ayuda, mantenimiento preventivo y correctivo, monitoreo proactivo. SLAs definidos y tiempos de respuesta garantizados.",
    Area: "Soporte",
    Imagen: prodImage('/images/services/servicio-105-soporte.jpg'),
    Stats: [
      { value: '24/7', label: 'Disponibilidad' },
      { value: '< 4hs', label: 'Tiempo Respuesta' },
      { value: '98%', label: 'Resolución 1er Contacto' },
      { value: '500+', label: 'Tickets/Mes' }
    ],
    Productos: [
      {
        titulo: "Mesa de Ayuda IT",
        descripcion: "Soporte de primer y segundo nivel para usuarios. Atención telefónica, remota y presencial con tiempos de respuesta garantizados.",
        imagen: prodImage('/images/services/productos/soporte/5.1.png'),
        features: ['Soporte multinivel', 'Portal de tickets', 'Base de conocimiento'],
        destacado: 'Brindamos soporte técnico a usuarios con SLAs definidos y seguimiento de cada caso.'
      },
      {
        titulo: "Mantenimiento Preventivo",
        descripcion: "Evite fallas antes de que ocurran. Revisiones periódicas, actualizaciones, limpieza y optimización de equipos.",
        imagen: prodImage('/images/services/productos/soporte/5.2.png'),
        features: ['Revisiones programadas', 'Actualizaciones', 'Reportes mensuales'],
        destacado: 'Realizamos mantenimiento preventivo de servidores, redes, PCs y sistemas con cronograma definido.'
      },
      {
        titulo: "Monitoreo Proactivo",
        descripcion: "Supervisamos su infraestructura 24/7. Alertas tempranas, diagnóstico remoto y resolución antes de que impacte.",
        imagen: prodImage('/images/services/productos/soporte/5.3.png'),
        features: ['Monitoreo 24/7', 'Alertas automáticas', 'Dashboard en tiempo real'],
        destacado: 'Monitoreamos servidores, redes y servicios críticos con herramientas profesionales.'
      },
      {
        titulo: "Administración de Servidores",
        descripcion: "Gestión completa de sus servidores físicos y virtuales. Backups, seguridad, actualizaciones, optimización.",
        imagen: prodImage('/images/services/productos/soporte/5.4.png'),
        features: ['Windows y Linux', 'Backups automáticos', 'Hardening de seguridad'],
        destacado: 'Administramos sus servidores on-premise y en la nube con las mejores prácticas.'
      },
      {
        titulo: "Soporte VIP",
        descripcion: "Atención prioritaria para ejecutivos y áreas críticas. Técnico dedicado, respuesta inmediata, visitas programadas.",
        imagen: prodImage('/images/services/productos/soporte/5.5.png'),
        features: ['Respuesta inmediata', 'Técnico dedicado', 'Visitas programadas'],
        destacado: 'Servicio premium para usuarios que requieren atención prioritaria y personalizada.'
      }
    ],
    Marcas: ['Microsoft', 'VMware', 'Veeam', 'PRTG', 'Zabbix', 'ServiceNow'],
    PorQueElegirnos: [
      'SLAs garantizados por contrato',
      'Técnicos certificados Microsoft y Cisco',
      'Centro de soporte en Mendoza'
    ]
  },

  // ==========================================
  // ID 106: CONSULTORÍA IT
  // ==========================================
  106: {
    id: 106,
    Titulo: "Consultoría IT y Transformación Digital",
    Subtitulo: "Arquitectura, Auditoría",
    Descripcion: "Asesoramiento estratégico para optimizar su infraestructura tecnológica. Auditorías, diseño de arquitectura, planes de transformación digital y acompañamiento en la implementación.",
    Area: "Consultoría",
    Imagen: prodImage('/images/services/servicio-106-consultoria.jpg'),
    Stats: [
      { value: '100+', label: 'Proyectos Asesorados' },
      { value: '22+', label: 'Años de Experiencia' },
      { value: '40%', label: 'Ahorro Promedio' },
      { value: '95%', label: 'Clientes Satisfechos' }
    ],
    Productos: [
      {
        titulo: "Auditoría de Infraestructura",
        descripcion: "Evaluación completa de su infraestructura actual. Identificamos vulnerabilidades, ineficiencias y oportunidades de mejora.",
        imagen: prodImage('/images/services/productos/consultoria/6.1.png'),
        features: ['Análisis exhaustivo', 'Informe ejecutivo', 'Plan de acción'],
        destacado: 'Realizamos auditorías técnicas con metodología probada y entregamos roadmap de mejoras.'
      },
      {
        titulo: "Diseño de Arquitectura",
        descripcion: "Diseñamos la arquitectura tecnológica óptima para su negocio. Escalable, segura y alineada con sus objetivos.",
        imagen: prodImage('/images/services/productos/consultoria/6.2.png'),
        features: ['Diseño a medida', 'Documentación completa', 'Presupuesto detallado'],
        destacado: 'Creamos arquitecturas de referencia para redes, seguridad, cloud y aplicaciones.'
      },
      {
        titulo: "Plan de Transformación Digital",
        descripcion: "Hoja de ruta para modernizar su empresa. Priorizamos iniciativas, estimamos inversiones y medimos resultados.",
        imagen: prodImage('/images/services/productos/consultoria/6.3.png'),
        features: ['Roadmap ejecutivo', 'ROI proyectado', 'Quick wins'],
        destacado: 'Elaboramos planes de transformación digital con foco en resultados medibles.'
      },
      {
        titulo: "Optimización de Costos IT",
        descripcion: "Reduzca gastos sin perder capacidad. Analizamos contratos, licencias, infraestructura y procesos para encontrar ahorros.",
        imagen: prodImage('/images/services/productos/consultoria/6.4.png'),
        features: ['Análisis de gastos', 'Renegociación de contratos', 'Consolidación'],
        destacado: 'Identificamos oportunidades de ahorro en licencias, servicios y operaciones IT.'
      },
      {
        titulo: "Acompañamiento en Proyectos",
        descripcion: "Project management y supervisión técnica de proyectos IT. Aseguramos que se cumplan alcance, tiempo y presupuesto.",
        imagen: prodImage('/images/services/productos/consultoria/6.5.png'),
        features: ['PMO especializado', 'Control de calidad', 'Gestión de riesgos'],
        destacado: 'Lideramos o supervisamos proyectos IT con metodología PMI y herramientas profesionales.'
      }
    ],
    Marcas: ['Microsoft', 'AWS', 'Google Cloud', 'VMware', 'Cisco', 'Fortinet'],
    PorQueElegirnos: [
      'Consultores con +15 años de experiencia',
      'Metodologías probadas (ITIL, COBIT)',
      'Enfoque en resultados medibles'
    ]
  },

  // ==========================================
  // ID 107: DETECCIÓN DE INCENDIOS
  // ==========================================
  107: {
    id: 107,
    Titulo: "Sistemas de Detección y Alarma de Incendios",
    Subtitulo: "Protección activa contra incendios",
    Descripcion: "Diseño, instalación y mantenimiento de sistemas de detección y alarma de incendios certificados según IRAM 3517 y NFPA 72. Protección integral para edificios comerciales, industriales, hospitalarios y gubernamentales en Mendoza y Cuyo. Centrales inteligentes, detectores fotoeléctricos y térmicos, sistemas de extinción automática.",
    Area: "Seguridad",
    Imagen: prodImage('/images/services/servicio-107-incendios.jpg'),
    Stats: [
      { value: '50+', label: 'Instalaciones Activas' },
      { value: 'IRAM', label: 'Certificación' },
      { value: '24/7', label: 'Monitoreo' },
      { value: '100%', label: 'Uptime' }
    ],
    Productos: [
      {
        titulo: "Centrales de Detección Inteligentes",
        descripcion: "Centrales direccionables de última generación con capacidad de monitoreo en tiempo real, integración con sistemas BMS y notificaciones automáticas a bomberos y personal de seguridad.",
        imagen: prodImage('/images/services/productos/incendios/7.1.png'),
        features: ['Hasta 1000 puntos direccionables', 'Protocolo abierto BACnet/Modbus', 'Redundancia de CPU y fuentes'],
        destacado: 'Instalación y puesta en marcha de centrales Honeywell, Notifier y Edwards con certificación IRAM 3517.'
      },
      {
        titulo: "Detectores de Humo Fotoeléctricos",
        descripcion: "Detectores de humo de tecnología fotoeléctrica con algoritmo inteligente que reduce falsas alarmas. Ideales para oficinas, hospitales, hoteles y centros comerciales.",
        imagen: prodImage('/images/services/productos/incendios/7.2.png'),
        features: ['Autocompensación de sensibilidad', 'Identificación única por dirección', 'Test remoto desde central'],
        destacado: 'Provisión e instalación de detectores con lazo analógico direccionable según NFPA 72.'
      },
      {
        titulo: "Detectores de Temperatura",
        descripcion: "Detectores térmicos fijos y termovelocimétricos certificados para zonas donde el humo genera falsas alarmas: cocinas industriales, talleres, depósitos con polvo.",
        imagen: prodImage('/images/services/productos/incendios/7.3.png'),
        features: ['Rango -30°C a +150°C', 'Velocidad de incremento ajustable', 'Resistente a ambientes corrosivos'],
        destacado: 'Selección técnica e instalación según riesgo y tipo de actividad conforme IRAM 3501.'
      },
      {
        titulo: "Pulsadores Manuales de Alarma",
        descripcion: "Estaciones manuales de alarma con protección antivandalismo, diseño ergonómico y alta visibilidad. Direccionables e identificables desde la central.",
        imagen: prodImage('/images/services/productos/incendios/7.4.png'),
        features: ['Vidrio rompible de seguridad', 'LED de indicación de estado', 'Reset remoto desde central'],
        destacado: 'Instalación estratégica en rutas de evacuación a menos de 30 metros según normativa vigente.'
      },
      {
        titulo: "Sirenas y Balizas Estroboscópicas",
        descripcion: "Dispositivos de notificación audiovisual con potencia regulable, tonos configurables y sincronización de destellos. Cumple accesibilidad ADA para personas con discapacidad auditiva.",
        imagen: prodImage('/images/services/productos/incendios/7.5.png'),
        features: ['Potencia hasta 110 dB a 1 metro', '15 tonos programables', 'Sincronización de flash temporal'],
        destacado: 'Cálculo de cobertura acústica y lumínica según normas NFPA 72 y ADA.'
      },
      {
        titulo: "Módulos de Control y Supervisión",
        descripcion: "Módulos entrada/salida para comandar válvulas de diluvio, compuertas cortafuego, extractores de humo, corte de energía y sistemas de extinción automática (sprinklers, gas, espuma).",
        imagen: prodImage('/images/services/productos/incendios/7.6.png'),
        features: ['Salidas supervisadas 24V/2A', 'Entradas monitoreadas EOL', 'Aislamiento de lazo incorporado'],
        destacado: 'Configuración e integración con equipos de extinción y sistemas de gestión edilicia.'
      },
      {
        titulo: "Detectores Especiales VESDA",
        descripcion: "Sistemas de detección por aspiración de humo VESDA (Very Early Smoke Detection Apparatus) para ambientes críticos: CPD, salas eléctricas, archivos, museos. Detecta antes que sistemas convencionales.",
        imagen: prodImage('/images/services/productos/incendios/7.7.png'),
        features: ['Detección hasta 100x más rápida', 'Cobertura hasta 2000 m² por unidad', '4 niveles de alarma configurables'],
        destacado: 'Diseño de red de tuberías, cálculo de caudal y configuración de umbrales según riesgo.'
      },
      {
        titulo: "Software de Gestión y Reportes",
        descripcion: "Plataforma de gestión centralizada para múltiples edificios con visualización de planos, históricos de eventos, generación de reportes automáticos y cumplimiento normativo.",
        imagen: prodImage('/images/services/productos/incendios/7.8.png'),
        features: ['Visualización de planos CAD/BIM', 'Reportes automáticos mensuales', 'Integración con sistemas CCTV/control accesos'],
        destacado: 'Implementación de servidor dedicado, configuración de usuarios y capacitación al personal.'
      }
    ],
    Marcas: ['Honeywell', 'Notifier', 'Edwards', 'Xtralis VESDA', 'Hochiki', 'Apollo'],
    PorQueElegirnos: [
      'Certificación IRAM 3517 y NFPA 72',
      'Más de 50 instalaciones activas en Cuyo',
      'Mantenimiento preventivo programado',
      'Respuesta de emergencia 24/7'
    ]
  },

  // ==========================================
  // ID 108: SERVICIOS ELÉCTRICOS
  // ==========================================
  108: {
    id: 108,
    Titulo: "Servicios Eléctricos para IT",
    Subtitulo: "Energía confiable para infraestructura crítica",
    Descripcion: "Instalaciones eléctricas especializadas para infraestructura IT: tableros, puesta a tierra, UPS, grupos electrógenos, energía solar, corrección de factor de potencia. Certificación AEA 90364. Termografía y análisis de calidad de energía. Protección de equipos críticos en data centers, hospitales, industria y comercio.",
    Area: "Infraestructura",
    Imagen: prodImage('/images/services/servicio-108-electricos.jpg'),
    Stats: [
      { value: '80+', label: 'Instalaciones' },
      { value: 'AEA', label: 'Certificación' },
      { value: '<5Ω', label: 'Resistencia PAT' },
      { value: '99.9%', label: 'Disponibilidad' }
    ],
    Productos: [
      {
        titulo: "Tableros Eléctricos Principales",
        descripcion: "Tableros eléctricos fabricados según normas IEC 61439 con barrajes de cobre electrolítico, interruptores termomagnéticos de marca premium y gabinetes metálicos con tratamiento anticorrosivo.",
        imagen: prodImage('/images/services/productos/electricos/8.1.png'),
        features: ['Capacidad hasta 4000A', 'Grado de protección IP54/IP65', 'Certificación de cortocircuito 50kA'],
        destacado: 'Diseño, fabricación, montaje y puesta en servicio con protocolo de mediciones y ensayos.'
      },
      {
        titulo: "Sistemas de Puesta a Tierra",
        descripcion: "Instalación de jabalinas, dispersores, soldaduras exotérmicas y medición de resistividad de suelo. Garantizamos valores de resistencia menores a 5 Ohms según normativa AEA 90364.",
        imagen: prodImage('/images/services/productos/electricos/8.2.png'),
        features: ['Jabalinas cooperweld 5/8" x 3m', 'Soldadura exotérmica CADWELD', 'Certificado de resistencia < 5Ω'],
        destacado: 'Estudio de suelo, cálculo de malla, instalación certificada y protocolo de medición con telurímetro.'
      },
      {
        titulo: "Instalaciones Eléctricas Industriales",
        descripcion: "Montaje de bandejas portacables, canalización de cables de potencia, instalación de motores trifásicos, arrancadores suaves y variadores de frecuencia para industria pesada y liviana.",
        imagen: prodImage('/images/services/productos/electricos/8.3.png'),
        features: ['Cables tipo LSOH libres de halógenos', 'Bandejas perforadas cincadas', 'Variadores ABB, Siemens, Schneider'],
        destacado: 'Proyecto eléctrico aprobado por organismo competente, instalación según planos y ensayos de continuidad/aislación.'
      },
      {
        titulo: "Sistemas de Alimentación Ininterrumpida (UPS)",
        descripcion: "Instalación de UPS online doble conversión de 5 kVA hasta 800 kVA con baterías de larga duración, bypass manual y monitoreo remoto SNMP para proteger equipos críticos.",
        imagen: prodImage('/images/services/productos/electricos/8.4.png'),
        features: ['Eficiencia > 95% en modo ECO', 'Factor de potencia salida = 1', 'Autonomía configurable hasta 8 horas'],
        destacado: 'Dimensionamiento de autonomía, instalación con neutro aislado y puesta en marcha con mediciones de calidad de energía.'
      },
      {
        titulo: "Grupos Electrógenos",
        descripcion: "Suministro e instalación de grupos electrógenos diésel desde 20 kVA hasta 2000 kVA con transferencia automática ATS, silenciadores industriales y tanques de combustible de larga autonomía.",
        imagen: prodImage('/images/services/productos/electricos/8.5.png'),
        features: ['Arranque automático en <10 seg', 'Motores Cummins, Perkins, Volvo', 'Transferencia Asco, Kohler, ComAp'],
        destacado: 'Cálculo de demanda, instalación de base antivibraciones, puesta en marcha y programa de mantenimiento preventivo.'
      },
      {
        titulo: "Instalaciones Fotovoltaicas",
        descripcion: "Proyectos llave en mano de energía solar on-grid y off-grid con paneles monocristalinos de alta eficiencia, inversores con monitoreo web y estructuras de montaje certificadas.",
        imagen: prodImage('/images/services/productos/electricos/8.6.png'),
        features: ['Paneles > 21% eficiencia', 'Inversores Fronius, SMA, Huawei', 'Garantía 25 años de paneles'],
        destacado: 'Estudio de radiación solar, diseño 3D, instalación eléctrica y mecánica, gestión de habilitación ante ente regulador.'
      },
      {
        titulo: "Bancos de Capacitores Automáticos",
        descripcion: "Instalación de bancos automáticos de capacitores con controlador digital, contactores de baja pérdida y protecciones contra armónicas para evitar multas por bajo cos φ y reducir pérdidas.",
        imagen: prodImage('/images/services/productos/electricos/8.7.png'),
        features: ['Pasos de 5 kVAr hasta 100 kVAr', 'Controlador 12 pasos automático', 'Reducción de hasta 15% en factura'],
        destacado: 'Medición de red eléctrica, cálculo de reactivo necesario, instalación y verificación de factor de potencia > 0.95.'
      },
      {
        titulo: "Termografía y Análisis de Calidad de Energía",
        descripcion: "Servicio de termografía infrarroja para detectar puntos calientes en tableros y conexiones, análisis de armónicas, transitorios y flicker con analizadores de redes clase A según IEC 61000-4-30.",
        imagen: prodImage('/images/services/productos/electricos/8.8.png'),
        features: ['Cámara FLIR resolución 640x480', 'Analizador clase A Fluke 1760', 'Reporte según IEEE 519 y IEC 61000'],
        destacado: 'Inspección termográfica certificada, mediciones de calidad de energía 7 días y reporte técnico con recomendaciones.'
      }
    ],
    Marcas: ['Schneider Electric', 'ABB', 'Siemens', 'Eaton', 'Legrand', 'Fronius', 'SMA'],
    PorQueElegirnos: [
      'Certificación AEA 90364',
      'Más de 80 instalaciones eléctricas en Cuyo',
      'Termografía y análisis preventivo',
      'Garantía extendida en equipos críticos'
    ]
  }
};

// Mapeo de IDs legacy a nuevos IDs
export const servicioIdMap = {
  1: 101,
  2: 101,  // Redes de datos -> Infraestructura
  3: 102,  // Seguridad -> Seguridad Electrónica
  4: 103,  // Telefonía -> Telecomunicaciones
  6: 104,  // Servicios Web -> Desarrollo (aproximación)
  101: 101,
  102: 102,
  103: 103,
  104: 104,
  105: 105,
  106: 106,
  107: 107,
  108: 108
};

// Obtener servicio por ID
export function getServicioCompleto(id) {
  const numId = parseInt(id);
  if (serviciosCompletos[numId]) {
    return serviciosCompletos[numId];
  }
  const mappedId = servicioIdMap[numId];
  if (mappedId && serviciosCompletos[mappedId]) {
    return serviciosCompletos[mappedId];
  }
  return null;
}

// Listar todos los servicios
export function listarServicios() {
  return Object.values(serviciosCompletos);
}

export default serviciosCompletos;
