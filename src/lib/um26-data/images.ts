/**
 * Imágenes de sectores, servicios y antecedentes: pósters Blender propios
 * (recorridos v4 por escena y servicio).
 *
 * Las fotos revisadas tienen prioridad. Las miniaturas anteriores permanecen
 * como respaldo mientras se revisa individualmente su reemplazo.
 */

import type { SectorSlug, ServiceCode } from "./types";
import { posterFor, posterForService } from "../../data/cine/posters";
import antecedenteThumbs from "../../data/antecedentes-generated-image-map.json";
import { casePhotograph } from "../../data/photography";

/** Mapa de miniaturas anteriores por antecedente. */
const ANTECEDENTE_THUMBS = antecedenteThumbs as Record<string, string>;

type ThumbnailSeed = {
  id: number;
  title: string;
  client?: string;
  sectorSlug: SectorSlug;
  image?: string;
};

/** Galería de un sector: sus principales frentes de servicio en su escena. */
export function getSectorGallery(slug: SectorSlug): string[] {
  return ([101, 102, 103, 107] as ServiceCode[]).map((code) => posterFor(slug, code));
}

/** Portada de un sector: el póster de su escena. */
export function getSectorCover(slug: SectorSlug): string {
  return posterFor(slug);
}

/** Galería de un servicio: el mismo frente en distintas escenas. */
export function getServiceGallery(code: ServiceCode): string[] {
  return (["aeropuertos", "bodegas", "salud", "industria"] as SectorSlug[]).map((slug) => posterFor(slug, code));
}

/** Portada de un servicio: el póster de su escena de referencia. */
export function getServiceCover(code: ServiceCode): string {
  return posterForService(code);
}

/**
 * Se mantiene la firma; las asociaciones se obtienen del mapa existente.
 */
export function assignAntecedenteThumbnails(_seeds: ThumbnailSeed[]): void {}

/** Imagen realista propia de un antecedente (mosaico y ficha), o vacío si no tiene. */
export function getAntecedenteThumb(id: string | number | null | undefined): string {
  return id === null || id === undefined || id === '' ? '' : casePhotograph(id) || ANTECEDENTE_THUMBS[String(id)] || '';
}

/** Imagen de un antecedente en el mosaico: su miniatura realista propia; si no tiene, la isometría de su sector × servicio. */
export function getAntecedenteImage(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  id: number,
): string {
  return casePhotograph(id) || ANTECEDENTE_THUMBS[String(id)] || posterFor(sectorSlug, serviceCodes[0]);
}

/** Galería de un antecedente: un póster por servicio, dentro de su sector. */
export function getAntecedenteGallery(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  _id: number,
): string[] {
  const codes = serviceCodes.length ? serviceCodes : ([101] as ServiceCode[]);
  return [...new Set(codes.map((code) => posterFor(sectorSlug, code)))].slice(0, 4);
}
