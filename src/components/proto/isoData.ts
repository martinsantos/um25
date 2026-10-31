/**
 * Datos compartidos de las propuestas de portada con despieces (2026-10-30).
 * Sólo reúne lo que ya existe en el sitio: las isometrías de /cine/iso, las fotos editoriales,
 * los ocho servicios de la navegación y el catálogo de antecedentes. Ningún texto nuevo.
 */
import { readFileSync } from 'node:fs';
import { getAntecedentes } from '../../lib/um26-directus';
import { getAntecedenteSectorLabel } from '../../utils/antecedenteSectorPresentation';
import { getAntecedentesCatalogCount } from '../../utils/verifiedProof';
import { NAV_SERVICES } from '../../data/navigation';
import { SECTORS } from '../../data/cine/scenes';
import { descripcionDeOrigen } from './relato';
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

/** La isometría completa (SVG) de un sitio, para incrustar en el HTML. */
export const readIso = (site: IsoSite): string =>
  readFileSync(new URL(`../../../public${isoSrc(site)}`, import.meta.url), 'utf8')
    .replace(/<\?xml[^>]*>/, '')
    .replace(/ id="sp-[a-z]+-(title|desc)"/g, '')
    .replace(/ aria-labelledby="[^"]*"/, ' aria-hidden="true"');

/** Proporción ancho/alto del dibujo de un sitio, leída de su viewBox: la caja se reserva antes de que llegue el SVG y la página no salta. */
const RATIO: Partial<Record<IsoSite, number>> = {};
export const isoRatio = (site: IsoSite): number => {
  if (RATIO[site]) return RATIO[site]!;
  try { const vb = readFileSync(new URL(`../../../public${isoSrc(site)}`, import.meta.url), 'utf8').match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/); RATIO[site] = vb ? Number(vb[3]) / Number(vb[4]) : 1; } catch { RATIO[site] = 1; }
  return RATIO[site]!;
};

/** El despiece de un equipo (switch, cámara, panel…), por código de servicio. */
export const readDevice = (code: string): string =>
  readFileSync(new URL(`../../../public/cine/iso/service-${code}.svg`, import.meta.url), 'utf8').replace(/<\?xml[^>]*>/, '');

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

const TEMPLATE_PHRASES: Array<[RegExp, string]> = [
  [/(^|>)\s*Ejecución integral de\s+/gi, '$1'],
  [/,?\s*asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad\.?/gi, '.'],
  [/\s*Cliente:\s*[^.<]+\.?\s*(?:Sector:\s*[^.<]+\.?)?\s*(?=<|$)/gi, ''],
];
const comparable = (v: string) => v.toLowerCase().replace(/\(\d+\)/g, ' ').replace(/[.,:;()·|-]/g, ' ').replace(/\s+/g, ' ').trim();
/** Descripción sin plantillas ni repeticiones del título; vacía si no aporta nada. */
export const cleanSummary = (raw: unknown, title: string, client: string): string => {
  let text = String(raw ?? '').replace(/<[^>]+>/g, ' ');
  for (const [re, rep] of TEMPLATE_PHRASES) text = text.replace(re, rep);
  text = text.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  const body = comparable(text);
  if (!body || body === comparable(title) || body === comparable(`${client} ${title}`) || body === comparable(`${title} ${client}`)) return '';
  return text;
};

/** Escena de película y clave de servicio, con la convención de /cine/media. */
export const SCENE_OF: Record<string, string> = { bodegas: 'bodega', aeropuertos: 'aeropuerto', salud: 'hospital', mineria: 'planta', industria: 'planta', constructoras: 'fachada', gobiernosectorpublico: 'fachada', gobierno: 'fachada' };
export const SERVICE_KEY: Record<string, string> = { '101': 'redes', '102': 'seguridad', '103': 'telecom', '104': 'software', '105': 'soporte', '106': 'consultoria', '107': 'incendios', '108': 'electricos' };
export const SITE_OF: Record<string, IsoSite> = { bodegas: 'winery', aeropuertos: 'terminal', salud: 'clinic', mineria: 'mine', industria: 'plant', constructoras: 'building', gobiernosectorpublico: 'building', gobierno: 'building' };
/** Fotos editoriales: la imagen a pleno de cada servicio y de cada sector. */
export const SERVICE_PHOTO: Record<string, string> = { '101': '/images/editorial/umsa-service-redes.webp', '102': '/images/editorial/umsa-service-seguridad-electronica.webp', '103': '/images/editorial/umsa-service-telecomunicaciones.webp', '104': '/images/editorial/umsa-service-software-a-medida.webp', '105': '/images/editorial/umsa-service-soporte-247.webp', '106': '/images/editorial/umsa-service-consultoria-it.webp', '107': '/images/editorial/umsa-service-deteccion-incendios.webp', '108': '/images/editorial/umsa-service-electricos-it.webp' };
export const SECTOR_PHOTO: Record<string, string> = { bodegas: '/images/editorial/umsa-sector-bodegas.webp', aeropuertos: '/images/editorial/umsa-sector-aeropuertos.webp', salud: '/images/editorial/umsa-sector-salud.webp', mineria: '/images/editorial/umsa-sector-mineria.webp', industria: '/images/editorial/umsa-sector-industria.webp', constructoras: '/images/editorial/umsa-sector-constructoras.webp', gobiernosectorpublico: '/images/editorial/umsa-sector-gobierno.webp', gobierno: '/images/editorial/umsa-sector-gobierno.webp' };
export const thumbOf = (image: string) => /^\/images\/antecedentes\/generated\/.+-principal\.webp$/.test(image) ? image.replace(/-principal\.webp$/, '-principal-480.webp') : image;
/** La película de Blender de la escena del sector, con su póster JPG (1920×1080). */
export const filmOf = (sectorSlug: string) => { const scene = SCENE_OF[sectorSlug] || 'fachada'; return { film: `/cine/media/cine-${scene}.mp4`, poster: `/cine/media/cine-${scene}-poster.jpg` }; };
export const posterOf = (sectorSlug: string, code?: string) => {
  const scene = SCENE_OF[sectorSlug] || 'fachada';
  return `/cine/media/cine-${scene}${code && SERVICE_KEY[code] ? `-${SERVICE_KEY[code]}` : ''}-poster.avif`;
};

