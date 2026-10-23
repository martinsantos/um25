// Pósters isométricos limpios (render propio sobre fondo azul marino, 1920×1080 y
// variante cuadrada 1080×1080) como única fuente de imágenes fijas de sectores,
// servicios, antecedentes y blog. Reemplazan a los cuadros de los recorridos v4
// (`cine-{escena}-{servicio}-poster.jpg`), que quedan sólo para los videos del cine.
// Ninguna imagen de estas rutas es generada con IA.
import { ANTECEDENTES_REALES } from '../../lib/um26-data/antecedentesReales';
import { sectorBySlug, type Scene } from './scenes';

/** Disciplina (archivo) de cada servicio y versión vigente de su póster. */
const SERVICE_POSTER_KEY: Record<string, string> = {
  '101': 'network-system-v1', '102': 'security-system-v1', '103': 'telecom-system-v1',
  '104': 'software-system-v5', '105': 'support-system-v1', '106': 'consulting-system-v1',
  '107': 'fire-system-v1', '108': 'power-system-v1',
};
const SERVICE_CODES = Object.keys(SERVICE_POSTER_KEY);

// Slugs de sector que no coinciden con los de la navegación.
const SECTOR_ALIAS: Record<string, string> = { gobierno: 'gobiernosectorpublico' };

/** Escenas con póster isométrico propio (minería tiene el suyo, aunque su recorrido comparta la planta). */
type PosterScene = Scene | 'mineria';

export interface PosterOptions {
  /** Variante cuadrada 1080×1080. */
  square?: boolean;
}

const MEDIA = '/cine/media';
const suffix = (opts?: PosterOptions) => (opts?.square ? '-poster-sq.jpg' : '-poster.jpg');

export const BASE_POSTER = `${MEDIA}/cine-fachada-proyecto-v5-poster.jpg`;

/** Misma ruta con la variante AVIF (todos los pósters tienen su `.avif` al lado). */
export const avifOf = (path: string): string => path.replace(/\.jpg$/, '.avif');

/** Escena del recorrido de un sector (fachada si no se reconoce). */
export const sceneForSector = (slug: string | null | undefined): Scene =>
  (sectorBySlug(SECTOR_ALIAS[slug || ''] || slug || '')?.scene as Scene) || 'fachada';

/** Escena del póster de un sector: igual que la del recorrido, salvo minería. */
const posterSceneForSector = (slug: string | null | undefined): PosterScene =>
  slug === 'mineria' ? 'mineria' : sceneForSector(slug);

/** Póster isométrico del sector. */
export function sectorPoster(slug: string | null | undefined, opts?: PosterOptions): string {
  return `${MEDIA}/cine-${posterSceneForSector(slug)}-proyecto-v5${suffix(opts)}`;
}

/** Póster isométrico de un servicio (código 101–108); sin código válido, la portada base. */
export function servicePoster(code: string | number | null | undefined, opts?: PosterOptions): string {
  const key = SERVICE_POSTER_KEY[String(code ?? '')];
  if (key) return `${MEDIA}/cine-${key}${suffix(opts)}`;
  return opts?.square ? `${MEDIA}/cine-fachada-proyecto-v5-poster-sq.jpg` : BASE_POSTER;
}

/** Póster del servicio si lo hay; si no, el del sector. */
export function posterFor(sector: string | null | undefined, serviceCode?: string | number | null): string {
  return SERVICE_POSTER_KEY[String(serviceCode ?? '')] ? servicePoster(serviceCode) : sectorPoster(sector);
}

/** Póster de un servicio. */
export function posterForService(serviceCode: string | number): string {
  return servicePoster(serviceCode);
}

const BY_ID = new Map(ANTECEDENTES_REALES.map((item) => [String(item.id), item]));

/** Póster de un antecedente: su servicio principal o, sin servicio, su sector. */
export function posterForAntecedente(id: string | number | null | undefined): string {
  const item = BY_ID.get(String(id ?? ''));
  return item ? posterFor(item.sectorSlug, item.serviceCodes?.[0]) : '';
}

/** Los ocho pósters de servicio: pozo para portadas sin imagen propia. */
export const ALL_SERVICE_POSTERS: string[] = SERVICE_CODES.map((code) => servicePoster(code));

// ── Portadas del blog: póster según el tema de la nota ──
// Las portadas de Directus y el pozo de reemplazo eran imágenes generadas. El servicio
// sale de palabras clave del título, la ruta, las etiquetas y el resumen. Sin coincidencia,
// la categoría decide y el slug reparte entre servicios. La portada no lleva sector.
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

/** Póster de portada para una nota del blog: el del servicio que trata (sin sector). */
export function blogTopicPoster(post: { slug?: string; titulo?: string; categoria?: string; tags?: string[] | null; resumen?: string }): string {
  const head = norm([post.titulo, post.slug, ...(post.tags || [])].join(' '));
  const body = norm(post.resumen);
  const pick = (terms: [string, RegExp][]) =>
    terms.find(([, re]) => re.test(head))?.[0] || terms.find(([, re]) => re.test(body))?.[0];
  const service = pick(SERVICE_TERMS) || CATEGORY_SERVICE[post.categoria || ''] || SPREAD[hash(post.slug || '') % SPREAD.length];
  return servicePoster(service);
}
