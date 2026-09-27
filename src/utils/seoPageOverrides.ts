/**
 * Política de indexación y metadatos por ruta, aplicada en SEOHead.
 *
 * - INTERNAL_PATH_PATTERNS: laboratorio, demos y herramientas internas. Se
 *   publican con noindex y quedan fuera de los sitemaps.
 * - PAGE_META_OVERRIDES: rutas cuyo title/description propio no cumple el rango
 *   (title 30–60, description 120–160). Sólo datos reales del sitio.
 */
import { getAntecedentesCatalogCount } from './verifiedProof';

export const INTERNAL_PATH_PATTERNS: RegExp[] = [
  /^\/admin(?:\/|$)/,
  /^\/estilo(?:\/|$)/,
  /^\/geo\/?$/,
  /^\/geo\/score(?:\/|$)/,
  /^\/pretext-demo(?:\/|$)/,
  /^\/banners(?:\/|$)/,
  /^\/plantilla-arca(?:\/|$)/,
  /^\/3dgemelo[a-z-]*(?:\/|$)/,
  /^\/_/,
];

export function isInternalPath(pathname: string): boolean {
  return INTERNAL_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

type PageMetaOverride = { title?: string; description?: string };

export function getPageMetaOverride(pathname: string): PageMetaOverride | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  const count = getAntecedentesCatalogCount();

  switch (path) {
    case '/antecedentes':
      return {
        title: `${count} antecedentes técnicos documentados`,
        description: `${count} antecedentes técnicos de ULTIMA MILLA en redes, seguridad electrónica, telecomunicaciones y software, con cliente, sector, servicio y alcance.`,
      };
    default:
      return null;
  }
}
