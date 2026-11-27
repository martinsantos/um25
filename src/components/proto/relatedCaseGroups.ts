import type { Story } from './isoData';
import { services } from './isoData';
import { clientKey, catalogHref, matchesCatalogSector } from './catalogFilters';
import { isNamedClient } from './catalogEditorial';
import { pageCaseCandidates } from './caseSelection';
import { publicCaseFor } from './casePresentation';

export type RelatedGroup = {
  name: string;
  kind: 'cliente' | 'sector' | 'servicio';
  works: Story[];
  href: string;
  all: string;
};

/** Prefer distinct clients without discarding additional works in short lists. */
function firstPerClient(works: Story[], seen = new Set<string>()) {
  const diverse: Story[] = [], rest: Story[] = [];
  for (const story of works) {
    const key = clientKey(story.client);
    if (seen.has(key)) rest.push(story);
    else {
      seen.add(key);
      diverse.push(story);
    }
  }
  return [...diverse, ...rest];
}

export function relatedCaseGroups(current: Story, stories: Story[]): RelatedGroup[] {
  const other = stories.filter(s => s.id !== current.id);
  const key = clientKey(current.client);
  const isClient = (s: Story) => isNamedClient(current.client) && isNamedClient(s.client) && clientKey(s.client) === key;
  const sharesSystem = (s: Story) => s.serviceCodes.some(code => current.serviceCodes.includes(code));
  const rank = (a: Story, b: Story) =>
    Number(Boolean(publicCaseFor(b))) - Number(Boolean(publicCaseFor(a))) ||
    Number(sharesSystem(b)) - Number(sharesSystem(a)) ||
    Number(Boolean(b.documentedScope)) - Number(Boolean(a.documentedScope)) ||
    b.year - a.year || b.month - a.month;
  // A dated delivery of parts stays available in the archive. For a recommendation,
  // look for a reviewed case or a registered system and a title that identifies the intervention.
  const intervention = /cableado|instalaci[oó]n|montaje|implementaci[oó]n|ampliaci[oó]n|integraci[oó]n|control de acceso|balizamiento|radioenlace|detecci[oó]n de incendios|mantenimiento|desarrollo|migraci[oó]n|certificaci[oó]n|puesta en (marcha|servicio)|automatizaci[oó]n|ingenier[ií]a/i;
  const eligible = other.filter(s => publicCaseFor(s) || (s.serviceCodes.length > 0 && intervention.test(s.title)));
  const client = pageCaseCandidates(eligible.filter(isClient)).sort(rank).slice(0, 3);
  const sector = current.sectorSlug && current.sector
    ? pageCaseCandidates(eligible.filter(s => !client.includes(s) && matchesCatalogSector(s.sectorSlug, s.serviceCodes, current.sectorSlug)), current.sectorSlug).sort(rank)
    : [];
  const clients = new Set<string>(isNamedClient(current.client) ? [key] : []);
  const sectorWorks = firstPerClient(sector, clients).slice(0, 3);
  const groups: RelatedGroup[] = [
    { name: 'Para ' + current.client, kind: 'cliente' as const, works: client, href: catalogHref({ cliente: current.client }), all: 'Ver archivo del cliente' },
    { name: 'En ' + current.sector, kind: 'sector' as const, works: sectorWorks, href: catalogHref({ sector: current.sectorSlug }), all: 'Ver archivo del sector' },
  ].filter(group => group.works.length);
  if (groups.length > 0) return groups;
  for (const code of current.serviceCodes) {
    const service = services.find(s => s.code === code);
    if (!service) continue;
    const ranked = pageCaseCandidates(eligible.filter(s => s.serviceCodes.includes(code)), undefined, code).sort(rank);
    const works = firstPerClient(ranked).slice(0, 3);
    if (works.length) return [{
      name: service.name, kind: 'servicio', works,
      href: catalogHref({ service: code }), all: 'Ver antecedentes del servicio',
    }];
  }
  return [];
}
