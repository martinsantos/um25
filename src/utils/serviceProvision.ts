import type { ProductoV4 } from '../types/directus-v4';
import reviewed from '../data/propuesta/service-provision-copy.json';
import { serviceProvisionParts, type ProvisionPart } from '../data/propuesta/service-provision-visuals';
import { plainTextFromHtml } from './editorialContent';

export type ServiceProvisionItem = { title: string; summary: string; parts: ProvisionPart[] };
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
    return [{ title, summary: edit?.summary || source, parts: serviceProvisionParts(serviceCode, title) }];
  });
}
