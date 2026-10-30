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

export type IsoSite = 'building' | 'winery' | 'terminal' | 'clinic' | 'mine' | 'plant';

/** La isometría completa (SVG) de un sitio, para incrustar en el HTML. */
export const readIso = (site: IsoSite): string =>
  readFileSync(new URL(`../../../public/cine/iso/site-${site}-v2.svg`, import.meta.url), 'utf8')
    .replace(/<\?xml[^>]*>/, '')
    .replace(/ id="sp-[a-z]+-(title|desc)"/g, '')
    .replace(/ aria-labelledby="[^"]*"/, ' aria-hidden="true"');

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
// Cliente en caja normal si el registro viene todo en mayúsculas o todo en minúsculas.
const clientCase = (client: string) => (client === client.toUpperCase() || client === client.toLowerCase())
  ? client.toLowerCase().replace(/(^|\s)(\S)/g, (m: string) => m.toUpperCase()).replace(/\b(De|Del|La|Las|Los|Y|E|Sa|Srl|S\.a\.|S\.r\.l\.)\b/gi, (w: string) => (/^(sa|srl|s\.a\.|s\.r\.l\.)$/i.test(w) ? w.toUpperCase() : w.toLowerCase()))
  : client;
const cleanTitle = (raw: unknown, client: string) => {
  let title = cleanText(raw);
  if (title.includes('|')) title = title.split('|')[0].trim() || title;
  // El título importado repite el cliente y la fecha ("… - Cliente - Febrero 2025"): se quitan.
  const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre';
  title = title.replace(new RegExp(`\\s+-\\s+(${MESES})\\s+\\d{4}\\s*$`, 'i'), '');
  if (client) { const re = new RegExp(`\\s+-\\s+${client.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(?=\\s+-\\s+|\\s*$)`, 'i'); title = title.replace(re, ''); }
  return title.replace(/\s*\(\d+\)\s*$/, '').replace(/\s+-\s+/g, ' · ').replace(/[.\s]+$/, '');
};

export type Story = { id: number; slug: string; href: string; client: string; title: string; year: number; month: number; sector: string; sectorSlug: string; serviceCodes: string[]; services: string[]; image: string; summary: string; status: string };

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
export const SCENE_OF: Record<string, string> = { bodegas: 'bodega', aeropuertos: 'aeropuerto', salud: 'hospital', mineria: 'planta', industria: 'planta', constructoras: 'fachada', gobiernosectorpublico: 'fachada', 'seguridad-electronica': 'aeropuerto', software: 'fachada' };
export const SERVICE_KEY: Record<string, string> = { '101': 'redes', '102': 'seguridad', '103': 'telecom', '104': 'software', '105': 'soporte', '106': 'consultoria', '107': 'incendios', '108': 'electricos' };
export const SITE_OF: Record<string, IsoSite> = { bodegas: 'winery', aeropuertos: 'terminal', salud: 'clinic', mineria: 'mine', industria: 'plant', constructoras: 'building', gobiernosectorpublico: 'building', 'seguridad-electronica': 'terminal', software: 'building' };
/** Fotos editoriales: la imagen a pleno de cada servicio y de cada sector. */
export const SERVICE_PHOTO: Record<string, string> = { '101': '/images/editorial/umsa-service-redes.webp', '102': '/images/editorial/umsa-service-seguridad-electronica.webp', '103': '/images/editorial/umsa-service-telecomunicaciones.webp', '104': '/images/editorial/umsa-service-software-a-medida.webp', '105': '/images/editorial/umsa-service-soporte-247.webp', '106': '/images/editorial/umsa-service-consultoria-it.webp', '107': '/images/editorial/umsa-service-deteccion-incendios.webp', '108': '/images/editorial/umsa-service-electricos-it.webp' };
export const SECTOR_PHOTO: Record<string, string> = { bodegas: '/images/editorial/umsa-sector-bodegas.webp', aeropuertos: '/images/editorial/umsa-sector-aeropuertos.webp', salud: '/images/editorial/umsa-sector-salud.webp', mineria: '/images/editorial/umsa-sector-mineria.webp', industria: '/images/editorial/umsa-sector-industria.webp', constructoras: '/images/editorial/umsa-sector-constructoras.webp', gobiernosectorpublico: '/images/editorial/umsa-sector-gobierno.webp', 'seguridad-electronica': '/images/editorial/umsa-sector-seguridad-electronica.webp', software: '/images/editorial/umsa-sector-software.webp' };
export const thumbOf = (image: string) => /^\/images\/antecedentes\/generated\/.+-principal\.webp$/.test(image) ? image.replace(/-principal\.webp$/, '-principal-480.webp') : image;
export const posterOf = (sectorSlug: string, code?: string) => {
  const scene = SCENE_OF[sectorSlug] || 'fachada';
  return `/cine/media/cine-${scene}${code && SERVICE_KEY[code] ? `-${SERVICE_KEY[code]}` : ''}-poster.avif`;
};

export async function loadStories() {
  const catalog = await getAntecedentes({ limit: 1000 });
  const total = getAntecedentesCatalogCount();
  const byCode = new Map(NAV_SERVICES.map((s) => [s.code, s.name]));
  const stories: Story[] = [...catalog]
    .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id))
    .filter((c, i, arr) => arr.findIndex((o) => `${o.title}|${o.client}`.toLowerCase() === `${c.title}|${c.client}`.toLowerCase()) === i)
    .map((c) => {
      const client = clientCase(cleanText(c.client));
      const title = cleanTitle(c.title, client);
      return {
        id: c.id,
        slug: c.slug,
        href: `/propuesta/antecedentes/${c.id}/${c.slug}`,
        client,
        title,
        year: c.year,
        month: c.month,
        sector: getAntecedenteSectorLabel(c.sector_slug) || '',
        sectorSlug: c.sector_slug,
        serviceCodes: c.service_codes.map(String),
        services: c.service_codes.map((code) => byCode.get(String(code)) || '').filter(Boolean),
        image: c.image,
        summary: descripcionDeOrigen(c.id) || cleanSummary(c.summary, title, client),
        status: c.status,
      };
    });
  const countOf = (slug: string) => catalog.filter((c) => c.sector_slug === slug).length;
  const places = PLACES.map((p) => {
    const row = SECTORS.find((s) => s.slug === p.slug)!;
    return { ...p, name: row.name, text: row.text, href: `/${p.slug}`, count: countOf(p.slug), stories: stories.filter((s) => s.sectorSlug === p.slug).slice(0, 3) };
  });
  const years = catalog.map((c) => c.year).filter(Boolean);
  return { total, stories, places, firstYear: Math.min(...years), lastYear: Math.max(...years) };
}
