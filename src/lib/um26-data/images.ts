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
import generatedImageMap from "../../data/antecedentes-generated-image-map.json";
import { curatedAntecedenteImages } from "../../data/editorialImageSystem";

const generatedMap = generatedImageMap as Record<string, string>;
const CURATED_ANTECEDENTE_IMAGES: Record<string, string> = curatedAntecedenteImages;

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

// ── Miniaturas únicas por antecedente ──
// 1) Curadas (/img/antecedentes/{id}.webp) para 3064, 3065, 3081 y 3087.
// 2) Imagen generada propia del id (la misma que muestra la ficha).
// 3) Sin imagen propia: la generada libre que mejor coincide con título,
//    sector y rubro, sin repetir ninguna ya asignada en el catálogo.
const SECTOR_TERMS: Record<SectorSlug, string[]> = {
  aeropuertos: ["aeropuerto", "aeropuertos", "aa2000", "vuelo"],
  bodegas: ["bodega", "bodegas", "vinedos", "cava"],
  constructoras: ["torre", "fideicomiso", "edificio", "obra"],
  gobierno: ["gobierno", "municipalidad", "ministerio", "provincia"],
  industria: ["planta", "industrial", "fabrica", "produccion"],
  mineria: ["minera", "mineria", "mina"],
  salud: ["hospital", "salud", "clinica", "fuesmen", "medicina"],
  "seguridad-electronica": ["seguridad", "acceso", "monitoreo", "alarma"],
  software: ["software", "digitalizacion", "desarrollo", "sistema"],
};

const HINT_TERMS: Record<string, string[]> = {
  "barrier-access": ["acceso", "barrera", "vehicular"],
  "biometric-access": ["acceso", "biometrico", "control"],
  "cctv-airport": ["cctv", "camara", "camaras", "aeropuerto"],
  "cctv-camera": ["cctv", "camara", "camaras"],
  "cctv-cellar": ["cctv", "camaras", "bodega"],
  "cctv-perimeter": ["cctv", "camaras", "perimetro", "perimetral"],
  "consulting-board": ["consultoria", "soporte", "infraestructura"],
  "control-room": ["monitoreo", "centro", "seguridad"],
  datacenter: ["data", "center", "rack", "servidores"],
  "electrical-panel": ["electrica", "electricas", "tableros", "tablero", "ups"],
  "factory-floor": ["planta", "industrial", "produccion"],
  "fiber-optic": ["fibra", "optica", "redes"],
  "fire-detection": ["deteccion", "incendios", "incendio", "sdi", "humo"],
  "hospital-network": ["hospital", "redes", "datos"],
  "hospital-rack": ["hospital", "rack", "patch"],
  "mining-site": ["minera", "campamento"],
  "network-cabinet": ["redes", "datos", "cableado", "rack"],
  "server-room": ["servidores", "rack", "data", "center"],
  "smart-building": ["edificio", "torre", "automatizacion"],
  "software-screen": ["software", "desarrollo", "digitalizacion", "sistema"],
  "telecom-tower": ["telecomunicaciones", "antena", "enlace", "radioenlace"],
  "vineyard-cellar": ["bodega", "vinedos"],
  "wifi-terminal": ["wifi", "ap", "inalambrica"],
};

const STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "en", "y", "para", "por", "con", "a", "al",
  "sa", "srl", "s", "e", "principal", "it", "24", "7",
]);

const normalizeWords = (value: string): string[] =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));

const stem = (word: string) => word.slice(0, 6);

type ThumbnailSeed = {
  id: number;
  title: string;
  client?: string;
  sectorSlug: SectorSlug;
  image?: string;
};

const thumbnailAssignments = new Map<number, string>();

/**
 * Precalcula una miniatura distinta para cada antecedente del catálogo.
 * Se llama una vez con el catálogo completo; el resultado es determinista.
 */
export function assignAntecedenteThumbnails(seeds: ThumbnailSeed[]): void {
  if (thumbnailAssignments.size) return;
  const taken = new Set<string>();
  const pending: ThumbnailSeed[] = [];

  for (const seed of seeds) {
    const own = getOwnAntecedenteImage(seed.id);
    if (own && !taken.has(own)) {
      thumbnailAssignments.set(seed.id, own);
      taken.add(own);
    } else {
      pending.push(seed);
    }
  }

  // Las generadas de ids del catálogo quedan reservadas para su propia ficha.
  const catalogIds = new Set(seeds.map((seed) => String(seed.id)));
  const pool = Object.entries(generatedMap)
    .filter(([id, url]) => !catalogIds.has(id) && !taken.has(url))
    .map(([, url]) => ({
      url,
      stems: new Set(normalizeWords(url.split("/").pop() || "").map(stem)),
    }));

  for (const seed of pending) {
    const weighted = new Map<string, number>();
    const add = (words: string[], weight: number) =>
      words.forEach((word) => weighted.set(stem(word), Math.max(weighted.get(stem(word)) || 0, weight)));
    add(normalizeWords(seed.title), 3);
    add(normalizeWords(seed.client || ""), 1);
    add(HINT_TERMS[seed.image || ""] || [], 3);
    add(SECTOR_TERMS[seed.sectorSlug] || [], 1);

    let best = -1;
    let bestScore = -1;
    pool.forEach((candidate, index) => {
      if (taken.has(candidate.url)) return;
      let score = 0;
      weighted.forEach((weight, key) => {
        if (candidate.stems.has(key)) score += weight;
      });
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    if (best >= 0) {
      const url = pool[best].url;
      thumbnailAssignments.set(seed.id, url);
      taken.add(url);
    }
  }
}

function getOwnAntecedenteImage(id: number | string): string {
  const key = String(id);
  return CURATED_ANTECEDENTE_IMAGES[key] || generatedMap[key] || "";
}

/**
 * Imagen principal (miniatura y ficha) de un antecedente del catálogo.
 * Única en todo el catálogo; si el id no fue asignado, cae al tema del sector.
 */
export function getAntecedenteImage(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  id: number,
): string {
  const assigned = thumbnailAssignments.get(id) || getOwnAntecedenteImage(id);
  if (assigned) return assigned;
  const pool = [
    ...THEME_BY_SECTOR[sectorSlug],
    ...(serviceCodes[0] ? THEME_BY_SERVICE[serviceCodes[0]] : []),
  ];
  const unique = [...new Set(pool)];
  if (unique.length === 0) return REAL_IMG["3069"];
  return REAL_IMG[unique[id % unique.length]];
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
