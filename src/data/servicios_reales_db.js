// SERVICIOS REALES DE LA BASE DE DATOS
// Recuperados desde datos_servicios.sql
// Total: 5 servicios

export const serviciosReales = [
  {
    "id": 1,
    "Titulo": "Servicios IT",
    "Descripcion": "Redes de Datos.\\ Seguridad.\\ Telecomunicaciones.\\ Software.\\ Acceso.",
    "Area": "Telecomunicaciones",
    "Cliente": "Instituciones",
    "Unidad_de_negocio": "Redes",
    "Imagen": "2749f988-2e2d-4f32-9978-4dbeb4aa6ab2",
    "Presupuesto": 200000,
    "Servicios": [
      "Consultoría IT",
      "Soporte técnico",
      "Mantenimiento",
      "Capacitación",
      "Auditorías"
    ],
    "Caracteristicas": [
      "Experiencia comprobada",
      "Soluciones integrales",
      "Atención personalizada",
      "Tecnología actualizada",
      "Resultados garantizados"
    ]
  },
  {
    "id": 2,
    "Titulo": "Redes de datos",
    "Descripcion": "¿Es fiable su red de datos?\\ \\ ¿Tiene un plan de contingencias para la conexión a internet de su organización?\\ \\ Ultima Milla ofrece servicios de ingeniería de telecomunicaciones, redes de cableado estructurado, fibra óptica y radioenlaces.\\ \\ Existe un amplio catálogo de casos que demuestran nuestra experiencia en el diseño, la ingeniería y la instalación de redes de datos.",
    "Area": "Telecomunicaciones",
    "Cliente": "Instituciones",
    "Unidad_de_negocio": "Redes",
    "Imagen": "18b5f4e3-4bc8-485d-a01c-8cbd53e25f4d",
    "Presupuesto": 200000,
    "Servicios": [
      "Cableado estructurado",
      "Fibra óptica",
      "Radioenlaces",
      "Redes LAN/WAN",
      "Ingeniería de telecomunicaciones"
    ],
    "Caracteristicas": [
      "Diseño personalizado de red",
      "Alta velocidad y confiabilidad",
      "Redundancia y contingencias",
      "Escalabilidad futura",
      "Soporte técnico especializado"
    ]
  },
  {
    "id": 3,
    "Titulo": "Seguridad Informática",
    "Descripcion": "Sistemas de detección de incendios, Alarmas de intrusión, Sistema de cámaras de seguridad (CCTV), Controles de acceso, Sistema de control de Edificios Inteligentes (BMS)\\ \\",
    "Area": "Seguridad",
    "Cliente": "Empresas",
    "Unidad_de_negocio": "Ciberseguridad",
    "Imagen": "f2a65085-e6ad-49fc-a123-1b5dc19fc7ab",
    "Presupuesto": 150000,
    "Servicios": [
      "Sistemas de detección de incendios",
      "Alarmas de intrusión",
      "CCTV y videovigilancia",
      "Control de acceso",
      "Edificios inteligentes (BMS)"
    ],
    "Caracteristicas": [
      "Monitoreo 24/7 en tiempo real",
      "Integración con sistemas existentes",
      "Alertas automáticas y notificaciones",
      "Análisis de video inteligente",
      "Respuesta rápida ante emergencias"
    ]
  },
  {
    "id": 4,
    "Titulo": "Telefonía y Citoina",
    "Descripcion": "Telefonía IP, Citofonía (porteros eléctricos)",
    "Area": "Telecomunicaciones",
    "Cliente": "Edificios",
    "Unidad_de_negocio": "Telefonía",
    "Imagen": "4ffcefb0-6cb8-4cfa-a748-bd4c3da1d716",
    "Presupuesto": 100000,
    "Servicios": [
      "Telefonía IP",
      "Citofonía",
      "Porteros eléctricos",
      "Intercomunicadores",
      "Sistemas de audio"
    ],
    "Caracteristicas": [
      "Tecnología VoIP avanzada",
      "Integración con redes existentes",
      "Calidad de audio superior",
      "Fácil administración",
      "Costos reducidos"
    ]
  },
  {
    "id": 6,
    "Titulo": "Servicios Web",
    "Descripcion": "Alojamiento web, API a servicios web, administración de recursos digitales y activos en la nube. Gestión de información corporativa de organizaciones y pequeñas empresas.",
    "Area": "Desarrollo",
    "Cliente": "Empresas",
    "Unidad_de_negocio": "Web",
    "Imagen": "dc6d6069-23af-4d75-ae5a-38c830bf2b85",
    "Presupuesto": 180000,
    "Servicios": [
      "Alojamiento web",
      "APIs y servicios web",
      "Gestión en la nube",
      "Recursos digitales",
      "Información corporativa"
    ],
    "Caracteristicas": [
      "Alta disponibilidad",
      "Escalabilidad automática",
      "Seguridad avanzada",
      "Backup automático",
      "Soporte 24/7"
    ]
  }
];

// Convertir a objeto indexado por ID para búsqueda rápida
export const serviciosPorId = serviciosReales.reduce((acc, servicio) => {
  acc[servicio.id] = servicio;
  return acc;
}, {});

export default serviciosReales;