export async function loadStories() {
  const catalog = await getAntecedentes({ limit: 1000 });
  const total = getAntecedentesCatalogCount();
  const byCode = new Map(NAV_SERVICES.map((s) => [s.code, s.name]));
  // Obras de SGI que todavía no están en el catálogo web (en curso): entran con lo que SGI sabe.
  const slugDe = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
  type Extra = { id: number; original_id: string; Titulo: string; Cliente: string; sector: string; servicios: string[]; inicio: string; cierre: string; estado: Estado; Descripcion: string };
  const extras = (extraJson as { proyectos: Extra[] }).proyectos.filter((e) => !catalog.some((c) => c.id === e.id));
  const EXTRA_DE = new Map(extras.map((e) => [e.id, e]));
  const catalogoCompleto = [...catalog, ...extras.map((e) => ({ id: e.id, title: e.Titulo, slug: slugDe(e.Titulo), client: e.Cliente, sector_slug: e.sector, service_codes: e.servicios.map(Number), year: Number(e.inicio.slice(0, 4)), month: Number(e.inicio.slice(5, 7)), location: '', scope: [] as string[], status: 'operativo' as const, image: SECTOR_PHOTO[e.sector] || SECTOR_PHOTO.constructoras, summary: e.Descripcion, tags: [] as string[] }))];
  const sectorDe = resolverSector(catalogoCompleto.map((c) => ({ client: c.client, sector: c.sector_slug })));
  const stories: Story[] = [...catalogoCompleto]
    .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id))
    .map((c) => {
      const client = nombreCliente(c.client);
      const title = tituloProyecto(c.title, c.client, c.summary);
      const sectorReal = sectorDe(c.client, c.sector_slug, `${c.title} ${c.summary}`);
      // El catálogo dice "gobierno"; la navegación del sitio, "gobiernosectorpublico".
      const sectorSlug = sectorReal === 'gobierno' ? 'gobiernosectorpublico' : sectorReal;
      const extra = EXTRA_DE.get(c.id);
      const sgi = extra ? { inicio: extra.inicio, cierre: extra.cierre, estado: extra.estado } : sgiDe(c.id);
      const inicio = sgi?.inicio || '';
      return {
        id: c.id,
        slug: c.slug,
        href: `/propuesta/antecedentes/${c.id}/${c.slug}`,
        client,
        title,
        // SGI es el sistema de registro: su fecha de inicio manda sobre la del catálogo cuando existe.
        year: inicio ? Number(inicio.slice(0, 4)) : c.year,
        month: inicio ? Number(inicio.slice(5, 7)) : c.month,
        inicio: inicio || undefined,
        cierre: sgi?.cierre || undefined,
        estado: sgi?.estado,
        sgiId: extra ? extra.original_id : sgi ? String(c.id) : undefined,
        sector: sectorReal ? getAntecedenteSectorLabel(sectorReal) || '' : '',
        sectorSlug,
        serviceCodes: c.service_codes.map(String),
        services: c.service_codes.map((code) => byCode.get(String(code)) || '').filter(Boolean),
        image: c.image,
        summary: descripcionDeOrigen(c.id) || cleanSummary(c.summary, title, client),
        status: c.status,
      };
    });
  // Sector heredado por regla: si un cliente tiene sector en sus otras fichas, y uno solo, sus fichas sin sector lo toman.
  const sectoresDe = new Map<string, Set<string>>();
  stories.forEach((s) => { if (s.sectorSlug) { const k = s.client.toLowerCase(); sectoresDe.set(k, (sectoresDe.get(k) || new Set()).add(s.sectorSlug)); } });
  stories.forEach((s) => { if (!s.sectorSlug) { const set = sectoresDe.get(s.client.toLowerCase()); if (set && set.size === 1) { s.sectorSlug = [...set][0]; s.sector = getAntecedenteSectorLabel(s.sectorSlug === 'gobiernosectorpublico' ? 'gobierno' : s.sectorSlug) || ''; } } });
  // Con las fechas de SGI, el orden se rehace: lo más reciente primero.
  stories.sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id));
  // Ningún proyecto se oculta por repetir título: se distingue por su descripción o por su fecha.
  desambiguarTitulos(stories);
  // Si la descripción no dice más que el título, la ficha no la repite.
  stories.forEach((s) => { if (s.summary && comparable(s.summary) === comparable(s.title)) s.summary = ''; });
  const countOf = (slug: string) => catalog.filter((c) => sectorDe(c.client, c.sector_slug, `${c.title} ${c.summary}`) === slug).length;
  const places = PLACES.map((p) => {
    const row = SECTORS.find((s) => s.slug === p.slug)!;
    return { ...p, name: row.name, text: row.text, href: `/${p.slug}`, count: countOf(p.slug), stories: stories.filter((s) => s.sectorSlug === p.slug).slice(0, 3) };
  });
  const years = catalog.map((c) => c.year).filter(Boolean);
  return { total, stories, places, firstYear: Math.min(...years), lastYear: Math.max(...years) };
}
