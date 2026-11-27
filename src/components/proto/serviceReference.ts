import { serviceJourney } from '../../data/propuesta/recorrido';
import { isNamedClient } from './catalogEditorial';
import { publicCaseFor, samePublicClient } from './casePresentation';
import { pageCaseCandidates } from './caseSelection';
import { destacados, type Story } from './isoData';

type ServiceReference = { id: number; client: string; title?: string };

export function matchesServiceReference(story: Story, reference: ServiceReference) {
  return story.id === reference.id && (samePublicClient(story.client, reference.client)
    || (story.client === reference.client && story.title === reference.title));
}

export function serviceWorkEnquiry(code: string, query: URLSearchParams, stories: Story[], groups: readonly { title: string }[]) {
  if (query.get('desde') !== 'obra') return;
  const id = query.get('antecedente');
  if (!id || !/^\d{1,8}$/.test(id)) return;
  const story = stories.find(item => String(item.id) === id && item.serviceCodes.includes(code));
  if (!story) return;

  const group = query.get('grupo');
  if (!group) return { code, id: story.id };
  if (!groups.some(item => item.title === group)) return;
  const reference = serviceJourney[code]?.groups[group]?.reference;
  if (!reference || !matchesServiceReference(story, reference)) return;
  return { code, group, id: story.id };
}

const featuredGroup: Record<string, string> = {
  '103': 'Telefonía IP',
  '105': 'Atención y gestión de incidentes',
  '108': 'Distribución y puesta a tierra',
};

export function serviceOverview(stories: Story[], code: string) {
  const related = stories.filter(story => story.serviceCodes.includes(code));
  const eligible = pageCaseCandidates(related, undefined, code).filter(story => isNamedClient(story.client));
  const group = featuredGroup[code];
  const preferred = group && serviceJourney[code]?.groups[group]?.reference;
  const match = preferred && eligible.find(story => story.id === preferred.id && samePublicClient(story.client, preferred.client));
  const reference = match || eligible.find(story => publicCaseFor(story)) || destacados(eligible, 1)[0];
  return { count: related.length, reference };
}
