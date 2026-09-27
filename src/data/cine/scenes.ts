import { sectorCaseLabel } from '../sectorCaseCounts';
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
