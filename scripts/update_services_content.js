// Script to update all services with complete marketing content
// This will be run from the fumbling-field directory which has pg installed

const DIRECTUS_API = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const serviciosCompletos = {
  101: {
    Titulo: "Infraestructura de Redes y Cableado",
    Subtitulo: "Conectividad de Alta Performance para Organizaciones Exigentes",
    Tagline: "La columna vertebral de su transformación digital",
    Stats: [
      { valor: "469+", label: "Proyectos ejecutados" },
      { valor: "25+", label: "Años de experiencia" },
      { valor: "100%", label: "Certificación garantizada" }
    ],
    Productos: [
      {
        nombre: "Fibra Óptica de Alta Capacidad",
        headline: "Velocidad sin límites para su organización",
        descripcion: "Olvídese de los cuellos de botella. Con nuestra instalación certificada de fibra óptica, sus datos viajan a la velocidad de la luz. Ideal para interconectar edificios, data centers o llevar conectividad donde el cobre no alcanza.",
        servicio_asociado: "🔧 Instalamos enlaces de fibra óptica monomodo y multimodo con fusiones certificadas, mediciones OTDR y garantía de 25 años.",
        imagen: "/images/services/productos/infraestructura/1.1.png",
        caracteristicas: ["Velocidades de hasta 100 Gbps", "Inmune a interferencias electromagnéticas", "Distancias de hasta 80 km sin repetidores"]
      },
      {
        nombre: "Centro de Distribución de Red",
        headline: "El corazón ordenado de toda su infraestructura",
        descripcion: "Un patch panel bien instalado es la diferencia entre encontrar un problema en minutos o en horas. Centralizamos todas sus conexiones en un punto de gestión profesional que facilita el mantenimiento, las expansiones y el troubleshooting.",
        servicio_asociado: "🔧 Instalamos racks completos con patch panels certificados, organizadores verticales, etiquetado profesional y documentación de cada puerto.",
        imagen: "/images/services/productos/infraestructura/1.2.png",
        caracteristicas: ["Identifique cualquier punto en segundos", "Agregue conexiones sin rediseñar", "Blindaje contra interferencias Cat6A"]
      },
      {
        nombre: "Cableado Estructurado Certificado",
        headline: "Cada punto de red, garantizado y documentado",
        descripcion: "No instalamos cables, construimos infraestructura. Cada punto que instalamos viene con su certificación Fluke individual. Usted recibe un informe con los valores de medición de cada conexión — su garantía ante cualquier auditoría o reclamo.",
        servicio_asociado: "🔧 Diseñamos e instalamos redes de cableado estructurado Cat5e, Cat6 y Cat6A con certificación punto por punto y garantía del fabricante de 25 años.",
        imagen: "/images/services/productos/infraestructura/1.3.png",
        caracteristicas: ["Certificación individual Fluke", "Garantía de 25 años", "Cumplimiento TIA/EIA-568-C"]
      },
      {
        nombre: "Switching de Alto Rendimiento",
        headline: "Conectividad inteligente que nunca se detiene",
        descripcion: "Su red necesita un cerebro que tome decisiones en microsegundos. Implementamos equipos de switching empresarial con redundancia, gestión remota y la capacidad de crecer con su organización. Monitoreo proactivo incluido.",
        servicio_asociado: "🔧 Configuramos y mantenemos su infraestructura de switching con VLANs, QoS, redundancia y monitoreo 24/7. Soporte remoto y presencial.",
        imagen: "/images/services/productos/infraestructura/1.4.png",
        caracteristicas: ["Cero downtime con redundancia", "Gestión remota segura", "Arquitectura modular escalable"]
      },
      {
        nombre: "Data Center Llave en Mano",
        headline: "Su centro de cómputos, profesionalmente implementado",
        descripcion: "Desde el piso técnico hasta el último cable, diseñamos e instalamos cuartos de comunicaciones que cumplen estándares internacionales. Climatización, energía redundante, control de acceso y monitoreo ambiental integrados.",
        servicio_asociado: "🔧 Construimos data centers y cuartos de comunicaciones completos: obra civil, climatización, energía, racks, cableado y seguridad.",
        imagen: "/images/services/productos/infraestructura/1.5.png",
        caracteristicas: ["Diseño térmico optimizado", "Acceso y mantenimiento simplificado", "Cumplimiento TIA-942"]
      },
      {
        nombre: "Radioenlaces Punto a Punto",
        headline: "Conecte ubicaciones remotas sin tender un solo cable",
        descripcion: "Cuando el cable no es opción, el aire es el camino. Diseñamos e instalamos radioenlaces de alta capacidad para unir edificios, sucursales o sitios remotos. Enlaces licenciados y no licenciados con SLA de disponibilidad.",
        servicio_asociado: "🔧 Implementamos radioenlaces profesionales con estudio de factibilidad, trámites regulatorios (si aplica), instalación y mantenimiento con SLA.",
        imagen: "/images/services/productos/infraestructura/1.6.png",
        caracteristicas: ["Distancias de hasta 50 km", "Velocidades de hasta 1 Gbps", "99.99% de disponibilidad"]
      },
      {
        nombre: "Certificación Profesional de Red",
        headline: "Cada punto que instalamos, lo certificamos",
        descripcion: "No confíe en 'funciona bien'. Exija la prueba. Con nuestro equipamiento Fluke de última generación, cada punto de red recibe su certificación individual con valores de medición reales. Documentación válida para auditorías y garantías de fabricante.",
        servicio_asociado: "🔧 Certificamos instalaciones nuevas y existentes con equipos Fluke DSX. Emitimos reportes PDF individuales válidos para auditorías y activación de garantías.",
        imagen: "/images/services/productos/infraestructura/1.7.png",
        caracteristicas: ["Reporte PDF por cada punto", "Válido para garantías 25 años", "Detecta fallas ocultas"]
      },
      {
        nombre: "Gestión Profesional de Fibra Óptica",
        headline: "Orden y escalabilidad para su backbone de fibra",
        descripcion: "La fibra óptica es delicada y valiosa. La organizamos con precisión quirúrgica: fusiones protegidas, identificación clara por código de colores, y acceso pensado para mantenimiento sin riesgo. Cada fusión documentada y medida.",
        servicio_asociado: "🔧 Instalamos ODFs y realizamos fusiones certificadas con empalmadora de precisión. Medición OTDR de cada hilo y documentación completa.",
        imagen: "/images/services/productos/infraestructura/1.8.png",
        caracteristicas: ["Fusiones con pérdida < 0.1 dB", "Expansión sin interrumpir servicio", "Identificación por código de colores"]
      }
    ],
    ServiciosLista: ["Cableado Estructurado Cat6/Cat6A certificado", "Redes de Fibra Óptica (monomodo y multimodo)", "Radioenlaces punto a punto y multipunto", "Data Centers y cuartos de comunicaciones", "Redes corporativas LAN/WAN"],
    PorQueElegirnos: ["Certificación Fluke de cada punto instalado", "Garantía extendida de 25 años en cableado", "Cumplimiento normas TIA/EIA-568 y ISO/IEC 11801"]
  },
  102: {
    Titulo: "Sistemas de Seguridad Electrónica",
    Subtitulo: "Detección de Incendios, CCTV y Control de Acceso",
    Tagline: "Protección inteligente para lo que más importa",
    Stats: [
      { valor: "50+", label: "Sistemas SDI instalados" },
      { valor: "100+", label: "Sistemas CCTV desplegados" },
      { valor: "24/7", label: "Monitoreo disponible" }
    ],
    Productos: [
      {
        nombre: "Videovigilancia IP Profesional",
        headline: "Ojos que nunca duermen, en cada rincón",
        descripcion: "Vea todo, siempre, desde cualquier lugar. Nuestras cámaras IP de alta definición capturan cada detalle en tiempo real. Visión nocturna, análisis inteligente y acceso remoto desde su celular. Disuasión y evidencia en un solo sistema.",
        servicio_asociado: "🔧 Diseñamos e instalamos sistemas CCTV IP completos: cámaras, grabadores NVR, almacenamiento y monitoreo remoto. Mantenimiento preventivo incluido.",
        imagen: "/images/services/productos/seguridad/2.1.png",
        caracteristicas: ["Acceso desde cualquier dispositivo", "Grabación continua 24/7", "Análisis inteligente con IA"]
      },
      {
        nombre: "Cámaras de Exterior Alta Definición",
        headline: "Vigilancia perimetral que no perdona detalles",
        descripcion: "Para exteriores exigentes: sol, lluvia, polvo. Nuestras cámaras bullet IP están diseñadas para condiciones extremas. Visión nocturna de largo alcance, lente ajustable y carcasa anti-vandálica. Protección real donde más se necesita.",
        servicio_asociado: "🔧 Instalamos sistemas de videovigilancia exterior con cámaras antivandalismo IP67, iluminación IR y cableado protegido. Ideal para perímetros y estacionamientos.",
        imagen: "/images/services/productos/seguridad/2.2.png",
        caracteristicas: ["Visión nocturna hasta 80 metros", "Resistencia IP67", "Carcasa antivandalismo IK10"]
      },
      {
        nombre: "Sistema de Detección de Incendios",
        headline: "Segundos que salvan vidas y activos",
        descripcion: "El fuego avanza rápido. Su sistema de detección debe ser más rápido. Instalamos detectores de humo fotoeléctricos que identifican el inicio de un incendio antes de que las llamas aparezcan. Cumplimiento NFPA 72 y certificación de Bomberos.",
        servicio_asociado: "🔧 Diseñamos e instalamos sistemas de detección de incendios (SDI) completos: detectores, panel central, sirenas y señalización. Habilitación ante Bomberos incluida.",
        imagen: "/images/services/productos/seguridad/2.3.png",
        caracteristicas: ["Detección temprana", "Certificación NFPA 72", "Habilitación Bomberos incluida"]
      },
      {
        nombre: "Panel Central de Alarma SDI",
        headline: "El cerebro que coordina la protección contra incendios",
        descripcion: "Todos los detectores reportan aquí. El panel central monitorea cada zona, activa sirenas, libera puertas de emergencia y notifica a la central de monitoreo. Interfaz clara para que cualquier persona pueda entender el estado del sistema.",
        servicio_asociado: "🔧 Instalamos y programamos paneles de alarma de incendios convencionales y direccionables. Integración con sistemas de evacuación, rociadores y monitoreo 24/7.",
        imagen: "/images/services/productos/seguridad/2.4.png",
        caracteristicas: ["Monitoreo por zonas", "Integración total", "Interfaz intuitiva"]
      },
      {
        nombre: "Estaciones Manuales de Alarma",
        headline: "Cualquier persona puede dar la alerta",
        descripcion: "Cuando alguien detecta fuego antes que el sistema, necesita una forma de alertar a todos. Las estaciones manuales ubicadas estratégicamente permiten activar la alarma general con un simple gesto. Cumplimiento normativo garantizado.",
        servicio_asociado: "🔧 Instalamos estaciones manuales de alarma en ubicaciones normativas: salidas de emergencia, pasillos y áreas de alta ocupación. Señalización fotoluminiscente incluida.",
        imagen: "/images/services/productos/seguridad/2.5.png",
        caracteristicas: ["Activación instantánea", "Ubicación normativa", "Alta visibilidad"]
      },
      {
        nombre: "Control de Acceso Biométrico",
        headline: "Acceso solo para quien usted autorice",
        descripcion: "La tarjeta se puede prestar, el PIN se puede compartir. La huella digital, no. Nuestros sistemas biométricos garantizan que solo las personas autorizadas ingresen a áreas restringidas. Registro completo de quién entró, cuándo y dónde.",
        servicio_asociado: "🔧 Instalamos sistemas de control de acceso con lectores biométricos, tarjetas RFID, software de gestión y reportes. Integración con RRHH y nómina disponible.",
        imagen: "/images/services/productos/seguridad/2.6.png",
        caracteristicas: ["Imposible de falsificar", "Registro de accesos", "Integración con RRHH"]
      },
      {
        nombre: "Grabación y Almacenamiento de Video",
        headline: "Cada segundo grabado, listo para cuando lo necesite",
        descripcion: "Las cámaras capturan, el NVR preserva. Almacenamiento de semanas o meses de video en alta definición, con búsqueda inteligente por fecha, hora o evento. Cuando necesite revisar un incidente, estará ahí.",
        servicio_asociado: "🔧 Instalamos grabadores NVR con capacidad de 8 a 128 cámaras, almacenamiento redundante, acceso remoto y backup en nube opcional.",
        imagen: "/images/services/productos/seguridad/2.7.png",
        caracteristicas: ["Semanas de grabación", "Búsqueda inteligente", "Acceso remoto seguro"]
      },
      {
        nombre: "Detección de Intrusos PIR",
        headline: "Alerta temprana ante presencias no autorizadas",
        descripcion: "Los sensores de movimiento PIR detectan la presencia humana por su calor corporal. Instalados en puntos estratégicos, activan alarmas ante intrusiones y pueden integrarse con cámaras para grabación por evento.",
        servicio_asociado: "🔧 Instalamos sistemas de alarma perimetral con sensores PIR, contactos magnéticos, sirenas y monitoreo central 24/7.",
        imagen: "/images/services/productos/seguridad/2.8.png",
        caracteristicas: ["Detección por calor corporal", "Integración con CCTV", "Alertas en tiempo real"]
      }
    ],
    ServiciosLista: ["Sistemas de detección de incendio convencionales y analógicos", "Centrales de incendio certificadas IRAM/UL/FM", "CCTV IP con analítica de video", "Control de acceso biométrico y por credenciales"],
    PorQueElegirnos: ["Certificación en sistemas Notifier, Hochiki, Bosch", "Personal propio capacitado en normas NFPA", "Servicio de mantenimiento preventivo programado"]
  },
  103: {
    Titulo: "Telecomunicaciones",
    Subtitulo: "Comunicaciones Unificadas para la Empresa Moderna",
    Tagline: "Comunicaciones que impulsan la productividad",
    Stats: [
      { valor: "200+", label: "Sistemas de telefonía" },
      { valor: "15+", label: "Operadores integrados" },
      { valor: "99.9%", label: "Uptime garantizado" }
    ],
    Productos: [
      {
        nombre: "Central Telefónica IP",
        headline: "Comunicación empresarial sin límites",
        descripcion: "Deje atrás las centrales analógicas. La telefonía IP reduce costos, mejora la calidad de audio y permite funcionalidades imposibles antes: conferencias, grabación, IVR, integración con CRM. Todo desde cualquier dispositivo.",
        servicio_asociado: "🔧 Instalamos centrales telefónicas IP basadas en Asterisk, 3CX o Grandstream. Migración gradual, capacitación y soporte incluidos.",
        imagen: "/images/services/productos/telecomunicaciones/3.1.png",
        caracteristicas: ["VoIP de alta calidad", "Integración con móviles", "Grabación de llamadas"]
      },
      {
        nombre: "Telefonía Cloud",
        headline: "Sin inversión en hardware, máxima flexibilidad",
        descripcion: "¿Por qué comprar equipos si puede pagar por uso? La telefonía cloud le da líneas, internos y funcionalidades avanzadas sin instalar nada en su oficina. Ideal para empresas distribuidas o en crecimiento.",
        servicio_asociado: "🔧 Configuramos y migramos su telefonía a servicios cloud con numeración local, DID y SLA de disponibilidad garantizado.",
        imagen: "/images/services/productos/telecomunicaciones/3.2.png",
        caracteristicas: ["Cero hardware", "Escalabilidad infinita", "Pago por uso"]
      },
      {
        nombre: "Sistema de Voceo y PA",
        headline: "Comunicación masiva clara y profesional",
        descripcion: "Aeropuertos, hospitales, fábricas: cuando necesita que todos escuchen el mismo mensaje al mismo tiempo, necesita un sistema de voceo profesional. Audio cristalino, zonas independientes, prioridad para emergencias.",
        servicio_asociado: "🔧 Instalamos sistemas de voceo con amplificadores, parlantes de techo/pared/bocina y micrófonos. Integración con sistemas de emergencia disponible.",
        imagen: "/images/services/productos/telecomunicaciones/3.3.png",
        caracteristicas: ["Zonas independientes", "Integración con emergencias", "Audio de alta fidelidad"]
      },
      {
        nombre: "Integración Microsoft Teams",
        headline: "Telefonía nativa en su plataforma de colaboración",
        descripcion: "Sus equipos ya usan Teams. ¿Por qué salir para hacer llamadas? Integramos telefonía pública directamente en Teams: reciba y realice llamadas, vea presencia de colegas, todo en una sola interfaz.",
        servicio_asociado: "🔧 Configuramos Direct Routing o Operator Connect para Teams. Integración con su central existente o migración completa.",
        imagen: "/images/services/productos/telecomunicaciones/3.4.png",
        caracteristicas: ["Llamadas desde Teams", "Presencia unificada", "Colaboración en tiempo real"]
      },
      {
        nombre: "Radiotroncalizado Digital",
        headline: "Comunicación crítica para operaciones exigentes",
        descripcion: "Cuando WiFi y celular no alcanzan, la radio profesional sigue funcionando. Sistemas DMR y TETRA para industria, emergencias, seguridad y logística. Cobertura garantizada donde más se necesita.",
        servicio_asociado: "🔧 Implementamos sistemas de radio DMR y TETRA con repetidores, consolas de despacho y terminales móviles/portátiles.",
        imagen: "/images/services/productos/telecomunicaciones/3.5.png",
        caracteristicas: ["Cobertura extendida", "Encriptación de voz", "GPS integrado"]
      },
      {
        nombre: "Videocolaboración Profesional",
        headline: "Reuniones que parecen presenciales",
        descripcion: "La sala de reuniones del futuro: pantallas de alta definición, audio que elimina el ruido de fondo, cámaras que siguen al orador. Colaboración efectiva sin importar dónde estén los participantes.",
        servicio_asociado: "🔧 Diseñamos y equipamos salas de videoconferencia con pantallas, cámaras PTZ, audio Poly/Shure y codec de video. Integración con Teams/Zoom.",
        imagen: "/images/services/productos/telecomunicaciones/3.6.png",
        caracteristicas: ["4K Ultra HD", "Audio inmersivo", "Control táctil"]
      }
    ],
    ServiciosLista: ["Centrales telefónicas IP y híbridas", "Telefonía cloud y VoIP empresarial", "Sistemas de voceo y PA", "Integración con Microsoft Teams y Zoom"],
    PorQueElegirnos: ["Partner certificado de fabricantes líderes", "Migración gradual sin interrumpir operaciones", "Soporte técnico especializado 24/7"]
  },
  104: {
    Titulo: "Desarrollo de Software",
    Subtitulo: "Software a Medida que Impulsa su Negocio",
    Tagline: "Soluciones digitales que transforman procesos",
    Stats: [
      { valor: "50+", label: "Proyectos entregados" },
      { valor: "10+", label: "Años en desarrollo" },
      { valor: "100%", label: "Código propio" }
    ],
    Productos: [
      {
        nombre: "Desarrollo Web Full Stack",
        headline: "Aplicaciones web modernas y escalables",
        descripcion: "Desde landing pages hasta aplicaciones empresariales complejas. Desarrollamos con las tecnologías más modernas: React, Vue, Node.js, Python. Diseño responsive, rendimiento optimizado y código mantenible.",
        servicio_asociado: "🔧 Desarrollamos aplicaciones web a medida con tecnologías modernas. UX/UI, desarrollo, testing y deployment incluidos.",
        imagen: "/images/services/productos/desarrollo/4.1.png",
        caracteristicas: ["Diseño responsive", "APIs REST/GraphQL", "Despliegue en la nube"]
      },
      {
        nombre: "Aplicaciones Móviles",
        headline: "Su negocio en el bolsillo de sus clientes",
        descripcion: "Apps nativas e híbridas para iOS y Android. Desde apps de productividad interna hasta aplicaciones de cara al cliente. Offline-first, notificaciones push, integración con hardware del dispositivo.",
        servicio_asociado: "🔧 Desarrollamos apps móviles con Flutter, React Native o desarrollo nativo. Publicación en stores y mantenimiento incluido.",
        imagen: "/images/services/productos/desarrollo/4.2.png",
        caracteristicas: ["iOS y Android", "Notificaciones push", "Modo offline"]
      },
      {
        nombre: "Sistemas ERP/CRM",
        headline: "Gestión integral de su operación",
        descripcion: "Software de gestión empresarial a la medida de su operación. Ventas, compras, inventario, contabilidad, RRHH: todo integrado en una sola plataforma. Reportes en tiempo real para decisiones informadas.",
        servicio_asociado: "🔧 Implementamos y personalizamos ERP/CRM sobre plataformas existentes o desarrollo 100% a medida según complejidad.",
        imagen: "/images/services/productos/desarrollo/4.3.png",
        caracteristicas: ["Módulos integrados", "Reportes avanzados", "Multi-sucursal"]
      },
      {
        nombre: "Automatización de Procesos",
        headline: "Elimine tareas repetitivas, libere talento",
        descripcion: "RPA y workflows para automatizar lo que no agrega valor. Desde ingreso de datos hasta aprobaciones complejas. ROI medible desde el primer mes.",
        servicio_asociado: "🔧 Implementamos automatizaciones con Power Automate, Zapier o desarrollo de bots a medida. Análisis de procesos incluido.",
        imagen: "/images/services/productos/desarrollo/4.4.png",
        caracteristicas: ["ROI medible", "Integración multi-sistema", "Monitoreo en tiempo real"]
      },
      {
        nombre: "Integración de Sistemas",
        headline: "Conectamos sus sistemas para que hablen entre sí",
        descripcion: "¿Datos en silos? Desarrollamos APIs, middleware y conectores para integrar cualquier sistema: ERP, CRM, e-commerce, bancos, proveedores. Sincronización en tiempo real o por lotes.",
        servicio_asociado: "🔧 Desarrollamos integraciones mediante APIs, web services, ETL y conectores nativos. Documentación y soporte incluidos.",
        imagen: "/images/services/productos/desarrollo/4.5.png",
        caracteristicas: ["APIs personalizadas", "ETL de datos", "Sincronización en tiempo real"]
      },
      {
        nombre: "Business Intelligence",
        headline: "Transforme datos en decisiones",
        descripcion: "Dashboards y reportes que muestran lo que realmente importa. KPIs en tiempo real, alertas automáticas, drill-down para análisis profundo. Datos de múltiples fuentes en una sola vista.",
        servicio_asociado: "🔧 Implementamos soluciones BI con Power BI, Tableau o desarrollo propio. Modelado de datos y capacitación incluidos.",
        imagen: "/images/services/productos/desarrollo/4.6.png",
        caracteristicas: ["Dashboards interactivos", "KPIs en tiempo real", "Alertas automáticas"]
      }
    ],
    ServiciosLista: ["Desarrollo web y aplicaciones móviles", "Sistemas de gestión ERP/CRM", "Automatización de procesos", "Integración de APIs y sistemas"],
    PorQueElegirnos: ["Equipo de desarrollo propio en Argentina", "Metodologías ágiles certificadas", "Código fuente 100% propiedad del cliente"]
  },
  105: {
    Titulo: "Soporte TIC y Mantenimiento",
    Subtitulo: "Servicio Técnico Integral para su Infraestructura IT",
    Tagline: "Su tranquilidad tecnológica, nuestra responsabilidad",
    Stats: [
      { valor: "500+", label: "Clientes activos" },
      { valor: "<15min", label: "Tiempo de respuesta" },
      { valor: "24/7", label: "Disponibilidad" }
    ],
    Productos: [
      {
        nombre: "Mesa de Ayuda 24/7",
        headline: "Soporte técnico cuando lo necesite",
        descripcion: "Un problema técnico a las 3am puede paralizar su operación. Nuestra mesa de ayuda está disponible las 24 horas, los 7 días. Técnicos certificados, herramientas de diagnóstico remoto, escalamiento definido.",
        servicio_asociado: "🔧 Brindamos soporte nivel 1, 2 y 3 con SLA garantizado. Tickets ilimitados, reportes mensuales, mejora continua.",
        imagen: "/images/services/productos/soporte/5.1.png",
        caracteristicas: ["Respuesta en 15 minutos", "Soporte remoto y presencial", "Tickets ilimitados"]
      },
      {
        nombre: "Mantenimiento Preventivo",
        headline: "Anticipamos los problemas antes de que ocurran",
        descripcion: "El mantenimiento reactivo cuesta más que el preventivo. Visitamos periódicamente, actualizamos, limpiamos, verificamos backups, revisamos logs. Cuando algo está por fallar, lo detectamos a tiempo.",
        servicio_asociado: "🔧 Realizamos mantenimiento programado de servidores, switches, firewalls y endpoints. Reportes y recomendaciones incluidos.",
        imagen: "/images/services/productos/soporte/5.2.png",
        caracteristicas: ["Actualizaciones de seguridad", "Limpieza de equipos", "Reportes mensuales"]
      },
      {
        nombre: "Monitoreo Proactivo 24/7",
        headline: "Vigilamos su infraestructura mientras usted duerme",
        descripcion: "Dashboards en tiempo real, alertas inteligentes, correlación de eventos. Sabemos que un servidor tiene poca memoria antes de que se caiga. Intervenimos proactivamente para evitar incidentes.",
        servicio_asociado: "🔧 Implementamos monitoreo con Zabbix, Nagios o herramientas enterprise. Alertas, dashboards y respuesta automatizada.",
        imagen: "/images/services/productos/soporte/5.3.png",
        caracteristicas: ["Detección temprana", "Alertas automáticas", "Dashboards en tiempo real"]
      },
      {
        nombre: "Gestión de Incidentes ITIL",
        headline: "Procesos certificados para resolver problemas",
        descripcion: "No improvisamos. Seguimos metodología ITIL para gestión de incidentes: registro, clasificación, priorización, escalamiento, resolución, análisis de causa raíz. Mejora continua documentada.",
        servicio_asociado: "🔧 Gestionamos incidentes con herramientas ITSM profesionales. SLAs diferenciados por prioridad, reportes ejecutivos.",
        imagen: "/images/services/productos/soporte/5.4.png",
        caracteristicas: ["Escalamiento definido", "SLAs por prioridad", "Análisis de causa raíz"]
      },
      {
        nombre: "Backup y Recuperación",
        headline: "Sus datos protegidos ante cualquier evento",
        descripcion: "Ransomware, falla de disco, error humano: las amenazas son reales. Implementamos backup automático, verificamos restauración, guardamos copias offsite. Dormirá tranquilo sabiendo que puede recuperarse.",
        servicio_asociado: "🔧 Implementamos soluciones de backup local, en nube e híbrido. Testing de restauración periódico y DR planning.",
        imagen: "/images/services/productos/soporte/5.5.png",
        caracteristicas: ["Backup automático", "Recuperación rápida", "Pruebas periódicas"]
      },
      {
        nombre: "Gestión de Activos IT",
        headline: "Control total de su inventario tecnológico",
        descripcion: "¿Cuántas PCs tiene? ¿Qué software tienen instalado? ¿Cuántas licencias necesita renovar? CMDB centralizada, control de licencias, ciclo de vida de activos. Decisiones informadas sobre inversión IT.",
        servicio_asociado: "🔧 Implementamos CMDB con discovery automático, control de licencias y gestión de ciclo de vida de activos.",
        imagen: "/images/services/productos/soporte/5.6.png",
        caracteristicas: ["Inventario actualizado", "Control de licencias", "Ciclo de vida de activos"]
      }
    ],
    ServiciosLista: ["Mesa de ayuda nivel 1, 2 y 3", "Mantenimiento preventivo programado", "Gestión de incidentes ITIL", "Monitoreo proactivo de infraestructura"],
    PorQueElegirnos: ["Personal técnico certificado", "SLAs garantizados por contrato", "Herramientas de gestión ITSM profesionales"]
  },
  106: {
    Titulo: "Consultoría IT",
    Subtitulo: "Asesoramiento Estratégico en Tecnología",
    Tagline: "Decisiones tecnológicas informadas y respaldadas",
    Stats: [
      { valor: "100+", label: "Proyectos de consultoría" },
      { valor: "25+", label: "Años de experiencia" },
      { valor: "360°", label: "Visión integral" }
    ],
    Productos: [
      {
        nombre: "Auditoría de Infraestructura IT",
        headline: "Diagnóstico completo de su estado tecnológico",
        descripcion: "¿Su infraestructura está preparada para lo que viene? Evaluamos redes, servidores, seguridad, procesos y capacidades. Informe ejecutivo con hallazgos, riesgos y roadmap de mejoras priorizado.",
        servicio_asociado: "🔧 Realizamos auditorías técnicas completas con herramientas especializadas. Informe ejecutivo y técnico, presentación a directivos.",
        imagen: "/images/services/productos/consultoria/6.1.png",
        caracteristicas: ["Informe ejecutivo", "Roadmap de mejoras", "Priorización por impacto"]
      },
      {
        nombre: "Planificación Estratégica IT",
        headline: "Tecnología alineada con objetivos de negocio",
        descripcion: "La tecnología debe servir al negocio, no al revés. Desarrollamos planes IT a 3-5 años que acompañan su estrategia de crecimiento. Inversiones justificadas con ROI proyectado.",
        servicio_asociado: "🔧 Desarrollamos planes estratégicos IT con análisis de brechas, roadmap de inversiones y governance recomendado.",
        imagen: "/images/services/productos/consultoria/6.2.png",
        caracteristicas: ["Visión a largo plazo", "Presupuesto detallado", "Hitos medibles"]
      },
      {
        nombre: "Arquitectura Empresarial",
        headline: "Diseño de la estructura tecnológica óptima",
        descripcion: "Aplicaciones, datos, infraestructura: todo conectado de forma coherente. Diseñamos arquitecturas que evitan redundancias, facilitan la integración y permiten la evolución ordenada.",
        servicio_asociado: "🔧 Aplicamos frameworks TOGAF y Zachman para diseñar su arquitectura enterprise. Documentación y governance incluidos.",
        imagen: "/images/services/productos/consultoria/6.3.png",
        caracteristicas: ["Diagramas técnicos", "Documentación completa", "Gobernanza IT"]
      },
      {
        nombre: "Evaluación de Riesgos IT",
        headline: "Identifique vulnerabilidades antes de que sea tarde",
        descripcion: "Ciberseguridad, disponibilidad, cumplimiento: los riesgos IT son reales. Identificamos, cuantificamos y priorizamos. Plan de mitigación concreto y monitoreo continuo de exposición.",
        servicio_asociado: "🔧 Realizamos análisis de riesgos con metodología ISO 27005. Matriz de riesgos, planes de mitigación y seguimiento.",
        imagen: "/images/services/productos/consultoria/6.4.png",
        caracteristicas: ["Matriz de riesgos", "Plan de mitigación", "Monitoreo continuo"]
      },
      {
        nombre: "Cumplimiento Normativo",
        headline: "Asegure el cumplimiento de regulaciones",
        descripcion: "ISO 27001, PCI-DSS, Ley de Datos Personales, regulaciones sectoriales. Evaluamos su estado actual, identificamos brechas y acompañamos la remediación. Preparación para auditorías externas.",
        servicio_asociado: "🔧 Asesoramos en cumplimiento de ISO 27001, PCI-DSS, GDPR y normativas locales. Gap analysis y plan de remediación.",
        imagen: "/images/services/productos/consultoria/6.5.png",
        caracteristicas: ["Gap analysis", "Plan de remediación", "Preparación para auditorías"]
      },
      {
        nombre: "Transformación Digital",
        headline: "Guiamos la evolución digital de su organización",
        descripcion: "Transformación digital no es solo tecnología: es cultura, procesos, personas. Acompañamos proyectos de transformación con diagnóstico de madurez, roadmap digital y gestión del cambio.",
        servicio_asociado: "🔧 Lideramos iniciativas de transformación digital con metodologías probadas. Diagnóstico, roadmap, capacitación y acompañamiento.",
        imagen: "/images/services/productos/consultoria/6.6.png",
        caracteristicas: ["Diagnóstico de madurez", "Roadmap digital", "Gestión del cambio"]
      }
    ],
    ServiciosLista: ["Auditorías de infraestructura IT", "Planificación estratégica tecnológica", "Arquitectura empresarial", "Evaluación de riesgos y cumplimiento"],
    PorQueElegirnos: ["Consultores senior con experiencia regional", "Metodologías probadas internacionalmente", "Enfoque práctico orientado a resultados"]
  }
};

async function updateService(id, data) {
  const url = `${DIRECTUS_API}/items/Servicios/${id}`;
  console.log(`Updating service ${id}: ${data.Titulo}...`);
  
  const body = {
    Subtitulo: data.Subtitulo,
    Tagline: data.Tagline,
    Stats: data.Stats,
    Productos: data.Productos,
    ServiciosLista: data.ServiciosLista,
    PorQueElegirnos: data.PorQueElegirnos
  };
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to update service ${id}: ${response.status} - ${err}`);
  }
  
  console.log(`✅ Service ${id} updated successfully!`);
  return response.json();
}

async function main() {
  console.log('🚀 Starting service content update from Marketing Document...\n');
  
  for (const [id, data] of Object.entries(serviciosCompletos)) {
    try {
      await updateService(id, data);
    } catch (error) {
      console.error(`❌ Error updating service ${id}:`, error.message);
    }
  }
  
  console.log('\n✅ All services updated successfully!');
}

main();
