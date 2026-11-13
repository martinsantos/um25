import { casoDestacadoDe } from '../../data/propuesta/casos-destacados';
import { isNamedClient } from './catalogEditorial';
import { despieceDe, type Despiece } from './despiece';

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

/** The reviewed inventory and the editorial case share the same live identity gate. */
export function caseEquipmentFor(story: { id: number; client: string; title: string; summary: string; serviceCodes: string[] }): Despiece {
  const detail = publicCaseFor(story);
  if (detail) return { partes: detail.parts, origen: 'registro' };
  // Local preview: “módulo” in this case refers to software; don't render a fire module.
  if (story.id === 3529 && /mercado pago/i.test(story.title) && /notas? de pedido/i.test(story.title)) {
    return { origen: 'registro', partes: [
      { key: 'pantalla', code: '104', label: 'Módulo de notas de pedido' },
      { key: 'servidor', code: '104', label: 'Integración de pagos por API' },
    ] };
  }
  return despieceDe(story.title, story.summary, story.serviceCodes);
}
