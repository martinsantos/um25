import { SITE_URL } from './seo';

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function envFlag(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return TRUTHY.has(String(value).trim().toLowerCase());
}

/** Localhost debe comportarse como producción (hybrid, datos CMS, sin mocks de lab). */
export function isLocalProdReplica(): boolean {
  const fromImport = import.meta.env?.UMSA_LOCAL_REPLICA;
  const fromProcess =
    typeof process !== 'undefined' ? process.env['UMSA_LOCAL_REPLICA'] : undefined;
  return envFlag(fromImport) || envFlag(fromProcess);
}

export function getDirectusInternalUrl(): string {
  const fromImport = import.meta.env?.DIRECTUS_INTERNAL_URL;
  const fromProcess =
    typeof process !== 'undefined' ? process.env['DIRECTUS_INTERNAL_URL'] : undefined;
  const publicUrl = import.meta.env?.PUBLIC_DIRECTUS_URL;
  return fromProcess || fromImport || publicUrl || 'http://localhost:8055';
}

export function getDirectusToken(): string {
  const token =
    import.meta.env?.DIRECTUS_STATIC_TOKEN ||
    import.meta.env?.PUBLIC_DIRECTUS_TOKEN ||
    import.meta.env?.DIRECTUS_ADMIN_TOKEN ||
    (typeof process !== 'undefined'
      ? process.env['DIRECTUS_STATIC_TOKEN'] ||
        process.env['PUBLIC_DIRECTUS_TOKEN'] ||
        process.env['DIRECTUS_ADMIN_TOKEN']
      : '');

  if (token) return token;

  if (isLocalProdReplica()) {
    console.warn(
      '[runtime] UMSA_LOCAL_REPLICA=1 sin token Directus: solo snapshots JSON (ejecutá npm run replica:sync con túnel SSH).',
    );
    return '';
  }

  // Legacy dev default (no usar en réplica ni prod)
  return 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
}

/** URL pública para canonical/OG: prod real en réplica, localhost en dev normal. */
export function getPublicSiteUrl(): string {
  if (isLocalProdReplica()) return SITE_URL;
  return import.meta.env?.PUBLIC_SITE_URL || 'http://localhost:4321';
}

/** Blog: en réplica, fallback a HTML de producción (no mock estático). */
export function allowPublicBlogFallback(): boolean {
  if (isLocalProdReplica()) return true;
  if (import.meta.env?.DEV) return true;
  return envFlag(
    typeof process !== 'undefined' ? process.env['UMSA_USE_PUBLIC_BLOG_FALLBACK'] : undefined,
  );
}

export function allowMockBlogFallback(): boolean {
  return import.meta.env?.DEV && !isLocalProdReplica();
}

export { isReplicaIdenticalCopy, resolveReplicaH1, resolveReplicaTitle } from '../utils/replicaProdCopy';
