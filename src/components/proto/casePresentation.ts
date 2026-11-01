import { casoDestacadoDe } from '../../data/propuesta/casos-destacados';
import { isNamedClient } from './catalogEditorial';

const identity = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A shared anonymous label never establishes a relationship between customers. */
export function samePublicClient(left: string, right: string): boolean {
  return isNamedClient(left) && isNamedClient(right) && identity(left) === identity(right);
}

/** Editorial additions cannot override a changed or anonymized live CMS identity. */
export function publicCaseFor(story: { id: number; client: string }) {
  const detail = casoDestacadoDe(story.id);
  return detail && samePublicClient(detail.client, story.client) ? detail : undefined;
}
