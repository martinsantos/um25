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

// ── Portadas del blog: póster según el tema de la nota ──
// Las portadas de Directus y el pozo de reemplazo eran imágenes generadas. El servicio
// sale de palabras clave del título, la ruta, las etiquetas y el resumen; el sector
// también. Sin coincidencia, la categoría decide y el slug reparte entre servicios.
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
const SECTOR_TERMS: [string, RegExp][] = [
  ['bodegas', /bodega|vino|vitivin|vinedo|enolog|cava/],
  ['salud', /hospital|clinica|salud|medic|sanatorio|paciente/],
  ['aeropuertos', /aeropuerto|aeroportuari|terminal|vuelo|aa2000/],
  ['industria', /industria|planta|fabrica|produccion|mineri|miner|campamento|petrol|oil|gas\b|cooperativa|agro|frigorif/],
  ['gobierno', /gobierno|municip|ministerio|provincia|estado|publico|escuela|universidad/],
  ['constructoras', /edificio|torre|consorcio|obra|construc|oficina|barrio|hotel/],
];
const CATEGORY_SERVICE: Record<string, string> = { tecnico: '101', tecnologia: '104', proyectos: '102', noticias: '106', empresa: '105' };
const SPREAD = ['101', '102', '103', '104', '105', '106', '107', '108'];

const norm = (value: unknown) =>
  String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_]/g, ' ');

const hash = (value: string) => [...value].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Póster de portada para una nota del blog, según su tema. */
export function blogTopicPoster(post: { slug?: string; titulo?: string; categoria?: string; tags?: string[] | null; resumen?: string }): string {
  const head = norm([post.titulo, post.slug, ...(post.tags || [])].join(' '));
  const body = norm(post.resumen);
  const pick = (terms: [string, RegExp][]) =>
    terms.find(([, re]) => re.test(head))?.[0] || terms.find(([, re]) => re.test(body))?.[0];
  const service = pick(SERVICE_TERMS) || CATEGORY_SERVICE[post.categoria || ''] || SPREAD[hash(post.slug || '') % SPREAD.length];
  const sector = pick(SECTOR_TERMS) || ['constructoras', 'aeropuertos', 'industria', 'salud', 'bodegas'][hash(post.slug || post.titulo || '') % 5];
  return posterFor(sector, service);
}
