/**
 * Tipos compartidos para los mock data de ULTIMA MILLA S.A.
 * Paleta UMSA restringida: #1A56C0, #DC2626, #2D8A2D, #333333, #000000
 * (más grises de soporte: #666666, #F5F5F5, #DDDDDD).
 */

export const UMSA_PALETTE = {
  black: "#000000",
  red: "#DC2626",
  blue: "#1A56C0",
  green: "#2D8A2D",
  darkGray: "#333333",
  mediumGray: "#666666",
  lightGray: "#F5F5F5",
  border: "#DDDDDD",
} as const;

export type AccentColor =
  | "#1A56C0"
  | "#DC2626"
  | "#2D8A2D"
  | "#333333"
  | "#000000";

export type SectorSlug =
  | "aeropuertos"
  | "bodegas"
  | "constructoras"
  | "gobierno"
  | "industria"
  | "mineria"
  | "salud"
  | "seguridad-electronica"
  | "software";

export type ServiceCode =
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108;

/** Sector industrial atendido por ULTIMA MILLA. */
export interface Sector {
  id: string;
  slug: SectorSlug;
  name: string;
  shortName: string;
  /** Nombre del ícono en lucide-react (sin importar el componente). */
  icon: string;
  description: string;
  accentColor: AccentColor;
  antecedentesCount: number;
  /** Códigos de servicio (101-108) que aplican al sector. */
  services: ServiceCode[];
  /** Emoji o clave corta para la cover (placeholder pre-SVG). */
  cover: string;
  /** 3 inquietudes operativas reales del sector. */
  highlights: string[];
}

/** Punto del alcance operativo de un servicio. */
export interface ScopeOperativoPoint {
  label: string;
  value: string;
}

/** Paso del proceso de ejecución de un servicio. */
export interface ProcesoStep {
  title: string;
  description: string;
}

/** Frente de servicio (8 frentes UMSA, códigos 101-108). */
export interface Servicio {
  id: string;
  code: ServiceCode;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  capabilities: string[];
  /** Párrafo de alcance operativo (post-capabilities). */
  alcanceOperativo: string;
  /** 6-8 puntos de alcance verificable (label/value). */
  scopeOperativo: ScopeOperativoPoint[];
  /** 4 pasos del proceso de ejecución. */
  proceso: ProcesoStep[];
  /** Metadata técnica del servicio (implementación, garantía, cobertura). */
  metadata: { label: string; value: string }[];
  /** Nombre del ícono en lucide-react. */
  icon: string;
  sectorIds: SectorSlug[];
}

export type AntecedenteStatus =
  | "verificado"
  | "operativo"
  | "mantenimiento";

/** Antecedente / caso operativo real (mock). */
export interface Antecedente {
  /** ID tipo 4 dígitos en rango 3000-3700. */
  id: number;
  title: string;
  slug: string;
  client: string;
  sectorSlug: SectorSlug;
  serviceCodes: ServiceCode[];
  year: number;
  /** 1-12. */
  month: number;
  location: string;
  scope: string[];
  status: AntecedenteStatus;
  /** Keyword descriptiva para generar/mapear cover. */
  image: string;
  summary: string;
  tags: string[];
}

export type BlogCategory =
  | "tecnico"
  | "tecnologia"
  | "proyectos"
  | "empresa"
  | "noticias";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  /** Fecha ISO YYYY-MM-DD. */
  date: string;
  readingMinutes: number;
  tags: string[];
  featured: boolean;
  summary: string;
}

export interface Stat {
  label: string;
  value: number;
  suffix: string;
}

export interface Hub {
  name: string;
  region: string;
  coords: { lat: number; lng: number };
}

export interface Company {
  name: string;
  legalName: string;
  founded: number;
  slogan: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  coverage: string[];
  email: string;
  hours: string;
  phone: string;
  socials: {
    linkedin: string;
    x: string;
  };
}

export type Stats = Stat[];
