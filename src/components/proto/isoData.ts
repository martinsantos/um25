/**
 * Datos compartidos de las propuestas de portada con despieces (2026-10-30).
 * Sólo reúne lo que ya existe en el sitio: las isometrías de /cine/iso, las fotos editoriales,
 * los ocho servicios de la navegación y el catálogo de antecedentes. Ningún texto nuevo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { getAntecedentes } from '../../lib/um26-directus';
import { getAntecedenteSectorLabel } from '../../utils/antecedenteSectorPresentation';
import { curateAntecedente } from '../../utils/antecedentesCuration';
import { getAntecedentesCatalogCount } from '../../utils/verifiedProof';
import { NAV_SERVICES } from '../../data/navigation';
import { SECTORS, SOFTWARE_FILM } from '../../data/cine/scenes';
import { descripcionDeOrigen } from './relato';
import { addEvidenceBackedService, addEvidenceBackedSector, curateCatalogImage } from './catalogEditorial';
import { nombreCliente, tituloProyecto, desambiguarTitulos } from './titulos';
import sgiJson from '../../data/sgi/fechas.json';
import extraJson from '../../data/propuesta/antecedentes-extra.json';

/** Lo que SGI sabe mejor que el catálogo web: cuándo empezó y cerró cada proyecto, y en qué estado está. Por id web; sin datos internos. */
export type Estado = 'finalizado' | 'en-curso' | 'pendiente';
type SgiFecha = { inicio: string | null; cierre: string | null; estado: Estado };
const SGI_JSON = sgiJson as { sgiTotal: number; conFichaWeb: number; sinFichaWeb: number; fichasSinSgi: number; fechas: Record<string, SgiFecha> };
export const SGI_RESUMEN = { total: SGI_JSON.sgiTotal, conFichaWeb: SGI_JSON.conFichaWeb, sinFichaWeb: SGI_JSON.sinFichaWeb, fichasSinSgi: SGI_JSON.fichasSinSgi };
export const sgiDe = (id: number): SgiFecha | undefined => SGI_JSON.fechas[String(id)];

import { resolverSector } from './sectorReal';

export type IsoSite = 'building' | 'winery' | 'terminal' | 'clinic' | 'mine' | 'plant';

/** Sitios ya redibujados con el kit (v3); los demás siguen en v2. */
const V3: ReadonlySet<IsoSite> = new Set<IsoSite>(['building', 'terminal', 'winery']);   // sitios renderizados desde su modelo 3D
export const isoSrc = (site: IsoSite): string => `/cine/iso/site-${site}-${V3.has(site) ? 'v3' : 'v2'}.svg`;

