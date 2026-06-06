import { SITE_URL } from './seo';

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function processEnv(name: string): string | undefined {
  return typeof process !== 'undefined' ? process.env[name] : undefined;
}

function envFlag(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return TRUTHY.has(String(value).trim().toLowerCase());
}

/** Localhost debe comportarse como producción (hybrid, datos CMS, sin mocks de lab). */
export function isLocalProdReplica(): boolean {
  const fromProcess = processEnv('UMSA_LOCAL_REPLICA');
  const fromImport = import.meta.env?.['UMSA_LOCAL_REPLICA'];
  return envFlag(fromImport) || envFlag(fromProcess);
}

export function getDirectusInternalUrl(): string {
  const fromProcess = processEnv('DIRECTUS_INTERNAL_URL');
  const fromImport = import.meta.env?.['DIRECTUS_INTERNAL_URL'];
  const publicUrl = processEnv('PUBLIC_DIRECTUS_URL') || import.meta.env?.['PUBLIC_DIRECTUS_URL'];
  return fromProcess || fromImport || publicUrl || 'http://localhost:8055';
}

export function getDirectusToken(): string {
  const token =
    processEnv('DIRECTUS_STATIC_TOKEN') ||
    processEnv('PUBLIC_DIRECTUS_TOKEN') ||
    processEnv('DIRECTUS_ADMIN_TOKEN') ||
    import.meta.env?.['DIRECTUS_STATIC_TOKEN'] ||
    import.meta.env?.['PUBLIC_DIRECTUS_TOKEN'] ||
    import.meta.env?.['DIRECTUS_ADMIN_TOKEN'] ||
    '';

  if (token) return token;

  if (isLocalProdReplica()) {
    console.warn(
      '[runtime] UMSA_LOCAL_REPLICA=1 sin token Directus: se intentarán lecturas públicas del CMS.',
    );
    return '';
  }

  if (import.meta.env?.DEV) {
    console.warn('[runtime] Directus token ausente: se intentarán lecturas públicas del CMS.');
  }
  return '';
}

/** URL pública para canonical/OG: prod real en réplica, localhost en dev normal. */
export function getPublicSiteUrl(): string {
  if (isLocalProdReplica()) return SITE_URL;
  return processEnv('PUBLIC_SITE_URL') || import.meta.env?.['PUBLIC_SITE_URL'] || 'http://localhost:4321';
}

/** Blog: en réplica, fallback a HTML de producción (no mock estático). */
export function allowPublicBlogFallback(): boolean {
  if (isLocalProdReplica()) return true;
  if (import.meta.env?.DEV) return true;
  return envFlag(processEnv('UMSA_USE_PUBLIC_BLOG_FALLBACK'));
}

export function allowMockBlogFallback(): boolean {
  return import.meta.env?.DEV && !isLocalProdReplica();
}

export { isReplicaIdenticalCopy, resolveReplicaH1, resolveReplicaTitle } from '../utils/replicaProdCopy';
