/**
 * SEO Configuration — Single source of truth for site URL and identity.
 *
 * IMPORTANT: The canonical domain is https://www.ultimamilla.com.ar.
 * All canonical URLs, sitemaps, structured data, and OG tags MUST use this domain.
 * The apex host redirects to this www host and must not be emitted as canonical.
 */
export const SITE_URL = 'https://www.ultimamilla.com.ar';
export const SITE_NAME = 'ULTIMA MILLA';
export const SITE_DESCRIPTION = 'Servicios IT integrales para continuidad operativa: redes, seguridad electrónica, telecomunicaciones, software, soporte y energía IT en Mendoza, Cuyo y Patagonia.';

/** Canonical business address — single source of truth for all schemas */
export const BUSINESS_ADDRESS = {
  streetAddress: 'Houssay 1159',
  addressLocality: 'Guaymallén',
  addressRegion: 'Mendoza',
  postalCode: 'M5519',
  addressCountry: 'AR',
};
