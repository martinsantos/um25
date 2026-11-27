import { NAV_SECTORS, NAV_SERVICES } from '../../data/navigation';
import { caseContextQuery, catalogBatch, catalogResultsHref, clientKey, type CatalogState } from './catalogFilters';

/** The archive can link back to the commercial fichas named by its active filters. */
export function catalogContext(state: CatalogState, visible = catalogBatch, names: readonly string[] = []) {
  const { service, sector } = state;
  const serviceEntry = NAV_SERVICES.find(item => item.code === service);
  const sectorEntry = NAV_SECTORS.find(item => item.slug === sector);
  const filters = [serviceEntry?.name, sectorEntry?.name].filter(Boolean).join(' · ');
  const key = state.cliente && clientKey(state.cliente);
  const client = key ? names.find(name => clientKey(name) === key) : undefined;
  const query = caseContextQuery(state, visible);
  const sectorSystems = sectorEntry?.href.startsWith('/sectores/');
  const sectorAnchor = sectorSystems ? (sector === 'bodegas' && serviceEntry ? '#sistemas' : '#integracion') : '#provision';
  const sectorQuery = sectorSystems && serviceEntry ? query + '&sistema=' + serviceEntry.code : query;
  return {
    title: client ? 'Obras para ' + client : filters,
    qualifier: client ? filters : '',
    client,
    links: {
      service: serviceEntry && { href: serviceEntry.href + query + '#provision' },
      sector: sectorEntry && { href: sectorEntry.href + sectorQuery + sectorAnchor },
      client: client && filters ? { href: catalogResultsHref({ cliente: client, orden: state.orden }) } : undefined,
    },
  };
}
