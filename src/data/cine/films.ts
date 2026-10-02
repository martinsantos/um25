// Movies v4: cada servicio filmado en cada escena (5 × 8). La lista de las que ya están
// renderizadas la escribe scripts/cine-sync-media.mjs (prebuild) en films.generated.json;
// los medios se sirven desde /cine/v4/cine-<escena>-<servicio>{.mp4,-sq.mp4,-poster.jpg,-ar.json}.
import generated from './films.generated.json';
import { SCENE_TITLES, type Scene } from './scenes';

export type ServiceKey = 'redes' | 'seguridad' | 'telecom' | 'software' | 'soporte' | 'consultoria' | 'incendios' | 'electricos';

export interface CineService {
  key: ServiceKey;
  code: string;
  name: string;
  short: string;
  href: string;
  color: string;
  /** Escena donde el servicio se filmó primero (su "casa"). */
  home: Scene;
  /** Sistemas del gemelo que el servicio señala con etiquetas. */
  systems: string[];
}

export const CINE_SERVICES: CineService[] = [
  { key: 'redes', code: '101', name: 'Infraestructura de redes', short: 'Redes', href: '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', color: '#2bb3d6', home: 'fachada', systems: ['Data', 'Fiber', 'WiFi'] },
  { key: 'seguridad', code: '102', name: 'Seguridad electrónica', short: 'Seguridad', href: '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', color: '#e0679f', home: 'aeropuerto', systems: ['CCTV', 'Security', 'Intercom'] },
  { key: 'telecom', code: '103', name: 'Telecomunicaciones', short: 'Telecom', href: '/servicios/103/telecomunicaciones-datos-voz-video', color: '#a07ae0', home: 'planta', systems: ['Telecom', 'WiFi', 'Data'] },
  { key: 'software', code: '104', name: 'Software a medida', short: 'Software', href: '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp', color: '#6f9be6', home: 'hospital', systems: ['Software'] },
  { key: 'soporte', code: '105', name: 'Soporte técnico 24/7', short: 'Soporte', href: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it', color: '#3fb07e', home: 'aeropuerto', systems: [] },
  { key: 'consultoria', code: '106', name: 'Consultoría IT', short: 'Consultoría', href: '/servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria', color: '#8b929a', home: 'fachada', systems: [] },
  { key: 'incendios', code: '107', name: 'Detección de incendios', short: 'Incendios', href: '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios', color: '#ef5a44', home: 'bodega', systems: ['Fire-detection'] },
  { key: 'electricos', code: '108', name: 'Eléctricos para IT', short: 'Eléctricos', href: '/servicios/108/servicios-electricos-para-it', color: '#d9a23a', home: 'hospital', systems: ['Power'] },
];

export const CINE_SCENES: Scene[] = ['bodega', 'planta', 'aeropuerto', 'hospital', 'fachada'];

/** "dentro de …": la instalación tipo de cada escena, con artículo. */
export const SCENE_INSIDE: Record<Scene, string> = {
  bodega: 'una bodega', planta: 'una planta de altura', aeropuerto: 'una terminal aeroportuaria',
  hospital: 'un hospital', fachada: 'un edificio corporativo',
};

const AVAILABLE = new Set<string>(generated as string[]);

export const filmId = (scene: Scene, service: ServiceKey) => `${scene}-${service}`;
export const hasFilm = (scene: Scene, service: ServiceKey) => AVAILABLE.has(filmId(scene, service));
export const serviceByCode = (code: string | number) => CINE_SERVICES.find((s) => s.code === String(code));
export const serviceByKey = (key: string) => CINE_SERVICES.find((s) => s.key === key);

export interface Film {
  id: string;
  scene: Scene;
  sceneTitle: string;
  service: CineService;
  poster: string;
  src: string;
  sq: string;
}

export const film = (scene: Scene, service: CineService): Film => {
  const id = filmId(scene, service.key);
  return {
    id, scene, sceneTitle: SCENE_TITLES[scene], service,
    poster: `/cine/v4/cine-${id}-poster.jpg`, src: `/cine/v4/cine-${id}.mp4`, sq: `/cine/v4/cine-${id}-sq.mp4`,
  };
};

/** El servicio en cada escena, empezando por su escena propia. */
export const filmsForService = (service: CineService) =>
  [service.home, ...CINE_SCENES.filter((s) => s !== service.home)]
    .filter((scene) => hasFilm(scene, service.key))
    .map((scene) => film(scene, service));

/** Los servicios filmados en una escena, primero los que tienen esa escena como propia. */
export const filmsForScene = (scene: Scene) =>
  [...CINE_SERVICES.filter((s) => s.home === scene), ...CINE_SERVICES.filter((s) => s.home !== scene)]
    .filter((s) => hasFilm(scene, s.key))
    .map((s) => film(scene, s));

export const allFilms = () => CINE_SCENES.flatMap((scene) => CINE_SERVICES.filter((s) => hasFilm(scene, s.key)).map((s) => film(scene, s)));
