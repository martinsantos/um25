export type DevSkinVariant = 'black' | 'white' | 'hybrid' | 'steel';

const allowedSkinVariants = new Set<DevSkinVariant>(['black', 'white', 'hybrid', 'steel']);

export function getDevSkinVariant(url: URL, isDev: boolean): DevSkinVariant | null {
  if (!isDev) return null;

  const value = url.searchParams.get('skin');
  if (!value) return null;

  return allowedSkinVariants.has(value as DevSkinVariant)
    ? (value as DevSkinVariant)
    : null;
}
