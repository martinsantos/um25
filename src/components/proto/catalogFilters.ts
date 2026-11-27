import { caseLinkReference } from '../../lib/despieceRoutes';

/** Shared filtering for the rendered catalog and its existing public URLs. */
export type CatalogState = Partial<Record<(typeof filterKeys)[number], string>>;
export type CatalogItem = { sector: string; services: string[]; year: string; client: string; search: string; status: string; reviewed?: boolean; documented?: boolean };
export const filterKeys = ['sector', 'service', 'year', 'cliente', 'q', 'periodo', 'estado', 'orden'] as const;
export const catalogCriteria = filterKeys.filter((key) => key !== 'orden');
export function catalogHref(state: CatalogState, without?: (typeof catalogCriteria)[number]): string {
  const params = new URLSearchParams();
  for (const key of filterKeys) {
    const value = state[key];
    if (key !== without && value && !(key === 'orden' && value === 'recent')) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/antecedentes?${query}` : '/antecedentes';
}

export const catalogResultsHref = (state: CatalogState) => catalogHref(state) + '#obras-filtradas';

export const catalogBatch = 36;
export function catalogWindow(value: string | null, total: number) {
  const requested = Number(value);
  return Number.isSafeInteger(requested) && requested > catalogBatch
    ? Math.min(total, Math.ceil(requested / catalogBatch) * catalogBatch)
    : catalogBatch;
}

export function catalogWindowHref(state: CatalogState, limit: number) {
  const path = catalogHref(state);
  return limit > catalogBatch ? path + (path.includes('?') ? '&' : '?') + 'mostrar=' + limit : path;
}

/** Preserve the public case URL for unfiltered browsing. */
export function caseContextQuery(state: CatalogState, visible: number) {
  if (!catalogCriteria.some(key => state[key]) && (!state.orden || state.orden === 'recent')) return '';
  const query = catalogWindowHref(state, visible).split('?')[1];
  return '?desde=archivo&' + query;
}

export function catalogNextHref(state: CatalogState, visible: number, nextId?: number) {
  if (nextId === undefined) return undefined;
  return catalogWindowHref(state, visible + catalogBatch) + '#resultado-um-' + nextId;
}

export function toggleCatalogHref(state: CatalogState, key: 'sector' | 'service' | 'year', value: string) {
  return catalogHref({ ...state, [key]: state[key] === value ? '' : value });
}

export function showCatalogHighlights(state: CatalogState, count: number): boolean {
  return count >= 12 && (!state.orden || state.orden === 'recent') && catalogCriteria.every((key) => !state[key]);
}

export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const clientKey = (value: string) => normalizeSearch(value).replace(/\bs[\W_]*r[\W_]*l\b/g, 'srl').replace(/\bs[\W_]*a\b/g, 'sa').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const periodOf = (value: string) => { const y = Number(value); return y >= 2024 ? '2024' : y >= 2020 ? '2020' : y >= 2015 ? '2015' : y >= 2010 ? '2010' : 'antes'; };
export function catalogState(params: URLSearchParams): Record<(typeof filterKeys)[number], string> {
  const state = Object.fromEntries(filterKeys.map(k => [k, params.get(k) || ''])) as Record<(typeof filterKeys)[number], string>;
  state.q = caseLinkReference(state.q) || state.q;
  state.service ||= params.get('servicio') || '';
  state.year ||= params.get('anio') || '';
  if (state.sector === 'gobierno') state.sector = 'gobiernosectorpublico';
  if (!['recent', 'year-desc', 'year-asc', 'client'].includes(state.orden)) state.orden = 'recent';
  return state;
}
function matchesSearch(text: string, query: string): boolean {
  const terms = normalizeSearch(query).replace(/\bum[\s-]*(\d+)\b/g, 'um-$1').trim().split(/\s+/);
  const haystack = normalizeSearch(text);
  return terms.every(term => haystack.includes(term));
}

export function matchesCatalogSector(sector: string, services: readonly string[], filter?: string): boolean {
  const wanted = filter === 'gobierno' ? 'gobiernosectorpublico' : filter;
  return !wanted || sector === wanted || (wanted === 'sin-clasificar' && !sector)
    || (wanted === 'software' && services.includes('104'))
    || (wanted === 'seguridad-electronica' && services.includes('102'));
}

export function matchesCatalog(it: CatalogItem, state: CatalogState, skip?: string): boolean {
  return (skip === 'sector' || matchesCatalogSector(it.sector, it.services, state.sector)) &&
    (skip === 'service' || !state.service || (state.service === 'sin-clasificar' ? it.services.length === 0 : it.services.includes(state.service))) &&
    (!state.year || it.year === state.year) &&
    (!state.cliente || clientKey(it.client) === clientKey(state.cliente)) &&
    (!state.q || matchesSearch(it.search, state.q)) &&
    (!state.periodo || periodOf(it.year) === state.periodo) &&
    (!state.estado || it.status === state.estado);
}

/** On an empty intersection, keep the client's archive and the chosen sort. */
export function catalogClientRecovery(items: readonly CatalogItem[], state: CatalogState) {
  const { cliente, orden } = state;
  if (!cliente || !catalogCriteria.some((key) => key !== 'cliente' && state[key])) return;

  const retained = { cliente, orden };
  const count = items.filter((item) => matchesCatalog(item, retained)).length;
  if (!count) return;

  return {
    href: catalogHref(retained),
    label: count === 1 ? 'Ver el proyecto de este cliente' : `Ver los ${count} proyectos de este cliente`,
  };
}

/** Suggest the smallest useful change to an empty search before dropping other filters. */
export function catalogRecovery(items: readonly (CatalogItem & { id: number; href: string })[], state: CatalogState) {
  const reference = /^(?:um[\s-]*)?(\d{1,8})$/i.exec(state.q?.trim() || '');
  if (reference) {
    const project = items.find(item => item.id === Number(reference[1]));
    if (project) return { href: project.href, label: `Abrir la ficha UM-${project.id}` };
  }

  const active = catalogCriteria.filter(key => state[key]);
  if (active.length > 1) {
    const facets = { year: 'año', periodo: 'período', estado: 'estado', service: 'servicio', sector: 'sector' } as const;
    for (const key of Object.keys(facets) as (keyof typeof facets)[]) {
      if (!state[key]) continue;
      const retained = { ...state, [key]: '' };
      const count = items.filter(item => matchesCatalog(item, retained)).length;
      if (count) return {
        href: catalogResultsHref(retained),
        label: `Ver ${count} ${count === 1 ? 'obra' : 'obras'} sin el filtro de ${facets[key]}`,
      };
    }
  }

  if (state.q && catalogCriteria.some(key => key !== 'q' && state[key])) {
    const retained = { ...state, q: '' };
    const count = items.filter(item => matchesCatalog(item, retained)).length;
    if (count) return {
      href: catalogHref(retained),
      label: count === 1 ? 'Ver 1 obra sin el texto de búsqueda' : `Ver ${count} obras sin el texto de búsqueda`,
    };
  }
  return catalogClientRecovery(items, state);
}

export function orderCatalog<T extends Pick<CatalogItem, 'year' | 'client' | 'reviewed' | 'documented'>>(items: T[], mode: string, scoped = false): T[] {
  const sorted = [...items];
  switch (mode) {
    case 'client': return sorted.sort((a, b) => a.client.localeCompare(b.client, 'es'));
    case 'year-asc': return sorted.sort((a, b) => Number(a.year) - Number(b.year));
    case 'year-desc': return sorted.sort((a, b) => Number(b.year) - Number(a.year));
    default: return scoped ? sorted.sort((a, b) =>
      Number(Boolean(b.reviewed)) - Number(Boolean(a.reviewed)) ||
      Number(Boolean(b.documented)) - Number(Boolean(a.documented))
    ) : sorted;
  }
}
