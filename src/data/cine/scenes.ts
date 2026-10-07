import { sectorCaseLabel } from '../sectorCaseCounts';
import v4Media from './v4-media.json';
// Escenas cine y su relación con sectores y servicios (una sola fuente para home,
// banners de sector, banners de servicio y atlas).
export type Scene = 'bodega' | 'fachada' | 'aeropuerto' | 'hospital' | 'planta';

export const SCENE_TITLES: Record<Scene, string> = {
  bodega: 'Bodega',
  fachada: 'Edificio corporativo',
  aeropuerto: 'Terminal aeroportuaria',
  hospital: 'Hospital',
  planta: 'Planta de altura',
};

// Sectores (textos de la home de producción; casos contados sobre el catálogo).
const SECTOR_ROWS = [
  { slug: 'aeropuertos', name: 'Aeropuertos', text: 'CCTV de perímetro 24/7', scene: 'aeropuerto' },
  { slug: 'bodegas', name: 'Bodegas', text: 'Trazabilidad vitivinícola end-to-end', scene: 'bodega' },
  { slug: 'constructoras', name: 'Constructoras', text: 'Cableado estructurado certificado', scene: 'fachada' },
  { slug: 'gobiernosectorpublico', name: 'Gobierno y Sector Público', text: 'Digitalización de trámites', scene: 'fachada' },
  { slug: 'industria', name: 'Industria', text: 'Redes industriales en planta 24/7', scene: 'planta' },
  { slug: 'mineria', name: 'Minería', text: 'Telecomunicaciones en campamento remoto', scene: 'planta' },
  { slug: 'salud', name: 'Salud', text: 'Redes para imágenes médicas', scene: 'hospital' },
  { slug: 'seguridad-electronica', name: 'Seguridad Electrónica', text: 'Centro de monitoreo 24/7', scene: 'aeropuerto' },
  { slug: 'software', name: 'Software', text: 'ERPs y plataformas a medida', scene: 'fachada' },
] as const;

export const SECTORS = SECTOR_ROWS.map((row) => ({ ...row, count: sectorCaseLabel(row.slug) }));

export const sectorBySlug = (slug: string) =>
  SECTORS.find((s) => s.slug === (slug === 'gobierno' ? 'gobiernosectorpublico' : slug));

// Portada: una escena por sector representativo, en este orden.
export const HOME_SCENES: { scene: Scene; sector: string; name: string; text: string }[] = [
  { scene: 'bodega', sector: 'bodegas', name: 'Bodegas', text: 'Trazabilidad vitivinícola end-to-end' },
  { scene: 'fachada', sector: 'constructoras', name: 'Edificios', text: 'Cableado estructurado certificado' },
  { scene: 'aeropuerto', sector: 'aeropuertos', name: 'Aeropuertos', text: 'CCTV de perímetro 24/7' },
  { scene: 'hospital', sector: 'salud', name: 'Salud', text: 'Redes para imágenes médicas' },
  { scene: 'planta', sector: 'mineria', name: 'Minería e industria', text: 'Enlaces en campamento remoto' },
];

// Servicios → escena de su banner y sistemas que se señalan.
export const SERVICE_SCENES: Record<string, { scene: Scene; systems: string[] }> = {
  '101': { scene: 'fachada', systems: ['Data', 'Fiber', 'WiFi'] },
  '102': { scene: 'aeropuerto', systems: ['CCTV', 'Security', 'Intercom'] },
  '103': { scene: 'planta', systems: ['Telecom', 'WiFi', 'Data'] },
  '104': { scene: 'hospital', systems: ['Software'] },
  '105': { scene: 'aeropuerto', systems: [] },
  '106': { scene: 'fachada', systems: [] },
  '107': { scene: 'bodega', systems: ['Fire-detection'] },
  '108': { scene: 'hospital', systems: ['Power'] },
};

// Cine v4 (render en la nube): un recorrido por escena y por servicio. El
// manifiesto lo genera scripts/cine/import-v4-media.mjs a partir de los
// archivos presentes en public/cine/media; el banner usa la clave
// "<escena>-<servicio>" con la misma convención de archivos que las escenas base.
export interface SceneServiceCut {
  key: string;
  scene: Scene;
  service: string;
  code: string;
  poster: string;
  video: string;
  square: string | null;
  track: string | null;
}

export const V4_CUTS: Record<string, SceneServiceCut> = v4Media as Record<string, SceneServiceCut>;

const SERVICE_SLUG_BY_CODE: Record<string, string> = {
  '101': 'redes', '102': 'seguridad', '103': 'telecom', '104': 'software',
  '105': 'soporte', '106': 'consultoria', '107': 'incendios', '108': 'electricos',
};

/** Clave de banner para un servicio: su recorrido v4 si está renderizado, o la escena base. */
export const serviceSceneKey = (code: string): string => {
  const base = SERVICE_SCENES[code] || SERVICE_SCENES['101'];
  const key = `${base.scene}-${SERVICE_SLUG_BY_CODE[code] || ''}`;
  return V4_CUTS[key] ? key : base.scene;
};

/** Recorridos v4 disponibles para una escena, en el orden de los ocho frentes. */
export const sceneServiceCuts = (scene: Scene): SceneServiceCut[] =>
  Object.keys(SERVICE_SLUG_BY_CODE)
    .map((code) => V4_CUTS[`${scene}-${SERVICE_SLUG_BY_CODE[code]}`])
    .filter((cut): cut is SceneServiceCut => Boolean(cut));

/** Escena base de una clave de banner ("hospital-redes" → "hospital"). */
export const baseScene = (key: string): Scene => (key.split('-')[0] as Scene);

const SERVICE_LABEL_BY_SLUG: Record<string, string> = {
  redes: 'Redes', seguridad: 'Seguridad electrónica', telecom: 'Telecomunicaciones', software: 'Software a medida',
  soporte: 'Soporte 24/7', consultoria: 'Consultoría IT', incendios: 'Detección de incendios', electricos: 'Eléctricos IT',
};

/** Rótulo del plano: "Hospital" para una escena base, "Hospital · Software a medida" para un recorrido v4.
 *  Mismo texto que escribe el reproductor (/cine/cine-banner-v4.js) en cada corte. */
const DISCIPLINE_TITLES: Record<string,string> = {
  network:'Redes', security:'Seguridad electrónica', telecom:'Telecomunicaciones', software:'Software a medida',
  support:'Soporte 24/7', consulting:'Consultoría IT', fire:'Detección de incendios', power:'Energía para IT',
};
export const cutCaption = (key: string): string => {
  if (/^[a-z]+-system-v\d+$/.test(key)) return DISCIPLINE_TITLES[key.split('-')[0]] || 'Infraestructura IT';
  const service = SERVICE_LABEL_BY_SLUG[key.split('-')[1] || ''];
  return SCENE_TITLES[baseScene(key)] + (service ? ` · ${service}` : '');
};