/** El paquete CI contiene dist/client, no public/. Desarrollo conserva public/. */
const archivoPublico = (rel: string): URL => {
  const built = new URL(`../../client/${rel}`, import.meta.url);
  return existsSync(built) ? built : new URL(`../../../public/${rel}`, import.meta.url);
};
export const existePublico = (rel: string): boolean => existsSync(archivoPublico(rel));
export const leerPublico = (rel: string): string => (existePublico(rel) ? readFileSync(archivoPublico(rel), 'utf8').replace(/<\?xml[^>]*>/, '') : '');
/** Proporción ancho/alto del viewBox de un SVG de public/, para reservar su caja antes de traerlo (sin salto). 1 si no se puede leer. */
const RATIO_PUBLICO: Record<string, number> = {};
export const ratioDe = (src: string): number => {
  if (RATIO_PUBLICO[src]) return RATIO_PUBLICO[src];
  const vb = leerPublico(src.replace(/^\//, '')).match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  RATIO_PUBLICO[src] = vb && Number(vb[4]) > 0 ? Number(vb[3]) / Number(vb[4]) : 1;
  return RATIO_PUBLICO[src];
};
/** La isometría completa (SVG) de un sitio, para incrustar en el HTML. */
export const readIso = (site: IsoSite): string =>
  readFileSync(archivoPublico(isoSrc(site).slice(1)), 'utf8')
    .replace(/<\?xml[^>]*>/, '')
    .replace(/ id="sp-[a-z]+-(title|desc)"/g, '')
    .replace(/ aria-labelledby="[^"]*"/, ' aria-hidden="true"');

/** Proporción ancho/alto del dibujo de un sitio, leída de su viewBox: la caja se reserva antes de que llegue el SVG y la página no salta. */
const RATIO: Partial<Record<IsoSite, number>> = {};
export const isoRatio = (site: IsoSite): number => {
  if (RATIO[site]) return RATIO[site]!;
  try { const vb = readFileSync(archivoPublico(isoSrc(site).slice(1)), 'utf8').match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/); RATIO[site] = vb ? Number(vb[3]) / Number(vb[4]) : 1; } catch { RATIO[site] = 1; }
  return RATIO[site]!;
};

/** El despiece de un equipo (switch, cámara, panel…), por código de servicio. */
export const readDevice = (code: string): string =>
  readFileSync(archivoPublico(`cine/iso/service-${code}.svg`), 'utf8').replace(/<\?xml[^>]*>/, '');

export const services = NAV_SERVICES;

/** Lugares: sector existente, su foto editorial y su isometría. */
export const PLACES: { slug: string; site: IsoSite; image: string }[] = [
  { slug: 'bodegas', site: 'winery', image: '/images/editorial/umsa-sector-bodegas.webp' },
  { slug: 'aeropuertos', site: 'terminal', image: '/images/editorial/umsa-sector-aeropuertos.webp' },
  { slug: 'salud', site: 'clinic', image: '/images/editorial/umsa-sector-salud.webp' },
  { slug: 'mineria', site: 'mine', image: '/images/editorial/umsa-sector-mineria.webp' },
  { slug: 'industria', site: 'plant', image: '/images/editorial/umsa-sector-industria.webp' },
  { slug: 'constructoras', site: 'building', image: '/images/editorial/umsa-sector-constructoras.webp' },
];

const cleanText = (value: unknown) => String(value ?? '').replace(/\b(Rubro|Cliente|Sector|Área|Area)\s*:\s*/gi, '').replace(/\s*(\.{3}|…)\s*$/u, '').replace(/\s+/g, ' ').trim();

export type Story = { id: number; slug: string; href: string; client: string; title: string; year: number; month: number; inicio?: string; cierre?: string; estado?: Estado; sgiId?: string; sector: string; sectorSlug: string; serviceCodes: string[]; services: string[]; image: string; summary: string; status: string };

const SOFTWARE_GENERIC_TITLE = /^desarrollo de software y digitalizacion de procesos\b/i;
const SOFTWARE_SCOPE_EVIDENCE = /\b(software|digitalizaci[oó]n|aplicaci[oó]n|plataforma|erp|web|api|programaci[oó]n|desarrollos? y actualizaci[oó]n sistema de ventas)\b/i;
const normalizeEvidence = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * El CMS usa un título genérico de software en algunos registros de otros rubros.
 * Si el título y el resumen ya curados describen un alcance concreto sin evidencia
 * de software, no mostramos el código 104 que sólo pudo venir de ese título genérico.
 */
export function reconcileGeneratedSoftwareService(
  sourceTitle: string,
  curatedTitle: string,
  curatedSummary: string,
  serviceCodes: string[],
): string[] {
  if (!SOFTWARE_GENERIC_TITLE.test(normalizeEvidence(sourceTitle))) return serviceCodes;
  if (!serviceCodes.includes('104')) return serviceCodes;
  if (SOFTWARE_SCOPE_EVIDENCE.test(`${curatedTitle} ${curatedSummary}`)) return serviceCodes;
  return serviceCodes.filter((code) => code !== '104');
}

const TEMPLATE_PHRASES: Array<[RegExp, string]> = [
  [/(^|>)\s*Ejecución integral de\s+/gi, '$1'],
  [/,?\s*asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad\.?/gi, '.'],
  [/\s*Cliente:\s*[^.<]+\.?\s*(?:Sector:\s*[^.<]+\.?)?\s*(?=<|$)/gi, ''],
];
const comparable = (v: string) => v.toLowerCase().replace(/\(\d+\)/g, ' ').replace(/[.,:;()·|-]/g, ' ').replace(/\s+/g, ' ').trim();
/** Si un texto empieza repitiendo el título, se queda con lo que sigue ("… para el sector de parking."); si no queda nada que valga, vacío. */
export const sinTitulo = (text: string, title: string, client = ''): string => {
  // Comparación sin puntos ni signos: "C.C.T.V." y "CCTV" son lo mismo.
  const llano = (v: string) => v.toLowerCase().replace(/[.·]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const body = llano(text), t = llano(title);
  if (!t || !body.startsWith(t) || body === t) return body === t ? '' : text;
  // Se avanza por palabras del texto original hasta cubrir el título.
  let i = 0; const re = /\S+/g; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) { i = m.index + m[0].length; if (llano(text.slice(0, i)).length >= t.length) break; }
  const resto = text.slice(i).replace(/^[\s.,:;·()-]+/, '');
  const rc = comparable(resto);
  if (rc.length < 20 || rc === comparable(client)) return '';
  // Si lo que sigue no arranca como frase (un conector o mayúscula), el título salió de las primeras palabras del texto y el texto va entero.
  if (!/^(para|en|con|sobre|y|e)\b|^[A-ZÁÉÍÓÚÑ]/.test(resto)) return text;
  return resto.charAt(0).toUpperCase() + resto.slice(1);
};
/** Descripción sin plantillas ni repeticiones del título; vacía si no aporta nada. */
export const cleanSummary = (raw: unknown, title: string, client: string): string => {
  let text = String(raw ?? '').replace(/<[^>]+>/g, ' ');
  for (const [re, rep] of TEMPLATE_PHRASES) text = text.replace(re, rep);
  text = text.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  const body = comparable(text);
  if (!body || body === comparable(title) || body === comparable(`${client} ${title}`) || body === comparable(`${title} ${client}`)) return '';
  return sinTitulo(text, title, client);
};

/** Escena de película y clave de servicio, con la convención de /cine/media. */
export const SCENE_OF: Record<string, string> = { bodegas: 'bodega', aeropuertos: 'aeropuerto', salud: 'hospital', mineria: 'planta', industria: 'planta', constructoras: 'fachada', gobiernosectorpublico: 'fachada', gobierno: 'fachada' };
export const SERVICE_KEY: Record<string, string> = { '101': 'redes', '102': 'seguridad', '103': 'telecom', '104': 'software', '105': 'soporte', '106': 'consultoria', '107': 'incendios', '108': 'electricos' };
export const SITE_OF: Record<string, IsoSite> = { bodegas: 'winery', aeropuertos: 'terminal', salud: 'clinic', mineria: 'mine', industria: 'plant', constructoras: 'building', gobiernosectorpublico: 'building', gobierno: 'building' };
/** A place cutaway needs both a known setting and a physical system. */
export function illustrationSiteFor(story: Pick<Story, 'sectorSlug' | 'serviceCodes'>): IsoSite | undefined {
  return story.serviceCodes.some(code => ['101', '102', '103', '107', '108'].includes(code))
    ? SITE_OF[story.sectorSlug] : undefined;
}
/** Fotos editoriales: la imagen a pleno de cada servicio y de cada sector. */
export const SERVICE_PHOTO: Record<string, string> = { '101': '/images/editorial/umsa-service-redes.webp', '102': '/images/editorial/umsa-service-seguridad-electronica.webp', '103': '/images/editorial/umsa-service-telecomunicaciones.webp', '104': '/images/editorial/umsa-service-software-a-medida.webp', '105': '/images/editorial/umsa-service-soporte-247.webp', '106': '/images/editorial/umsa-service-consultoria-it.webp', '107': '/images/editorial/umsa-service-deteccion-incendios.webp', '108': '/images/editorial/umsa-service-electricos-it.webp' };
export const SECTOR_PHOTO: Record<string, string> = { software: `/cine/media/cine-${SOFTWARE_FILM}-poster.avif`, 'seguridad-electronica': '/images/editorial/umsa-sector-seguridad-electronica.webp', bodegas: '/images/editorial/umsa-sector-bodegas.webp', aeropuertos: '/images/editorial/umsa-sector-aeropuertos.webp', salud: '/images/editorial/umsa-sector-salud.webp', mineria: '/images/editorial/umsa-sector-mineria.webp', industria: '/images/editorial/umsa-sector-industria.webp', constructoras: '/images/editorial/umsa-sector-constructoras.webp', gobiernosectorpublico: '/images/editorial/umsa-sector-gobierno.webp', gobierno: '/images/editorial/umsa-sector-gobierno.webp' };
/** Las variantes de ancho de una foto según su familia: de antecedente (1600 → 960 → 480) o editorial (1672 → 960 → 480, y AVIF a 960 y 1672 para la apertura). Sin familia, las tres son la misma y el ancho es 0. */
export const variantes = (image: string) => {
  if (/^\/images\/antecedentes\/generated\/.+-principal\.webp$/.test(image)) return { w480: image.replace(/-principal\.webp$/, '-principal-480.webp'), w960: image.replace(/-principal\.webp$/, '-principal-960.webp'), full: image, ancho: 1600, avif: '' };
  if (/^\/images\/editorial\/umsa-[a-z0-9-]+\.webp$/.test(image) && !/-(480|960)\.webp$/.test(image)) return { w480: image.replace(/\.webp$/, '-480.webp'), w960: image.replace(/\.webp$/, '-960.webp'), full: image, ancho: 1672, avif: `${image.replace(/\.webp$/, '-960.avif')} 960w, ${image.replace(/\.webp$/, '.avif')} 1672w` };
  return { w480: image, w960: image, full: image, ancho: 0, avif: '' };
};
/** El srcset de una foto con variantes, o nada. */
export const srcsetDe = (image: string) => { const v = variantes(image); return v.ancho ? `${v.w480} 480w, ${v.w960} 960w, ${v.full} ${v.ancho}w` : undefined; };
/** Las fichas que mejor representan un conjunto, con la curaduría del sitio (utils/antecedentesCuration): los casos fuertes primero, las ventas de insumos y los registros con error al final; dentro de cada grupo, las más recientes. Para las ocho tarjetas de un servicio o un sector. */
const ORDEN_CALIDAD: Record<string, number> = { 'strong-case': 0, 'needs-editorial-review': 1, 'low-value-candidate': 2, 'data-error-candidate': 3 };
export const destacados = (lista: Story[], n: number): Story[] => {
  const rango = (c: Story) => ORDEN_CALIDAD[curateAntecedente({ id: c.id, Titulo: c.title, Descripcion: c.summary, Cliente: c.client, Area: c.sector, Fecha: c.inicio || (c.year ? `${c.year}-${String(c.month || 1).padStart(2, '0')}-01` : '') }).curation.quality] ?? 1;
  return lista.map((c, i) => ({ c, i, r: rango(c) })).sort((a, b) => a.r - b.r || a.i - b.i).slice(0, n).map((x) => x.c);
};
/** La miniatura de ficha: la variante de 480 px. */
export const thumbOf = (image: string) => variantes(image).w480;
/** La película de Blender de la escena del sector, con su póster JPG (1920×1080). */
export const filmOf = (sectorSlug: string) => { const scene = SCENE_OF[sectorSlug] || 'fachada'; return { film: `/cine/media/cine-${scene}.mp4`, poster: `/cine/media/cine-${scene}-poster.jpg` }; };
export const posterOf = (sectorSlug: string, code?: string) => {
  const scene = SCENE_OF[sectorSlug] || 'fachada';
  return `/cine/media/cine-${scene}${code && SERVICE_KEY[code] ? `-${SERVICE_KEY[code]}` : ''}-poster.avif`;
};

export async function loadStories() {
  const catalog = await getAntecedentes({ limit: 1000 });
  // El total que ve el sitio es el de las fichas servidas: catálogo más obras en curso de SGI. Así portada, nosotros y muro dicen lo mismo.
  const totalCatalogo = getAntecedentesCatalogCount();
  const byCode = new Map(NAV_SERVICES.map((s) => [s.code, s.name]));
  // Obras de SGI que todavía no están en el catálogo web (en curso): entran con lo que SGI sabe.
  const slugDe = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
  type Extra = { id: number; original_id: string; Titulo: string; Cliente: string; sector: string; servicios: string[]; inicio: string; cierre: string; estado: Estado; Descripcion: string };
  const extras = (extraJson as { proyectos: Extra[] }).proyectos.filter((e) => !catalog.some((c) => c.id === e.id));
  const EXTRA_DE = new Map(extras.map((e) => [e.id, e]));
  const catalogoCompleto = [...catalog, ...extras.map((e) => ({ id: e.id, title: e.Titulo, slug: slugDe(e.Titulo), client: e.Cliente, sector_slug: e.sector, service_codes: e.servicios.map(Number), year: Number(e.inicio.slice(0, 4)), month: Number(e.inicio.slice(5, 7)), location: '', scope: [] as string[], status: 'operativo' as const, image: SECTOR_PHOTO[e.sector] || SECTOR_PHOTO['constructoras'], summary: e.Descripcion, tags: [] as string[] }))];
  const tituloOrigenPorId = new Map(catalogoCompleto.map((c) => [c.id, c.title]));
  const origenPorId = new Map(catalogoCompleto.map((c) => [c.id, c]));
  const sectorDe = resolverSector(catalogoCompleto.map((c) => ({ client: c.client, sector: c.sector_slug })));
  const stories: Story[] = [...catalogoCompleto]
    .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id))
    .map((c) => {
      const client = nombreCliente(c.client);
      const title = tituloProyecto(c.title, c.client, c.summary);
      const summary = sinTitulo(descripcionDeOrigen(c.id), title, client) || cleanSummary(c.summary, title, client);
      const sectorReal = addEvidenceBackedSector(c.id, c.title, c.summary, sectorDe(c.client, c.sector_slug, `${c.title} ${c.summary}`));
      // El catálogo dice "gobierno"; la navegación del sitio, "gobiernosectorpublico".
      const sectorSlug = sectorReal === 'gobierno' ? 'gobiernosectorpublico' : sectorReal;
      const extra = EXTRA_DE.get(c.id);
      const sgi = extra ? { inicio: extra.inicio, cierre: extra.cierre, estado: extra.estado } : sgiDe(c.id);
      const inicio = sgi?.inicio || '';
      return {
        id: c.id,
        slug: c.slug,
        href: `/antecedentes/${c.id}/${c.slug}`,
        client,
        title,
        // SGI es el sistema de registro: su fecha de inicio manda sobre la del catálogo cuando existe.
        year: inicio ? Number(inicio.slice(0, 4)) : c.year,
        month: inicio ? Number(inicio.slice(5, 7)) : c.month,
        inicio: inicio || undefined,
        cierre: sgi?.cierre || undefined,
        estado: sgi?.estado,
        sgiId: extra ? extra.original_id : sgi ? String(c.id) : undefined,
        sector: sectorReal ? getAntecedenteSectorLabel(sectorReal === 'gobiernosectorpublico' ? 'gobierno' : sectorReal) || '' : '',
        sectorSlug,
        serviceCodes: c.service_codes.map(String),
        services: c.service_codes.map((code) => byCode.get(String(code)) || '').filter(Boolean),
        image: curateCatalogImage(c.id, c.image || ''),
        summary,
        status: c.status,
      };
    });
  // Sector heredado por regla: las fichas sin sector toman el de su cliente sólo si la evidencia pesa (tres o más con ese sector, un tercio o más de todas las del cliente).
  const sectoresDe = new Map<string, Map<string, number>>();
  const fichasDe = new Map<string, number>();
  stories.forEach((s) => { const k = s.client.toLowerCase(); fichasDe.set(k, (fichasDe.get(k) || 0) + 1); if (s.sectorSlug) { const m = sectoresDe.get(k) || new Map<string, number>(); m.set(s.sectorSlug, (m.get(s.sectorSlug) || 0) + 1); sectoresDe.set(k, m); } });
  stories.forEach((s) => {
    if (s.sectorSlug) return;
    const k = s.client.toLowerCase(); const m = sectoresDe.get(k); if (!m) return;
    const [top, n] = [...m.entries()].sort((a, b) => b[1] - a[1])[0]!;
    if (n >= 3 && n >= (fichasDe.get(k) || 0) / 3) { s.sectorSlug = top; s.sector = getAntecedenteSectorLabel(top === 'gobiernosectorpublico' ? 'gobierno' : top) || ''; }
  });
  // Con las fechas de SGI, el orden se rehace: lo más reciente primero.
  stories.sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id));
  // Ningún proyecto se oculta por repetir título: se distingue por su descripción o por su fecha.
  desambiguarTitulos(stories);
  // El título concreto de algunas fichas se obtiene al desambiguar descripciones que
  // comparten el rótulo genérico del CMS. Reconciliar antes dejaba heredar Software.
  stories.forEach((story) => {
    const serviceCodes = reconcileGeneratedSoftwareService(
      tituloOrigenPorId.get(story.id) || '',
      story.title,
      story.summary,
      story.serviceCodes,
    );
    const origin = origenPorId.get(story.id);
    story.serviceCodes = addEvidenceBackedService(story.id, origin?.title || '', origin?.summary || '', serviceCodes);
    story.services = story.serviceCodes.map((code) => byCode.get(code) || '').filter(Boolean);
  });
  // Si la descripción no dice más que el título, la ficha no la repite.
  stories.forEach((s) => { if (s.summary && comparable(s.summary) === comparable(s.title)) s.summary = ''; });
  const countOf = (slug: string) => stories.filter((c) => c.sectorSlug === slug).length;
  const places = PLACES.map((p) => {
    const row = SECTORS.find((s) => s.slug === p.slug)!;
    return { ...p, name: row.name, text: row.text, href: `/sectores/${p.slug}`, count: countOf(p.slug), stories: stories.filter((s) => s.sectorSlug === p.slug).slice(0, 3) };
  });
  const years = catalog.map((c) => c.year).filter(Boolean);
  return { total: Math.max(totalCatalogo, stories.length), stories, places, firstYear: Math.min(...years), lastYear: Math.max(...years) };
}
