/**
 * Mapa de imágenes reales extraídas de ultimamilla.com.ar
 * + covers generados para sectores/servicios.
 *
 * Las imágenes de antecedentes (3064-3088.webp) son reales, descargadas
 * desde https://www.ultimamilla.com.ar/images/antecedentes/generated/
 * Las imágenes de servicios (8) y sectores (9) son reales, descargadas
 * desde https://www.ultimamilla.com.ar/images/editorial/
 */

import type { SectorSlug, ServiceCode } from "./types";

// ── Imágenes reales por ID de antecedente (del sitio actual) ──
const REAL_IMG = {
  "3064": "/img/antecedentes/3064.webp",
  "3065": "/img/antecedentes/3065.webp",
  "3067": "/img/antecedentes/3067.webp",
  "3068": "/img/antecedentes/3068.webp",
  "3069": "/img/antecedentes/3069.webp",
  "3071": "/img/antecedentes/3071.webp",
  "3072": "/img/antecedentes/3072.webp",
  "3073": "/img/antecedentes/3073.webp",
  "3074": "/img/antecedentes/3074.webp",
  "3075": "/img/antecedentes/3075.webp",
  "3076": "/img/antecedentes/3076.webp",
  "3078": "/img/antecedentes/3078.webp",
  "3079": "/img/antecedentes/3079.webp",
  "3080": "/img/antecedentes/3080.webp",
  "3081": "/img/antecedentes/3081.webp",
  "3082": "/img/antecedentes/3082.webp",
  "3087": "/img/antecedentes/3087.webp",
  "3088": "/img/antecedentes/3088.webp",
} as const;

// ── Mapeo temático: sector + servicio → imágenes reales que aplican ──
// Define qué imágenes reales usar para cada combinación sector/servicio.
type Theme = keyof typeof REAL_IMG;

const THEME_BY_SECTOR: Record<SectorSlug, Theme[]> = {
  aeropuertos: ["3065", "3068", "3080", "3076", "3087", "3088"],
  bodegas: ["3081", "3082", "3069"],
  constructoras: ["3067", "3069", "3082"],
  gobierno: ["3064", "3079", "3071"],
  industria: ["3071", "3069", "3082"],
  mineria: ["3068", "3067", "3069"],
  salud: ["3072", "3073", "3074", "3075", "3078"],
  "seguridad-electronica": ["3065", "3078", "3067"],
  software: ["3064", "3079"],
};

const THEME_BY_SERVICE: Record<ServiceCode, Theme[]> = {
  101: ["3068", "3080", "3081", "3082", "3073", "3074", "3075", "3088"], // Redes
  102: ["3065", "3078", "3072"], // Seguridad electrónica
  103: ["3068", "3080", "3082", "3087"], // Telecomunicaciones
  104: ["3064"], // Software
  105: ["3079", "3072"], // Soporte 24/7
  106: ["3064", "3079"], // Consultoría
  107: ["3067", "3071", "3076"], // Detección incendios
  108: ["3069"], // Eléctricos IT
};

// ── Covers editoriales REALES de sectores (de /images/editorial/) ──
const SECTOR_COVER: Record<SectorSlug, string> = {
  aeropuertos: "/img/sectores/aeropuertos.webp",
  bodegas: "/img/sectores/bodegas.webp",
  constructoras: "/img/sectores/constructoras.webp",
  gobierno: "/img/sectores/gobierno.webp",
  industria: "/img/sectores/industria.webp",
  mineria: "/img/sectores/mineria.webp",
  salud: "/img/sectores/salud.webp",
  "seguridad-electronica": "/img/sectores/seguridad-electronica.webp",
  software: "/img/sectores/software.webp",
};

// ── Covers editoriales REALES de servicios (de /images/editorial/) ──
const SERVICE_COVER: Record<ServiceCode, string> = {
  101: "/img/servicios/redes.webp",
  102: "/img/servicios/seguridad-electronica.webp",
  103: "/img/servicios/telecomunicaciones.webp",
  104: "/img/servicios/software-a-medida.webp",
  105: "/img/servicios/soporte-247.webp",
  106: "/img/servicios/consultoria-it.webp",
  107: "/img/servicios/deteccion-incendios.webp",
  108: "/img/servicios/electricos-it.webp",
};

// ── Helpers de acceso ──

/** Galeria de imágenes (reales) para un sector dado. */
export function getSectorGallery(slug: SectorSlug): string[] {
  return THEME_BY_SECTOR[slug].map((t) => REAL_IMG[t]);
}

/** Cover principal de un sector. */
export function getSectorCover(slug: SectorSlug): string {
  return SECTOR_COVER[slug];
}

/** Galeria de imágenes (reales) para un servicio dado. */
export function getServiceGallery(code: ServiceCode): string[] {
  return THEME_BY_SERVICE[code].map((t) => REAL_IMG[t]);
}

/** Cover principal de un servicio. */
export function getServiceCover(code: ServiceCode): string {
  return SERVICE_COVER[code];
}

/**
 * Imagen principal para un antecedente mock.
 * Asigna una imagen real basada en sectorSlug + serviceCodes, determinista.
 */
export function getAntecedenteImage(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  id: number,
): string {
  // Combinar imágenes de su sector + su primer servicio, elegir por hash del id
  const pool = [
    ...THEME_BY_SECTOR[sectorSlug],
    ...(serviceCodes[0] ? THEME_BY_SERVICE[serviceCodes[0]] : []),
  ];
  const unique = [...new Set(pool)];
  if (unique.length === 0) return REAL_IMG["3069"];
  const pick = unique[id % unique.length];
  return REAL_IMG[pick];
}

/**
 * Galería (2-4 imágenes) para un antecedente mock.
 * Variaciones deterministas por id.
 */
export function getAntecedenteGallery(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  id: number,
): string[] {
  const pool = [
    ...THEME_BY_SECTOR[sectorSlug],
    ...serviceCodes.flatMap((c) => THEME_BY_SERVICE[c]),
  ];
  const unique = [...new Set(pool)];
  if (unique.length === 0) return [REAL_IMG["3069"]];
  // Rotar para variar, tomar 3-4
  const count = Math.min(unique.length, 4);
  const start = id % unique.length;
  const gallery: string[] = [];
  for (let i = 0; i < count; i++) {
    gallery.push(REAL_IMG[unique[(start + i) % unique.length]]);
  }
  return gallery;
}

export { REAL_IMG };
