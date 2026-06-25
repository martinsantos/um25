import type { Servicio, ServiceCode } from "./types";

/**
 * 8 frentes de servicio de ULTIMA MILLA S.A.
 * Códigos 101-108 según el sitio real.
 *
 * Cada servicio incluye:
 * - capabilities: 6 sub-capacidades (sección "Qué cubre <Servicio>")
 * - alcanceOperativo: párrafo post-capabilities (sección "Alcance operativo")
 * - scopeOperativo: 6-8 puntos de alcance verificable (2-col grid)
 * - proceso: 4 pasos del proceso (sección "De la medición al resultado")
 * - metadata: ficha técnica (implementación, garantía, cobertura)
 */
export const SERVICIOS: Servicio[] = [
  {
    id: "srv-redes",
    code: 101,
    name: "Redes",
    slug: "redes",
    tagline: "Cableado estructurado y fibra óptica certificados.",
    description:
      "Diseño, implementación y certificación de redes de datos y fibra óptica para entornos críticos. Desde cableado estructurado en edificios corporativos hasta redes industriales en planta 24/7.",
    capabilities: [
      "Cableado estructurado categoría 6A y 8 certificado",
      "Fibra óptica monomodo y multimodo con OTDR",
      "Redes industriales tolerantes a fallas",
      "Diseño de data centers con topología spine-leaf",
      "Migraciones en caliente sin corte de servicio",
      "Documentación y certificación por normas ISO/IEC",
    ],
    alcanceOperativo:
      "Diseño e implementación de infraestructura de redes de datos en Mendoza, San Juan, San Luis y Cuyo. Soluciones completas: cableado estructurado Cat 6/6A/7, fibra óptica, radioenlaces, LAN/WAN, data centers. +94 proyectos exitosos en minería, bodegas, constructoras, gobierno y salud. Certificación TIA/EIA. Garantía extendida.",
    scopeOperativo: [
      { label: "Norma", value: "TIA/EIA-568, ISO/IEC 11801" },
      { label: "Categoría", value: "Cat 6 / 6A / 7 certificado" },
      { label: "Fibra", value: "Monomodo y multimodo, fusión y OTDR" },
      { label: "Topología", value: "Spine-leaf, colapsado, estrella" },
      { label: "Garantía", value: "5 años en materiales y mano de obra" },
      { label: "Documentación", value: "Planos, certificación y etiquetado por par" },
    ],
    proceso: [
      { title: "Relevamiento de red", description: "Medimos cobertura, puntos de demanda y cuellos de botella en el sitio." },
      { title: "Diseño y certificación", description: "Proyectamos topología, cableado y enlaces con normas y mediciones." },
      { title: "Tendido e implementación", description: "Instalamos cobre, fibra y equipos sin cortar la operación existente." },
      { title: "Monitoreo y soporte", description: "Vigilamos el tráfico, documentamos y respondemos ante cualquier falla." },
    ],
    metadata: [
      { label: "Implementación", value: "2-8 semanas" },
      { label: "Garantía", value: "5 años en materiales" },
      { label: "Cobertura", value: "Mendoza, Cuyo y Patagonia" },
    ],
    icon: "Network",
    sectorIds: [
      "aeropuertos",
      "bodegas",
      "constructoras",
      "gobierno",
      "industria",
      "mineria",
      "salud",
      "seguridad-electronica",
      "software",
    ],
  },
  {
    id: "srv-seguridad-electronica",
    code: 102,
    name: "Seguridad electrónica",
    slug: "seguridad-electronica",
    tagline: "CCTV IP, control de accesos y detección de intrusión.",
    description:
      "Sistemas de CCTV IP de alta resolución, control de accesos con biometría, detección de intrusión en perímetros y centros de monitoreo 24/7. Diseñados para edificios corporativos, aeropuertos y plantas industriales.",
    capabilities: [
      "CCTV IP con analítica de video (LPR, detección de movimiento)",
      "Control de accesos con biometría y tarjetas MIFARE",
      "Detección de intrusión en perímetros con sensores sísmicos",
      "Centro de monitoreo 24/7 con redundancia geográfica",
      "Integración con sistemas existentes (PSIM)",
      "Grabación con retención configurable y cifrado",
    ],
    alcanceOperativo:
      "Diseño, instalación y monitoreo de sistemas de seguridad electrónica en Mendoza, San Juan, San Luis y Cuyo. Cobertura CCTV IP, control de accesos biométrico, detección de intrusión perimetral y centros de monitoreo 24/7. +120 proyectos en aeropuertos, minería, gobierno e industria. Cumplimiento de normativas IRAM y privacidad.",
    scopeOperativo: [
      { label: "Cámaras", value: "IP 4K, analítica LPR y detección de movimiento" },
      { label: "Accesos", value: "Biometría, MIFARE y control por horario" },
      { label: "Perímetro", value: "Sensores sísmicos, barreras microondas y láser" },
      { label: "Monitoreo", value: "NOC 24/7 con redundancia geográfica" },
      { label: "Integración", value: "PSIM, VMS y sistemas existentes" },
      { label: "Retención", value: "Grabación cifrada con política configurable" },
    ],
    proceso: [
      { title: "Relevamiento de riesgo", description: "Mapeamos activos, zonas críticas, líneas de visión y vectores de intrusión." },
      { title: "Diseño y certificación", description: "Definimos cobertura, integración PSIM y cumplimiento normativo." },
      { title: "Instalación y comisión", description: "Tendemos cámaras, lectores y sensores sin detener la operación." },
      { title: "Monitoreo y respuesta", description: "NOC 24/7 vigila, escala y documenta cada incidente detectado." },
    ],
    metadata: [
      { label: "Implementación", value: "2-6 semanas" },
      { label: "Garantía", value: "3 años en equipos" },
      { label: "Cobertura", value: "Mendoza, Cuyo y Patagonia" },
    ],
    icon: "ShieldCheck",
    sectorIds: [
      "aeropuertos",
      "bodegas",
      "constructoras",
      "gobierno",
      "industria",
      "mineria",
      "salud",
      "seguridad-electronica",
    ],
  },
  {
    id: "srv-telecomunicaciones",
    code: 103,
    name: "Telecomunicaciones",
    slug: "telecomunicaciones",
    tagline: "Enlaces de radio y satelitales para sitios remotos.",
    description:
      "Enlaces de microondas, radioenlaces y conexiones satelitales para campamentos mineros, terminales aeroportuarias y sedes remotas. Cobertura donde la última milla no llega por cable.",
    capabilities: [
      "Enlaces de microondas licenciados y no licenciados",
      "Conectividad satelital VSAT para sitios remotos",
      "Radios trunking y redes privadas de voz",
      "Sistemas de telefonía IP corporativa",
      "Redes PMR/TETRA para emergencias",
      "Mantenimiento de torres y cableados de antena",
    ],
    alcanceOperativo:
      "Diseño e implementación de enlaces de telecomunicaciones en Mendoza, San Juan, San Luis, Patagonia y zonas remotas. Radioenlaces licenciados, VSAT satelital, trunking y telefonía IP. +60 enlaces activos en minería, aeropuertos y oil & gas. Mantenimiento de torres y certificación de enlaces.",
    scopeOperativo: [
      { label: "Banda", value: "Licenciada y no licenciada (6–80 GHz)" },
      { label: "Satelital", value: "VSAT Ku/Ka con backup automático" },
      { label: "Voz", value: "Telefonía IP, trunking y TETRA" },
      { label: "Torres", value: "Mantenimiento, inspección y certificación" },
      { label: "SLA", value: "Disponibilidad 99.5% medible por enlace" },
      { label: "Redundancia", value: "Hot-standby conmutación automática" },
    ],
    proceso: [
      { title: "Relevamiento de sitio", description: "Medimos línea de vista, interferencia y disponibilidad de banda." },
      { title: "Diseño y licencia", description: "Proyectamos enlaces, gestionamos permisos y certificamos disponibilidad." },
      { title: "Instalación y alineación", description: "Montamos torres, radios y antenas con alineación milimétrica." },
      { title: "Monitoreo y mantenimiento", description: "Vigilamos cada enlace y mantenemos torres y cableados." },
    ],
    metadata: [
      { label: "Implementación", value: "3-10 semanas" },
      { label: "Garantía", value: "2 años en equipos" },
      { label: "Cobertura", value: "Cuyo, Patagonia y zonas remotas" },
    ],
    icon: "Radio",
    sectorIds: [
      "aeropuertos",
      "mineria",
      "seguridad-electronica",
    ],
  },
  {
    id: "srv-software-medida",
    code: 104,
    name: "Software a medida",
    slug: "software-a-medida",
    tagline: "ERPs, plataformas web y APIs que escalan con tu operación.",
    description:
      "Desarrollo de software a medida: ERPs, plataformas e-commerce, APIs de integración, aplicaciones web y mobile. Arquitectura cloud-native con pipelines CI/CD y observabilidad de extremo a extremo.",
    capabilities: [
      "ERPs y sistemas de gestión a medida",
      "Plataformas e-commerce headless",
      "APIs REST y GraphQL con autenticación OAuth2",
      "Aplicaciones web Next.js y mobile React Native",
      "Pipelines CI/CD con Git y contenedores",
      "Observabilidad con métricas, logs y trazas",
    ],
    alcanceOperativo:
      "Diseño, desarrollo y mantenimiento de software a medida para empresas de Mendoza, San Juan, San Luis y Argentina. ERPs, plataformas web, APIs y aplicaciones mobile. Arquitectura cloud-native, CI/CD y observabilidad. +40 sistemas en producción en gobierno, salud, bodegas y software.",
    scopeOperativo: [
      { label: "Stack", value: "Next.js, Node, PostgreSQL, contenedores" },
      { label: "Arquitectura", value: "Cloud-native, headless y event-driven" },
      { label: "APIs", value: "REST y GraphQL con OAuth2 y rate-limit" },
      { label: "CI/CD", value: "Pipelines automatizados con tests" },
      { label: "Observabilidad", value: "Métricas, logs y trazas distribuidas" },
      { label: "Soporte", value: "Mantenimiento evolutivo con SLA" },
    ],
    proceso: [
      { title: "Descubrimiento y alcance", description: "Talleres con stakeholders para definir MVP, alcance y métricas de éxito." },
      { title: "Diseño y arquitectura", description: "Modelamos datos, APIs y arquitectura con contratos verificables." },
      { title: "Desarrollo iterativo", description: "Entregamos cada 2 semanas con demos y despliegues continuos." },
      { title: "Operación y evolución", description: "Monitoreamos, medimos uso y evolucionamos con roadmap compartido." },
    ],
    metadata: [
      { label: "Implementación", value: "MVP en 8-12 semanas" },
      { label: "Garantía", value: "90 días post-launch" },
      { label: "Cobertura", value: "Argentina, remoto" },
    ],
    icon: "Code2",
    sectorIds: [
      "bodegas",
      "gobierno",
      "salud",
      "software",
    ],
  },
  {
    id: "srv-soporte-247",
    code: 105,
    name: "Soporte 24/7",
    slug: "soporte-247",
    tagline: "Mesa de ayuda y NOC con SLA de respuesta garantizado.",
    description:
      "Mesa de ayuda y NOC 24/7 con SLA de respuesta garantizado. Monitoreo proactivo de infraestructura, escalado jerárquico de incidentes y reportes mensuales de disponibilidad y cumplimiento.",
    capabilities: [
      "Mesa de ayuda 24/7 con ticketing y SLA medible",
      "NOC con monitoreo proactivo de infraestructura",
      "Escalado jerárquico de incidentes críticos",
      "Reportes mensuales de disponibilidad y SLA",
      "Mantenimiento preventivo programado",
      "Inventario y gestión de activos con Snipe-IT",
    ],
    alcanceOperativo:
      "Mesa de ayuda y NOC 24/7 para empresas de Mendoza, San Juan, San Luis y Patagonia. Monitoreo proactivo, ticketing con SLA medible y escalado jerárquico. +200 estaciones de trabajo y 50 servidores monitoreados. Reportes mensuales de disponibilidad con evidencia.",
    scopeOperativo: [
      { label: "Cobertura", value: "24/7/365 con turno real y NOC propio" },
      { label: "SLA", value: "Respuesta 15 min crítico, 1 h normal" },
      { label: "Ticketing", value: "Sistema con auditoría y evidencia" },
      { label: "Monitoreo", value: "Infraestructura, red y aplicaciones" },
      { label: "Escalado", value: "Jerárquico, con responsables y backup" },
      { label: "Reportes", value: "Mensual con disponibilidad y SLA" },
    ],
    proceso: [
      { title: "Onboarding y monitoreo", description: "Integramos tu stack al NOC y definimos umbrales y contactos." },
      { title: "Triaje y escalado", description: "Recibimos el incidente, clasificamos y escalamos al responsable." },
      { title: "Resolución y comunicación", description: "Resolvemos o escalamos al proveedor, comunicando cada paso." },
      { title: "Postmortem y mejora", description: "Documentamos el incidente y aplicamos acciones preventivas." },
    ],
    metadata: [
      { label: "Implementación", value: "1-3 semanas" },
      { label: "Garantía", value: "SLA contractual medible" },
      { label: "Cobertura", value: "Cuyo y Patagonia" },
    ],
    icon: "Headset",
    sectorIds: [
      "aeropuertos",
      "bodegas",
      "constructoras",
      "gobierno",
      "industria",
      "mineria",
      "salud",
      "seguridad-electronica",
      "software",
    ],
  },
  {
    id: "srv-consultoria-it",
    code: 106,
    name: "Consultoría IT",
    slug: "consultoria-it",
    tagline: "Arquitectura, ciberseguridad y modernización del estado.",
    description:
      "Consultoría en arquitectura de software, ciberseguridad, modernización del estado e Industria 4.0. Auditorías de infraestructura, planes de mejora y acompañamiento técnico en compras públicas.",
    capabilities: [
      "Auditorías de infraestructura y seguridad",
      "Arquitectura de software cloud-native",
      "Planes de ciberseguridad y respuesta a incidentes",
      "Consultoría en modernización del estado",
      "Acompañamiento técnico en licitaciones",
      "Roadmaps de transformación digital",
    ],
    alcanceOperativo:
      "Consultoría IT para empresas y gobierno de Mendoza, San Juan, San Luis y Argentina. Auditorías de infraestructura y seguridad, arquitectura cloud-native, ciberseguridad y acompañamiento en licitaciones. +30 procesos de modernización del estado con documentación verificable.",
    scopeOperativo: [
      { label: "Auditoría", value: "Infraestructura, seguridad y procesos" },
      { label: "Arquitectura", value: "Cloud-native, microservicios y event-driven" },
      { label: "Ciberseguridad", value: "Planes, respuesta a incidentes y forense" },
      { label: "Estado", value: "Modernización y compras públicas" },
      { label: "Licitaciones", value: "Pliegos técnicos y evaluación de propuestas" },
      { label: "Entregables", value: "Informes con evidencia y plan de mejora" },
    ],
    proceso: [
      { title: "Diagnóstico y entrevistas", description: "Relevamos infraestructura, procesos y riesgos con stakeholders." },
      { title: "Análisis y plan", description: "Identificamos brechas y proponemos plan con prioridades y costo." },
      { title: "Acompañamiento", description: "Asistimos en la ejecución, compras y validación de proveedores." },
      { title: "Medición y mejora", description: "Medimos KPIs y ajustamos el plan en iteraciones trimestrales." },
    ],
    metadata: [
      { label: "Implementación", value: "Diagnóstico en 2-4 semanas" },
      { label: "Garantía", value: "Informes verificables" },
      { label: "Cobertura", value: "Argentina, remoto" },
    ],
    icon: "ClipboardCheck",
    sectorIds: [
      "aeropuertos",
      "bodegas",
      "gobierno",
      "industria",
      "salud",
      "software",
    ],
  },
  {
    id: "srv-deteccion-incendios",
    code: 107,
    name: "Detección de incendios",
    slug: "deteccion-de-incendios",
    tagline: "Sistemas SDI certificados y mantenimiento crítico.",
    description:
      "Sistemas de detección de incendios (SDI) certificados por normas nacionales e internacionales. Mantenimiento crítico programado, pruebas periódicas y response 24/7 para edificios, hospitales y plantas industriales.",
    capabilities: [
      "Diseño e instalación de sistemas SDI certificados",
      "Detectores de humo, temperatura y llama",
      "Mantenimiento crítico programado (N+1)",
      "Pruebas periódicas y protocolos de response",
      "Integración con sistemas de evacuación",
      "Cumplimiento de normas IRAM y NFPA",
    ],
    alcanceOperativo:
      "Diseño, instalación y mantenimiento de sistemas de detección de incendios (SDI) en Mendoza, San Juan, San Luis y Patagonia. Cumplimiento de normas IRAM y NFPA. +80 sistemas certificados en hospitales, industria, minería y bodegas. Pruebas periódicas documentadas y response 24/7.",
    scopeOperativo: [
      { label: "Norma", value: "IRAM 3595, NFPA 72 y municipal" },
      { label: "Detectores", value: "Humo, temperatura, llama y multicriterio" },
      { label: "Central", value: "Direccionable con redundancia N+1" },
      { label: "Integración", value: "Evacuación, ascensores y HVAC" },
      { label: "Pruebas", value: "Periódicas documentadas con planilla" },
      { label: "Response", value: "24/7 con técnico de guardia" },
    ],
    proceso: [
      { title: "Relevamiento de riesgo", description: "Identificamos zonas, cargas de fuego y rutas de evacuación." },
      { title: "Diseño y certificación", description: "Proyectamos la central y detectores con planos y memoria de cálculo." },
      { title: "Instalación y pruebas", description: "Tendemos circuitos, instalamos detectores y ejecutamos pruebas." },
      { title: "Mantenimiento y response", description: "Plan de pruebas periódicas y guardia 24/7 para fallas." },
    ],
    metadata: [
      { label: "Implementación", value: "2-6 semanas" },
      { label: "Garantía", value: "2 años en equipos" },
      { label: "Cobertura", value: "Cuyo y Patagonia" },
    ],
    icon: "Flame",
    sectorIds: [
      "aeropuertos",
      "bodegas",
      "constructoras",
      "industria",
      "mineria",
      "salud",
      "seguridad-electronica",
    ],
  },
  {
    id: "srv-electricos-it",
    code: 108,
    name: "Eléctricos IT",
    slug: "electricos-it",
    tagline: "Tableros, PDU y energía limpia para data centers.",
    description:
      "Instalación eléctrica de uso IT: tableros, PDU, UPS, grupos electrógenos y cableado de energía para data centers y salas técnicas. Energía limpia, redundante y monitoreada con telemetría en tiempo real.",
    capabilities: [
      "Tableros eléctricos de uso IT con selectividad",
      "PDU monitoreados y grupados electrógenos",
      "UPS con autonomía dimensionada por carga crítica",
      "Sistemas de tierra dedicada y pararrayos",
      "Telemetría de energía en tiempo real",
      "Mantenimiento eléctrico programado",
    ],
    alcanceOperativo:
      "Instalación eléctrica de uso IT para data centers y salas técnicas en Mendoza, San Juan, San Luis y Cuyo. Tableros con selectividad, PDU monitoreados, UPS y grupos electrógenos con redundancia. Telemetría de energía en tiempo real. +45 salas técnicas en operación 24/7.",
    scopeOperativo: [
      { label: "Tableros", value: "Selectivos, con telemetría y bloqueo" },
      { label: "UPS", value: "Online doble conversión, autonomía por carga" },
      { label: "Grupo electrógeno", value: "Diesel con ATS y prueba semanal" },
      { label: "PDU", value: "Monitoreado por toma, con mediciones" },
      { label: "Tierra", value: "Dedicada con medición periódica" },
      { label: "Telemetría", value: "Tensión, corriente y energía en tiempo real" },
    ],
    proceso: [
      { title: "Relevamiento de carga", description: "Medimos consumo actual, proyectamos crecimiento y cargas críticas." },
      { title: "Diseño eléctrico", description: "Proyectamos tableros, UPS y tierras con memoria de cálculo." },
      { title: "Instalación y comisión", description: "Tendemos circuitos, montamos equipos y configuramos telemetría." },
      { title: "Mantenimiento y monitoreo", description: "Mantenemos equipos y vigilamos la energía en tiempo real." },
    ],
    metadata: [
      { label: "Implementación", value: "2-8 semanas" },
      { label: "Garantía", value: "2 años en materiales" },
      { label: "Cobertura", value: "Cuyo y Patagonia" },
    ],
    icon: "Zap",
    sectorIds: [
      "constructoras",
      "industria",
    ],
  },
];

export const SERVICIO_CODES = SERVICIOS.map((s) => s.code) as ServiceCode[];

export const getServicioByCode = (code: number): Servicio | undefined =>
  SERVICIOS.find((s) => s.code === code);

export const getServicioBySlug = (slug: string): Servicio | undefined =>
  SERVICIOS.find((s) => s.slug === slug);

export default SERVICIOS;
