import type { Story } from './isoData';
import { archiveRecord } from './casePresentation';
import { caseContextQuery, catalogBatch, catalogState, catalogWindow, catalogWindowHref, matchesCatalog, orderCatalog } from './catalogFilters';

/** Restore an archive selection only when it still includes this work. */
export function catalogCaseJourney(story: Story, params: URLSearchParams, stories: Story[]) {
  if (params.get('desde') !== 'archivo') return;
  const filters = catalogState(params);
  const windowSize = catalogWindow(params.get('mostrar'), stories.length);
  if (!caseContextQuery(filters, windowSize)) return;

  const results = orderCatalog(stories.map(archiveRecord).filter(record => matchesCatalog(record, filters)),
    filters.orden, Boolean(filters.sector || filters.service));
  const index = results.findIndex(record => record.story.id === story.id);
  if (index === -1) return;

  const visible = Math.max(windowSize, Math.ceil((index + 1) / catalogBatch) * catalogBatch);
  const query = caseContextQuery(filters, visible);
  return {
    href: catalogWindowHref(filters, visible) + '#resultado-um-' + story.id,
    label: 'Volver a resultados',
    query,
    position: index + 1,
    total: results.length,
    prev: results[index - 1]?.story,
    next: results[index + 1]?.story,
    contact: new URLSearchParams({ seleccionArchivo: query.slice(1) }),
  };
}
