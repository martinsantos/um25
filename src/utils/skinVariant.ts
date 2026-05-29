import { isLocalProdReplica } from '../config/runtime';

export type DevSkinVariant = 'black' | 'white' | 'hybrid' | 'steel';

const allowedSkinVariants = new Set<DevSkinVariant>(['black', 'white', 'hybrid', 'steel']);

/** Overrides de skin por query: solo en dev normal (no réplica prod). Prod y réplica = hybrid fijo. */
export function getDevSkinVariant(url: URL, isDev: boolean): DevSkinVariant | null {
  const value = url.searchParams.get('skin');
  if (!value) return null;

  if (!isDev || isLocalProdReplica()) return null;

  return allowedSkinVariants.has(value as DevSkinVariant)
    ? (value as DevSkinVariant)
    : null;
}
