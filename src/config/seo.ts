/**
 * SEO Configuration — Single source of truth for site URL and identity.
 *
 * IMPORTANT: The canonical domain is https://ultimamilla.com.ar (non-www).
 * All canonical URLs, sitemaps, structured data, and OG tags MUST use this domain.
 * The www subdomain is NOT used and will be stripped if present.
 */
export const SITE_URL = 'https://ultimamilla.com.ar';
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
