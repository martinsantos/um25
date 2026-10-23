// Imágenes fijas del sitio: capturas del despiece de código (`SectorCode`), la escena de
// cada sector desarmada por capas con un servicio activo. Una por sector y una por par
// sector × servicio, en `public/cine/despiece/`. Son la misma pieza que se ve en movimiento
// en las páginas, no renders sueltos; ninguna es generada con IA.
import { ANTECEDENTES_REALES } from '../../lib/um26-data/antecedentesReales';
import { sectorBySlug, type Scene } from './scenes';

/** Servicios que aparecen como capa en el despiece de cada sector (orden del modelo). */
const DESPIECE: Record<string, string[]> = {
  salud: ['108', '101', '103', '102', '107', '104', '106', '105'],
  aeropuertos: ['108', '101', '103', '102', '107', '105'],
  industria: ['108', '101', '103', '102', '107', '104', '106', '105'],
  bodegas: ['108', '101', '103', '102', '107', '104', '105'],
  constructoras: ['108', '101', '102', '107', '105'],
  mineria: ['108', '101', '103', '102', '106', '105'],
};

/** Sector de referencia de cada servicio (donde su capa se lee mejor). */
const SERVICE_SECTOR: Record<string, string> = {
  '101': 'constructoras', '102': 'aeropuertos', '103': 'mineria', '104': 'industria',
  '105': 'salud', '106': 'salud', '107': 'bodegas', '108': 'salud',
};
const SERVICE_CODES = Object.keys(SERVICE_SECTOR);

/** Sectores de la navegación que no tienen despiece propio: usan el de la escena que comparten. */
const SECTOR_ALIAS: Record<string, string> = {
  gobierno: 'constructoras', gobiernosectorpublico: 'constructoras', software: 'industria', 'seguridad-electronica': 'aeropuertos',
};

export interface PosterOptions {
  /** Se mantiene por compatibilidad: las capturas tienen una sola proporción y las tarjetas recortan con `object-fit`. */
  square?: boolean;
}

const DIR = '/cine/despiece';
const despieceSector = (slug: string | null | undefined): string => {
  const s = SECTOR_ALIAS[slug || ''] || slug || '';
  return DESPIECE[s] ? s : 'constructoras';
};

export const BASE_POSTER = `${DIR}/constructoras.jpg`;

/** Misma captura en AVIF (cada `.jpg` tiene su `.avif` al lado). */
export const avifOf = (path: string): string => path.replace(/\.jpg$/, '.avif');

/** Escena del recorrido Blender de un sector (fachada si no se reconoce). */
export const sceneForSector = (slug: string | null | undefined): Scene =>
  (sectorBySlug(slug === 'gobierno' ? 'gobiernosectorpublico' : slug || '')?.scene as Scene) || 'fachada';

/** La escena del sector, completa. */
export function sectorPoster(slug: string | null | undefined, _opts?: PosterOptions): string {
  return `${DIR}/${despieceSector(slug)}.jpg`;
}

/** El servicio activo en su sector de referencia; sin código válido, la portada base. */
export function servicePoster(code: string | number | null | undefined, _opts?: PosterOptions): string {
  const c = String(code ?? '');
  const sector = SERVICE_SECTOR[c];
  return sector ? `${DIR}/${sector}-${c}.jpg` : BASE_POSTER;
}

/** El servicio dentro del sector pedido si esa capa existe; si no, el servicio en su referencia; sin servicio, el sector. */
export function posterFor(sector: string | null | undefined, serviceCode?: string | number | null): string {
  const c = String(serviceCode ?? '');
  if (!SERVICE_SECTOR[c]) return sectorPoster(sector);
  const s = despieceSector(sector);
  return DESPIECE[s].includes(c) ? `${DIR}/${s}-${c}.jpg` : servicePoster(c);
}

/** Póster de un servicio. */
export function posterForService(serviceCode: string | number): string {
  return servicePoster(serviceCode);
}

const BY_ID = new Map(ANTECEDENTES_REALES.map((item) => [String(item.id), item]));

/** Póster de un antecedente: su servicio principal dentro de su sector. */
export function posterForAntecedente(id: string | number | null | undefined): string {
  const item = BY_ID.get(String(id ?? ''));
  return item ? posterFor(item.sectorSlug, item.serviceCodes?.[0]) : '';
}

/** Los ocho pósters de servicio: pozo para portadas sin imagen propia. */
export const ALL_SERVICE_POSTERS: string[] = SERVICE_CODES.map((code) => servicePoster(code));

// ── Portadas del blog: póster según el tema de la nota ──
// Las portadas de Directus y el pozo de reemplazo eran imágenes generadas. El servicio
// sale de palabras clave del título, la ruta, las etiquetas y el resumen. Sin coincidencia,
// la categoría decide y el slug reparte entre servicios.
const SERVICE_TERMS: [string, RegExp][] = [
  ['107', /incendi|humo|sdi\b|nfpa|deteccion de (fuego|incendio)|alarma de incendio|rociador/],
  ['108', /electri|ups\b|tablero|puesta a tierra|energia|bateria|generador|grupo electrogeno|tension/],
  ['102', /cctv|camara|videovigilancia|vigilancia|seguridad electronica|control de acceso|acceso|alarma|intrusion|biometr|nvr|vms|lpr|patente/],
  ['103', /telecom|radioenlace|enlace|antena|voip|telefon|starlink|satelit|4g|5g|lte|microonda|torre/],
  ['101', /redes?\b|red de|fibra|cableado|switch|wifi|wi-fi|lan\b|wan\b|vlan|router|mikrotik|ubiquiti|patch|rack|data ?center|backbone/],
  ['105', /soporte|mesa de ayuda|helpdesk|monitoreo|noc\b|mantenimiento|incidente|sla\b|backup|respaldo|zabbix|grafana/],
  ['106', /consultor|auditor|diagnostico|roadmap|normativa|resolucion|iso\b|ciberseguridad|riesgo|cumplimiento|arca|afip|ley\b/],
  ['104', /software|sistema|erp|odoo|app\b|aplicacion|api\b|desarrollo|python|node|postgres|sql|docker|kubernetes|ia\b|inteligencia artificial|llm|automatiz|digitaliz|factur|plantilla/],
];
const CATEGORY_SERVICE: Record<string, string> = { tecnico: '101', tecnologia: '104', proyectos: '102', noticias: '106', empresa: '105' };
const SPREAD = ['101', '102', '103', '104', '105', '106', '107', '108'];

const norm = (value: unknown) =>
  String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_]/g, ' ');

const hash = (value: string) => [...value].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Póster de portada para una nota del blog: el del servicio que trata. */
export function blogTopicPoster(post: { slug?: string; titulo?: string; categoria?: string; tags?: string[] | null; resumen?: string }): string {
  const head = norm([post.titulo, post.slug, ...(post.tags || [])].join(' '));
  const body = norm(post.resumen);
  const pick = (terms: [string, RegExp][]) =>
    terms.find(([, re]) => re.test(head))?.[0] || terms.find(([, re]) => re.test(body))?.[0];
  const service = pick(SERVICE_TERMS) || CATEGORY_SERVICE[post.categoria || ''] || SPREAD[hash(post.slug || '') % SPREAD.length];
  return servicePoster(service);
}
