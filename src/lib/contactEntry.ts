import { publicDespiecePath } from './despieceRoutes';

export const isContactPage = (path: string) => ['/contacto', '/en/contact'].includes(publicDespiecePath(path));

/** Only carry the public pathname. Search terms, fragments and external URLs are not origin fields. */
export function contactOrigin(value: string | null) {
  if (!value || !/^\/(?!\/)/.test(value) || /[\\?#\s\x00-\x1f]/.test(value)) return '';
  const path = publicDespiecePath(new URL(value, 'https://example.invalid').pathname);
  return path.startsWith('//') || isContactPage(path) ? '' : path;
}

export function contextualParams(input: URLSearchParams, path: string) {
  const params = new URLSearchParams(input);
  const service = /^\/servicios\/(10[1-8])(?:\/|$)/.exec(path);
  const project = /^\/antecedentes\/(\d{1,8})(?:\/|$)/.exec(path);
  const sector = /^\/sectores\/([\w-]+)$/.exec(path)?.[1] ||
    (['/software', '/seguridad-electronica'].includes(path) ? path.slice(1) : '');
  if (project && !params.has('antecedente')) params.set('antecedente', project[1]!);
  if (service && !params.has('sistema')) params.set('sistema', service[1]!);
  if (sector && !params.has('sector')) params.set('sector', sector);
  return params;
}

export function contactLink(from: string, destination = '/contacto') {
  const target = new URL(destination, 'https://example.invalid');
  const path = contactOrigin(from);
  if (!path) return publicDespiecePath(from) === target.pathname && !target.search ? '#formulario' : destination;
  const params = contextualParams(target.searchParams, path);
  params.set('origen', path);
  return target.pathname + '?' + params.toString() + '#formulario';
}
