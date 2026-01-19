/**
 * Configuración SEO Detallada para Servicios
 * Basada en SEO_SERVICIOS_ULTIMA_MILLA.md
 * Geolocalización: Mendoza, Cuyo, Patagonia, Argentina Oeste
 */

export const serviciosSEO = {
  // ========================
  // NUEVOS SERVICIOS 101-106
  // ========================
  
  101: {
    // INFRAESTRUCTURA DE REDES Y CABLEADO
    slug: 'infraestructura-de-redes-y-cableado',
    title: 'Cableado Estructurado y Fibra Óptica en Mendoza | Certificación Fluke | Ultima Milla',
    description: 'Instalación de cableado estructurado Cat6/Cat6A y fibra óptica en Mendoza. Certificación Fluke punto por punto. Garantía 25 años. Data centers, racks y radioenlaces. +500 proyectos ejecutados. Presupuesto sin cargo.',
    keywords: 'cableado estructurado Mendoza, fibra óptica Mendoza, certificación Fluke, data center, rack servidores, patch panel Cat6A, radioenlace, redes de datos, instalación redes empresas',
    regions: ['Mendoza', 'San Juan', 'San Luis', 'Neuquén'],
    industries: ['Minería', 'Bodegas', 'Constructoras', 'Gobierno', 'Salud', 'Aeropuertos'],
    canonical: 'https://ultimamilla.com.ar/servicios/101/infraestructura-de-redes-y-cableado',
    ogImage: 'https://ultimamilla.com.ar/images/services/productos/redinfraestructura.png',
    schema: {
      "@type": "Service",
      "name": "Infraestructura de Redes y Cableado Estructurado",
      "alternateName": ["Cableado Estructurado", "Instalación de Redes", "Fibra Óptica"],
      "description": "Diseño, instalación y certificación de infraestructura de redes: cableado estructurado Cat5e/Cat6/Cat6A, fibra óptica monomodo y multimodo, data centers, racks de comunicaciones y radioenlaces punto a punto.",
      "serviceType": "Infraestructura IT",
      "award": "Certificación Fluke Networks Partner"
    },
    faqs: [
      {
        question: "¿Qué incluye la certificación Fluke de cableado estructurado?",
        answer: "La certificación Fluke incluye medición de cada punto de red con equipo certificador DSX, generando un reporte PDF individual con valores de atenuación, NEXT, retardo y otros parámetros. Este documento es válido para activar garantías de fabricante de 25 años y para auditorías de calidad."
      },
      {
        question: "¿Cuánto cuesta instalar cableado estructurado en Mendoza?",
        answer: "El costo depende de la cantidad de puntos, categoría del cable (Cat5e, Cat6, Cat6A), distancias y complejidad del tendido. Ofrecemos presupuesto sin cargo con visita técnica incluida. Contacte a nuestro equipo comercial para una cotización personalizada."
      },
      {
        question: "¿Cuál es la diferencia entre fibra óptica monomodo y multimodo?",
        answer: "La fibra monomodo permite distancias mayores (hasta 80km) y es ideal para enlaces entre edificios o ciudades. La multimodo es más económica y se usa para distancias cortas (hasta 550m), típicamente dentro de un mismo edificio o campus."
      },
      {
        question: "¿Qué garantía tienen las instalaciones de cableado estructurado?",
        answer: "Nuestras instalaciones certificadas tienen garantía de 25 años del fabricante del cableado. Esta garantía cubre defectos de materiales y mano de obra, y requiere la certificación Fluke que entregamos con cada proyecto."
      }
    ]
  },

  102: {
    // SISTEMAS DE SEGURIDAD ELECTRÓNICA
    slug: 'sistemas-de-seguridad-electronica',
    title: 'Detección de Incendios y CCTV en Mendoza | Seguridad Electrónica | Ultima Milla',
    description: 'Sistemas de detección de incendios (SDI) con habilitación de Bomberos en Mendoza. CCTV IP profesional, control de acceso biométrico. Instalación y mantenimiento. +20 años de experiencia. Presupuesto sin cargo.',
    keywords: 'detección de incendios Mendoza, CCTV Mendoza, cámaras de seguridad, control de acceso, alarma contra incendios, detectores de humo, habilitación bomberos, sistema SDI, NVR, biométrico',
    regions: ['Mendoza', 'San Juan', 'San Luis', 'Neuquén'],
    industries: ['Aeropuertos', 'Hoteles', 'Hospitales', 'Gobierno', 'Comercios'],
    canonical: 'https://ultimamilla.com.ar/servicios/102/sistemas-de-seguridad-electronica',
    ogImage: 'https://ultimamilla.com.ar/images/services/productos/seguridad.png',
    schema: {
      "@type": "Service",
      "name": "Sistemas de Seguridad Electrónica",
      "alternateName": ["Detección de Incendios", "CCTV", "Videovigilancia", "Control de Acceso"],
      "description": "Diseño, instalación y mantenimiento de sistemas de seguridad electrónica: detección de incendios (SDI) con habilitación de Bomberos, videovigilancia CCTV IP, control de acceso biométrico y alarmas de intrusión.",
      "serviceType": "Seguridad Electrónica"
    },
    faqs: [
      {
        question: "¿Qué incluye la habilitación de Bomberos para un sistema de detección de incendios?",
        answer: "La habilitación incluye la presentación del proyecto ante Bomberos de Mendoza, la inspección del sistema instalado, las pruebas de funcionamiento y la emisión del certificado de aprobación. Este trámite es obligatorio para habilitar comercios, hoteles, edificios de oficinas y espacios públicos."
      },
      {
        question: "¿Cuánto tiempo se guardan las grabaciones de CCTV?",
        answer: "El tiempo de almacenamiento depende de la capacidad del disco duro del NVR y la cantidad de cámaras. Típicamente configuramos entre 15 y 30 días de grabación continua. Para requerimientos especiales (bancos, casinos) podemos implementar almacenamiento extendido o en nube."
      },
      {
        question: "¿El control de acceso biométrico se integra con el sistema de RRHH?",
        answer: "Sí, nuestros sistemas de control de acceso se integran con los principales sistemas de gestión de RRHH para automatizar el control de asistencia, cálculo de horas extras y generación de reportes para liquidación de sueldos."
      },
      {
        question: "¿Cada cuánto se debe hacer mantenimiento al sistema de detección de incendios?",
        answer: "La norma NFPA 72 exige inspecciones visuales semanales, pruebas funcionales mensuales y mantenimiento preventivo completo anual. Para clientes con contrato de mantenimiento, realizamos todas estas actividades y documentamos cada intervención."
      }
    ]
  },

  103: {
    // TELECOMUNICACIONES
    slug: 'telecomunicaciones',
    title: 'Telefonía IP y WiFi Empresarial en Mendoza | Central PBX | Ultima Milla',
    description: 'Telefonía IP empresarial, centrales PBX, redes WiFi corporativas y videoporteros IP en Mendoza. Ahorre hasta 60% en telefonía. Instalación y soporte. +20 años de experiencia.',
    keywords: 'telefonía IP Mendoza, central telefónica IP, PBX, WiFi empresarial, videoportero IP, citofonía, access point, comunicaciones unificadas, VoIP',
    regions: ['Mendoza', 'San Juan', 'Cuyo', 'Argentina'],
    industries: ['Empresas', 'Hoteles', 'Edificios', 'Gobierno', 'Salud'],
    canonical: 'https://ultimamilla.com.ar/servicios/103/telecomunicaciones',
    ogImage: 'https://ultimamilla.com.ar/images/services/productos/telecomunicaciones/3.1.png',
    schema: {
      "@type": "Service",
      "name": "Telecomunicaciones Empresariales",
      "alternateName": ["Telefonía IP", "VoIP", "WiFi Empresarial", "Citofonía"],
      "description": "Soluciones de comunicaciones unificadas: telefonía IP con centrales PBX, redes WiFi empresariales con cobertura garantizada, videoporteros IP y sistemas de citofonía para edificios.",
      "serviceType": "Telecomunicaciones"
    },
    faqs: [
      {
        question: "¿Cuánto puedo ahorrar con telefonía IP?",
        answer: "Típicamente nuestros clientes ahorran entre 40% y 60% en sus costos de telefonía al migrar a VoIP. El ahorro depende del volumen de llamadas, destinos frecuentes y la infraestructura existente. Ofrecemos análisis de facturación sin cargo."
      },
      {
        question: "¿Puedo mantener mi número telefónico actual al migrar a IP?",
        answer: "Sí, realizamos portabilidad numérica para que mantenga sus números actuales. El proceso toma aproximadamente 15-30 días hábiles según el operador de origen."
      }
    ]
  },

  104: {
    // DESARROLLO DE SOFTWARE
    slug: 'desarrollo-de-software',
    title: 'Desarrollo de Software a Medida en Mendoza | Apps Web y Móviles | Ultima Milla',
    description: 'Desarrollo de software a medida en Mendoza. Aplicaciones web, apps móviles iOS/Android, sistemas ERP, trazabilidad y servicios cloud. El código es suyo. +15 años de experiencia.',
    keywords: 'desarrollo software Mendoza, aplicaciones web, apps móviles, ERP a medida, software empresarial, trazabilidad, cloud, AWS, desarrollo a medida, programación',
    regions: ['Mendoza', 'Cuyo', 'Argentina'],
    industries: ['Gobierno', 'Industria', 'Logística', 'Comercio', 'Salud'],
    canonical: 'https://ultimamilla.com.ar/servicios/104/desarrollo-de-software',
    ogImage: 'https://ultimamilla.com.ar/images/services/productos/desarrollo.png',
    schema: {
      "@type": "Service",
      "name": "Desarrollo de Software a Medida",
      "alternateName": ["Desarrollo Web", "Apps Móviles", "Software Empresarial"],
      "description": "Desarrollo de software personalizado: aplicaciones web responsive, apps móviles nativas para iOS y Android, sistemas ERP, plataformas de trazabilidad y servicios en la nube.",
      "serviceType": "Desarrollo de Software"
    },
    faqs: [
      {
        question: "¿El código fuente es propiedad del cliente?",
        answer: "Sí, a diferencia de otras empresas, el código fuente es 100% propiedad del cliente al finalizar el proyecto. Usted tiene libertad total para mantenerlo internamente o con otro proveedor."
      },
      {
        question: "¿Qué metodología de desarrollo utilizan?",
        answer: "Trabajamos con metodologías ágiles (Scrum) con sprints de 2 semanas. El cliente participa en demos al final de cada sprint y puede ajustar prioridades según las necesidades del negocio."
      }
    ]
  },

  105: {
    // SOPORTE TIC Y MANTENIMIENTO
    slug: 'soporte-tic-y-mantenimiento',
    title: 'Soporte Técnico IT 24/7 en Mendoza | Mesa de Ayuda | Ultima Milla',
    description: 'Servicio de soporte técnico IT 24/7 en Mendoza y Cuyo. Mesa de ayuda, mantenimiento preventivo, monitoreo proactivo. SLA garantizado. +500 clientes activos.',
    keywords: 'soporte técnico Mendoza, mesa de ayuda IT, mantenimiento informático, soporte 24/7, monitoreo proactivo, help desk, ITIL, gestión incidentes',
    regions: ['Mendoza', 'San Juan', 'San Luis', 'Cuyo'],
    industries: ['Empresas', 'Pymes', 'Gobierno', 'Salud', 'Industria'],
    canonical: 'https://ultimamilla.com.ar/servicios/105/soporte-tic-y-mantenimiento',
    ogImage: 'https://ultimamilla.com.ar/images/services/productos/soportetic.png',
    schema: {
      "@type": "Service",
      "name": "Soporte TIC y Mantenimiento",
      "alternateName": ["Mesa de Ayuda", "Soporte Técnico", "Mantenimiento IT"],
      "description": "Servicio integral de soporte técnico IT: mesa de ayuda 24/7, mantenimiento preventivo, monitoreo proactivo, gestión de incidentes ITIL y backup empresarial.",
      "serviceType": "Soporte Técnico IT"
    },
    faqs: [
      {
        question: "¿Cuál es el tiempo de respuesta ante un incidente crítico?",
        answer: "Para incidentes críticos (caída de servicio), garantizamos respuesta en 15 minutos y llegada en sitio en 4 horas para zona urbana de Mendoza. Los SLAs específicos se definen en cada contrato según las necesidades del cliente."
      },
      {
        question: "¿Incluyen backup de datos en el servicio de soporte?",
        answer: "Sí, todos nuestros contratos de soporte incluyen monitoreo de backups. Opcionalmente podemos implementar soluciones de backup local, en nube o híbrido con verificación automática de integridad."
      }
    ]
  },

  106: {
    // CONSULTORÍA IT
    slug: 'consultoria-it',
    title: 'Consultoría IT y Transformación Digital en Mendoza | Ultima Milla',
    description: 'Consultoría IT estratégica en Mendoza. Auditorías de infraestructura, arquitectura de soluciones, transformación digital, gestión de licitaciones públicas. +25 años de experiencia.',
    keywords: 'consultoría IT Mendoza, transformación digital, auditoría infraestructura, arquitectura IT, licitaciones públicas, cumplimiento normativo, ISO 27001',
    regions: ['Mendoza', 'Cuyo', 'Patagonia', 'Argentina'],
    industries: ['Gobierno', 'Empresas', 'Organizaciones', 'Industria'],
    canonical: 'https://ultimamilla.com.ar/servicios/106/consultoria-it',
    ogImage: 'https://ultimamilla.com.ar/images/services/productos/consultoria.png',
    schema: {
      "@type": "Service",
      "name": "Consultoría IT",
      "alternateName": ["Transformación Digital", "Auditoría IT", "Arquitectura Empresarial"],
      "description": "Asesoramiento estratégico en tecnología: auditorías de infraestructura, planificación IT, arquitectura de soluciones, evaluación de riesgos, cumplimiento normativo y gestión de licitaciones públicas.",
      "serviceType": "Consultoría IT"
    },
    faqs: [
      {
        question: "¿Qué incluye una auditoría de infraestructura IT?",
        answer: "La auditoría incluye inventario de activos, análisis de vulnerabilidades, evaluación de backups, revisión de licencias, estado de actualizaciones y un informe ejecutivo con plan de acción priorizado por riesgo e impacto."
      },
      {
        question: "¿Ayudan a preparar licitaciones públicas?",
        answer: "Sí, tenemos experiencia en licitaciones públicas con más del 90% de tasa de adjudicación. Asistimos en análisis de pliegos, elaboración de oferta técnica y económica, y seguimiento hasta la adjudicación."
      }
    ]
  },

  107: {
    // DETECCIÓN DE INCENDIOS
    slug: 'sistemas-de-deteccion-y-alarma-de-incendios',
    title: 'Detección de Incendios Mendoza | Sistemas SDI Certificados NFPA 72 | Ultima Milla',
    description: 'Instalación y mantenimiento de sistemas de detección de incendios (SDI) en Mendoza. Certificación NFPA 72, habilitación de Bomberos incluida. Detectores de humo, paneles direccionables. +20 años de experiencia.',
    keywords: 'detección de incendios Mendoza, sistema alarma incendios, SDI, detectores humo, panel alarma incendios, NFPA 72, habilitación bomberos, sirena estroboscópica, mantenimiento SDI, detectores térmicos, Mendoza Argentina',
    regions: ['Mendoza', 'San Juan', 'San Luis'],
    industries: ['Aeropuertos', 'Hospitales', 'Edificios', 'Comercios'],
    canonical: 'https://ultimamilla.com.ar/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios',
    ogImage: 'https://ultimamilla.com.ar/images/og-deteccion-incendios.jpg',
    schema: {
        "@type": "Service",
        "name": "Sistemas de Detección y Alarma de Incendios",
        "alternateName": ["SDI", "Sistema de Detección de Incendios", "Fire Alarm System"],
        "description": "Diseño, instalación, programación y mantenimiento de sistemas de detección y alarma de incendios (SDI) con certificación NFPA 72. Incluye detectores de humo fotoeléctricos, térmicos y de llama, paneles direccionables, sirenas estroboscópicas, estaciones manuales e integración con sistemas de supresión automática. Habilitación ante Bomberos incluida.",
        "serviceType": "Fire Alarm Installation",
        "award": "Certificación NFPA 72"
    },
    faqs: [
        {
            question: "¿Qué es un sistema de detección de incendios SDI?",
            answer: "Un Sistema de Detección de Incendios (SDI) es un conjunto de dispositivos electrónicos interconectados que detectan la presencia de fuego o humo de forma temprana y alertan a los ocupantes del edificio. Incluye detectores de humo, térmicos o de llama, un panel central de control, dispositivos de notificación (sirenas y luces estroboscópicas) y estaciones manuales. Su función es dar tiempo para evacuar y actuar antes de que el fuego se propague."
        },
        {
            question: "¿Cuál es la diferencia entre un panel convencional y uno direccionable?",
            answer: "Un panel convencional agrupa detectores por zonas y solo indica en qué zona hay alarma, sin identificar el detector específico. Un panel direccionable identifica exactamente cuál detector está en alarma, mostrando su ubicación precisa en el display. Para edificios grandes o complejos, el panel direccionable permite localizar el incendio mucho más rápido, acelerando la respuesta de emergencia."
        },
        {
            question: "¿Qué es NFPA 72 y por qué es importante?",
            answer: "NFPA 72 es el Código Nacional de Alarmas de Incendio y Señalización de Estados Unidos, reconocido internacionalmente como el estándar de referencia para sistemas de detección de incendios. Cumplir con NFPA 72 garantiza que el sistema está diseñado según las mejores prácticas: cantidad correcta de detectores, ubicación adecuada, niveles de sonido de sirenas, tiempos de respuesta y mantenimiento requerido. Las aseguradoras suelen exigir cumplimiento NFPA para otorgar cobertura."
        },
        {
            question: "¿Necesito habilitación de Bomberos para mi sistema de incendios?",
            answer: "Sí. En Argentina, cualquier edificio con uso comercial, industrial, educativo, sanitario o de concurrencia pública requiere habilitación de Bomberos para su sistema de detección y extinción de incendios. Esta habilitación certifica que el sistema cumple con las normas de seguridad y está en condiciones operativas. En Ultima Milla tramitamos la habilitación como parte del servicio de instalación."
        },
        {
            question: "¿Cada cuánto se debe hacer mantenimiento al sistema de incendios?",
            answer: "Según NFPA 72, el sistema debe inspeccionarse visualmente mensualmente, probarse trimestralmente y recibir mantenimiento completo anualmente. Las pruebas incluyen activación de detectores, verificación de sirenas, prueba de baterías y limpieza de sensores. El mantenimiento preventivo evita falsas alarmas y garantiza que el sistema funcionará cuando realmente se necesite."
        }
    ]
  },

  108: {
    // SERVICIOS ELÉCTRICOS IT
    slug: 'servicios-electricos-para-it',
    title: 'Instalaciones Eléctricas para Data Center Mendoza | UPS, Tableros, PDU | Ultima Milla',
    description: 'Servicios eléctricos especializados para IT y data centers en Mendoza. UPS, bancos de baterías, tableros para informática, transferencia automática, PDU y puesta a tierra técnica TIA-607. +20 años de experiencia.',
    keywords: 'UPS Mendoza, instalación eléctrica data center, tablero eléctrico IT, energía ininterrumpida, SAI, banco baterías, transferencia automática, PDU rack, puesta tierra técnica, TIA-607, infraestructura eléctrica crítica',
    regions: ['Mendoza', 'San Juan', 'San Luis'],
    industries: ['Data Centers', 'IT', 'Empresas', 'Telecomunicaciones'],
    canonical: 'https://ultimamilla.com.ar/servicios/108/servicios-electricos-para-it',
    ogImage: 'https://ultimamilla.com.ar/images/og-electrico-it.jpg',
    schema: {
        "@type": "Service",
        "name": "Servicios Eléctricos para IT y Data Centers",
        "alternateName": ["Infraestructura Eléctrica IT", "Electrical Services for IT"],
        "description": "Diseño, instalación y mantenimiento de infraestructura eléctrica especializada para tecnología de la información y data centers. Incluye sistemas UPS de doble conversión, bancos de baterías para autonomía extendida, tableros eléctricos dedicados para informática, transferencia automática, PDU para racks, puesta a tierra técnica según TIA-607 y corrección de factor de potencia. Cumplimiento de normas TIA-942 para data centers.",
        "serviceType": "UPS Installation",
        "award": "Cumplimiento TIA-942"
    },
    faqs: [
        {
            question: "¿Qué es un UPS online de doble conversión?",
            answer: "Un UPS online de doble conversión convierte la energía de la red (AC) a corriente continua (DC) para cargar las baterías, y luego vuelve a convertirla a AC para alimentar los equipos. Esto significa que los equipos siempre se alimentan de las baterías a través del inversor, nunca directamente de la red. La ventaja es que hay cero tiempo de transferencia ante un corte de luz y la energía entregada es siempre limpia y regulada, independientemente de la calidad de la red eléctrica."
        },
        {
            question: "¿Por qué los equipos IT necesitan un tablero eléctrico dedicado?",
            answer: "Los equipos de IT son sensibles al ruido eléctrico, transitorios y variaciones de voltaje. Si comparten circuito con cargas inductivas (motores de aire acondicionado, ascensores, maquinaria) pueden sufrir interferencias que causan errores, reinicios o daños. Un tablero dedicado con circuitos separados, protecciones adecuadas, supresores de transitorios y puesta a tierra técnica aísla los equipos IT de estas perturbaciones."
        },
        {
            question: "¿Qué es la puesta a tierra técnica TIA-607?",
            answer: "TIA-607 es la norma que establece los requisitos de puesta a tierra y equipotencialidad para instalaciones de telecomunicaciones. Define una tierra técnica separada de la tierra de fuerza (aunque conectadas en un solo punto) con una barra principal (TMGB), barras secundarias (TGB) en cada piso o sala, y conductores de cobre de calibre específico. Esta configuración proporciona una referencia de tierra limpia y de baja impedancia para equipos electrónicos sensibles."
        },
        {
            question: "¿Cuánta autonomía de UPS necesito?",
            answer: "Depende de su estrategia de continuidad. Si tiene generador, típicamente necesita 10-15 minutos para que el generador arranque y estabilice. Si no tiene generador, puede necesitar autonomía para apagar ordenadamente (15-30 minutos) o para operar durante cortes cortos (1-4 horas). La autonomía se logra con bancos de baterías externos dimensionados según la carga y el tiempo requerido."
        },
        {
            question: "¿Qué es un tablero de transferencia automática (ATS)?",
            answer: "Un ATS (Automatic Transfer Switch) es un tablero que monitorea la red eléctrica comercial y, ante una falla, automáticamente arranca el generador y transfiere la carga a él. Cuando la red se normaliza, retransfiere la carga a la red y apaga el generador. Todo esto ocurre sin intervención humana, asegurando continuidad aunque el corte ocurra a las 3 AM de un domingo."
        }
    ]
  },

  // ========================
  // SERVICIOS LEGACY (mantenidos para compatibilidad)
  // ========================

  7: {
    // INFRAESTRUCTURA DE REDES
    slug: 'infraestructura-de-redes',
    title: 'Infraestructura de Redes | Cableado, Fibra Óptica, Radioenlaces | ULTIMA MILLA',
    description: 'Diseño e implementación de infraestructura de redes en Mendoza, San Juan y Cuyo. Cableado estructurado, fibra óptica, radioenlaces y arquitectura LAN/WAN. +94 proyectos exitosos.',
    keywords: 'infraestructura de redes mendoza, cableado estructurado mendoza, fibra optica mendoza, redes empresariales, radioenlaces cuyo, redes datos argentina, lan wan mendoza, certificacion cableado, ingenieria telecomunicaciones',
    regions: ['Mendoza', 'San Juan', 'San Luis', 'Cuyo', 'Patagonia'],
    industries: ['Minería', 'Bodegas', 'Constructoras', 'Gobierno', 'Salud'],
    longTail: [
      'instalacion cableado estructurado mendoza',
      'fibra optica empresarial cuyo',
      'radioenlaces punto a punto',
      'infraestructura redes para mineria',
      'redes empresariales san juan',
      'data center mendoza',
      'alta disponibilidad redes argentina'
    ]
  },

  8: {
    // DESARROLLO DE SOFTWARE
    slug: 'desarrollo-de-software',
    title: 'Desarrollo de Software a Medida | Web, Mobile, ERP | ULTIMA MILLA',
    description: 'Desarrollo de software a medida para empresas en Mendoza y Argentina. Aplicaciones web, sistemas ERP, plataformas de e-commerce, APIs. Experiencia con CNN, Gobierno de Mendoza, Banco Credicoop. +60 clientes.',
    keywords: 'desarrollo software mendoza, desarrollo a medida mendoza, software empresarial, aplicaciones web mendoza, desarrollo mobile argentina, erp desarrollo, software cuyo, desarrollo cloud mendoza',
    regions: ['Mendoza', 'Cuyo', 'Argentina', 'San Juan'],
    industries: ['Constructoras', 'Bodegas', 'Minería', 'Salud', 'Gobierno'],
    longTail: [
      'desarrollo web mendoza',
      'aplicaciones mobile ios android',
      'sistemas erp para pymes',
      'plataforma e-commerce mendoza',
      'software gestion construccion',
      'sistema vitivinicola',
      'desarrollo a medida argentina'
    ]
  },

  3: {
    // SEGURIDAD INFORMÁTICA
    slug: 'seguridad-informatica',
    title: 'Seguridad Informática y Ciberseguridad | CCTV, Control Acceso | ULTIMA MILLA',
    description: 'Soluciones integrales de seguridad informática en Mendoza y Cuyo. CCTV, sistemas de detección de intrusos, control de acceso biométrico, videovigilancia, BMS. +67 proyectos en aeropuertos y sitios críticos.',
    keywords: 'seguridad informatica mendoza, ciberseguridad argentina, firewall empresarial, cctv mendoza, control acceso biometrico, videovigilancia, deteccion intrusos, bms mendoza',
    regions: ['Mendoza', 'Cuyo', 'Patagonia', 'Argentina'],
    industries: ['Aeropuertos', 'Minería', 'Gobierno', 'Salud', 'Bodegas'],
    longTail: [
      'camaras cctv mendoza',
      'control acceso rfid biometrico',
      'sistemas alarma inteligentes',
      'monitoreo 24/7 empresas',
      'seguridad perimetral mendoza',
      'edificios inteligentes bms',
      'videovigilancia ip mendoza'
    ]
  },

  10: {
    // SOPORTE TÉCNICO 24/7
    slug: 'soporte-tecnico-247',
    title: 'Soporte Técnico 24/7 | Mesa de Ayuda, Mantenimiento IT | ULTIMA MILLA',
    description: 'Servicio integral de soporte técnico 24/7 en Mendoza, San Juan y Cuyo. Mesa de ayuda, mantenimiento preventivo, gestión de incidentes, administración IT. +51 contratos activos. SLA garantizado.',
    keywords: 'soporte tecnico mendoza, mesa de ayuda 24/7, soporte informatico mendoza, mantenimiento informatico, soporte remoto argentina, soporte it 24/7, gestion incidentes, help desk mendoza',
    regions: ['Mendoza', 'San Juan', 'Cuyo', 'Argentina'],
    industries: ['Minería', 'Bodegas', 'Constructoras', 'Salud', 'Gobierno'],
    longTail: [
      'mesa de ayuda 24/7 mendoza',
      'mantenimiento computadoras empresas',
      'soporte tecnico remoto on-site',
      'gestion ticketing it',
      'monitorizacion infraestructura',
      'respuesta rapida incidentes',
      'administracion servidores'
    ]
  },

12: {
    // CONSULTORÍA IT
    slug: 'consultoria-it',
    title: 'Consultoría IT y Transformación Digital | Arquitectura, Auditoría | ULTIMA MILLA',
    description: 'Asesoramiento estratégico en tecnología para Mendoza, Cuyo y Patagonia. Consultoría IT, arquitectura empresarial, auditorías de seguridad, transformación digital. +100 proyectos de consultoría.',
    keywords: 'consultoria informatica mendoza, consultoria it mendoza, consultoria tecnologica, arquitectura it empresarial, auditoria informatica, transformacion digital mendoza, evaluacion proveedores',
    regions: ['Mendoza', 'Cuyo', 'Patagonia', 'Argentina'],
    industries: ['Minería', 'Gobierno', 'Bodegas', 'Constructoras', 'Salud'],
    longTail: [
      'consultoria digital argentina',
      'arquitectura sistemas empresariales',
      'auditoria seguridad informatica',
      'evaluacion tecnologica',
      'roadmap transformacion digital',
      'mejores practicas it',
      'analisis infraestructura'
    ]
  },

  1: {
    // SERVICIOS IT INTEGRALES
    slug: 'servicios-it',
    title: 'Servicios IT Integrales para Empresas | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    description: 'Servicios IT completos para empresas y organizaciones en Mendoza, San Juan y Cuyo. Redes de datos, seguridad informática, telecomunicaciones, software y soporte técnico. +469 proyectos, +20 años de experiencia.',
    keywords: 'servicios it mendoza, servicios informaticos empresas, tecnologia empresarial cuyo, soluciones it argentina, informatica corporativa, gestion activos tecnologicos, servicios tecnologicos mendoza',
    regions: ['Mendoza', 'San Juan', 'San Luis', 'Cuyo', 'Patagonia'],
    industries: ['Minería', 'Bodegas', 'Constructoras', 'Gobierno', 'Salud', 'Aeropuertos'],
    longTail: [
      'servicios informaticos para pymes mendoza',
      'gestion activos tecnologicos empresas',
      'outsourcing it argentina',
      'servicios tecnologicos para organizaciones',
      'empresa de servicios it cuyo'
    ]
  },

  2: {
    // REDES DE DATOS
    slug: 'redes-de-datos',
    title: 'Redes de Datos Empresariales | Cableado Estructurado Certificado | ULTIMA MILLA',
    description: 'Diseño e instalación de redes de datos en Mendoza y Cuyo. Cableado estructurado Cat6/6A, fibra óptica, radioenlaces, redes LAN/WAN. Certificación TIA/EIA. Experiencia en minería, bodegas e industria.',
    keywords: 'redes de datos mendoza, cableado estructurado certificado, redes empresariales cuyo, fibra optica instalacion, radioenlaces mendoza, redes lan wan, telecomunicaciones empresas',
    regions: ['Mendoza', 'San Juan', 'San Luis', 'Cuyo', 'Patagonia'],
    industries: ['Minería', 'Bodegas', 'Constructoras', 'Industria', 'Gobierno'],
    longTail: [
      'instalacion redes empresariales mendoza',
      'cableado estructurado cat6 certificado',
      'redes de datos para mineria',
      'fibra optica para empresas cuyo',
      'radioenlaces punto a punto mendoza'
    ]
  },

  4: {
    // TELEFONÍA Y CITOFONÍA
    slug: 'telefonia',
    title: 'Telefonía IP y Comunicaciones Unificadas | Centrales Telefónicas | ULTIMA MILLA',
    description: 'Soluciones de telefonía IP y comunicaciones unificadas en Mendoza y Cuyo. Centrales telefónicas, citofonía, VoIP, intercomunicadores para edificios y empresas. Integración con sistemas existentes.',
    keywords: 'telefonia ip mendoza, comunicaciones unificadas, central telefonica empresas, voip argentina, citofonia edificios, intercomunicadores, telefonia empresarial cuyo',
    regions: ['Mendoza', 'San Juan', 'Cuyo', 'Argentina'],
    industries: ['Edificios', 'Empresas', 'Gobierno', 'Salud', 'Constructoras'],
    longTail: [
      'central telefonica ip mendoza',
      'telefonia voip para empresas',
      'citofonia y porteros electricos',
      'comunicaciones unificadas cuyo',
      'telefonia para edificios inteligentes'
    ]
  },

  6: {
    // SERVICIOS WEB
    slug: 'servicios-web',
    title: 'Servicios Web y Cloud | Hosting, APIs, Gestión Digital | ULTIMA MILLA',
    description: 'Servicios web profesionales en Mendoza y Argentina. Alojamiento web, APIs, administración de recursos digitales, gestión de activos en la nube para empresas y organizaciones.',
    keywords: 'servicios web mendoza, hosting empresarial argentina, apis desarrollo, gestion activos digitales, cloud computing cuyo, recursos digitales, alojamiento web profesional',
    regions: ['Mendoza', 'Cuyo', 'Argentina'],
    industries: ['Empresas', 'Pymes', 'Gobierno', 'Organizaciones'],
    longTail: [
      'alojamiento web empresarial mendoza',
      'desarrollo apis rest mendoza',
      'gestion recursos digitales empresas',
      'cloud para pymes argentina',
      'administracion servidores web'
    ]
  },

  9: {
    // CIBERSEGURIDAD Y CCTV
    slug: 'ciberseguridad-cctv',
    title: 'CCTV y Seguridad Electrónica | Detección de Incendio, Control de Acceso | ULTIMA MILLA',
    description: 'Sistemas de seguridad electrónica en Mendoza, Cuyo y Patagonia. CCTV videovigilancia, detección de incendios, control de acceso biométrico, alarmas, corrientes débiles. +67 proyectos en aeropuertos y sitios críticos.',
    keywords: 'cctv mendoza, videovigilancia empresas, deteccion incendio certificada, control acceso biometrico, corrientes debiles, seguridad electronica cuyo, alarmas inteligentes, sistemas seguridad patagonia',
    regions: ['Mendoza', 'San Juan', 'Cuyo', 'Patagonia', 'Argentina'],
    industries: ['Aeropuertos', 'Minería', 'Gobierno', 'Salud', 'Bodegas', 'Constructoras'],
    longTail: [
      'camaras cctv ip mendoza',
      'sistema deteccion incendio certificado',
      'control acceso biometrico rfid',
      'instalacion corrientes debiles obras',
      'seguridad electronica aeropuertos',
      'videovigilancia para mineria',
      'alarmas inteligentes empresas'
    ]
  }
};

