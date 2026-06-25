import type { Sector, SectorSlug } from "./types";

/**
 * 9 sectores reales de ULTIMA MILLA S.A.
 * Distribución de antecedentesCount suma 510 (consistente con ~518 operativos).
 */
export const SECTORES: Sector[] = [
  {
    id: "sec-aeropuertos",
    slug: "aeropuertos",
    name: "Aeropuertos",
    shortName: "Aeropuertos",
    icon: "Plane",
    description:
      "Infraestructura IT crítica para terminales aeroportuarias: CCTV de perímetro, redes de datos certificadas, sistemas de detección de incendios certificados por normas aeronáuticas y soporte 24/7 para operaciones que no pueden detenerse.",
    accentColor: "#1A56C0",
    antecedentesCount: 58,
    services: [101, 102, 103, 105, 107],
    cover: "✈️",
    highlights: [
      "CCTV de perímetro 24/7",
      "Redes críticas con redundancia",
      "SDI certificado por normas aeronáuticas",
    ],
  },
  {
    id: "sec-bodegas",
    slug: "bodegas",
    name: "Bodegas",
    shortName: "Bodegas",
    icon: "Grape",
    description:
      "Continuidad operativa para bodegas: redes industriales en sala de frío y cava, software de trazabilidad vitivinícola, detección de incendios en depósitos y monitoreo remoto de tanques de fermentación durante cosecha.",
    accentColor: "#2D8A2D",
    antecedentesCount: 67,
    services: [101, 104, 105, 106, 107],
    cover: "🍇",
    highlights: [
      "Trazabilidad vitivinícola end-to-end",
      "SDI en cavas y depósitos",
      "Monitoreo de tanques durante cosecha",
    ],
  },
  {
    id: "sec-constructoras",
    slug: "constructoras",
    name: "Constructoras",
    shortName: "Constructoras",
    icon: "HardHat",
    description:
      "Infraestructura IT para edificios inteligentes y obras: cableado estructurado certificado, sistemas de detección de incendios en torres, CCTV en obra y garajes, instalación eléctrica IT para data centers corporativos.",
    accentColor: "#333333",
    antecedentesCount: 54,
    services: [101, 102, 105, 107, 108],
    cover: "🏗️",
    highlights: [
      "Cableado estructurado certificado",
      "SDI en torres residenciales",
      "Eléctricos IT para data centers",
    ],
  },
  {
    id: "sec-gobierno",
    slug: "gobierno",
    name: "Gobierno y Sector Público",
    shortName: "Gobierno",
    icon: "Landmark",
    description:
      "Modernización del Estado: digitalización de trámites, redes de datos en sedes administrativas y judiciales, CCTV de seguridad ciudadana, soporte IT de alta disponibilidad para data centers gubernamentales.",
    accentColor: "#1A56C0",
    antecedentesCount: 72,
    services: [101, 102, 104, 105, 106],
    cover: "🏛️",
    highlights: [
      "Digitalización de trámites",
      "Data centers de alta disponibilidad",
      "CCTV para seguridad ciudadana",
    ],
  },
  {
    id: "sec-industria",
    slug: "industria",
    name: "Industria",
    shortName: "Industria",
    icon: "Factory",
    description:
      "Redes industriales y sistemas de seguridad para plantas 24/7: cableado estructurado en líneas de producción, detección de incendios en naves y salas de calderas, mantenimiento crítico y consultoría Industria 4.0.",
    accentColor: "#DC2626",
    antecedentesCount: 63,
    services: [101, 102, 105, 107, 108],
    cover: "🏭",
    highlights: [
      "Redes industriales en planta 24/7",
      "SDI en naves y salas de calderas",
      "Mantenimiento crítico programado",
    ],
  },
  {
    id: "sec-mineria",
    slug: "mineria",
    name: "Minería",
    shortName: "Minería",
    icon: "Pickaxe",
    description:
      "Conectividad para faenas remotas: redes de datos y fibra óptica, telecomunicaciones en campamentos mineros, CCTV en polvorines y túneles, sistemas de detección en casas de fuerza y subestaciones.",
    accentColor: "#333333",
    antecedentesCount: 41,
    services: [101, 102, 103, 105, 107],
    cover: "⛏️",
    highlights: [
      "Telecomunicaciones en campamento remoto",
      "CCTV en polvorines y túneles",
      "Soporte 24/7 para faena continua",
    ],
  },
  {
    id: "sec-salud",
    slug: "salud",
    name: "Salud",
    shortName: "Salud",
    icon: "HeartPulse",
    description:
      "Infraestructura IT hospitalaria crítica: racks y patch panels certificados, redes para imágenes médicas, software de gestión de pacientes e historia clínica digital, soporte 24/7 para guardias y terapia intensiva.",
    accentColor: "#DC2626",
    antecedentesCount: 69,
    services: [101, 102, 104, 105, 106],
    cover: "🏥",
    highlights: [
      "Redes para imágenes médicas",
      "Historia clínica digital",
      "Soporte 24/7 para terapia intensiva",
    ],
  },
  {
    id: "sec-seguridad-electronica",
    slug: "seguridad-electronica",
    name: "Seguridad Electrónica",
    shortName: "Seguridad",
    icon: "ShieldCheck",
    description:
      "Centros de monitoreo 24/7, control de accesos con biometría, CCTV IP de alta resolución, detección de intrusión en perímetros y sistemas de detección de incendios certificados para edificios corporativos y centros comerciales.",
    accentColor: "#000000",
    antecedentesCount: 48,
    services: [101, 102, 103, 105, 107],
    cover: "🛡️",
    highlights: [
      "Centro de monitoreo 24/7",
      "Control de accesos con biometría",
      "Detección de intrusión en perímetro",
    ],
  },
  {
    id: "sec-software",
    slug: "software",
    name: "Software",
    shortName: "Software",
    icon: "Code2",
    description:
      "Desarrollo de software a medida: ERPs, plataformas e-commerce, APIs de integración, pipelines CI/CD y arquitectura cloud-native para clientes que necesitan plataformas confiables y escalables.",
    accentColor: "#1A56C0",
    antecedentesCount: 38,
    services: [101, 104, 105, 106],
    cover: "💻",
    highlights: [
      "ERPs y plataformas a medida",
      "Pipelines CI/CD y DevOps",
      "Arquitectura cloud-native",
    ],
  },
];

export const SECTOR_SLUGS = SECTORES.map((s) => s.slug) as SectorSlug[];

export const getSectorBySlug = (slug: string): Sector | undefined =>
  SECTORES.find((s) => s.slug === slug);

export const getSectorById = (id: string): Sector | undefined =>
  SECTORES.find((s) => s.id === id);

export default SECTORES;
