/**
 * Pares de rutas EN ↔ ES para hreflang (rutas EN con slug legible).
 */
export const EN_TO_ES_PATH: Record<string, string> = {
  '/en': '/',
  '/en/': '/',
  '/en/contacto': '/contacto',
  '/en/services': '/servicios',
  '/en/about': '/nosotros',
};

export function resolveSpanishPath(pathname: string): string {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
  if (EN_TO_ES_PATH[normalized]) return EN_TO_ES_PATH[normalized];
  if (normalized.startsWith('/en/')) {
    return normalized.replace(/^\/en/, '') || '/';
  }
  return pathname;
}

export function resolveEnglishPath(pathname: string): string {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  const fromMap = Object.entries(EN_TO_ES_PATH).find(([, es]) => es === normalized);
  if (fromMap) return fromMap[0] === '/en' ? '/en/' : fromMap[0];

  if (normalized === '/') return '/en/';
  if (normalized.startsWith('/en')) return pathname;
  return `/en${normalized}`;
}

export function hasEnglishAlternate(pathname: string): boolean {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  if (normalized === '/') return true;
  if (normalized.startsWith('/en')) return EN_TO_ES_PATH[normalized] !== undefined;
  return Object.values(EN_TO_ES_PATH).includes(normalized);
}
