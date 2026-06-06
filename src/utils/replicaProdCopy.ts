import prodCopy from '../data/replica-prod-copy.json';
import { isLocalProdReplica } from '../config/runtime';

type ProdCopyEntry = { status?: number; title?: string; h1?: string };

/** En réplica: H1/títulos como www (skin hybrid nueva). Desactivar con UMSA_REPLICA_IDENTICAL=0 */
export function isReplicaIdenticalCopy(): boolean {
  if (!isLocalProdReplica()) return false;
  const v =
    import.meta.env?.['UMSA_REPLICA_IDENTICAL'] ??
    (typeof process !== 'undefined' ? process.env['UMSA_REPLICA_IDENTICAL'] : undefined);
  if (v === '0' || v === 'false') return false;
  return true;
}

function normalizePath(path: string): string {
  const clean = path.split('#')[0] || path;
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export function getReplicaProdEntry(path: string): ProdCopyEntry | null {
  const key = normalizePath(path);
  const paths = (prodCopy as { paths?: Record<string, ProdCopyEntry> }).paths || {};
  return paths[key] || null;
}

export function resolveReplicaH1(path: string, editorialFallback: string): string {
  if (!isReplicaIdenticalCopy()) return editorialFallback;
  const entry = getReplicaProdEntry(path);
  return entry?.h1?.trim() || editorialFallback;
}

export function resolveReplicaTitle(path: string, editorialFallback: string): string {
  if (!isReplicaIdenticalCopy()) return editorialFallback;
  const entry = getReplicaProdEntry(path);
  return entry?.title?.trim() || editorialFallback;
}

export function cmsServiceTitle(titulo: unknown): string {
  const raw = String(titulo || '').trim();
  return raw.split('|')[0]?.trim() || raw;
}
