/** Exact public route scope for the reviewed Despiece delivery. */
const sectors = new Set(['aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria', 'mineria', 'salud']);
const fixed = new Set(['/', '/servicios', '/sectores', '/antecedentes', '/nosotros', '/contacto', '/documentacion', '/privacidad', '/blog', '/en', '/en/services', '/en/about', '/en/contact', '/antecedentes/datos.json']);
// Archive IDs 10991, 10980 and 10942 match the current records by client, SGI start date and scope.
const historicalCaseRedirects = new Map([
  ['/antecedentes/10991/jose-nucete-e-hijos-sa-soporte-it', '/antecedentes/3311/soporte-de-infraestructura-it-de-alta-disponibilidad-jose-nucete-e-hijos-sa-abril-2021'],
  ['/antecedentes/10980/hospital-a-italo-perrupato-sdi', '/antecedentes/3332/infraestructura-hospitalaria-servicio-tecnico-hospital-a-italo-perrupato'],
  ['/antecedentes/10942/hospital-a-italo-perrupato-sdi', '/antecedentes/3373/soporte-de-infraestructura-it-de-alta-disponibilidad-hospital-a-italo-perrupato-febrero-2020'],
]);
export function publicDespiecePath(path: string): string {
  return (path.replace(/^\/propuesta(?=\/|$)/, '').replace(/\/$/, '') || '/');
}
export function despieceRoute(path: string, method = 'GET'): { redirect?: string; rewrite?: string } | null {
  if (!['GET', 'HEAD'].includes(method)) return null;
  const p = path.replace(/\/$/, '') || '/';
  const historicalCase = historicalCaseRedirects.get(p);
  if (historicalCase) return { redirect: historicalCase };
  // This diagnostic remains non-indexable and is not a public page alias.
  if (p === '/propuesta/auditoria.json') return null;
  if (p === '/propuesta' || p.startsWith('/propuesta/')) {
    const target = publicDespiecePath(p);
    return despieceRoute(target) || /^\/blog\/[a-z0-9-]+$/.test(target) ? { redirect: target } : null;
  }
  if (sectors.has(p.slice(1))) return { redirect: '/sectores' + p };
  if (p === '/sectores/software') return { redirect: '/software' };
  if (p === '/sectores/seguridad-electronica') return { redirect: '/seguridad-electronica' };
  if (p === '/sectores/gobierno') return { redirect: '/sectores/gobiernosectorpublico' };
  if (p === '/en/contacto') return { redirect: '/en/contact' };
  const oldService = p.match(/^\/servicios\/(10[1-8])\/([^/]+)$/);
  if (oldService && oldService[2] !== 'ficha') return { redirect: '/servicios/' + oldService[1] };
  const sector = p.match(/^\/sectores\/([^/]+)$/);
  if (fixed.has(p) || /^\/servicios\/10[1-8]$/.test(p) ||
      (sector && sectors.has(sector[1]!)) ||
      /^\/antecedentes\/\d+\/[^/]+$/.test(p)) {
    return { rewrite: '/propuesta' + (p === '/' ? '' : p) };
  }
  // Keep the production article renderer: TOC, contextual links, previous/next,
  // FAQ/BlogPosting metadata and editorial normalization are already integrated there.
  return null;
}
