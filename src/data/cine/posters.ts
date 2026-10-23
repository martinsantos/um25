// Pósters Blender propios (recorridos v4 por escena y servicio) como única fuente de
// imágenes de sectores, servicios y antecedentes. Reemplazan las imágenes generadas
// (antecedentes con ChatGPT Images, portadas editoriales de sectores y servicios).
import { ANTECEDENTES_REALES } from '../../lib/um26-data/antecedentesReales';
import { V4_CUTS, sectorBySlug, serviceSceneKey, type Scene } from './scenes';

const SERVICE_SLUG: Record<string, string> = {
  '101': 'redes', '102': 'seguridad', '103': 'telecom', '104': 'software',
  '105': 'soporte', '106': 'consultoria', '107': 'incendios', '108': 'electricos',
};
// Slugs de sector que no coinciden con los de la navegación.
const SECTOR_ALIAS: Record<string, string> = { gobierno: 'gobiernosectorpublico' };

export const BASE_POSTER = '/cine/media/cine-fachada-poster.jpg';

export const sceneForSector = (slug: string | null | undefined): Scene =>
  (sectorBySlug(SECTOR_ALIAS[slug || ''] || slug || '')?.scene as Scene) || 'fachada';

/** Póster del sector, o del servicio dentro de la escena de ese sector. */
export function posterFor(sector: string | null | undefined, serviceCode?: string | number | null): string {
  const scene = sceneForSector(sector);
  const slug = SERVICE_SLUG[String(serviceCode ?? '')];
  return (slug && V4_CUTS[`${scene}-${slug}`]?.poster) || `/cine/media/cine-${scene}-poster.jpg`;
}

/** Póster de un servicio en su escena de referencia (la de su banner). */
export function posterForService(serviceCode: string | number): string {
  return V4_CUTS[serviceSceneKey(String(serviceCode))]?.poster || BASE_POSTER;
}

const BY_ID = new Map(ANTECEDENTES_REALES.map((item) => [String(item.id), item]));

/** Póster de un antecedente: su sector y su primer servicio. */
export function posterForAntecedente(id: string | number | null | undefined): string {
  const item = BY_ID.get(String(id ?? ''));
  return item ? posterFor(item.sectorSlug, item.serviceCodes?.[0]) : '';
}

/** Todos los pósters de recorrido (40): pozo para portadas sin imagen propia. */
export const ALL_SERVICE_POSTERS: string[] = Object.values(V4_CUTS).map((cut) => cut.poster);
