/**
 * Casos por sector: fuente única para home, /sectores y cada portada de sector.
 * Se cuentan sobre el catálogo publicado (snapshot de Antecedentes) con las mismas
 * palabras clave que usa cada página de sector para listar sus casos.
 */
import antecedentesSnapshot from './snapshots/antecedentes.json';
import sectoresSnapshot from './snapshots/sectores.json';

type Row = Record<string, unknown>;
const rows = <T>(raw: unknown): T[] => (Array.isArray(raw) ? raw : ((raw as { data?: T[] })?.data || [])) as T[];

const cases = rows<Row>(antecedentesSnapshot);
const sectors = rows<{ slug: string; keywords?: string[] }>(sectoresSnapshot);

const haystack = (item: Row) =>
  ['Cliente', 'Titulo', 'Area', 'Descripcion', 'Nombre'].map((key) => String(item[key] || '')).join(' ').toLowerCase();

const COUNTS: Record<string, number> = Object.fromEntries(
  sectors.map((sector) => {
    const keywords = (sector.keywords || []).map((keyword) => keyword.toLowerCase());
    return [sector.slug, cases.filter((item) => keywords.some((keyword) => haystack(item).includes(keyword))).length];
  }),
);

/** Por debajo de este umbral la cifra no se muestra: el sector se presenta sin conteo. */
export const MIN_VISIBLE_CASES = 20;

export function sectorCaseCount(slug: string): number {
  return COUNTS[slug] ?? 0;
}

/** "109" o null si el sector no alcanza el umbral. */
export function sectorCaseLabel(slug: string): string | null {
  const count = sectorCaseCount(slug);
  return count >= MIN_VISIBLE_CASES ? String(count) : null;
}
