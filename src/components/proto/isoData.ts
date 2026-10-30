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
const clientCase = (client: string) => client === client.toUpperCase()
  ? client.toLowerCase().replace(/(^|\s)(\S)/g, (m: string) => m.toUpperCase()).replace(/\b(De|Del|La|Las|Los|Y|E|Sa|Srl)\b/g, (w: string) => (/^(Sa|Srl)$/.test(w) ? w.toUpperCase() : w.toLowerCase()))
  : client;
const cleanTitle = (raw: unknown, client: string) => {
  let title = cleanText(raw);
  if (title.includes('|')) title = title.split('|')[0].trim() || title;
  const suffix = ` - ${client}`.toLowerCase();
  if (client && title.toLowerCase().endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
  return title.replace(/\s*\(\d+\)\s*$/, '').replace(/\s+-\s+/g, ' · ');
};

export type Story = { id: number; href: string; client: string; title: string; year: number; sector: string; sectorSlug: string; services: string[]; image: string };

export async function loadStories() {
  const catalog = await getAntecedentes({ limit: 1000 });
  const total = getAntecedentesCatalogCount();
  const byCode = new Map(NAV_SERVICES.map((s) => [s.code, s.name]));
  const stories: Story[] = [...catalog]
    .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id))
    .filter((c, i, arr) => arr.findIndex((o) => `${o.title}|${o.client}`.toLowerCase() === `${c.title}|${c.client}`.toLowerCase()) === i)
    .map((c) => {
      const client = clientCase(cleanText(c.client));
      return {
        id: c.id,
        href: `/antecedentes/${c.id}/${c.slug}`,
        client,
        title: cleanTitle(c.title, client),
        year: c.year,
        sector: getAntecedenteSectorLabel(c.sector_slug) || '',
        sectorSlug: c.sector_slug,
        services: c.service_codes.map((code) => byCode.get(String(code)) || '').filter(Boolean),
        image: c.image,
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