/**
 * Estructura de Metadatos Común para todas los servicios
 */
export const serviceMetaTemplate = (serviceId, seoData) => ({
  title: seoData.title,
  description: seoData.description,
  keywords: seoData.keywords,
  ogTitle: seoData.title,
  ogDescription: seoData.description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  canonical: `https://ultimamilla.com.ar/servicios/${serviceId}/${seoData.slug}`,

  // Local SEO
  areaServed: seoData.regions,
  serviceAreas: seoData.industries,
});

/**
 * Función para obtener config SEO de un servicio
 */
export function getServiceSEO(serviceId) {
  return serviciosSEO[serviceId] || null;
}

/**
 * Palabras clave adicionales por región (para link building y análisis)
 */
export const regionalKeywords = {
  mendoza: [
    'servicios it mendoza',
    'empresa tecnologia mendoza',
    'soporte tecnico mendoza',
    'infraestructura redes mendoza',
    'desarrollo software mendoza',
    'seguridad informatica mendoza',
    'consultoria it mendoza',
    'cloud computing mendoza'
  ],
  cuyo: [
    'servicios it cuyo',
    'infraestructura tecnologica cuyo',
    'desarrollo software cuyo',
    'soporte informatico cuyo',
    'redes datos cuyo',
    'seguridad informatica san juan'
  ],
  patagonia: [
    'servicios it patagonia',
    'infraestructura tecnologica neuquen',
    'desarrollo software patagonia',
    'soporte tecnico neuquen',
    'redes empresariales patagonia'
  ]
};

/**
 * Keywords por industria para cross-linking
 */
export const industryKeywords = {
  mineria: [
    'tecnologia minera argentina',
    'infraestructura it mineria',
    'sistemas mineros mendoza',
    'conectividad remota mineria',
    'automatizacion minera'
  ],
  bodegas: [
    'tecnologia para bodegas mendoza',
    'software vitivinicola',
    'automatizacion bodegas',
    'sistemas bodegarios'
  ],
  salud: [
    'sistemas hospitalarios mendoza',
    'software clinico argentina',
    'historia clinica electronica',
    'tecnologia salud cuyo'
  ],
  gobierno: [
    'servicios it gobierno mendoza',
    'infraestructura publica',
    'digitalizacion gobierno cuyo',
    'tecnologia sector publico'
  ],
  constructoras: [
    'software constructoras mendoza',
    'gestion proyectos construccion',
    'erp construccion argentina',
    'tecnologia constructoras cuyo'
  ]
};
