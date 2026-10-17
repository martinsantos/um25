// The real archive, per sector: each case read by its own client, title and description
// (the CMS sector tag is loose) and assigned the service its work describes. Shared by the
// sector infographic (cases under their service) and the closing record list.
import antecedentesSnapshot from '../snapshots/antecedentes.json';
import { generateSlug } from '../../utils/slugUtils.js';
import { caseService } from './stageMap';

const SECTOR_TEXT: Record<string, RegExp> = {
  salud: /hospital|cl[ií]nic|sanatorio|fuesmen|medicina|salud mental|caps\b/i,
  constructoras: /torre|edificio|consorcio|fideicomiso|constructora|desarrolladora/i,
  aeropuertos: /aeropuert|aa2000|aeroparque|terminal a[eé]rea/i,
  industria: /industr|planta(?! baja)|f[aá]brica|premix|frigor[ií]fico|metal[uú]rg/i,
  bodegas: /bodega|vi[nñ]edo|vitivin|\bvinos?\b/i,
  mineria: /miner|\bmina\b|yacimiento/i,
};
// Matches that belong to another kind of client (an event, a municipality's tower, a mall).
const EXCLUDE: Record<string, RegExp> = {
  industria: /c[aá]mara de comercio|evento|bodega|planta uno|torre/i,
  constructoras: /municipalidad|enlace|antena/i,
};

export interface SectorCase { client: string; work: string; year: string; href: string; svc: string | null }

// The archive pastes its own loose area label into titles and descriptions ("Sector:
// Aeropuertos & Telecomunicaciones", "Gobierno & Sector Público: ..."); drop it before
// reading what the work was, or a server for an olive grower reads as airport work.
const stripArea = (v: string) => v.replace(/^[\p{L} ]{3,40} & [\p{L} ]{3,40}:\s*/u, '');
const ownText = (r: any) => [r.Cliente, r.Titulo, r.Descripcion].join(' ')
  .replace(/Sector:\s*[^.]*\.?/gi, ' ')
  .replace(/[\p{L} ]{3,40} & [\p{L} ]{3,40}:\s*/gu, ' ');

const records: any[] = Array.isArray(antecedentesSnapshot) ? antecedentesSnapshot : (antecedentesSnapshot as any).data || [];
const clean = (v: unknown) => String(v || '').replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim();
const titleCase = (v: string) => (v === v.toUpperCase() ? v.toLowerCase().replace(/(^|\s|\()(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : v);
// The archive often repeats the client inside the title; keep the work, drop the echo.
const work = (item: any) => {
  const client = clean(item.Cliente);
  let t = stripArea(clean(item.Titulo)).split(' - ')[0];
  if (client) t = t.replace(new RegExp(client.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '').replace(/\s{2,}/g, ' ').replace(/[\s:–-]+$/, '').trim();
  t = t.replace(/\s+(para|de|del|en|y|a)$/i, '').replace(/\bSiste?na\b|\bSitema\b/g, 'Sistema').replace(/\bremplazo\b/gi, 'reemplazo').replace(/\bdebiles\b/g, 'débiles').replace(/\binformatica\b/g, 'informática').replace(/\btecnica\b/gi, 'técnica').replace(/\bdeteccion\b/gi, 'detección');
  t = t || clean(item.Titulo);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function sectorCases(sector: string): SectorCase[] {
  const match = SECTOR_TEXT[sector]; if (!match) return [];
  const seen = new Set<string>();
  return records
    .filter((r) => { const text = ownText(r); return match.test(text) && !EXCLUDE[sector]?.test(text); })
    .sort((a, b) => String(b.Fecha || '').localeCompare(String(a.Fecha || '')))
    // A case sits under a service only when its own title names that work; descriptions and
    // the archive's area label are too loose to attribute it.
    .map((r) => ({ client: titleCase(clean(r.Cliente) || 'Cliente reservado'), work: work(r), year: String(r.Fecha || '').slice(0, 4), href: `/antecedentes/${r.id}/${generateSlug(r.Titulo || '')}`, svc: caseService({ Titulo: stripArea(clean(r.Titulo)) }) }))
    .filter((r) => { const k = `${r.client}|${r.work}`.toLowerCase(); if (seen.has(k) || r.work.length < 14 || /^adicional\b|sector p[uú]blico|actualizar presupuesto/i.test(r.work)) return false; seen.add(k); return true; });
}
