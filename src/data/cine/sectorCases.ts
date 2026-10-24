// El archivo real, por sector: cada caso leído por su propio cliente, título y descripción
// (la etiqueta de sector del CMS es floja) y asignado al servicio que describe su trabajo.
// Lo comparten el despiece del sector (casos bajo su servicio) y la lista de antecedentes
// del cierre.
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
  // Gobierno y software tienen escena propia en SECTOR_FILMS (slugs `gobierno` y `software`) y
  // casos propios: se leen igual, por cliente, título y descripción.
  gobierno: /municipalidad|gobierno de|ministerio|poder judicial|vialidad|irrigaci[oó]n|fondo para la transformaci|administraci[oó]n federal|legislat|concejo|intendencia|sector p[uú]blico/i,
  software: /software|digitalizaci[oó]n de procesos|aplicaci[oó]n (web|m[oó]vil)|sistema de gesti[oó]n|\bapi\b/i,
};
// Coincidencias que son de otro tipo de cliente (un evento, la torre de una municipalidad, un shopping).
const EXCLUDE: Record<string, RegExp> = {
  industria: /c[aá]mara de comercio|evento|bodega|planta uno|torre/i,
  constructoras: /municipalidad|enlace|antena/i,
  gobierno: /hospital|cl[ií]nic|sanatorio|aeropuert/i,
};
// La página pública de gobierno se llama /gobierno; el dato del CMS, gobiernosectorpublico.
const ALIAS: Record<string, string> = { gobiernosectorpublico: 'gobierno' };

export interface SectorCase { client: string; work: string; year: string; href: string; svc: string | null }

// El archivo pega su propia etiqueta de área en títulos y descripciones ("Sector:
// Aeropuertos & Telecomunicaciones", "Gobierno & Sector Público: ..."); se la saca antes de
// leer qué fue el trabajo, o un servidor para un olivicultor se lee como obra de aeropuerto.
const stripArea = (v: string) => v.replace(/^[\p{L} ]{3,40} & [\p{L} ]{3,40}:\s*/u, '');
const ownText = (r: any) => [r.Cliente, r.Titulo, r.Descripcion].join(' ')
  .replace(/Sector:\s*[^.]*\.?/gi, ' ')
  .replace(/[\p{L} ]{3,40} & [\p{L} ]{3,40}:\s*/gu, ' ');

const records: any[] = Array.isArray(antecedentesSnapshot) ? antecedentesSnapshot : (antecedentesSnapshot as any).data || [];
const clean = (v: unknown) => String(v || '').replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim();
const titleCase = (v: string) => (v === v.toUpperCase() ? v.toLowerCase().replace(/(^|\s|\()(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : v);
// El archivo repite seguido el cliente dentro del título; se queda el trabajo y se saca el eco.
const work = (item: any) => {
  const client = clean(item.Cliente);
  let t = stripArea(clean(item.Titulo)).split(' - ')[0];
  if (client) t = t.replace(new RegExp(client.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '').replace(/\s{2,}/g, ' ').replace(/[\s:–-]+$/, '').trim();
  t = t.replace(/\s+(para|de|del|en|y|a)$/i, '').replace(/\bSiste?na\b|\bSitema\b/g, 'Sistema').replace(/\bremplazo\b/gi, 'reemplazo').replace(/\bdebiles\b/g, 'débiles').replace(/\binformatica\b/g, 'informática').replace(/\btecnica\b/gi, 'técnica').replace(/\bdeteccion\b/gi, 'detección');
  t = t || clean(item.Titulo);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function sectorCases(slug: string): SectorCase[] {
  const sector = ALIAS[slug] || slug;
  const match = SECTOR_TEXT[sector]; if (!match) return [];
  const seen = new Set<string>();
  return records
    .filter((r) => { const text = ownText(r); return match.test(text) && !EXCLUDE[sector]?.test(text); })
    .sort((a, b) => String(b.Fecha || '').localeCompare(String(a.Fecha || '')))
    // Un caso queda bajo un servicio sólo cuando su propio título nombra ese trabajo; las
    // descripciones y la etiqueta de área del archivo son muy sueltas para atribuirlo.
    .map((r) => ({ client: titleCase(clean(r.Cliente) || 'Cliente reservado'), work: work(r), year: String(r.Fecha || '').slice(0, 4), href: `/antecedentes/${r.id}/${generateSlug(r.Titulo || '')}`, svc: caseService({ Titulo: stripArea(clean(r.Titulo)) }) }))
    .filter((r) => { const k = `${r.client}|${r.work}`.toLowerCase().replace(/\bde\b/g, '').replace(/\s+/g, ' '); if (seen.has(k) || r.work.length < 14 || /^adicional\b|sector p[uú]blico|actualizar presupuesto/i.test(r.work)) return false; seen.add(k); return true; });
}
