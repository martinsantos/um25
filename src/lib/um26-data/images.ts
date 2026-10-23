/**
 * Imágenes de sectores, servicios y antecedentes: pósters Blender propios
 * (recorridos v4 por escena y servicio).
 *
 * Antes se usaban portadas editoriales y una imagen por antecedente hechas con
 * ChatGPT Images; ninguna imagen generada queda en estas rutas.
 */

import type { SectorSlug, ServiceCode } from "./types";
import { posterFor, posterForService } from "../../data/cine/posters";

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
 * Se mantiene la firma: las miniaturas únicas eran imágenes generadas y ya no
 * hace falta precalcularlas.
 */
export function assignAntecedenteThumbnails(_seeds: ThumbnailSeed[]): void {}

/** Imagen de un antecedente: el póster de su sector × su primer servicio. */
export function getAntecedenteImage(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  _id: number,
): string {
  return posterFor(sectorSlug, serviceCodes[0]);
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
