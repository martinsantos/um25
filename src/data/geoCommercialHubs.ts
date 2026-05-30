import { SITE_URL } from '../config/seo';
import { getInstitutionalProofLines } from '../utils/verifiedProof';

export interface GeoHubServiceLink {
  id: number;
  title: string;
  href: string;
  summary: string;
}

export interface GeoHubSectorLink {
  title: string;
  href: string;
  summary: string;
}

export interface GeoHubCaseLink {
  title: string;
  client: string;
  href: string;
  sector: string;
}

export interface GeoHubFAQ {
  question: string;
  answer: string;
}

export interface GeoCommercialHub {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string;
  market: string;
  intent: 'comparison' | 'decision' | 'research';
  eyebrow: string;
  h1: string;
  lead: string;
  proof: string[];
  searchTerms: string[];
  buyerNeed: string;
  decisionFrame: string;
  operatingRisks: string[];
  services: GeoHubServiceLink[];
  sectors: GeoHubSectorLink[];
  cases: GeoHubCaseLink[];
  process: string[];
  faqs: GeoHubFAQ[];
  primaryCta: string;
  secondaryCta: string;
  secondaryHref: string;
}

const serviceHref = (id: number, slug: string) => `/servicios/${id}/${slug}`;

export const geoCommercialHubs: Record<string, GeoCommercialHub> = {
  'servicios-it-empresas-mendoza': {
    slug: 'servicios-it-empresas-mendoza',
    title: 'Servicios tecnológicos e informáticos para empresas en Mendoza',
    seoTitle: 'Servicios IT para empresas en Mendoza',
    description: 'Proveedor tecnológico local para empresas en Mendoza y Cuyo: redes, soporte, seguridad electrónica, software, energía IT, relevamiento y continuidad operativa.',
    keywords: 'servicios informaticos empresas Mendoza, empresa de sistemas Mendoza, proveedor IT Mendoza, soporte infraestructura IT Mendoza, servicios tecnologicos empresas Mendoza',
    market: 'Mendoza y Cuyo',
    intent: 'comparison',
    eyebrow: 'Proveedor IT empresarial en Mendoza',
    h1: 'Operación IT para empresas de Mendoza',
    lead: 'Infraestructura, seguridad, software, soporte y energía IT coordinados por un equipo local que releva, diseña, implementa y sostiene operaciones exigentes.',
    proof: getInstitutionalProofLines(),
    searchTerms: ['servicios informáticos para empresas Mendoza', 'empresa de sistemas Mendoza', 'proveedor IT empresarial Mendoza', 'soporte infraestructura IT Mendoza'],
    buyerNeed: 'Elegir un proveedor tecnológico capaz de combinar cercanía local, ingeniería, documentación y soporte sin fragmentar la operación entre contratistas aislados.',
    decisionFrame: 'La comparación no debería empezar por precio unitario: primero hay que entender criticidad, sedes, estado de red, seguridad, documentación, ventanas de trabajo y soporte posterior.',
    operatingRisks: ['Redes sin documentación ni certificación', 'Soporte reactivo sin trazabilidad', 'CCTV o accesos desconectados de la operación', 'Software aislado de procesos reales'],
    services: [
      { id: 101, title: 'Infraestructura de redes', href: serviceHref(101, 'infraestructura-de-redes-cableado-fibra-optica-radioenlaces'), summary: 'Cableado, fibra, switching, WiFi, radioenlaces y documentación.' },
      { id: 105, title: 'Soporte técnico 24/7', href: serviceHref(105, 'soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it'), summary: 'Mesa de ayuda, mantenimiento, monitoreo y continuidad operativa.' },
      { id: 102, title: 'Seguridad electrónica', href: serviceHref(102, 'sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi'), summary: 'CCTV, accesos, intrusión, SDI y mantenimiento documental.' },
      { id: 104, title: 'Software a medida', href: serviceHref(104, 'desarrollo-de-software-a-medida-web-mobile-erp'), summary: 'Sistemas, APIs, tableros e integraciones para procesos operativos.' }
    ],
    sectors: [
      { title: 'Bodegas', href: '/bodegas', summary: 'Plantas productivas, trazabilidad, CCTV, red industrial y soporte.' },
      { title: 'Construcción', href: '/constructoras', summary: 'Pre-cableado, tableros, racks, SDI y documentación de obra.' },
      { title: 'Salud', href: '/salud', summary: 'Disponibilidad, privacidad operativa, redes y seguridad edilicia.' },
      { title: 'Gobierno', href: '/gobiernosectorpublico', summary: 'Edificios públicos, software, videovigilancia y continuidad institucional.' }
    ],
    cases: [
      { title: 'Digitalización de procesos', client: 'Gobierno de Mendoza', href: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza', sector: 'Gobierno' },
      { title: 'Cámara de CCTV', client: 'Aeropuertos Argentina 2000', href: '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza', sector: 'Aeropuertos' },
      { title: 'Detección y mantenimiento crítico', client: 'Consorcio Torre Thays', href: '/antecedentes/3066/torre-thays-dispositivos-de-deteccion', sector: 'Seguridad' }
    ],
    process: ['Relevamiento de sitio y criticidad', 'Arquitectura técnica y alcance', 'Implementación documentada', 'Soporte, medición y mejora'],
    faqs: [
      { question: '¿ULTIMA MILLA trabaja solo en Mendoza?', answer: 'La base operativa está en Mendoza, con cobertura en Cuyo, Patagonia y proyectos en Argentina según alcance, criticidad y necesidad de soporte.' },
      { question: '¿Se puede contratar un solo servicio?', answer: 'Sí. El relevamiento define si conviene resolver una necesidad puntual o construir un plan integrado de red, seguridad, soporte, energía o software.' },
      { question: '¿Cómo se pide una cotización seria?', answer: 'Conviene enviar sede, cantidad de usuarios o puntos, criticidad, ventanas de trabajo, documentación disponible y resultado esperado.' }
    ],
    primaryCta: 'Solicitar diagnóstico',
    secondaryCta: 'Ver antecedentes',
    secondaryHref: '/antecedentes'
  },

  'presupuesto-servicios-it-empresas': {
    slug: 'presupuesto-servicios-it-empresas',
    title: 'Presupuesto de servicios tecnológicos e informáticos para empresas',
    seoTitle: 'Presupuesto de servicios IT para empresas',
    description: 'Guía comercial para cotizar servicios IT empresariales: alcance, criticidad, SLA, materiales, documentación, soporte, redes, seguridad, software y energía IT.',
    keywords: 'presupuesto servicios informaticos empresas, cotizar proyecto IT, presupuesto tecnologia empresas, cuanto cuesta infraestructura IT, proveedor IT presupuesto',
    market: 'Argentina',
    intent: 'decision',
    eyebrow: 'Presupuesto IT empresarial',
    h1: 'Cotizar servicios IT sin perder alcance',
    lead: 'Una cotización tecnológica seria separa diagnóstico, materiales, ingeniería, ejecución, documentación, SLA, soporte posterior e integraciones reales.',
    proof: ['Alcance técnico verificable', 'Riesgo operativo medido', 'Entregables documentados', 'Próximo paso comercial claro'],
    searchTerms: ['presupuesto tecnología para empresas', 'cotizar proyecto IT', 'presupuesto infraestructura IT', 'costo soporte técnico empresarial'],
    buyerNeed: 'Pasar de una consulta genérica de precio a una conversación de alcance: qué se debe relevar, qué se entrega, qué riesgos se cubren y cómo se sostiene después.',
    decisionFrame: 'Un presupuesto bajo puede ocultar omisiones críticas: certificación, pruebas, documentación, ventanas de trabajo, licencias, viáticos, soporte o integraciones.',
    operatingRisks: ['Comparar precios sin comparar alcance', 'No separar obra, soporte y documentación', 'Contratar sin SLA ni criterio de criticidad', 'Dejar integraciones y materiales fuera del presupuesto'],
    services: [
      { id: 106, title: 'Consultoría IT', href: serviceHref(106, 'consultoria-it-y-transformacion-digital-arquitectura-auditoria'), summary: 'Diagnóstico, arquitectura, auditoría y roadmap técnico.' },
      { id: 101, title: 'Infraestructura de redes', href: serviceHref(101, 'infraestructura-de-redes-cableado-fibra-optica-radioenlaces'), summary: 'Puntos, racks, fibra, certificación, switching y pruebas.' },
      { id: 105, title: 'Soporte técnico 24/7', href: serviceHref(105, 'soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it'), summary: 'Abonos, tickets, mantenimiento, visitas y continuidad.' },
      { id: 108, title: 'Servicios eléctricos para IT', href: serviceHref(108, 'servicios-electricos-para-it'), summary: 'UPS, tableros, puesta a tierra, energía dedicada y racks.' }
    ],
    sectors: [
      { title: 'Industria', href: '/industria', summary: 'Plantas activas, ventanas de trabajo y continuidad productiva.' },
      { title: 'Salud', href: '/salud', summary: 'Entornos sensibles con disponibilidad y trazabilidad.' },
      { title: 'Bodegas', href: '/bodegas', summary: 'Redes, seguridad y soporte para operación vitivinícola.' },
      { title: 'Construcción', href: '/constructoras', summary: 'Infraestructura IT planificada desde obra.' }
    ],
    cases: [
      { title: 'Instalación eléctrica para data center', client: 'Hospital A. Italo Perrupato', href: '/antecedentes/3069/instalacion-electrica-para-data-center', sector: 'Salud' },
      { title: 'Mantenimiento crítico de detección', client: 'Torre Thays', href: '/antecedentes/3067/mantenimiento-critico-de-sistemas-de-deteccion-torre-thays', sector: 'Seguridad' },
      { title: 'Digitalización de procesos', client: 'Gobierno de Mendoza', href: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza', sector: 'Gobierno' }
    ],
    process: ['Definir necesidad y criticidad', 'Relevar sitio, sedes y restricciones', 'Separar alcance, entregables y SLA', 'Presentar propuesta comparable'],
    faqs: [
      { question: '¿Publican precios fijos?', answer: 'No como lista cerrada. Para servicios IT empresariales, el presupuesto depende de sitio, alcance, criticidad, SLA, materiales, integraciones y documentación.' },
      { question: '¿Qué información acelera una cotización?', answer: 'Sedes, cantidad de usuarios o puntos, planos, fotos de racks, servicios esperados, ventanas de trabajo y criticidad del negocio.' },
      { question: '¿Se puede empezar con un diagnóstico?', answer: 'Sí. Un diagnóstico permite ordenar riesgos, quick wins, inversión inicial y fases antes de comprometer una implementación mayor.' }
    ],
    primaryCta: 'Cotizar alcance',
    secondaryCta: 'Enviar información técnica',
    secondaryHref: '/contacto'
  },

  'proyectos-ingenieria-it-mendoza': {
    slug: 'proyectos-ingenieria-it-mendoza',
    title: 'Proyectos de ingeniería tecnológica e infraestructura en Mendoza',
    seoTitle: 'Proyectos de ingeniería IT en Mendoza',
    description: 'Proyectos de ingeniería tecnológica en Mendoza: relevamiento, arquitectura, redes, telecomunicaciones, energía IT, detección, pruebas, documentación y soporte.',
    keywords: 'proyectos ingenieria IT Mendoza, infraestructura redes Mendoza, corrientes debiles Mendoza, ingenieria tecnologica empresas Mendoza',
    market: 'Mendoza, Cuyo y sitios remotos',
    intent: 'research',
    eyebrow: 'Ingeniería tecnológica',
    h1: 'Ingeniería IT para obras y operación',
    lead: 'Relevamiento, arquitectura, instalación, pruebas, transferencia y soporte para redes, energía, telecomunicaciones, seguridad y sistemas críticos.',
    proof: ['Relevamiento en sitio', 'Planos y documentación', 'Puesta en marcha verificable', 'Soporte posterior'],
    searchTerms: ['proyectos ingeniería IT Mendoza', 'corrientes débiles Mendoza', 'proyecto infraestructura redes Mendoza', 'ingeniería tecnológica empresas Mendoza'],
    buyerNeed: 'Resolver proyectos donde la tecnología se cruza con obra, operación, seguridad, energía, plazos, normativa y mantenimiento posterior.',
    decisionFrame: 'La ingeniería IT debe empezar por riesgo y condiciones de campo: edificios activos, sitios remotos, ventanas acotadas, continuidad del servicio y documentación final.',
    operatingRisks: ['Ejecutar sin relevamiento de campo', 'No documentar planos ni pruebas', 'Subestimar energía, racks y canalizaciones', 'No coordinar con obra civil o mantenimiento'],
    services: [
      { id: 101, title: 'Infraestructura de redes', href: serviceHref(101, 'infraestructura-de-redes-cableado-fibra-optica-radioenlaces'), summary: 'Cableado, fibra, racks, switching y certificación.' },
      { id: 103, title: 'Telecomunicaciones', href: serviceHref(103, 'telecomunicaciones-datos-voz-video'), summary: 'Datos, voz, video, radioenlaces y comunicación distribuida.' },
      { id: 108, title: 'Servicios eléctricos para IT', href: serviceHref(108, 'servicios-electricos-para-it'), summary: 'Tableros, UPS, puesta a tierra y continuidad eléctrica.' },
      { id: 107, title: 'Detección de incendios', href: serviceHref(107, 'sistemas-de-deteccion-y-alarma-de-incendios'), summary: 'Ingeniería, sensores, paneles, pruebas y mantenimiento.' }
    ],
    sectors: [
      { title: 'Construcción', href: '/constructoras', summary: 'Tecnología incorporada desde la obra.' },
      { title: 'Minería', href: '/mineria', summary: 'Sitios remotos con enlaces, energía y soporte.' },
      { title: 'Industria', href: '/industria', summary: 'Ambientes productivos con mínima interrupción.' },
      { title: 'Aeropuertos', href: '/aeropuertos', summary: 'Operación continua, comunicaciones y seguridad.' }
    ],
    cases: [
      { title: 'Cámara de CCTV', client: 'Aeropuertos Argentina 2000', href: '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza', sector: 'Aeropuertos' },
      { title: 'Instalación eléctrica para data center', client: 'Hospital A. Italo Perrupato', href: '/antecedentes/3069/instalacion-electrica-para-data-center', sector: 'Salud' },
      { title: 'Dispositivos de detección', client: 'Consorcio Torre Thays', href: '/antecedentes/3066/torre-thays-dispositivos-de-deteccion', sector: 'Seguridad' }
    ],
    process: ['Relevamiento técnico y restricciones', 'Arquitectura y documentación', 'Ejecución con ventanas operativas', 'Pruebas, entrega y soporte'],
    faqs: [
      { question: '¿Qué diferencia un proyecto de ingeniería IT de una instalación común?', answer: 'La ingeniería define alcance, riesgos, documentación, pruebas, coordinación con otros gremios y soporte posterior; no se limita a instalar equipos.' },
      { question: '¿Trabajan con obras en curso?', answer: 'Sí. La planificación debe coordinar canalizaciones, racks, energía, tableros, seguridad y puesta en marcha con obra civil y mantenimiento.' },
      { question: '¿Entregan documentación final?', answer: 'El objetivo del proyecto es dejar infraestructura funcionando, probada y documentada para operación y mantenimiento.' }
    ],
    primaryCta: 'Solicitar relevamiento',
    secondaryCta: 'Ver proyectos',
    secondaryHref: '/antecedentes'
  },

  'servicios-it-empresas-argentina': {
    slug: 'servicios-it-empresas-argentina',
    title: 'Servicios tecnológicos e informáticos para empresas en Argentina',
    seoTitle: 'Servicios IT para empresas en Argentina',
    description: 'Servicios IT empresariales para Argentina: consultoría, software, soporte, telecomunicaciones, redes, seguridad y continuidad operativa con base en Mendoza.',
    keywords: 'servicios informaticos empresas Argentina, proveedor IT Argentina, soporte tecnico empresarial Argentina, empresa servicios IT organizaciones medianas',
    market: 'Argentina y Latinoamérica hispanohablante',
    intent: 'comparison',
    eyebrow: 'Proveedor IT con base argentina',
    h1: 'Servicios IT para sedes en Argentina',
    lead: 'Consultoría, software, soporte, telecomunicaciones e infraestructura para organizaciones que necesitan un proveedor tecnológico con método, documentación y experiencia regional.',
    proof: ['Base operativa en Mendoza', 'Cobertura nacional según alcance', 'Servicios integrados', 'Evidencia pública y anonimizada'],
    searchTerms: ['servicios informáticos para empresas Argentina', 'proveedor IT Argentina', 'soporte técnico empresarial Argentina', 'empresa servicios IT organizaciones medianas'],
    buyerNeed: 'Encontrar un proveedor capaz de operar con criterio local, soporte remoto, visitas planificadas, documentación y continuidad para sedes distribuidas.',
    decisionFrame: 'Para cobertura nacional conviene separar consultoría, ejecución local, soporte remoto, visitas, documentación, seguridad, software e integraciones.',
    operatingRisks: ['Proveedor remoto sin evidencia operativa', 'Sedes con criterios técnicos distintos', 'Soporte sin documentación ni trazabilidad', 'Software desconectado de infraestructura real'],
    services: [
      { id: 106, title: 'Consultoría IT', href: serviceHref(106, 'consultoria-it-y-transformacion-digital-arquitectura-auditoria'), summary: 'Roadmaps, auditoría, arquitectura y transferencia.' },
      { id: 104, title: 'Software a medida', href: serviceHref(104, 'desarrollo-de-software-a-medida-web-mobile-erp'), summary: 'Aplicaciones, APIs e integraciones con procesos reales.' },
      { id: 105, title: 'Soporte técnico 24/7', href: serviceHref(105, 'soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it'), summary: 'Mesa, mantenimiento, monitoreo y continuidad.' },
      { id: 103, title: 'Telecomunicaciones', href: serviceHref(103, 'telecomunicaciones-datos-voz-video'), summary: 'Conectividad, voz, video y operación distribuida.' }
    ],
    sectors: [
      { title: 'Gobierno', href: '/gobiernosectorpublico', summary: 'Escala, auditoría y continuidad institucional.' },
      { title: 'Minería', href: '/mineria', summary: 'Sitios remotos, enlaces y soporte planificado.' },
      { title: 'Industria', href: '/industria', summary: 'Plantas activas, robustez y mantenimiento.' },
      { title: 'Salud', href: '/salud', summary: 'Disponibilidad y seguridad para edificios sensibles.' }
    ],
    cases: [
      { title: 'Digitalización de procesos', client: 'Gobierno de Mendoza', href: '/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza', sector: 'Gobierno' },
      { title: 'CCTV aeroportuario', client: 'Aeropuertos Argentina 2000', href: '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza', sector: 'Aeropuertos' },
      { title: 'Mantenimiento crítico de sistemas', client: 'Torre Thays', href: '/antecedentes/3067/mantenimiento-critico-de-sistemas-de-deteccion-torre-thays', sector: 'Seguridad' }
    ],
    process: ['Diagnóstico remoto o presencial', 'Arquitectura por sedes y criticidad', 'Ejecución local o coordinada', 'Soporte y documentación reusable'],
    faqs: [
      { question: '¿Atienden empresas fuera de Mendoza?', answer: 'Sí, según alcance y criticidad. El modelo combina consultoría, ejecución planificada, soporte remoto, visitas y documentación.' },
      { question: '¿Qué tipo de empresas encajan mejor?', answer: 'Organizaciones medianas con infraestructura, sedes, sistemas, seguridad o soporte que requieren continuidad operativa y trazabilidad.' },
      { question: '¿Cómo se evita depender de una sola persona?', answer: 'Con documentación, tablero de soporte, transferencia, procedimientos y arquitectura entendible para operación.' }
    ],
    primaryCta: 'Hablar con un especialista',
    secondaryCta: 'Ver servicios',
    secondaryHref: '/servicios'
  }
};

export const geoCommercialHubSlugs = Object.keys(geoCommercialHubs);

export function getGeoCommercialHub(slug: string): GeoCommercialHub | undefined {
  return geoCommercialHubs[slug];
}

export function buildGeoHubStructuredData(hub: GeoCommercialHub) {
  const canonical = `${SITE_URL}/${hub.slug}`;
  return [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: hub.title,
      description: hub.description,
      inLanguage: 'es-AR',
      about: hub.searchTerms,
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Empresas y organizaciones que compran servicios IT'
      },
      mainEntity: {
        '@id': `${canonical}#service`
      }
    },
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: hub.title,
      serviceType: 'Servicios IT empresariales',
      description: hub.lead,
      areaServed: hub.market,
      provider: {
        '@type': 'Organization',
        name: 'ULTIMA MILLA',
        url: SITE_URL
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Capacidades relacionadas',
        itemListElement: hub.services.map((service, index) => ({
          '@type': 'Offer',
          position: index + 1,
          itemOffered: {
            '@type': 'Service',
            name: service.title,
            url: `${SITE_URL}${service.href}`,
            description: service.summary
          }
        }))
      }
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#evidence`,
      name: 'Evidencia y antecedentes relacionados',
      itemListElement: hub.cases.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${item.client}: ${item.title}`,
        url: `${SITE_URL}${item.href}`
      }))
    },
    {
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: hub.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }
  ];
}
