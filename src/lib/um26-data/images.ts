/**
 * Imágenes de sectores, servicios y antecedentes: pósters isométricos limpios
 * propios (ver data/cine/posters.ts).
 *
 * Antes se usaban portadas editoriales y una imagen por antecedente hechas con
 * ChatGPT Images, y luego cuadros de los recorridos v4; ninguna imagen generada
 * queda en estas rutas.
 */

import type { SectorSlug, ServiceCode } from "./types";
import { posterFor, sectorPoster, servicePoster } from "../../data/cine/posters";

type ThumbnailSeed = {
  id: number;
  title: string;
  client?: string;
  sectorSlug: SectorSlug;
  image?: string;
};

const ALL_SERVICE_CODES = [101, 102, 103, 104, 105, 106, 107, 108] as ServiceCode[];

/** Galería de un sector: pósters de sus principales frentes de servicio, sin repetir. */
export function getSectorGallery(_slug: SectorSlug): string[] {
  return ([101, 102, 103, 107] as ServiceCode[]).map((code) => servicePoster(code));
}

/** Portada de un sector: su póster isométrico. */
export function getSectorCover(slug: SectorSlug): string {
  return sectorPoster(slug);
}

/** Galería de un servicio: su póster y el de tres frentes distintos que lo acompañan. */
export function getServiceGallery(code: ServiceCode): string[] {
  const start = Math.max(ALL_SERVICE_CODES.indexOf(code), 0);
  return [0, 1, 2, 3].map((step) => servicePoster(ALL_SERVICE_CODES[(start + step) % ALL_SERVICE_CODES.length]));
}

/** Portada de un servicio: su póster isométrico. */
export function getServiceCover(code: ServiceCode): string {
  return servicePoster(code);
}

/**
 * Se mantiene la firma: las miniaturas únicas eran imágenes generadas y ya no
 * hace falta precalcularlas.
 */
export function assignAntecedenteThumbnails(_seeds: ThumbnailSeed[]): void {}

/** Imagen de un antecedente: el póster de su servicio principal o, sin servicio, el de su sector. */
export function getAntecedenteImage(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  _id: number,
): string {
  return posterFor(sectorSlug, serviceCodes[0]);
}

/** Galería de un antecedente: un póster por servicio (sin repetir); sin servicios, el del sector. */
export function getAntecedenteGallery(
  sectorSlug: SectorSlug,
  serviceCodes: ServiceCode[],
  _id: number,
): string[] {
  if (!serviceCodes.length) return [sectorPoster(sectorSlug)];
  return [...new Set(serviceCodes.map((code) => servicePoster(code)))].slice(0, 4);
}
