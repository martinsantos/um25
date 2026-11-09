/** Shared filtering for the rendered catalog and its existing public URLs. */
export type CatalogState = Partial<Record<(typeof filterKeys)[number], string>>;
export type CatalogItem = { sector: string; services: string[]; year: string; client: string; search: string; status: string };
export const filterKeys = ['sector', 'service', 'year', 'cliente', 'q', 'periodo', 'estado', 'orden'] as const;
export const catalogCriteria = filterKeys.filter((key) => key !== 'orden');
export function catalogHref(state: CatalogState, without?: (typeof catalogCriteria)[number]): string {
  const params = new URLSearchParams();
  for (const key of filterKeys) {
    const value = state[key];
    if (key !== without && value && !(key === 'orden' && value === 'recent')) params.set(key, value);
  }
  return params.size ? `/antecedentes?${params}` : '/antecedentes';
}

export function showCatalogHighlights(state: CatalogState, count: number): boolean {
  return count >= 12 && (!state.orden || state.orden === 'recent') && catalogCriteria.every((key) => !state[key]);
}

export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const clientKey = (value: string) => normalizeSearch(value).replace(/\bs[\W_]*r[\W_]*l\b/g, 'srl').replace(/\bs[\W_]*a\b/g, 'sa').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const periodOf = (value: string) => { const y = Number(value); return y >= 2024 ? '2024' : y >= 2020 ? '2020' : y >= 2015 ? '2015' : y >= 2010 ? '2010' : 'antes'; };
export function catalogState(params: URLSearchParams): Record<(typeof filterKeys)[number], string> {
  const state = Object.fromEntries(filterKeys.map(k => [k, params.get(k) || ''])) as Record<(typeof filterKeys)[number], string>;
  state.service ||= params.get('servicio') || '';
  state.year ||= params.get('anio') || '';
  if (!['recent', 'year-desc', 'year-asc', 'client'].includes(state.orden)) state.orden = 'recent';
  return state;
}
export function matchesCatalog(it: CatalogItem, state: CatalogState, skip?: string): boolean {
  const sector = state.sector === 'gobierno' ? 'gobiernosectorpublico' : state.sector;
  const sectorMatches = (sector === 'sin-clasificar' && !it.sector) || it.sector === sector || (sector === 'software' && it.services.includes('104')) || (sector === 'seguridad-electronica' && it.services.includes('102'));
  return (skip === 'sector' || !sector || sectorMatches) &&
    (skip === 'service' || !state.service || (state.service === 'sin-clasificar' ? it.services.length === 0 : it.services.includes(state.service))) &&
    (!state.year || it.year === state.year) &&
    (!state.cliente || clientKey(it.client) === clientKey(state.cliente)) &&
    (!state.q || normalizeSearch(it.search).includes(normalizeSearch(state.q.trim()))) &&
    (!state.periodo || periodOf(it.year) === state.periodo) &&
    (!state.estado || it.status === state.estado);
}
export function orderCatalog<T extends Pick<CatalogItem, 'year' | 'client'>>(items: T[], mode: string): T[] {
  return [...items].sort((a, b) => mode === 'client' ? a.client.localeCompare(b.client, 'es') : mode === 'year-asc' ? Number(a.year) - Number(b.year) : mode === 'year-desc' ? Number(b.year) - Number(a.year) : 0);
}
