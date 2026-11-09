import type { ProductoV4 } from '../types/directus-v4';
import reviewed from '../data/propuesta/service-provision-copy.json';
import { serviceProvisionParts, type ProvisionPart } from '../data/propuesta/service-provision-visuals';
import { plainTextFromHtml } from './editorialContent';

export type ServiceProvisionItem = {
  title: string;
  summary: string;
  parts: ProvisionPart[];
  scopeDetail?: { label: string; text: string };
  referenceCaseId?: number;
  group?: { title: string; heading: string };
};
const text = (value: unknown) => plainTextFromHtml(value).replace(/\*\*/g, '').trim();

/** The live catalog owns membership and order. Reviewed copy only applies to an unchanged source. */
export function serviceProvisionItems(products: ProductoV4[], serviceCode: number): ServiceProvisionItem[] {
  return products.filter(product => {
    const owner = typeof product.servicio_id === 'object' ? product.servicio_id.id : product.servicio_id;
    return Number(owner) === serviceCode && product.estado !== 'borrador' && (!product.status || product.status === 'published');
  }).flatMap(product => {
    const title = text(product.titulo);
    if (!title) return [];
    // Older snapshots place the work description after a wrench/Markdown paragraph.
    const legacyScope = String(product.descripcion || '').split(/\n\s*\n/).find(part => /🔧|^\s*\*\*/u.test(part));
    const source = text(product.servicio_asociado || legacyScope || product.descripcion);
    const edit = reviewed.items.find(item => item.serviceCode === serviceCode && text(item.title) === title && text(item.sourceText) === source);
    return [{
      title,
      summary: edit?.summary || source,
      parts: serviceProvisionParts(serviceCode, title),
      scopeDetail: edit?.scopeDetail,
      referenceCaseId: edit?.referenceCaseId,
      group: edit?.group,
    }];
  });
}

/** A group is displayed at its first member; missing or unverified products keep their original positions. */
export function groupServiceProvision<T extends Pick<ServiceProvisionItem, 'title' | 'parts' | 'group'>>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!item.group) continue;
    const members = groups.get(item.group.title) ?? [];
    members.push(item);
    groups.set(item.group.title, members);
  }
  return items.flatMap(item => {
    const title = item.group?.title;
    const members = title ? groups.get(title) : undefined;
    if (!title || !members || members.length < 2 || new Set(members.map(member => member.title)).size !== members.length) {
      return [{ title: item.title, members: [item], parts: item.parts }];
    }
    if (item !== members[0]) return [];
    const parts = [...new Map(members.flatMap(member => member.parts).map(part => [part.key, part])).values()];
    return [{ title, members, parts }];
  });
}
